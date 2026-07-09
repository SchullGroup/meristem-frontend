# Required Backend Changes

Based on our recent updates to the KYC Update and ADMOR frontend flows, the backend team needs to implement or confirm the following.

# KYC Update — Backend Requirements

---

## 1. Unified KYC Change Payload

All change types — `PERSONAL`, `CONTACT`, `BANK`, `SIGNATURE`, `DOCUMENT` — use the same request/response shape. Only `field`/`newValue` content differs by type.

`POST /api/v1/accounts/{accountNumber}/kyc-changes`

```json
{
  "changeType": "PERSONAL | CONTACT | BANK | SIGNATURE | DOCUMENT",
  "changes": [{ "field": "string", "newValue": "string" }],
  "initiatedBy": "string",
  "reason": "string",
  "supportingDocuments": [{ "name": "string", "url": "string" }]
}
```

- `reason`: one per request, not per field — even when `changes` contains multiple fields.
- `supportingDocuments`: optional array on every change type.
  - `DOCUMENT`: not required — the uploaded document is itself the artifact.
  - `SIGNATURE`: not required by the client, but accept it if sent.
  - `PERSONAL` / `CONTACT` / `BANK`: as currently implemented.
- `SIGNATURE` example: `"changes": [{ "field": "signature", "newValue": "<uploaded image URL>" }]`
- `DOCUMENT` example: `"changes": [{ "field": "<documentType>", "newValue": "<JSON string: url, name, ref, type>" }]` — one KYC change per document.

## 2. Two-Step Approval (Authoriser + ICU)

Required for every change type — no exceptions.

- `status` values: `PENDING_AUTH`, `PENDING_ICU`, `APPROVED`, `REJECTED`
- Flow: `PENDING_AUTH` → authoriser acts → `PENDING_ICU` → ICU acts → `APPROVED`
- Either stage can reject → `REJECTED`
- Add response fields: `authorisedBy`, `authorisedAt`, `icuApprovedBy`, `icuApprovedAt`
- Approve/reject actions must indicate which stage the actor is acting as (authoriser vs ICU)
- Rejection must be attributable to the stage it happened at

## 3. `KycChange` Response Model

- Add `reason` — currently accepted on submit but missing from the response entirely.
- Add per-field `oldValue` inside `changesJson` entries — currently only `newValue` is captured per field, so multi-field submissions can't show before/after beyond the first field.
- Add the Section 2 approval fields (`authorisedAt`, `icuApprovedBy`, `icuApprovedAt`).

Full field list required: `id, shareholderId, accountNumber, holderName, changeType, fieldChanged, oldValue, newValue, changesJson, reason, status, initiatorId, initiatorName, authorisedBy, authorisedAt, icuApprovedBy, icuApprovedAt, rejectionComment, supportingDocuments, createdAt, decidedAt`.

## 4. Signature Archive

On signature approval, archive the previous active signature instead of overwriting it.

- `GET /holders/signature/archive?chn={chn}&register={registerSymbol}` — returns all signatures (`ACTIVE` + `ARCHIVED`), sorted by date descending.
- Existing `GET /holders/signature` continues to return only the active signature.

## 5. New: NIBSS Bank Details Validation

The bank details tab now includes a "Validate with NIBSS" panel. Operators can enter an account number and/or BVN and validate them against NIBSS before submitting the KYC change.

### 5a. Endpoint — `POST /nibss/validate-bank-details`

- **Request:**

  ```json
  {
    "bankCode": "044",
    "accountNumber": "0123456789",
    "bvn": "22334455667"
  }
  ```

  - `bankCode` — the sort code/code of the selected bank (required)
  - `accountNumber` — optional, validate account number belongs to bank
  - `bvn` — optional, validate BVN is valid

- **Response:**

  ```json
  {
    "results": [
      {
        "field": "accountNumber",
        "valid": true,
        "message": "Account number verified: John Doe"
      },
      {
        "field": "bvn",
        "valid": false,
        "message": "BVN does not match account holder"
      }
    ]
  }
  ```

  - `results` — array of per-field validation results
  - `field` — `"accountNumber"`, `"bvn"`, or `"general"`
  - `valid` — boolean
  - `message` — human-readable result

- **Action:** Create this endpoint using NIBSS APIs to validate bank account numbers and BVNs. This is a synchronous endpoint — it calls NIBSS and returns immediately.

---

## 6. Bulk Upload — Preview + Submit

New: Bulk Upload — Preview + Submit Flow (Warrant Markoff Pattern)

The current `POST /accounts/kyc-changes/bulk-upload` endpoint creates an async job and returns a `jobId`. This doesn't match the operator workflow. The frontend needs a two-step flow matching the warrant mark-off pattern.

### 6a. Preview Endpoint — `POST /accounts/kyc-changes/bulk-upload/preview`

- **Request:** `multipart/form-data` with the uploaded `.xlsx` / `.csv` file + optional `registerId`
- **Response:** Synchronous. Returns parsed row data with per-row validation status.
- **Response shape:**
  ```json
  {
    "rows": [
      {
        "row": 1,
        "accountNumber": "12345",
        "field": "email",
        "newValue": "new@example.com",
        "reason": "Shareholder request",
        "status": "valid" | "warning" | "error",
        "errors": []
      }
    ],
    "totalRows": 50,
    "validCount": 48,
    "warningCount": 1,
    "errorCount": 1
  }
  ```
- **Validation rules** (applied per row):
  - Account number must exist and belong to the selected register
  - `field` must be a recognized KYC field name
  - `newValue` must not be empty
  - Bank changes (`bankName`, `bankAccountNumber`, `bvn`) flagged as high-risk (warning)
  - Unknown fields → error
- **Why preview:** The operator reviews the parsed rows, sees per-row valid/warning/error status, and removes invalid rows before submission.

### 6b. Submit Endpoint — `POST /accounts/kyc-changes/bulk-upload/submit`

- **Request:**
  ```json
  {
    "rows": [
      {
        "accountNumber": "12345",
        "field": "email",
        "newValue": "new@example.com",
        "reason": "Shareholder request"
      }
    ],
    "initiatedBy": "operator@example.com",
    "registerId": "ABC"
  }
  ```
- **Response:** A batch change request record (not one per row). Returns the batch status.
- **Behavior:** Creates one `KycChange` record per row in the batch, linked by a shared batch ID.
- **Why single batch:** The entire upload enters the approval queue as one batch, not 50 individual requests.

### Migration Path

If changing the existing `POST /accounts/kyc-changes/bulk-upload` is too disruptive, create two new endpoints as described above and keep the old async endpoint for backward compatibility. The frontend will switch to the new preview/submit pattern.

---

## 7. `ShareholderAccount` Fields

`GET /api/accounts/{accountNumber}` must return: `dob`/`dateOfBirth`, `gender`, `nationality`, `state`, `nin`, `tin`, `phone2`, `altAddress`, `bankAccountNumber` (distinct from the register account number), `bvn`.

## 8. Legacy Document Endpoints

Inline approve/reject buttons for documents are removed from the frontend — verification now happens exclusively via KYC approvals. Deprecate `PATCH /holders/kyc-documents/{id}/verify` and `/reject` if no other consumers use them; otherwise keep for backward compatibility.

## 9. Endpoint Reference (confirmed working)

`GET /api/v1/accounts/{accountNumber}/kyc-changes` — params: `status`, `page`, `pageSize` (default `0`/`20`). No changes needed.

## 10. Removed: Legacy Document Review Buttons

The inline "Approve" / "Reject" buttons in the Documents > Review tab have been removed. Document verification now happens exclusively through the KYC Approvals workflow.

- **Action:** The old `PATCH /holders/kyc-documents/{id}/verify` and `/reject` endpoints may be deprecated if no other consumers use them. Keep them for backward compatibility with the existing `uploadHolderKycDocuments` flow if needed.

---

# Estate Administration — Backend Requirements

## 11. New: Deceased Account Search for ADMOR (ADMOR-BE-02)

The Estate Administration (ADMOR) "New Administration" form now has a typeahead search box that queries for deceased account holders. The frontend currently uses the existing `GET /api/accounts` search endpoint as a temporary stand-in, but a dedicated endpoint is needed.

### 11a. Endpoint — `GET /api/v1/admor/search-accounts?q=&registerId=(optional)`

- **`q`** searches across: Account Number, Account/Holder Name, CHN, BVN, NIN, Email Address — all in one query string, no need for the caller to specify which field.
- **`registerId`** (optional): If omitted or set to `"all"`, the search spans ALL registers, not just one.
- **Response per result:** `accountId`, `accountNumber`, `holderName`, `chn`, `registerId`, `registerName`, `holdings`, `status`, `isDeceased` (boolean).
- Support partial, case-insensitive match on `holderName` (trigram/ILIKE) and exact/partial match on `account_number`, `chn`, `bvn`, `nin`.
- Response time target: under 500ms for typical queries. Add DB indexes on `chn`, `bvn`, `nin`, `account_number`, and a trigram index on `holder_name` if not already present.
- Cap results at a sensible page size (e.g. 20) with pagination support for broader queries.

**Technical Notes:**

- If a cross-register account search endpoint already exists from the Account Consolidation revamp (CON-BE-05), extend/reuse that infrastructure rather than building a separate one from scratch.
- The frontend currently falls back to the generic `GET /api/accounts?q=&registerId=` endpoint. This is a temporary measure — once ADMOR-BE-02 is available, the frontend will switch to the dedicated endpoint.

- **Action:** Create this endpoint. The `isDeceased` field is critical — the ADMOR flow should only surface accounts where the holder is confirmed deceased.

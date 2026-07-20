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

## 6. Bulk Upload — Preview + Submit (KYC + NIBSS BVN Mandate)

New: Bulk Upload — Preview + Submit Flow (Warrant Markoff Pattern)

The bulk upload UI is now a simple 2-screen flow: **Upload** (download a CSV template, then upload the filled-in file) → **Preview** (review parsed rows, remove any bad ones) → **Submit**. On successful submit the user is returned to the Upload screen with a toast. There is no async job-polling screen — submit is a single request/response.

**Update:** the "no cover-letter/evidence upload step" note below is now stale for both upload types. KYC's actual frontend implementation (`kyc-bulk-upload.tsx` + `kyc-review-panel.tsx`) already requires a per-row review with a mandatory supporting-document attachment before approval, and NIBSS has just been updated to match (§6b). Treat "Preview" as "Preview + per-row Review" for both flows — this doc will be reconciled fully once the KYC side's contract below is updated to match.

Template downloads are generated entirely on the frontend (a CSV blob from a fixed column list) — the backend does **not** need a template download endpoint for either template type.

There are two independent upload types, each needing its own preview/submit endpoint pair, because the row shape is completely different (KYC is a shareholder profile update; NIBSS is a full bank-mandate record). Both are KYC-domain submissions, not dividend-domain ones — see §6b.

### 6a. KYC Bulk Update

**Template columns** (in this order):

```
account_number, shareholder_name, email, phone, address, bank_name, bank_account_number, nin, bvn
```

Each row is a **full record**, not a single field/value change — whichever of the 8 non-key columns are populated on a row represent the fields to update for that `account_number`.

#### Preview — `POST /accounts/kyc-changes/bulk-upload/preview`

- **Request:** `multipart/form-data` with the uploaded `.csv` file + optional `registerId`.
- **Response:** Synchronous. Returns parsed rows with per-row validation status.
  ```json
  {
    "rows": [
      {
        "row": 2,
        "accountNumber": "1234567",
        "shareholderName": "string",
        "email": "string",
        "phone": "string",
        "address": "string",
        "bankName": "string",
        "bankAccountNumber": "string",
        "nin": "string",
        "bvn": "string",
        "status": "valid" | "warning" | "error",
        "errors": ["string"]
      }
    ],
    "totalRows": 50,
    "validCount": 48,
    "warningCount": 1,
    "errorCount": 1
  }
  ```
- **Validation rules** (per row):
  - `account_number` must exist and belong to the selected register.
  - At least one of the non-key columns must be non-empty (otherwise nothing to update → error).
  - Changes to `bank_name` / `bank_account_number` / `bvn` → flagged `warning` (high-risk fields).
  - Unknown/malformed rows → `error`.

#### Submit — `POST /accounts/kyc-changes/bulk-upload/submit`

- **Request:**
  ```json
  {
    "rows": [
      {
        "accountNumber": "1234567",
        "shareholderName": "string",
        "email": "string",
        "phone": "string",
        "address": "string",
        "bankName": "string",
        "bankAccountNumber": "string",
        "nin": "string",
        "bvn": "string"
      }
    ],
    "initiatedBy": "operator@example.com",
    "registerId": "ABC"
  }
  ```
  (only the rows the operator kept after reviewing the preview — any removed on the frontend are simply omitted)
- **Response:** A batch record, not one per row — e.g. `{ "batchId": "string", "totalRows": 50, "status": "string" }`.
- **Behavior:** One `KycChange` per populated field per row, all linked by a shared batch ID, entering the approval queue as a single batch.

### 6b. NIBSS BVN Mandate Bulk Upload

**Domain correction:** this is a **KYC** upload, not a dividend one — the earlier `/dividend/nibss-mandates/...` paths below were wrong and have been corrected. The source file is downloaded from the NIBSS eDMS portal; the operator uploads it, confirms the parsed data against the registry, and submits for approval. Every field in the file already corresponds to an existing shareholder/mandate field in the registry (bank details, BVN, etc.), so approved rows go into the same KYC Approvals queue as any other KYC change — see the Behavior note under Submit below.

**Template columns** (in this order):

```
subscriberName, broker, chn, accountNumber, bank_sort_code, stockbrokerCode, symbol, units, amount, remark, bvn, nin, tin, next_kin, gender, type, bank_account_number, phone, email
```

`type` is `individual` or `corporate`.

**Update:** this flow now has the same per-row review step as KYC (§6a): after preview, the operator opens each row in a review drawer, which looks up the existing registry record and compares it against the NIBSS CSV data field-by-field, then requires at least one supporting document to be attached before the row can be approved. Only approved rows are included in the submit payload — see the updated Submit request shape below. The earlier "no evidence/cover-letter attachment" note is superseded.

#### Preview — `POST /accounts/kyc-changes/nibss-mandates/bulk-upload/preview` _(new endpoint, path TBC with backend team — nested under `/accounts/kyc-changes` since this is a KYC submission)_

- **Request:** `multipart/form-data` with the uploaded `.csv` file.
- **Response:** Synchronous, same shape as the KYC preview but with the NIBSS column set:
  ```json
  {
    "rows": [
      {
        "row": 2,
        "subscriberName": "string",
        "broker": "string",
        "chn": "string",
        "accountNumber": "string",
        "bankSortCode": "string",
        "stockbrokerCode": "string",
        "symbol": "string",
        "units": "string",
        "amount": "string",
        "remark": "string",
        "bvn": "string",
        "nin": "string",
        "tin": "string",
        "nextKin": "string",
        "gender": "string",
        "type": "individual" | "corporate",
        "bankAccountNumber": "string",
        "phone": "string",
        "email": "string",
        "status": "valid" | "warning" | "error",
        "errors": ["string"]
      }
    ],
    "totalRows": 50,
    "validCount": 48,
    "warningCount": 1,
    "errorCount": 1
  }
  ```

#### Submit — `POST /accounts/kyc-changes/nibss-mandates/bulk-upload/submit` _(new endpoint, path TBC with backend team — nested under `/accounts/kyc-changes` since this is a KYC submission)_

- **Request:**
  ```json
  {
    "rows": [
      {
        "subscriberName": "string",
        "broker": "string",
        "chn": "string",
        "accountNumber": "string",
        "bankSortCode": "string",
        "stockbrokerCode": "string",
        "symbol": "string",
        "units": "string",
        "amount": "string",
        "remark": "string",
        "bvn": "string",
        "nin": "string",
        "tin": "string",
        "nextKin": "string",
        "gender": "string",
        "type": "individual" | "corporate",
        "bankAccountNumber": "string",
        "phone": "string",
        "email": "string",
        "supportingDocuments": [{ "name": "string", "url": "string" }]
      }
    ],
    "initiatedBy": "operator@example.com"
  }
  ```
  Only rows the operator **approved** during review are included — rejected and unreviewed rows are omitted entirely (not just flagged). `supportingDocuments` should be required (at least one entry) per row, same as KYC's `KycRowPayload.supportingDocuments`.
- **Response:** `{ "batchId": "string", "totalRows": number, "status": "string" }`.
- **Behavior:** Same as §6a — each approved row becomes a `KycChange` (one per populated field, per §1), all linked by a shared batch ID, entering the **same KYC Approvals queue** as any other KYC change. NIBSS mandate changes are not a separate approval workflow; they should be indistinguishable from other KYC changes once submitted (e.g. `changeType` could be `BANK` or a new `NIBSS_MANDATE` value — backend's call, whichever fits the existing `changeType` enum better), and should appear in `GET /accounts/kyc-changes` / the KYC Change History view like anything else.

**New requirement — BVN-based account search:** The review step looks up each row's existing registry record **by BVN**, not account number (a NIBSS mandate row isn't guaranteed to carry a matching registry account number). No such endpoint currently exists — the closest is the generic account search used elsewhere in this doc (`GET /api/accounts?q=`), which currently matches on account number/name. Please confirm whether that endpoint can be extended so `q` also matches `bvn`, or whether a dedicated lookup is preferred. Until this exists, the frontend mock is not calling any real endpoint for this lookup — see the "Frontend interim behavior" note below.

**Frontend interim behavior (mock only, not for backend implementation):** with no BVN-search endpoint yet, the review drawer temporarily calls the existing `GET /api/accounts/{accountNumber}` endpoint using the row's `bvn` value as if it were an account number, purely so the demo has a real registry record to show. The mock CSV rows are seeded with a real account number (`9033387545`) in the `bvn` field to make this resolve. This is scaffolding for local demos only — once the BVN-search endpoint above exists, the frontend will switch to it and this workaround will be removed.

### Migration Path

If changing the existing `POST /accounts/kyc-changes/bulk-upload` is too disruptive, create the new endpoints above and keep the old async endpoint for backward compatibility. The frontend now exclusively uses the new preview/submit pattern for both upload types.

## 7. `ShareholderAccount` Fields

`GET /api/accounts/{accountNumber}` must return: `dob`/`dateOfBirth`, `gender`, `nationality`, `state`, `nin`, `tin`, `phone2`, `altAddress`, `bankAccountNumber` (distinct from the register account number), `bvn`.

## 8. Legacy Document Endpoints

Inline approve/reject buttons for documents are removed from the frontend — verification now happens exclusively via KYC approvals. Deprecate `PATCH /holders/kyc-documents/{id}/verify` and `/reject` if no other consumers use them; otherwise keep for backward compatibility.

## 9. Endpoint Reference (confirmed working)

`GET /api/v1/accounts/{accountNumber}/kyc-changes` — params: `status`, `page`, `pageSize` (default `0`/`20`). No changes needed.

## 10. Removed: Legacy Document Review Buttons

The inline "Approve" / "Reject" buttons in the Documents > Review tab have been removed. Document verification now happens exclusively through the KYC Approvals workflow.

- **Action:** The old `PATCH /holders/kyc-documents/{id}/verify` and `/reject` endpoints may be deprecated if no other consumers use them. Keep them for backward compatibility with the existing `uploadHolderKycDocuments` flow if needed.

## 10a. New: Cancel a Pending KYC Request (KYC-BE-06)

Ticket as given by the backend team:

> `PATCH /api/v1/kyc-change-requests/:id/cancel`
>
> Rules:
>
> - Only the original submitter (`submitted_by`) can cancel.
> - Can only cancel when status is `pending_1st_approval` — not after 1st approval.
> - Set status → `cancelled`.
> - Re-enable the edit icon for that field on the frontend (field is no longer locked).

**Note on the endpoint path:** every other KYC change action (`authorise`, `reject`) lives under `/accounts/kyc-changes/{id}/...`, not `/kyc-change-requests/{id}/...`. The frontend has implemented this exactly as specified above (`PATCH /kyc-change-requests/{id}/cancel`, base URL already prepends `/api/v1`) rather than assuming it should be folded into the existing path — please confirm with the backend team whether this is an intentional new resource naming or whether it should instead be `PATCH /accounts/kyc-changes/{id}/cancel` for consistency with the sibling actions.

**Request body (frontend assumption, please confirm):**

```json
{
  "cancelledBy": "string"
}
```

**Frontend behavior implemented:**

- A "Cancel" button appears next to "Review" in the Pending Changes list, but only for the row's own submitter (`initiatorId === currentUser.email`) and only while `status === "PENDING"`.
- A confirmation dialog is required before the cancel request is sent.
- On success, the frontend invalidates both the `kyc-changes` and `account-kyc-history` query caches, which automatically re-enables the edit icon / unlocks the field — no extra frontend wiring needed once the backend sets `status: "cancelled"` and the field no longer matches an active pending change.

---

# Estate Administration — Backend Requirements

## 11. New: Deceased Account Search for ADMOR (ADMOR-BE-02)

The Estate Administration (ADMOR) "New Administration" form now has a typeahead search box that queries for deceased account holders. The frontend currently uses the existing `GET /api/accounts` search endpoint as a temporary stand-in, but a dedicated endpoint to fetch deceased accounts is needed.

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

## 12. ADMOR: Probate Documents — Changed from Single to Multi-File (ADMOR-BE-03)

The "Probate / Letters of Administration" upload in the New Administration form has been changed from a single-document upload (`probateDocUrl`) to a multi-document upload (`probateDocs[]`). The separate "Shared Case Documents" section has been removed — probate documents now serve both purposes as a single multi-file upload area.

### 12a. Fields Changed

- **Removed:** `probateDocUrl` (string) — single document URL
- **Kept:** `probateDocs` (array of `{ name, url }`) — now the only probate document field
- The frontend no longer sends `probateDocUrl` in `POST /api/v1/admor` requests.

### 12b. Backend Changes Required

- Update `Admon` response model: replace `probateDocUrl: string` with `probateDocs: { name: string; url: string }[]`.
- Update `CreateAdmonRequest` validation: remove `probateDocUrl`, keep only `probateDocs`.
- No migration needed for existing records if `probateDocUrl` was already optional — just ensure the new field handles the array shape correctly.
- **Action:** Update the ADMOR create/read endpoints to reflect the field change.

## 13. ADMOR: Admon Response — Include Administrators with Documents (ADMOR-BE-04)

The Pending Authorisation table and review dialog now show document status badges (Complete/Pending) and a grouped Supporting Documents section. To support this, the `Admon` response model must include per-administrator details with their uploaded documents.

### 13a. Response Fields to Add

Add an `administrators` array to the `Admon` response model:

```json
{
  "administrators": [
    {
      "adminName": "string",
      "isExecutor": false,
      "documents": [{ "name": "string", "url": "string" }]
    }
  ]
}
```

- `administrators` — array of administrator/executor entries submitted with the original request.
- `adminName` — the administrator's full name.
- `isExecutor` — whether this person is an executor (vs. administrator).
- `documents` — optional array of supporting documents uploaded per administrator.

### 13b. Document Status Logic (Frontend)

The frontend considers a request to "have documents" if:

- `probateDocs` has ≥1 entry, OR
- Any administrator's `documents` array has ≥1 entry.

This drives:

- The **Documents column** in the Pending Authorisation table (green "Complete" badge vs amber "Pending" badge).
- The **Approve button** disabled state in the review dialog (cannot approve without ≥1 document).

### 13c. Backend Changes Required

- Update `GET /api/v1/admor` (list) and `GET /api/v1/admor/{id}` (detail) to include the `administrators` array with per-administrator documents.
- **Action:** Add the `administrators` field to the `Admon` response DTO.

## 14. ADMOR: Estate Account Number for Dividend Routing (ADMOR-BE-05)

Once an ADMOR request is approved, a single estate bank account is created (or designated) to receive dividend payments from **all** deceased accounts across all registers managed by this registrar. The `Admon` response must include this account number so the frontend can link directly to the New Mandate Payment queue pre-filtered for the estate.

### 14a. Why a single `estateAccountNumber` is necessary

- **Same registrar, multiple registers:** If the deceased held accounts in Company A, Company B, and Company C — all managed by this registrar — the system applies the approved probate bundle globally. A single estate bank account receives all outstanding dividends from all three registers.
- **Different registrars:** If the deceased held shares managed by a different registrar, this system cannot touch those funds. The administrators must take certified copies of the probate paperwork to that other registrar separately.

Without a shared `estateAccountNumber`, there is no way to link the approved ADMOR to the dividend payment queue for the consolidated estate account. The "View Outstanding Dividends" button on the Approved tab relies on this field.

### 14b. Field to Add

```json
{
  "estateAccountNumber": "string"
}
```

- `estateAccountNumber` — the single estate bank account number where dividends from all deceased accounts are routed after ADMOR approval.
- **Optional** while the ADMOR is in `PENDING` status; **required** once `APPROVED`.

### 14c. Outstanding Dividends Aggregation (Frontend)

After approval, the frontend queries `GET /enquiry/holders/{id}/dividend-statement` for **every** `deceasedAccountId` in the ADMOR and aggregates the count of `status === "UNPAID"` dividends. The total is displayed as a badge on the "View Outstanding Dividends" button, and clicking navigates to `/dividends/new-mandate?account={estateAccountNumber}`.

### 14d. Backend Changes Required

- Add `estateAccountNumber` to the `Admon` response DTO.
- On ADMOR approval, create or link the estate bank account and populate `estateAccountNumber`.
- Ensure `GET /enquiry/holders/{id}/dividend-statement` correctly returns unpaid dividends for estate-managed accounts.
- **Action:** Add `estateAccountNumber` field; populate it at approval time.

## 15. ADMOR: Return for Correction (ADMOR-BE-06)

At either approval stage (OPS Authoriser or ICU), the reviewer can send a request back to the initiator instead of approving or terminally rejecting it. This is distinct from `REJECTED` — a returned request is resumable, not archived.

### 15a. New status value: `RETURNED`

- Flow: `PENDING_AUTH` -> OPS returns -> `RETURNED` (or `PENDING_ICU` -> ICU returns -> `RETURNED`)
- A `RETURNED` record is resumable by the initiator. Resubmitting always restarts the chain at `PENDING_AUTH`, regardless of which stage returned it.
- This is separate from `REJECTED`, which is terminal — the frontend already prevents editing/reuse of rejected records.

### 15b. Endpoint — `POST /admon/batch-return`

Mirrors the existing `/admon/batch-authorise` and `/admon/batch-reject` endpoints (single-row actions reuse this same endpoint with a one-item `ids` array).

Request:

```json
{
  "ids": ["string"],
  "comment": "string",
  "authorisedBy": "string"
}
```

Response: `BatchAdmonResponse` (same shape as batch-authorise/batch-reject).

On success, for each id: set `status: "RETURNED"`, `returnedReason: comment`, `returnedBy: authorisedBy`, `returnedAt: now`.

### 15c. Initiator's "Returned Requests" list

The New Administration tab now has a button for the initiator to see their own returned requests and resume editing them.

- Uses the existing `GET /admon` endpoint with `initiatorId` + `status=RETURNED` (both already supported by `AdmonFilters` — confirm the backend honors `RETURNED` as a filterable status value).
- **Important:** the frontend hydrates the resume form directly from the records returned by this list call (deceased accounts, administrators, probate fields, docs, `returnedReason`) — it does **not** make a separate `GET /admon/{id}` call. So this list endpoint must return the **full** `Admon` shape (including `deceasedAccounts[]` and `administrators[]` with documents), not a summary/light version.
- **Action:** Ensure `GET /admon?initiatorId=&status=RETURNED` returns full records, and that resubmitting via `PATCH /admon/{id}` (existing endpoint, `status: "PENDING_AUTH"`) correctly moves a `RETURNED` record back into the approval chain.

## 16. ADMOR: Removed field `changeAddressToAdmin`

The frontend never shipped a UI for this flag, and it's now deprecated — an ADMOR request can include multiple administrators, each with their own independent address, so a single case-level "change address to administrator's address" toggle doesn't make sense.

- **Action:** Remove `changeAddressToAdmin` from the `Admon` response model and `CreateAdmonRequest` if already scaffolded on the backend. No frontend requests will send this field going forward.

## 17. ADMOR: Reversal (Recall) — Two-Stage Approval + Batch Endpoints (ADMOR-BE-07)

The "Approved" tab now has a "Recall" action that lets a user submit a reversal against an approved ADMOR, stating a required reason. Reversals go through their own OPS → ICU approval chain, mirroring the main ADMOR flow — no dropdown scenarios, no litigation blocking, just a reason and a two-stage sign-off.

### 17a. Reversal creation defaults to `PENDING_AUTH`

`POST /admon/{admonId}/reversals` (existing endpoint) should create the reversal with `status: "PENDING_AUTH"`.

### 17b. Two-stage authorise, same pattern as `Admon`

The existing `PUT /admon/reversals/{id}/authorise` endpoint must behave like the main `Admon` authorise endpoint:

- First call (by an OPS Authoriser): `PENDING_AUTH` → `PENDING_ICU`, sets `authorisedBy`/`authorisedAt`.
- Second call (by ICU): `PENDING_ICU` → `APPROVED` (administration is reversed / account restored), sets `icuApprovedBy`/`icuApprovedAt`.
- `PUT /admon/reversals/{id}/reject` (existing) can terminally reject at either stage.

### 17c. New: Batch endpoints

The frontend was previously (incorrectly) calling the main `/admon/batch-authorise` and `/admon/batch-reject` endpoints to act on reversals — a bug, now fixed to call new reversal-specific endpoints instead:

- `POST /admon/reversals/batch-authorise`
- `POST /admon/reversals/batch-reject`

Both take the same shape as the existing `/admon/batch-authorise`/`/admon/batch-reject`:

```json
{
  "ids": ["string"],
  "comment": "string",
  "authorisedBy": "string"
}
```

Response: `{ authorised: number, rejected: number, skipped: number, details: AdmonReversal[] }`.

### 17d. `GET /admon/reversals` — `status` filter

`AdmonReversalFilters` already includes `status?: string`. The frontend now filters this list by `PENDING_AUTH` / `PENDING_ICU` (a stage-select UI mirroring the main ADMOR pending queue) — confirm the backend honors this filter.

- **Action:** Implement `POST /admon/reversals/batch-authorise` and `POST /admon/reversals/batch-reject`; make the existing single-record authorise endpoint two-stage; confirm `status` filtering on the reversals list endpoint.

---

# Dividend Mandate Payments — Backend Requirements

## 19. New: Optional Account Number Filter on Load Accounts

`POST /api/v1/dividend/mandate-payments/load` currently takes no filters — it loads every account with recently updated bank details / outstanding dividends system-wide (used by the "Load Accounts" button on the New Mandate Payment page).

The ADMOR "Approved" tab links to this page via `/dividends/new-mandate?account={estateAccountNumber}` (its "View Outstanding Dividends" button), intending to land the user on a queue pre-scoped to that one estate account. Today the load call ignores that context entirely.

### Request

```json
{
  "accountNumber": "string (optional)"
}
```

- When `accountNumber` is omitted, behavior is unchanged (loads all accounts, as today).
- When `accountNumber` is present, the response should only include unpaid dividends for that account.

---

# KYC Update — Cross-Account Change History (new)

## 20. New: Search & Register Display on `GET /accounts/kyc-changes`

The KYC Update page has a new "History" tab (`KycChangesHistory`) — a read-only, cross-account table of every KYC change (any status), separate from the KYC Approvals queue. It reuses the existing `GET /accounts/kyc-changes` endpoint but needs two additions:

### 20a. Cross-field search (`q`)

- **Add:** `q` query param on `GET /accounts/kyc-changes`, matching the pattern already requested for ADMOR search (§11a) — a single string that matches across the _shareholder's_ account number, holder name, BVN, NIN, and CHN (not `KycChange` fields directly, since the change record itself doesn't carry BVN/NIN/CHN — this requires a join back to the shareholder record).
- Case-insensitive partial match on name; exact/partial match on the identifiers.
- Combine with the existing `status`/`changeType`/`registerId`/`from`/`to` filters (AND logic).

### 20b. Register on each `KycChange` record

- **Add:** `registerSymbol` (or `registerId` + resolvable name) to each row returned by `GET /accounts/kyc-changes`.
- Today `registerId` can be used to _filter_ the list, but the returned `KycChange` objects don't say which register a row belongs to — necessary for the History table since it's a cross-register view by default (no register filter applied).
- **Frontend behavior today:** the History table renders "—" in the Register column until this field exists; already wired to display `row.registerSymbol` the moment the backend adds it, no frontend change needed.

- **Action:** Add an optional `accountNumber` field to the `POST /dividend/mandate-payments/load` request body/filters, scoping the loaded queue to that account when provided.

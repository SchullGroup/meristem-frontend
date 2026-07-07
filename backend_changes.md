# Required Backend Changes

Based on our recent updates to the KYC Update frontend flow, the backend team needs to implement the following changes to support the new data fields and functionality.

## 1. Updates to the `CreateKycChangeRequest` Endpoint

The API endpoint that handles creation of a new KYC change (e.g., `POST /api/kyc-changes` or equivalent) needs to accept a new field to store the initiator's reason for the modification.

- **Add Field:** `reason` (string, required/optional based on your business rules).
- **Purpose:** Captures the required comment submitted by the operator when proposing a field edit.
- **Frontend Usage:** Sent alongside `changeType`, `changes`, `supportingDocUrl`, and `initiatedBy`.

### 1a. `fieldChanged` — Must Reflect the Specific Field

Each KYC change is now submitted **per-field** (one field at a time) rather than in batches. The `changes` array will always contain a single element, e.g.:

```json
{
  "changeType": "CONTACT",
  "changes": [{ "field": "email", "newValue": "new@example.com" }],
  "initiatedBy": "operator@example.com",
  "reason": "Shareholder requested email update"
}
```

- **Requirement:** The `fieldChanged` property on the `KycChange` response model **must** be set to the specific field name from the single `changes` entry (e.g., `"email"`, `"holderName"`, `"bankName"`).
- **Why:** The frontend matches pending changes to individual field rows using `fieldChanged`. If this field is empty, concatenated, or set to the first entry of a legacy multi-field batch, the pending badge and disabled-edit state will not render correctly.

### 1b. Populate `oldValue` at Creation Time

- **Requirement:** When a KYC change is created, populate `oldValue` with the **current value** of that field on the shareholder account at the time the change request was submitted.
- **Why:** The Change History tab displays before/after values. Without `oldValue`, the history shows only the new value.

### 1c. Populate `initiatorName`

- **Requirement:** When creating a KYC change, resolve `initiatedBy` (email) to a display name and populate `initiatorName` on the `KycChange` response.
- **Why:** The pending badge tooltip and Change History tab show "Submitted by {name} on {date}". If `initiatorName` is null, the frontend falls back to `"—"`.

## 2. Updates to the `ShareholderAccount` Model

The core shareholder account model needs to be expanded to return additional personal and contact information for the richer tab structure.

- **Add Field:** `dob` or `dateOfBirth` (Date string)
- **Add Field:** `nationality` (String)
- **Add Field:** `tin` (String - Tax Identification Number)
- **Add Field:** `altAddress` (String - Alternative Address)

_Note: The frontend currently maps these missing fields to "N/A" (or empty strings) and will seamlessly begin displaying the backend values once they are included in the GET `/api/accounts/{accountNumber}` response._

## 3. Status Filtering on Account KYC History Endpoint

The endpoint `GET /api/accounts/{accountNumber}/kyc-history` (used to fetch KYC change history for a specific account) must support a `status` query parameter for filtering.

- **Parameter:** `?status=PENDING` (or `APPROVED`, `REJECTED`, etc.)
- **Frontend Usage:** The frontend calls this endpoint with `status=PENDING` after an account is selected to determine which fields have outstanding change requests. Each field row queries: are there any pending changes for `fieldChanged === thisField`?
- **Why:** This drives the amber "Pending" badge on individual field rows and disables the edit icon so operators cannot stack a second change on top of an unresolved one.
- **Fallback:** If status filtering is not supported, the frontend will still work but will fetch all KYC history records and filter client-side, which is inefficient for accounts with large histories.

## 4. Verify `bankAccountNumber` on `ShareholderAccount`

The Bank Details tab now displays `bankAccountNumber` (the shareholder's bank account number at their financial institution) rather than the register `accountNumber` (their shareholder account ID).

- **Requirement:** Confirm that `bankAccountNumber` is present in the `ShareholderAccount` response from `GET /api/accounts/{accountNumber}`.
- **Why:** Previously the Bank Details tab incorrectly showed `accountNumber` in the bank section. The fix now references the correct field.

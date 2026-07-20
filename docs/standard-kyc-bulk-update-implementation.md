# Standard KYC Bulk Update — Implementation Guide

## Overview

The Standard KYC bulk upload has two major updates:

1. **Backend account validation**: When a CSV is uploaded for preview, the backend checks that each account number exists in the registrar system. Only valid rows are returned; invalid ones are counted and skipped.
2. **Mandatory supporting documents**: Each shareholder whose KYC details are changing must have supporting documents attached. Documents are collected on the frontend per row and submitted alongside approved rows.

---

## 1. Backend Changes

### 1.1 Preview Endpoint (`POST /accounts/kyc-changes/bulk-upload/preview`)

**What changes:**

When the CSV is uploaded, the backend must validate each `accountNumber` against the registrar database before returning rows.

**Logic:**

```
For each row in the CSV:
  1. Look up accountNumber in the registry
  2. If found → include in the `rows` array with status "valid"
  3. If NOT found → skip the row, increment invalidCount

Return:
  - rows: only the valid rows (accounts found)
  - totalRows: total rows in the CSV (including invalid)
  - validCount: number of valid rows
  - warningCount: rows with warnings (existing logic)
  - errorCount: rows with errors (existing logic)
```

**Response type update:**

Add `invalidCount` to `KycBulkPreviewResponse`:

```ts
// src/types/account-maintenance.ts — update KycBulkPreviewResponse

export interface KycBulkPreviewResponse {
  rows: KycBulkPreviewRow[];
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
}
```

### 1.2 Submit Endpoint (`POST /accounts/kyc-changes/bulk-upload/submit`)

**What changes:**

Accept supporting documents per row.

**Request type update:**

```ts
// src/types/account-maintenance.ts — update KycBulkSubmitRequest

export interface KycBulkSubmitRequest {
  rows: {
    accountNumber: string;
    shareholderName: string;
    email: string;
    phone: string;
    address: string;
    bankName: string;
    bankAccountNumber: string;
    nin: string;
    bvn: string;
    supportingDocuments: { name: string; url: string }[]; // ← NEW
  }[];
  initiatedBy: string;
  registerId?: string;
}
```

---

## 2. Frontend Changes

### 2.1 New Types

Add a per-row review state type in `src/types/account-maintenance.ts`:

```ts
export type KycReviewDecision = "unreviewed" | "accepted" | "rejected";

export interface KycReviewRow extends KycBulkPreviewRow {
  decision: KycReviewDecision;
  documents: { name: string; url: string }[];
}
```

### 2.2 Component Architecture

The `KYCBulkUpload` component is refactored into two sub-components:

```
src/components/custom/account-maintenance/kyc/
├── kyc-bulk-upload.tsx              ← Refactored: thin wrapper, 3-step flow
├── kyc-review-panel.tsx             ← NEW: per-row detail panel (right side)
└── nibss-bulk-upload.tsx            ← (future: separate NIBSS component)
```

### 2.3 Step Flow

The step indicator changes from `["Template", "Upload", "Preview", "Submit"]` to `["Upload", "Review", "Submit"]`. The Template step is removed — the user already has their filled CSV.

### 2.4 Step 1 — Upload

Same as current Step 2. No changes needed beyond:

- Removing the "Back to Template" button (no template step)

### 2.5 Step 2 — Review (Split Panel)

This is the main new work. Uses a split-panel layout:

```
┌──────────────────────────┬──────────────────────────────────┐
│  Summary bar             │                                  │
│  8 valid · 3 invalid     │                                  │
├──────────────────────────┤       Detail Panel (60%)         │
│                          │                                  │
│  Master Table (40%)      │  ┌─ Existing Record ───────────┐ │
│                          │  │  Name: Adebayo Ogunlesi     │ │
│  #  │ Name    │ Acct │ D │  │  Acct: 0001000 · CHN: ...  │ │
│ ────┼─────────┼──────┼───│  │  Bank: GTBank · 0123456789 │ │
│  1  │ A. Ogun │ 0001 │ U │  │  BVN: 22000000000          │ │
│  2  │ C. Eze  │ 0002 │ ✓ │  └─────────────────────────────┘ │
│  3  │ I. Musa │ 0003 │ ✗ │                                  │
│  4  │ N. Okon │ 0004 │ U │  ┌─ KYC Changes (from CSV) ───┐ │
│                          │  │  Email: new@email.com       │ │
│                          │  │  Phone: +2348012345678      │ │
│                          │  │  Address: 123 New Street    │ │
│                          │  │  Bank: Access · 0987654321  │ │
│                          │  │  NIN: 11000000000           │ │
│                          │  │  BVN: 22000000000           │ │
│                          │  └─────────────────────────────┘ │
│                          │                                  │
│                          │  ── Supporting Documents ──      │
│                          │  <MultiDocUpload />              │
│                          │                                  │
│                          │  [Approve & Update]  [Reject]    │
└──────────────────────────┴──────────────────────────────────┘
```

**Master Table Columns:**

| #   | Subscriber Name  | Account No | Decision   |
| --- | ---------------- | ---------- | ---------- |
| 1   | Adebayo Ogunlesi | 0001000    | Unreviewed |
| 2   | Chioma Eze       | 0002111    | ✓ Accepted |
| 3   | Ibrahim Musa     | 0003222    | ✗ Rejected |

**Decision badges:**

- `unreviewed` — neutral/outline badge
- `accepted` — green badge with checkmark
- `rejected` — red badge with X

**Summary bar:**

```
8 total · 8 valid · 3 invalid (skipped)  ·  5 accepted · 2 rejected · 1 unreviewed
```

**Detail Panel (right side):**

The panel is persistent — clicking a row in the table loads its details here.

**Top section — Existing Record:**

- Fetched via `useGetAccount(accountNumber)` when row is selected
- Shows key fields: name, account number, CHN, bank name, bank account number, BVN, NIN, phone, email, address
- This is read-only reference — the registrar sees what's currently in the database

**Middle section — KYC Changes (from CSV):**

- Shows the fields being updated: email, phone, address, bank name, bank account number, NIN, BVN
- Fields that differ from the existing record are highlighted (amber background)
- Fields that are the same are shown muted

**Bottom section — Supporting Documents:**

- Uses the existing `MultiDocUpload` component
- Required before the Approve button becomes enabled
- Files are uploaded to storage immediately on drop (via `GetImageUrl` / `GetPDFUrl`)
- URLs are collected in the row's `documents` array

**Action buttons (sticky footer):**

- **Approve & Update** — disabled until at least one document is uploaded. Marks row as `accepted`.
- **Reject** — always enabled. Marks row as `rejected`.

### 2.6 Step 3 — Submit

Same as current Step 4, with these updates:

- Only `accepted` rows are included in the submit payload
- `rejected` rows are silently dropped
- `unreviewed` rows trigger a confirmation dialog

**Confirmation dialog before submit:**

> You have 3 unreviewed rows that will be skipped.
>
> - 5 rows approved (will be submitted)
> - 2 rows rejected (will be skipped)
> - 3 rows unreviewed (will be skipped)
>
> Continue anyway?

If all rows are rejected or unreviewed, the submit button is disabled with the message "No rows approved for submission."

---

## 3. State Management

### 3.1 Row State Flow

```
CSV parsed (backend validates)
        │
        ▼
KycBulkPreviewRow[] (only valid accounts)
        │
        ▼  (user reviews)
KycReviewRow[]  ←  wraps each row with decision + documents
        │
        ▼  (user clicks submit)
Only accepted rows → KycBulkSubmitRequest
```

### 3.2 Key State Variables

```ts
// In KYCBulkUpload component:
const [kycRows, setKycRows] = useState<KycReviewRow[]>([]);
const [selectedRow, setSelectedRow] = useState<number | null>(null); // row number
const [invalidCount, setInvalidCount] = useState(0);

// Derived:
const acceptedRows = kycRows.filter((r) => r.decision === "accepted");
const rejectedRows = kycRows.filter((r) => r.decision === "rejected");
const unreviewedRows = kycRows.filter((r) => r.decision === "unreviewed");
```

### 3.3 Row Actions

```ts
// When a row is approved:
function approveRow(
  rowNum: number,
  documents: { name: string; url: string }[],
) {
  setKycRows((prev) =>
    prev.map((r) =>
      r.row === rowNum ? { ...r, decision: "accepted", documents } : r,
    ),
  );
  setSelectedRow(null); // return to table
}

// When a row is rejected:
function rejectRow(rowNum: number) {
  setKycRows((prev) =>
    prev.map((r) => (r.row === rowNum ? { ...r, decision: "rejected" } : r)),
  );
  setSelectedRow(null);
}

// When a row is clicked (to re-review):
function selectRow(rowNum: number) {
  setSelectedRow(rowNum);
}
```

---

## 4. File-by-File Change Summary

| File                                                                 | Change                                                                                                                                                |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/account-maintenance.ts`                                   | Add `invalidCount` to `KycBulkPreviewResponse`; add `supportingDocuments` to `KycBulkSubmitRequest`; add `KycReviewDecision` and `KycReviewRow` types |
| `src/actions/accountMaintenanceActions.ts`                           | No changes (handles `KycBulkSubmitRequest` with documents field)                                                                                      |
| `src/hooks/useAccountMaintenance.tsx`                                | No changes needed                                                                                                                                     |
| `src/components/custom/account-maintenance/kyc/kyc-bulk-upload.tsx`  | Major refactor: split-panel layout, per-row review, document upload, decision tracking                                                                |
| `src/components/custom/account-maintenance/kyc/kyc-review-panel.tsx` | **New file**: the detail panel component                                                                                                              |
| Backend: `previewKycBulkUpload`                                      | Add account existence validation; return `invalidCount`                                                                                               |
| Backend: `submitKycBulkUpload`                                       | Accept `supportingDocuments` per row                                                                                                                  |

---

## 5. Edge Cases

| Situation                                    | Handling                                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| CSV has no valid rows (all accounts invalid) | Show empty state: "None of the X account numbers were found in the registry." Offer to upload a different file |
| CSV has some invalid rows                    | Summary bar shows invalid count. Table shows only valid rows. User never sees invalid rows                     |
| User tries to approve without documents      | Approve button is disabled. Tooltip: "Upload at least one supporting document"                                 |
| User approves, then changes mind             | Click the row again → reopens panel → can flip to rejected (or vice versa)                                     |
| All rows rejected                            | Submit button disabled. Message: "No rows approved for submission."                                            |
| Unreviewed rows remain at submit             | Confirmation dialog warns user before proceeding                                                               |
| Browser refresh during review                | `beforeunload` event warns: "You have unsaved review progress. Leave anyway?"                                  |

---

## 6. Differences: Standard KYC vs NIBSS Live Mandate

| Aspect               | Standard KYC                                                      | NIBSS Live Mandate                                    |
| -------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Who provides the CSV | Registrar fills template                                          | NIBSS provides the file                               |
| Template download    | Yes (step 1)                                                      | No                                                    |
| Backend validation   | Validates accounts exist; returns only valid rows + invalid count | No backend yet (mock)                                 |
| Database comparison  | Backend does it automatically                                     | Registrar does it per row (side-by-side)              |
| Lookup key           | `accountNumber` (validated by backend)                            | `bvn` (registrar verifies name)                       |
| Supporting documents | Required per row                                                  | Required per row                                      |
| Review mode          | Per-row accept/reject with existing record reference              | Per-row accept/reject with side-by-side DB comparison |

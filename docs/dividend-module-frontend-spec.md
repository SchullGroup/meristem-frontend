# Dividend Management Module — Frontend Functional Breakdown

**Purpose of this document:** `docs/backend-spec.md` explicitly defers the Dividends module ("Additional modules ... Dividends ... will be appended as the project progresses"). This document reverse-engineers the _already-built_ frontend for the Dividend Management module — screens, fields, validation, API contracts, and business/edge-case logic — so it can be diffed against the client's functional specification and feedback list to surface missing requirements, API gaps, and UI discrepancies.

**Method:** Direct reading of every page, component, action (API-call), hook, and type file under the `dividends` route tree, `dividend-*` component folders, `warrant-markoff` component folder, and their supporting `actions/`, `hooks/`, and `types/` files.

**Scope — 7 sub-modules**, each its own route under `/dividends/*`:

| #   | Sub-module                     | Route                        | Tabs / Screens                                                                               |
| --- | ------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | New Mandate Payment Processing | `/dividends/new-mandate`     | Review Queue · Pending Approval · ICU Approval                                               |
| 2   | Dividend Declaration           | `/dividends/declaration`     | New Declaration · Draft · Pending Approval · ICU Approval · Declaration History              |
| 3   | Dividend Payment               | `/dividends/payment`         | Declaration Payments · ICU Approval · New Mandate Payments · Payment History · Re-Push Queue |
| 4   | Return Money                   | `/dividends/return-money`    | Unclaimed Dividends · Withheld Payments · Reimburse Requests                                 |
| 5   | Dividend Split                 | `/dividends/split`           | New Split · Pending Approvals                                                                |
| 6   | Warrant Mark-Off               | `/dividends/warrant-markoff` | Manual Mark-Off · En Bloc Mark-Off · Bulk Upload · Pending Approvals · History               |
| 7   | Dividend Reports               | `/dividends/reports`         | 6 report types behind one filter bar                                                         |

All API endpoints are relative to the app's base URL and live under the `/dividend/...` path prefix. All mutation payloads that need an "acting user" read `currentUser.email` from the Zustand store (`useStore`) — there is no separate approver/session-token field in request bodies.

---

## 1. New Mandate Payment Processing

**Page:** `src/app/(dashboard)/dividends/new-mandate/page.tsx` · **Actions:** `src/actions/divNewMandate.ts`
**Purpose:** Process dividend payments for shareholder accounts that recently had a bank-mandate/KYC update — these are held out of normal payment runs until reviewed.

### 1.1 Review Queue (tab `queue`)

**User flow:**

1. Optionally filter by **Register** (Select, options from `useGetRegisters({size:100, status:"ACTIVE"})`, value = `symbol`) and **Dividend Number** (Select, populated from `GET_ALL_DIVIDEND_DECLARATIONS_NUMBERS`, filtered by register).
2. Click **Load Accounts** → `POST /dividend/mandate-payments/load`. On success, toast + queue table populates.
3. Select rows via checkboxes (header checkbox = select all loaded).
4. A sticky bottom bar shows "N items selected · Total: ₦X" with **Submit Selected for Approval**.
5. Submit → `POST /dividend/mandate-payments/submit`.

**Fields:** Register (optional, default "All Registers"), Dividend Number (optional, default "All Dividends", disabled interaction resets when register changes), row checkboxes.

**Validation:** Submit blocked (`toast.error("No accounts selected")`) if `queueLoaded && selectedIds.size === 0`.

**API calls:**

- `GET /dividend/mandate-payments/queue` — params `{ registerId, dividendNumber, page, size }` — response `data.content` rows: `id, registerNumber, holderName, newBank, accountNumber, dividendNumber, amount`.
- `POST /dividend/mandate-payments/load` — no body — triggers server-side load of the queue.
- `POST /dividend/mandate-payments/submit` — body `{ ids: string[], totalAmount: number, authorisedBy: string }`.

**Edge cases:** Table shows animated skeleton rows while loading; "No records found" empty state; each row tagged with a "KYC Update" badge (hardcoded, not derived from data); pre-load state shows a prompt card instead of a table.

### 1.2 Pending Approval (tab `auth`)

**User flow:** Paginated table of items with `status === "PENDING_OPS"` (client-side filtered from the full pending list). Checkbox-select rows → batch action bar ("Reject Selected" / "Approve Selected"). Single-row **Review & Decide** opens a detail dialog with an Approval Chain visual, Comment textarea, Reject/Approve buttons.

**API calls:**

- `GET /dividend/mandate-payments/pending` — params `{ page, size }` — response `data.content`, `totalElements`, `totalPages`.
- `POST /dividend/mandate-payments/{id}/approve` — body `{ comment, authorisedBy }`.
- `POST /dividend/mandate-payments/{id}/reject` — body `{ comment, authorisedBy }`.
- `POST /dividend/mandate-payments/batch/approve` — body `{ ids, comment, authorisedBy }`.
- `POST /dividend/mandate-payments/batch/reject` — body `{ ids, comment, authorisedBy }`.

**Validation:** Reject (single or batch) requires non-empty comment — `toast.error("Comment is required for rejection.")` / `"Comment required for rejection."`.

**Edge case / dead code:** `approvalChainSteps()` has hardcoded step arrays for authoriser/ICU decisions **entirely commented out** — only the "Submitted by X" step ever renders; the second approval-chain step (e.g., "Emeka Obiora (Authoriser) · Pending your action") is dead/placeholder code, so the Approval Chain UI never shows more than one step regardless of actual backend state. "Download Records" button only fires a toast — no real export.

### 1.3 ICU Approval (tab `icu`)

Same table/dialog pattern as Pending Approval, sourced from a separate endpoint (`GET /dividend/mandate-payments/icu`), styled with a blue "ICU Sign-Off Required" banner ("Items below exceed Tier 3 threshold..."). Amount is shown in red/bold. Dialog title becomes "ICU Review — New Mandate"; approve button label becomes "ICU Sign-Off & Approve". Same approve/reject/batch endpoints as 1.2 are reused (same mutation functions).

**Note:** the review dialog shows a static condition `selected?.tier > 4` banner text ("exceeds Tier 4... ICU sign-off required") but the `MandateApproval` type has no `tier` field being populated from any query in this file — this banner is effectively unreachable/dead in current wiring.

---

## 2. Dividend Declaration

**Page:** `src/app/(dashboard)/dividends/declaration/page.tsx` · **Actions:** `src/actions/divDeclarationActions.ts` · **Hook:** `src/hooks/useGetDividendLiabilityPreview.tsx`
**Purpose:** Declare a dividend for a register (rate × qualifying stock), preview the per-shareholder liability, and route it through a 4-tier approval workflow before it becomes payable.

### 2.1 New Declaration (tab `new`)

**Access control:** Users with role `ENQUIRY_ONLY` or `AUDIT_REVIEWER` (from `currentUser.roles[0]`) see a permission-denied card instead of the form.

**Fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| Register | Select | Yes (_) | Only `status === "ACTIVE"` registers listed |
| Dividend Type | Select | Yes (_) | `FINAL` (default) / `INTERIM` / `SPECIAL` |
| Currency | Select | No | From `useGetCurrencies()`, default `NGN` |
| Dividend Rate (₦/share) | Number input, step 0.0001 | Yes (_) | Drives live Gross/WHT/Net calculation |
| Fractional Register | Switch | No | default off |
| Qualification Date | Date picker | Yes (_) | |
| Closure Date | Date picker | Yes (_) | Must be ≥ Qualification Date |
| Payment Date | Date picker | Yes (_) | Must be ≥ Closure Date |
| Narrative | Textarea | No | |
| Warehouse Bank | Select (GTBank/Zenith/Access/First/UBA/Stanbic — hardcoded list) | No | **Not included in the submit payload at all** — pure UI, no state binding, no `value`/`onValueChange` |
| Warehouse Account No | Input | No | **Same — not wired to state or payload** |

**Live computed panel (client-side):** `grossLiability = rate × stockToday` (stockToday from `register.currentStockInIssue`); `wht = grossLiability × 0.10` (hardcoded 10% WHT); `netLiability = grossLiability − wht`. A "TIER N" banner appears once `grossLiability > 0`:

- Tier 1 (≤ ₦500,000): Auto-Approval, requires None.
- Tier 2 (≤ ₦5,000,000): Manager Approval Required — Ops Manager.
- Tier 3 (≤ ₦50,000,000): Compliance Approval Required — Internal Control (ICU).
- Tier 4 (> ₦50,000,000): Board Approval Required — MD + CEO dual sign-off.

(These thresholds match `docs/backend-spec.md §6.1` tier limits exactly — `TIER2_LIMIT=500000`, `TIER3_LIMIT=5000000`, `TIER4_LIMIT=50000000` — confirming the frontend tier bands are already aligned with the documented backend rule.)

**Validation (`handleSubmit`), each blocks with a toast:**

1. Register `TRANSACTION_DISABLED`/`INACTIVE` → "Cannot declare dividend — register is Inactive or Transaction Disabled."
2. Missing Qualification/Closure/Payment date → 3 distinct messages.
3. `closureDate < qualificationDate` → "Closure date must be greater than qualification date."
4. `paymentDate < closureDate` → "Payment date must be greater than closure date."

**Submit payload** (`POST /dividend/declarations`):

```json
{
  "registerId": "symbol",
  "dividendType": "FINAL|INTERIM|SPECIAL",
  "rate": 0,
  "currency": "NGN",
  "qualificationDate": "yyyy-MM-dd",
  "closureDate": "yyyy-MM-dd",
  "paymentDate": "yyyy-MM-dd",
  "fractionalRegister": false,
  "narrative": "",
  "initiatedBy": "user@email"
}
```

**Preview Liability modal** ("Preview Liability Table" button, enabled once rate+register set):

- `GET /dividend/declarations/liability-preview?registerId=&rate=&page=` (0-indexed) — paginated per-shareholder rows (`accountNumber, holderName, units, grossDividend, whtAmount, netDividend`) plus header totals (`totalShareholders, grossLiability, whtAmount, netPayout, rate, registerSymbol`).
- **Download Full List (Excel)** — separately calls `GET_DIVIDEND_LIABILITY_PREVIEW_FULL` (same endpoint, `size` = full total) and builds an `.xlsx` client-side via the `xlsx` package with auto-fit columns; filename `dividend_liability_preview_{symbol}_{timestamp}.xlsx`.

**Business rules displayed as static UI copy (not necessarily enforced anywhere visible):** "Dividend computed on units held as at Qualification Date"; "Initiator cannot authorise their own declaration"; "Once authorised, computation results are immutable" — **no code in this file actually checks initiator ≠ approver**; this is asserted only as on-screen text, matching the backend spec's stated rule (§6.3) but with no client-side enforcement to catch it before the API call.

### 2.2 Draft / Pending Approval / ICU Approval / History (tabs `draft`, `auth`, `icu`, `history`)

All four share the same list pattern: Register + Dividend Type filters, paginated table (`PAYMENT NO, REGISTER, TYPE, RATE, GROSS LIABILITY, TIER, STATUS, ACTIONS`), row checkboxes for batch select, "Review & Decide" per-row action opening a detail dialog.

- **Draft** — `GET /dividend/declarations?status=DRAFT&...`. Row action opens the same review Sheet; if status is `DRAFT`, the Sheet shows a single **Submit** button → `POST /dividend/declarations/{id}/submit`.
- **Pending Approval** — `GET /dividend/declarations?status=PENDING_TIER2&...`.
- **ICU Approval** — `GET /dividend/declarations` (unfiltered by status server-side) then **client-side filtered** to `status === "PENDING_TIER3" || status === "PENDING_TIER4"`.
- **History** — `GET /dividend/declarations?status=AUTHORIZED&...`. Row actions via dropdown menu: "View Details", "Print Warrant Advice" (toast-only, no real print), "Recall Declaration" (only if `DRAFT` — toast-only, no API call), "Re-submit" (only if `REJECTED` — toast-only, no API call).

**Approve/Reject (shared across Draft/Pending/ICU dialogs):**

- `POST /dividend/declarations/{id}/approve` — body `{ comment, authorisedBy }`.
- `POST /dividend/declarations/{id}/reject` — body `{ comment, authorisedBy }`. Requires non-empty comment (both regular and ICU dialogs) — `toast.error("Comment is required")`.
- Approve in the regular (non-ICU) dialog has its comment-required check **commented out** (`// if (!sheetComment) {...}`), so approving from Draft/Pending tabs does **not** require a comment, while ICU-approve **does** require one (`handleIcuApprove` still enforces it).

**Batch approve/reject on Draft/Pending/ICU tabs:** `handleBatchApprove` / `handleBatchReject` are **entirely local/fake** — they only fire `toast.success`/`toast.error` with a count and clear selection; **no API call is made for batch operations anywhere in this file**, unlike the equivalent New Mandate and Warrant Mark-Off modules which do call real batch endpoints. This is a significant functional gap if batch approval is expected to persist.

**Excel export ("Download Records" buttons on Draft/Auth/ICU/History tabs):** toast-only (`toast.info("Downloading...")`) — no real export triggered from these list tabs (contrast with the New-Declaration tab's liability preview, which does export real Excel).

---

## 3. Dividend Payment

**Page:** `src/app/(dashboard)/dividends/payment/page.tsx` · **Actions:** `src/actions/dividendPayments.ts` · **Hook:** `src/hooks/useDividendPayment.tsx`
**Purpose:** Initiate and track actual disbursement of authorised dividends via NIBSS/Remita, ICU-approve payment runs, handle newly-mandated accounts, view history, and manage a re-push queue for failed payments.

### 3.1 Declaration Payments

**Purpose:** Pick an `AUTHORIZED` declaration, initiate a payment run against a gateway, and download the NIBSS settlement file.

**Flow:** Register → Dividend (dropdown pre-filtered to `AUTHORIZED` declarations) → auto-loads payment data → optional Payment Status filter (All/Unpaid/Paid) → choose Gateway (NIBSS default/Remita) → **Initiate Payment Run** → button becomes disabled "Run Initiated" + a client-side-only **Reset** appears → **Download NIBSS File (.txt)** once a run exists.

**Validation:** No gateway → "Please select a payment gateway"; no dividend selected → "Please select a dividend number."; no session → "Your session has expired. Please login again."; download attempted before a run exists → "Please initiate a payment run first to generate a NIBSS file."

**API calls:**

- `GET /dividend/payment-runs/declaration-payment` — params `{ registerId, paymentNumber, status, page, size }` — response includes `totalOnRegister, totalEligible, totalPayout, successful, failedAttempts, declarationId, rows.{content,totalElements,totalPages}` (rows: `serial, accountNumber, holderName, bankSortCode, bankName, amount, narration, status, warrantNumber`).
- `POST /dividend/payment-runs` — body `{ declarationId, gateway, initiatedBy }`.
- `GET /dividend/payment-runs/{id}/nibss-file` (blob) → downloaded as `PAY-DIV-{activeRunId}.txt`.

**Edge cases:** "Unpaid" stat is client-computed (`totalEligible − successful − failedAttempts`), not server-supplied; changing Register/Dividend resets `activeRunId` client-side only — **no API call cancels the just-initiated run server-side**; no visible tier/approval gating in this tab (relies on the dividend dropdown already being restricted to `AUTHORIZED`).

### 3.2 ICU Approval

**Purpose:** Approve payment runs with `status: "PENDING_ICU"` (hardcoded filter).

**Filters:** Register, Date Range, Payment Gateway — all optional. Review dialog shows run detail (Reference, Payment Number, Register, Gateway, Date Run, Total Records, Total Amount) + required **Comment** + **Approve**/**Cancel**.

**API calls:**

- `GET /dividend/payment-runs` — params `{ page, size, dateFrom, dateTo, registerId, gateway, status: "PENDING_ICU" }`.
- `POST /dividend/payment-runs/{id}/approve` — body `{ comment, authorisedBy }`.

**Validation:** No target → "No active payment run to approve."; no session → session-expired toast; empty comment → "Please leave a comment".

**Gap flagged:** **No reject/decline action exists on this tab at all** — approve-only, no batch approval, and no visible check that the approver differs from the run's initiator.

### 3.3 New Mandate Payments

**Purpose:** Push individually-queued, newly-mandated shareholder payments to NIBSS (distinct data source from §1's New Mandate module — see cross-cutting note below).

**Filters:** Registers, Dividend Number (populated from `useGetDividendDeclarations`). Table has row checkboxes (rows already `PAID` have none) + header select-all (current page only) + batch **Push Selected to NIBSS** + per-row **Push to NIBSS**.

**Validation:** Batch push with none selected → "Select records to push"; invalid single id → "Invalid record ID".

**API calls:**

- `GET /dividend/mandate-payments/queue` (via `useGetMandatePayments`) — params `{ registerId, dividendNumber, page, size }`.
- `POST /dividend/mandate-payments/{id}/push-to-nibss` — single push, no body.
- `POST /dividend/mandate-payments/batch/push-to-nibss` — body `{ ids: string[] }`.

**Notable code smell:** row rendering falls back across multiple possible field names (`row.accountNumber || row.account`, `row.holderName || row.holder`, `row.amount || row.grossAmount`, etc.) — indicates the actual response contract isn't finalized. A **Payment Status filter** exists as dead code — state declared, its `<Select>` UI fully commented out.

**Cross-cutting note:** this tab's endpoints (`/dividend/mandate-payments/queue`, `/push-to-nibss`) are entirely separate from the approval-workflow endpoints used by the standalone **New Mandate Payment Processing** page (§1, `/dividend/mandate-payments/pending`, `/icu`, `/approve`, etc., defined in `divNewMandate.ts`). These are two parallel "mandate payment" concepts under similar names — worth explicit disambiguation with the client since it's an easy point of confusion when comparing against a functional spec.

### 3.4 Payment History

**Purpose:** Read-only log of all payment runs (no status filter — returns every status).

**Filters:** Register, Date Range only.

**API calls:**

- `GET /dividend/payment-runs` — params `{ page, size, dateFrom, dateTo, registerId }` (no `status`).
- `GET /dividend/payment-runs/{id}/receipt` (blob) → downloaded as `payment-run-receipt-{ref}.csv`.
- `POST /dividend/payment-runs/{id}/repush` — row-level Re-push button (shown only if `status === "FAILED"`), no body.

**Bug flagged:** the detail dialog's **"Add to Re-Push Queue"** button does **not** call the repush API at all — it only fires `toast.success("Added to re-push queue")` and closes the dialog. This is a fake success, inconsistent with the row-level Re-push button in the same tab, which does call the real endpoint.
**Also flagged:** receipt download is forced to `text/csv` client-side, but the action-layer code comment describes it as a "PDF stub" (`application/pdf`) — content-type expectation mismatch worth confirming with backend.

### 3.5 Re-Push Queue

**Purpose:** Per-warrant (not per-run) queue of failed/rejected/unpaid payments for individual re-submission.

**Filters:** Payment Status (blank/FAILED/REJECTED/UNPAID).

**Flow:** Table → "View Holder" opens detail dialog (with failure reason) → "Re-Push This Payment" or row "Re-push" → opens a "Confirm Re-Push" dialog (Account/Holder/Bank/Amount/Fail Reason + warning copy) → Confirm.

**API calls:**

- `GET /dividend/repush-queue` — params `{ page, size, status }`.
- `POST /dividend/repush-queue/{id}/repush` — no body.

**Gap flagged:** the actions/hooks layer already defines **batch repush** (`POST /dividend/repush-queue/batch/repush`, body `{ ids, comment, authorisedBy }`, response with per-item success/failure) via `useBatchRepush()`, but this component has **no checkboxes or batch UI at all** — only one-at-a-time re-push, and no comment field on the single re-push flow despite the batch contract requiring one.

---

## 4. Return Money

**Page:** `src/app/(dashboard)/dividends/return-money/page.tsx` · **Types:** `src/types/dividend-return-money.ts` · **Hook:** `src/hooks/useDividendReturnMoney.ts` · **Actions:** `src/actions/dividendReturnMoneyActions.ts`
**Purpose (per page subtitle):** "Manage unclaimed dividend returns — 90% to company, 10% withheld for shareholder claims."

> **⚠️ Critical integration finding:** This entire sub-module is currently **mock-data driven**. `dividendReturnMoneyActions.ts` (the file with real `api.get`/`api.post` calls) is **never imported anywhere** in the codebase. Every hook in `useDividendReturnMoney.ts` reads from hardcoded arrays in `src/components/custom/dividend-return-money/seed-data.ts` and simulates latency with `setTimeout`. The hook file contains its own comment: `// TODO: swap these mock queryFns for the real actions when endpoints are ready`. A page refresh reverts all "saved" state. This means **all API endpoints and payloads below are the intended contract inferred from the mock hook signatures, not currently-wired live calls** — treat this whole section as a wishlist/target spec, not confirmed working integration.
>
> There is also a **response-envelope mismatch** that would break real wiring as-is: `dividendReturnMoneyActions.ts` types responses as the app-wide `PaginatedResponse<T>` envelope (`{ isSuccessful, responseMessage, data: { content, totalElements, ... } }`), but every component consumes the flat `ContentPaginatedResponse<T>` shape (`{ content, totalElements, ... }`, no `data` wrapper) that the mock `paginate()` helper produces. Swapping in the real action as-is would silently break (`data?.content` would be `undefined`).

### 4.1 Unclaimed Dividends

**Purpose:** Per-declaration overview of unclaimed pools; initiate a "return" (to Company under a 90/10 split, or to SEC as a fixed remittance); review/approve pending return initiations (2-step: ICU → Final).

**90/10 split verification:** the 90% is a **hardcoded client-side literal** (`returnPercentage: recipientType === "COMPANY" ? 90 : undefined`), not read from any configurable backend setting. SEC has no split — a fixed amount is entered manually.

**Filters:** Register, Status (`PENDING_RETURN`/`RETURNED`/`PARTIALLY_CLAIMED`/`EXHAUSTED`).

**Initiate Return dialog fields:** Recipient Type* (Company/SEC toggle, default Company), Amount to Remit to SEC* (number, only when SEC selected, hint shows max = total unclaimed), Narration (optional).

**Validation:** SEC amount must be > 0 ("Enter the amount to remit to SEC."); must not exceed total unclaimed ("Amount cannot exceed total unclaimed of ₦X."); reject requires comment ("A comment is required when rejecting.").

**Intended API contract (mock-only today):**

- List: `GET /dividend/return-money` — params `{ registerSymbol?, paymentNumber?, returnStatus?, page?, size? }`.
- Legacy single-step: `POST /dividend/return-money/{id}/process-return` — body `{ returnRecordId, recipientType, returnPercentage?, secAmount?, narration? }`.
- **The UI's actual 2-step initiation/approval flow (create initiation → ICU approve → final approve/reject) has _no_ matching backend action defined at all** — only the legacy single-step `processReturn` exists in the actions file. This is the clearest backend-spec gap in the module.

### 4.2 Withheld Payments

**Purpose:** Disburse from a declaration's 10%-withheld pool to shareholders who later claim; approve/reject/bulk-approve; set a low-balance notification threshold.

**Flow:** Select Declaration → summary cards (Originally Withheld, [Reimbursements Received if any], Paid to Shareholders, Remaining Balance) → if exhausted (`remainingBalance ≤ 0`), red warning + "Record Shareholder Payment" disabled → dialog: Shareholder Name*, Account No*, Amount\* (max = remaining balance), Narration → submit for approval → row-level or bulk Review/Approve.

**Validation:** name/account required; amount must be valid > 0 and ≤ remaining balance; reject requires comment; threshold must be valid number > 0.

**Intended API contract:** only `GET /dividend/return-money/withheld-payments` (list) and `POST /dividend/return-money/withheld-payments` (record) exist in the real actions file. **Review (approve/reject), bulk-approve, and set-notification-threshold have no backend action counterpart at all** — pure mock/local-state today.

### 4.3 Reimburse Requests

**Purpose:** When the 10% pool is exhausted, request the company return part of its already-received 90% to top up shareholder claims. Two-step approval (L1 → Final).

**New Request dialog:** % of 90% Return to Request Back* (0–90, client-clamps values >90 down to 90, live "Calculated amount" preview, quick-fill "Use shortfall %" link), Reason*, Narration (optional).

**Validation:** percentage must be in (0,90]; reason required; reject requires comment.

**Intended API contract:** `GET /dividend/return-money/refund-requests`, `POST /dividend/return-money/refund-requests` (create), `POST /dividend/return-money/refund-requests/{id}/approve` exist — but the real approve endpoint has **no `step` parameter** to distinguish L1 vs Final approval (the UI's two-step model has no matching two-step endpoint), and **no reject endpoint exists at all** in the real actions file.

**Status note:** `RefundRequestStatus.RECEIVED` is a fully defined/styled status with **no code path anywhere that ever sets it** — implied to need a backend-driven confirmation step not yet modeled on the frontend.

### 4.4 Shared Data Model (`src/types/dividend-return-money.ts`)

- **`DividendReturnRecord`**: `id, declarationId, paymentNumber, registerSymbol, registerName, qualificationDate, paymentDate, shareholderCount, totalUnclaimed, returnPercentage, returnAmount, withheldPercentage, withheldAmount, totalPaidToShareholders, totalReimbursed, remainingBalance, returnStatus, recipientType?, returnDate?, returnRef?, notificationThreshold?, pendingInitiationId?`
- **`ReturnInitiation`**: `id, returnRecordId, paymentNumber, registerSymbol, recipientType, totalUnclaimed, returnAmount, withheldAmount, secAmount?, narration?, initiatedBy, initiatedDate, status(PENDING_APPROVAL|ICU_APPROVED|PROCESSED|REJECTED), icuApprovedBy?, icuApprovedDate?, processedBy?, processedDate?, rejectedBy?, rejectionComment?`
- **`WithheldPayment`**: `id, returnRecordId, declarationId, paymentNumber, registerSymbol, shareholderName, accountNo, amount, paymentDate, reference, status(PENDING|APPROVED|REJECTED), approvedBy?, approvedDate?, rejectionComment?, narration?`
- **`RefundRequest`**: `id, returnRecordId, declarationId, paymentNumber, registerSymbol, totalWithheld, totalPaidToShareholders, remainingBalance, requestedAmount, reason, requestDate, initiatedBy, status(PENDING|FIRST_APPROVED|APPROVED|RECEIVED|REJECTED), firstApprovedBy?, firstApprovedDate?, approvedBy?, approvedDate?, receivedDate?, rejectedBy?, rejectionComment?, narration?`

---

## 5. Dividend Split

**Page:** `src/app/(dashboard)/dividends/split/page.tsx` · **Actions:** `src/actions/dividendSplitActions.ts` · **Hook:** `src/hooks/useDividendSplit.tsx`
**Purpose:** Split a single dividend warrant's net amount across 2–4 destination accounts, subject to approval.

### 5.1 New Split (`SplitFormPanel`)

**Flow:** (Optional) Register → Account No/CHN + **Lookup** → account summary chip appears → **Select Dividend** dropdown enables → Step 2 fieldset (destinations) only enables if the chosen dividend is `eligible` → pick **Number of Parts** (2/3/4 only) → fill each row's Destination Account + Amount → live balance banner ("✓ Balanced" or "₦X remaining/over-allocated") → **Reason\*** → **Submit for Approval**.

**Balancing rule:** allocated amounts must sum **exactly** to the dividend's `netAmount` (`remaining === 0`, no tolerance, no percentage option — fixed currency per destination only).

**Validation (in order):** must lookup + select dividend first; dividend must be eligible ("Only eligible dividends may be split."); reason required; all destination/amount fields filled; each amount > 0; allocated total must exactly match net amount; session must be valid.

**API calls:**

- `GET /dividend/splits/account-lookup` — params `{ accountNumber, registerId }`.
- `GET /dividend/splits/eligible-dividends` — params `{ accountNumber }` — items: `dividendId, dividendNumber, warrantNumber, netAmount, status, eligible`.
- `POST /dividend/splits ` _(⚠ literal trailing space in the endpoint string in code — likely a typo worth confirming doesn't break routing)_ — payload:

```json
{
  "registerId": "",
  "sourceAccountNumber": "",
  "dividendId": "",
  "reason": "",
  "submittedBy": "user@email",
  "parts": [{ "destinationAccountNumber": "", "amount": 0 }]
}
```

**Dead UI:** the page-level `rejectedComment` banner state is never set to anything other than `""` anywhere in the split flow — the "Request Rejected" banner is currently unreachable, suggesting the intent was to surface a rejection reason back on this tab (as other modules do) but the wiring was never completed.

### 5.2 Pending Approvals (`PendingSplitsTable`)

Paginated list (`GET /dividend/splits/pending`, params `{page,size}`), checkbox multi-select, batch **Approve Selected** (fires immediately, no dialog) / **Reject Selected** (opens comment dialog).

**API calls:**

- `POST /dividend/splits/batch/approve` — body `{ ids, comment: "Batch approved" /* hardcoded, not user-entered */, authorisedBy }`.
- `POST /dividend/splits/batch/reject` — body `{ ids, comment, authorisedBy }`.

**Bugs flagged:**

- The batch-reject Textarea is visually labeled "Rejection Comment \*" (required) but `handleBatchReject` does **not** actually block an empty comment — no client-side guard prevents submitting `comment: ""`.
- On successful batch reject, the code calls `toast.error(...)` (not `toast.success`) — likely intentional red styling for a negative action, but worth flagging as unusual.

### 5.3 Split Review Dialog (single item, from Pending Approvals row action)

Shows warrant/holder/split-parts breakdown + a **static, hardcoded 2-step approval chain visual** (does not read the real `approvalChain` array present on the `DividendSplit` type) + required **Comment** + Approve/Reject.

**API calls:** `POST /dividend/splits/{id}/approve` / `POST /dividend/splits/{id}/reject` — both `{ comment, authorisedBy }`.

**Confirmed bug:** `handleReject`'s success/error toast messages are copy-pasted from the approve path — a user rejecting a split sees `"Split approved successfully."` instead of a rejection message.

### 5.4 Batch Reject Dialog (standalone component file)

`batch-reject-dialog.tsx` defines a generic (`any`-typed props) reject dialog that is **not imported/used anywhere** — `PendingSplitsTable` implements its own inline reject dialog instead. This file appears to be orphaned/dead scaffold code.

**Also unused:** `getSplitDetailsRequest` (`GET /dividend/splits/{id}`) has a defined hook (`useGetSplitDetailsRequest`) but is never called — the review dialog uses the row object passed in from the table instead of fetching fresh detail.

---

## 6. Warrant Mark-Off

**Page:** `src/app/(dashboard)/dividends/warrant-markoff/page.tsx` · **Actions:** `src/actions/warrantMarkoffActions.ts` · **Hook:** `src/hooks/useWarrantMarkoff.tsx`
**Purpose:** Flag dividend warrants as paid — single warrant, filtered bulk selection, or file upload — routed through a 3-tier approval chain (1st Approval → ICU → Management).

### 6.1 Manual Mark-Off

**3-step flow:** Select Register → Search Warrant No/Account No/CHN → on match, review Warrant Details card (Warrant No, Account, Holder, Dividend, Net Amount, Status) + required **Reason/Comment** → **Submit Mark-Off for Approval**. A rejected mark-off (from the Pending Approvals tab) surfaces here as a dismissible red banner regardless of which tab it originally came from.

**API calls:**

- `GET /dividend/warrant-markoff/search` — params `{ q, registerId }`.
- `POST /dividend/warrant-markoff/manual` — body `{ warrantNumber, reason, submittedBy }`.

**Validation:** empty search → "Please enter a search query."; empty reason → inline error "Reason is required."; no session → session-expired toast.

**UI quirk:** the found-warrant status badge is always styled amber regardless of actual `status` value.

### 6.2 En Bloc Mark-Off

**Flow:** Register + From/To date (both default to **today**) → **Load Unpaid Warrants** → checkbox-select specific rows from the loaded list (not criteria-based bulk-marking) → sticky footer "N warrants selected — Total: ₦X" → **Submit Selected for Mark-Off** → confirm dialog requiring Reason.

**API calls:**

- `GET /dividend/warrant-markoff/en-bloc` — params `{ registerId, dateFrom, dateTo, page, size }`. **Note:** the register Select's `value` is bound to `r.symbol`, so `registerId` in this request actually carries the register _symbol_, not its UUID — worth confirming the backend accepts symbol here (inconsistent with other tabs' `registerId` semantics).
- `POST /dividend/warrant-markoff/en-bloc` — body `{ warrantIds: string[], reason, submittedBy }`.

**Validation:** register required to load; valid date range required; ≥1 row selected required to submit; reason required in confirm dialog.

### 6.3 Bulk Upload

**Flow:** (Optional) **Download Template** → drag-and-drop or click-to-browse a `.csv`/`.xlsx` file → immediate POST to a preview endpoint ("Parsing file...") → preview table (matched/unmatched counts, per-row status, unmatched rows shaded red with a hover-only reason tooltip) → **Submit N Records for Approval** (only matched rows; no per-row deselect).

**Template columns (per UI copy):** `register_id`, `dividend_number`, `shareholder_account_number`.

**API calls:**

- `GET /dividend/warrant-markoff/bulk/template` → downloads `warrant_markoff_template.csv`.
- `POST /dividend/warrant-markoff/bulk/preview` — `FormData` with `file` field. **⚠ The `Content-Type` header is manually forced to `"multipart/form-data"` with no boundary** — this overrides the boundary Axios/browser would normally auto-generate, which can break multipart parsing server-side. Worth a real bug check.
- `POST /dividend/warrant-markoff/bulk/submit` — body `{ rows: [{ register, dividendNumber, accountNumber }], submittedBy, reason }`. **Field-name mismatch**: template tells users to name columns `register_id`/`dividend_number`/`shareholder_account_number`, but the submit payload keys are `register`/`dividendNumber`/`accountNumber` — presumably mapped server-side, but worth confirming. `reason` is **auto-generated** (`"Bulk warrant mark-off upload: {filename}"`), not user-entered. `submittedBy` **silently falls back to `"system"`** if no session (unlike Manual/En Bloc, which hard-block submission when logged out).

**Validation inconsistency:** drag-and-drop checks file extension client-side (`toast.error("Please upload a CSV or Excel (.xlsx) file")`); the click-to-browse path has no equivalent check and relies solely on the OS file picker's `accept` filter (which users can override).

### 6.4 Pending Approvals

**Tier logic** (`getTierNumber`, parsed from a free-text `currentTier` field, not an enum): contains "3"/"THREE"/"MANAGEMENT"/"FINAL" → Tier 3 ("Management"); contains "2"/"TWO"/"ICU"/"SECOND" → Tier 2 ("ICU"); else Tier 1 ("1st Approval"). Dialog title/approve-button text/approval-chain visual all adapt per tier (e.g. Tier 1 approve button reads "Approve & Forward to ICU"; Tier 2 reads "ICU Approve & Forward to Management"; Tier 3 reads "Final Management Approval").

**API calls:**

- `GET /dividend/warrant-markoff/pending` — params `{ page, size }`.
- `POST /dividend/warrant-markoff/{id}/approve` / `.../reject` — body `{ comment, authorisedBy }`.
- `POST /dividend/warrant-markoff/batch/approve` — body `{ ids, comment: "Batch approved" /* hardcoded */, authorisedBy }`.
- `POST /dividend/warrant-markoff/batch/reject` — body `{ ids, comment, authorisedBy }`.

**Validation:** reject (single or batch) requires comment; every action requires a valid session.

**Bug flagged:** on successful batch reject, code calls `toast.error("{n} warrant(s) rejected.")` (should likely be `toast.success`) — same pattern as the Dividend Split module. Per-item batch response (`{processed, succeeded, failed, errors}`) is defined but **never read/displayed** — only an aggregate toast based on selection count is shown, regardless of actual per-item outcomes.

### 6.5 History

Read-only, filters (Register, From/To date — default **blank**, unlike En Bloc's default-today) apply live with no explicit "Search" button.

**API call:** `GET /dividend/warrant-markoff/history` — params include a **hardcoded `status: "APPROVED"`** — there is no way for the user to view rejected/other-status history from this tab despite a status-badge red-styling branch existing in the code (now effectively dead, since the filter always requests only APPROVED records).

**Minor bug:** empty-state `colSpan={7}` but the table header has 8 columns — cosmetic misalignment.

### 6.6 Shared Dialogs (`dialogs.tsx`)

`ReviewDecideDialog` (Pending Approvals), `BatchRejectDialog` (Pending Approvals), `EnBlocConfirmDialog` (En Bloc) — all client-side validate their required comment/reason before invoking the parent's callback; none call APIs directly.

---

## 7. Dividend Reports

**Page:** `src/app/(dashboard)/dividends/reports/page.tsx` · **Actions:** `src/actions/dividendReportActions.ts` · **Hook:** `src/hooks/useDividendReport.tsx` · **Print utility:** `src/lib/utils/printDividendReport.ts`
**Purpose:** Generate, export, and print 6 dividend-related reports behind one shared filter bar (Register, Dividend Number, Date Range, "Generate Report").

Shared filter object sent to every report: `{ registerId?, dividendId?, dateFrom?, dateTo?, page, size }`. The Declaration Summary report is the one exception — it omits `dividendId`/`page`/`size` (non-paginated, grouped rollup).

| Report                          | Endpoint                                    | Columns                                                                                                                 | Summary cards                                                                | Notes                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dividend Liability Register** | `GET /dividend/reports/liability-register`  | #, Account No, Holder Name, CHN, Units, Gross Div, WHT, Net Div                                                         | Total Shareholders, Total Gross Liability, Total Net Payout                  | Table footer shows only Net Payout total (Gross/WHT omitted from footer despite being in KPI cards)                                                                        |
| **WHT Deduction Report**        | `GET /dividend/reports/wht-deduction`       | #, Account No, Holder Name, Holder Type, Units, Gross Div, WHT Rate, WHT Amount, Net Div                                | Total Gross Dividend, Total WHT @10%, Net Payout, Shareholders Assessed      | "@10%" label is hardcoded text, not derived from the per-row `whtRate` field                                                                                               |
| **Payment Status Report**       | `GET /dividend/reports/payment-status`      | #, Payment No, Register, Div Type, Qual Date, Rate, Gross Liability, WHT, Net Payout, Tier, Status                      | Total Declarations, Total Gross Liability, Authorized/Paid, Pending Approval | Status badge: green (PAID/AUTHORIZED), red (REJECTED), gray (DRAFT), amber (everything else incl. PENDING_TIERx). **Print output omits the TIER column** present on-screen |
| **Unclaimed Dividends Report**  | `GET /dividend/reports/unclaimed-dividends` | #, Warrant No, Account No, Holder Name, Dividend No, Amount, Date Issued, Days Outstanding, Status                      | Unclaimed Warrants, Total Unclaimed Amount, Avg Days Outstanding             | Status badge always styled amber regardless of actual value; no aging-bucket filter (e.g. &gt;90 days) despite "days outstanding" being central to the report              |
| **Declaration Summary**         | `GET /dividend/reports/declaration-summary` | Register, Register Type, Declarations, Total Gross Liability, Total WHT, Total Net Payout, Latest Div Type, Latest Rate | Total Declarations, Total Gross Liability, Total WHT, Total Net Payout       | Only non-paginated report; no dividend-number filter applicable                                                                                                            |
| **Mandate Payment Report**      | `GET /dividend/reports/mandate-payments`    | #, Account No, Holder Name, New Bank, Bank Account No, Sort Code, Amount, Dividend No, Status                           | **None**                                                                     | Only report with **no KPI cards and no footer totals row at all** — despite having an Amount column, no total-paid figure is computed anywhere (client or server)          |

**Export/Print (all 6 reports):**

- **Excel export**: `GET /dividend/reports/{reportType}/export?format=EXCEL` (blob) via `useExportDividendReport`. Downloads e.g. `liability-register-report.xlsx`. The `ReportExportFormat` type also defines `"CSV"` as valid, but **no component ever requests CSV** — Excel is the only format actually used.
- **"PDF" and "Print" buttons are wired to the exact same function** in every report — there is **no true PDF generation**. `printDividendReport.ts` exports a separate `exportToPDF()` function with an explicit comment (`// This requires an external library like html2pdf or jsPDF` / `// For now, we'll use the print dialog which allows "Save as PDF"`), and it is **never called anywhere**. All "PDF" buttons just open the browser's native print dialog (`window.open` + `.print()` after a 250ms delay), relying on the user manually choosing "Save as PDF". If `window.open` is blocked by a popup blocker, the failure is silently swallowed (`console.error` only, no user-facing toast).
- Print layout: title, "Summary" card grid (last card always visually highlighted — a purely positional rule, not semantic), "Details" table, footer with generation timestamp.

---

## Cross-Cutting Findings (for spec/gap comparison)

These patterns recur across multiple sub-modules and are worth flagging as a batch to the client/backend team:

1. **Tiered approval terminology is inconsistent across sub-modules.** Dividend Declaration uses a numeric Tier 1–4 system matching `docs/backend-spec.md`'s documented limits (Auto/Ops Manager/ICU/Board). Warrant Mark-Off uses its own 3-tier scheme (1st Approval/ICU/Management) inferred from **free-text substring matching** on a `currentTier` field rather than an enum. Payment and Split modules show only single-step approve/reject with no tier concept surfaced in the UI at all. Recommend the spec explicitly define one canonical tier model across all dividend sub-flows.
2. **"Batch approved"/reject comment is frequently hardcoded rather than user-entered** — seen in Dividend Split's batch-approve (`comment: "Batch approved"`) and Warrant Mark-Off's batch-approve (same literal string). Only single-item approvals let the user type a real comment.
3. **Several "success" toasts do not correspond to a real API call** — most notably Payment History's "Add to Re-Push Queue" dialog button (no mutation fired) and Dividend Declaration's entire batch approve/reject on Draft/Pending/ICU tabs (fully local, no API call at all), plus History-tab row actions "Recall Declaration"/"Re-submit"/"Print Warrant Advice" (all toast-only).
4. **Copy/paste bugs swapping approve/reject toast text** exist in the Dividend Split review dialog (`handleReject` shows "Split approved successfully.") — worth a full search for the same pattern elsewhere before sign-off.
5. **`toast.error()` used to announce successful rejections** (styling choice or bug) appears in both Dividend Split and Warrant Mark-Off batch-reject flows.
6. **Self-approval / initiator-cannot-approve-own-submission** is asserted only as static UI copy in Dividend Declaration ("Initiator cannot authorise their own declaration") and is **not enforced in any client-side code** across any sub-module — relies entirely on the backend to reject same-user approvals, consistent with `docs/backend-spec.md §6.3`, but there's no client-side guard/hint if a user attempts it.
7. **Return Money is fully mock/seed-data backed** with no live API wiring at all — the single largest gap in the module; treat every endpoint listed in §4 as a target contract to validate, not a confirmed integration.
8. **Multiple defined-but-unused endpoints/hooks** suggest half-finished features across the module: `getSplitDetailsRequest` (Split), `useBatchRepush`/batch repush endpoint (Payment Re-Push Queue), review/bulk-approve/set-threshold mutations (Return Money — Withheld Payments), reject + step-aware approve (Return Money — Reimburse Requests).
9. **PDF export is a placeholder everywhere it appears** (Dividend Reports) — "PDF" buttons are identical to "Print" buttons; no dedicated PDF file is ever generated client-side.
10. **Field-name/response-shape inconsistencies** appear in New Mandate Payments (Payment module) and Return Money (envelope mismatch) — both indicate the frontend was built ahead of a finalized backend contract and will need reconciliation once real endpoints land.

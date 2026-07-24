import type {
  KycRequest,
  NibssBatch,
  NibssBatchRow,
  MandateValidation,
  MandatingQueueEntry,
  SyncLogEntry,
  ValResult,
} from "@/types/kyc-module";

export const KYC_REGISTERS = [
  { symbol: "MTNN", name: "MTN Nigeria Communications Plc" },
  { symbol: "DANGCEM", name: "Dangote Cement Plc" },
  { symbol: "ZENITHBANK", name: "Zenith Bank Plc" },
  { symbol: "GTCO", name: "Guaranty Trust Holding Company Plc" },
  { symbol: "NESTLE", name: "Nestlé Nigeria Plc" },
];

const NAME_POOL = [
  "John Adeyemi",
  "Sarah Okafor",
  "Emeka Nwachukwu",
  "Fatimah Ibrahim",
  "Taiwo Adesanya",
  "Chidi Okonkwo",
  "Blessing Osei",
  "Ngozi Umeh",
  "Ibrahim Musa",
  "Grace Adebayo",
  "Kunle Ogundipe",
  "Amara Chukwu",
];

export const BANK_POOL = [
  { name: "GTBank", code: "058" },
  { name: "Zenith Bank", code: "057" },
  { name: "Access Bank", code: "044" },
  { name: "First Bank", code: "011" },
  { name: "UBA", code: "033" },
  { name: "Stanbic IBTC", code: "221" },
  { name: "FCMB", code: "214" },
  { name: "Fidelity Bank", code: "070" },
];

export const ACCOUNT_TYPES = ["Savings", "Current", "Domiciliary"];

export const OFFICERS = [
  "amaka.eze@meristem.com",
  "tunde.bello@meristem.com",
  "chioma.adaeze@meristem.com",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(pool: readonly T[]): T {
  return pool[randInt(0, pool.length - 1)];
}
function digits(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += randInt(0, 9);
  return s;
}

let reqCounter = 0;
export function nextRequestId() {
  reqCounter += 1;
  return `KYC-2026-${String(1000 + reqCounter).slice(1)}`;
}

let batchCounter = 30;
export function nextBatchRef() {
  batchCounter += 1;
  return `NB-2026-00${batchCounter}`;
}

const worse = (a: ValResult, b: ValResult) => {
  const rank: Record<ValResult, number> = { PASS: 0, WARN: 1, FAIL: 2 };
  return rank[a] >= rank[b] ? a : b;
};

// Mock NIBSS name-enquiry / NUBAN / BVN validation.
export function runMandateValidation(): MandateValidation {
  const roll = (): ValResult => {
    const r = Math.random();
    return r < 0.7 ? "PASS" : r < 0.9 ? "WARN" : "FAIL";
  };
  const nameEnquiry = roll();
  return {
    nuban: roll(),
    nameEnquiry,
    bvnMatch: roll(),
    nameEnquiryResult:
      nameEnquiry === "PASS"
        ? "Exact match"
        : nameEnquiry === "WARN"
          ? "Partial match (initials differ)"
          : "No match",
  };
}

function rowValidationFrom(v: MandateValidation): {
  validationStatus: NibssBatchRow["validationStatus"];
  nameEnquiryResult: string;
} {
  const overall = worse(worse(v.nuban, v.nameEnquiry), v.bvnMatch);
  return {
    validationStatus:
      overall === "PASS" ? "VALID" : overall === "WARN" ? "WARNING" : "FAILED",
    nameEnquiryResult: v.nameEnquiryResult ?? "—",
  };
}

export function generateNibssRows(count = 24): NibssBatchRow[] {
  const rows: NibssBatchRow[] = [];
  for (let i = 0; i < count; i++) {
    const cur = pick(BANK_POOL);
    let nb = pick(BANK_POOL);
    while (nb.name === cur.name) nb = pick(BANK_POOL);
    const v = runMandateValidation();
    const { validationStatus, nameEnquiryResult } = rowValidationFrom(v);
    const documentAttached = Math.random() < 0.55;
    rows.push({
      rowNo: i + 1,
      chn: `CHN${digits(8)}`,
      accountNumber: `ACC-${digits(6)}`,
      holderName: pick(NAME_POOL),
      currentBank: cur.name,
      currentAccountNo: digits(10),
      newBank: nb.name,
      newAccountNo: digits(10),
      bvn: digits(11),
      reason: "Change of bank",
      validationStatus,
      nameEnquiryResult,
      documentAttached,
      rowStatus: validationStatus === "FAILED" ? "NEEDS_FIX" : "VALID",
      documents: documentAttached
        ? [{ name: "bank-confirmation.pdf", url: "#", type: "application/pdf" }]
        : [],
    });
  }
  return rows;
}

function makeRequest(overrides: Partial<KycRequest> & Pick<KycRequest, "channel" | "status">): KycRequest {
  const reg = pick(KYC_REGISTERS);
  const holderName = pick(NAME_POOL);
  const rid = overrides.requestId ?? nextRequestId();
  return {
    accountNumber: `ACC-${digits(6)}`,
    chn: `CHN${digits(8)}`,
    holderName,
    registerSymbol: reg.symbol,
    registerName: reg.name,
    submittedBy: pick(OFFICERS),
    submittedDate: "2026-07-18",
    ageingDays: randInt(0, 9),
    changes: [],
    documents: [{ name: "supporting-doc.pdf", url: "#", type: "application/pdf" }],
    hasUnpaidDividend: Math.random() < 0.5,
    ...overrides,
    id: rid,
    requestId: rid,
  };
}

const STANDARD_CHANGES = [
  { field: "address", label: "Residential Address", oldValue: "12 Old Rd, Lagos", newValue: "45 New Ave, Lekki, Lagos" },
  { field: "phone", label: "Phone Number", oldValue: "08031112222", newValue: "08039998888" },
  { field: "email", label: "Email", oldValue: "old@mail.com", newValue: "new@mail.com" },
];

const BANK_CHANGES = [
  { field: "bankName", label: "Bank Name", oldValue: "First Bank", newValue: "GTBank" },
  { field: "nuban", label: "NUBAN Account No", oldValue: "3011122233", newValue: "0123456789" },
  { field: "bvn", label: "BVN", oldValue: "22233344455", newValue: "22299988877" },
];

const CSCS_CHANGES = [
  { field: "bankName", label: "Bank Name", oldValue: "First Bank", newValue: "Access Bank", accepted: true },
  { field: "nuban", label: "Account No.", oldValue: "3011122233", newValue: "0987654321", accepted: true },
  { field: "address", label: "Address", oldValue: "12 Old Rd, Lagos", newValue: "88 New Rd, Abuja", accepted: true },
  { field: "bvn", label: "BVN", oldValue: "22233344455", newValue: "22233344455", accepted: true },
];

const MERI_CHANGES = [
  { field: "phone", label: "Phone Number", oldValue: "08031112222", newValue: "07066554433", accepted: true },
  { field: "email", label: "Email", oldValue: "old@mail.com", newValue: "holder@newmail.com", accepted: true },
  { field: "address", label: "Address", oldValue: "5 Marina, Lagos", newValue: "9 Ikoyi Cres, Lagos", accepted: true },
];

export const SEED_KYC_REQUESTS: KycRequest[] = [
  makeRequest({ channel: "STANDARD", status: "SUBMITTED", requestId: "KYC-2026-0001", changes: STANDARD_CHANGES }),
  makeRequest({
    channel: "CSCS",
    status: "DRAFT",
    requestId: "CSCS-2026-0101",
    submittedBy: "CSCS Feed",
    receivedDate: "2026-07-20",
    externalRef: "CSCS-REF-88213",
    changes: CSCS_CHANGES,
    documents: [],
  }),
  makeRequest({
    channel: "CSCS",
    status: "DRAFT",
    requestId: "CSCS-2026-0102",
    submittedBy: "CSCS Feed",
    receivedDate: "2026-07-21",
    externalRef: "CSCS-REF-88240",
    changes: CSCS_CHANGES.slice(0, 2),
    documents: [],
  }),
  makeRequest({
    channel: "MERICONNECT",
    status: "DRAFT",
    requestId: "MC-2026-0201",
    submittedBy: "Mericonnect",
    receivedDate: "2026-07-21",
    externalRef: "MC-REF-55102",
    requestType: "Contact Update",
    changes: MERI_CHANGES,
    documents: [{ name: "utility-bill.pdf", url: "#", type: "application/pdf" }],
  }),
  makeRequest({
    channel: "MERICONNECT",
    status: "DRAFT",
    requestId: "MC-2026-0202",
    submittedBy: "Mericonnect",
    receivedDate: "2026-07-22",
    externalRef: "MC-REF-55130",
    requestType: "Bank Update",
    changes: BANK_CHANGES.map((c) => ({ ...c, accepted: true })),
    documents: [{ name: "bank-letter.pdf", url: "#", type: "application/pdf" }],
  }),
  makeRequest({
    channel: "NIBSS",
    status: "SUBMITTED",
    requestId: "KYC-2026-0002",
    reason: "Change of bank",
    changes: BANK_CHANGES,
    validation: { nuban: "PASS", nameEnquiry: "PASS", bvnMatch: "WARN", nameEnquiryResult: "Partial match" },
  }),
  makeRequest({ channel: "STANDARD", status: "RETURNED", requestId: "KYC-2026-0003", changes: STANDARD_CHANGES.slice(0, 1), rejectionReason: "Attach a valid utility bill." }),
  makeRequest({ channel: "NIBSS", status: "APPROVED", requestId: "KYC-2026-0004", reason: "Wrong account on record", changes: BANK_CHANGES, hasUnpaidDividend: true }),
  makeRequest({ channel: "STANDARD", status: "APPROVED", requestId: "KYC-2026-0005", changes: STANDARD_CHANGES, hasUnpaidDividend: false }),
  makeRequest({ channel: "NIBSS", status: "APPROVED", requestId: "KYC-2026-0006", reason: "Change of bank", changes: BANK_CHANGES, hasUnpaidDividend: true }),
];

export const SEED_NIBSS_BATCHES: NibssBatch[] = [
  {
    batchRef: "NB-2026-0031",
    uploadedBy: OFFICERS[0],
    uploadedDate: "2026-07-19",
    status: "DRAFT",
    registerSymbol: "MTNN",
    rows: generateNibssRows(24),
  },
];

export const SEED_MANDATING_QUEUE: MandatingQueueEntry[] = [];

export const SEED_SYNC_LOG: SyncLogEntry[] = [
  { id: "SYNC-1", ranAt: "2026-07-22T06:00:00Z", recordsPulled: 12, errors: 0, ranBy: "Scheduler" },
  { id: "SYNC-2", ranAt: "2026-07-21T06:00:00Z", recordsPulled: 9, errors: 1, ranBy: "Scheduler" },
];

import type {
  MandateBatch,
  MandateBatchStatus,
  MandateNotificationLogEntry,
  MandateShareholder,
  MandateSource,
  PaymentRowStatus,
} from "@/types/mandate-payment-flow";
import {
  APPROVERS,
  FAILURE_REASONS,
  MOCK_REGISTERS,
} from "@/components/custom/dividend-declaration/seed-data";

export { APPROVERS, MOCK_REGISTERS };

// ── Pools ─────────────────────────────────────────────────────────────────────

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
  "Yusuf Bello",
  "Patience Effiong",
  "Segun Aina",
  "Halima Sani",
  "Obinna Eze",
  "Funmilayo Alabi",
  "David Etim",
  "Mercy Okoro",
  "Abdullahi Yusuf",
  "Rita Nkemdirim",
  "Wale Fashola",
  "Chinwe Obi",
  "Musa Abdullahi",
];

const BANK_POOL = [
  { name: "GTBank", sortCode: "058" },
  { name: "Zenith Bank", sortCode: "057" },
  { name: "Access Bank", sortCode: "044" },
  { name: "First Bank", sortCode: "011" },
  { name: "UBA", sortCode: "033" },
  { name: "Stanbic IBTC", sortCode: "221" },
  { name: "FCMB", sortCode: "214" },
  { name: "Fidelity Bank", sortCode: "070" },
];

const ADDRESS_POOL = [
  "14 Adeola Odeku St, Victoria Island, Lagos",
  "27 Ademola Adetokunbo Cres, Wuse II, Abuja",
  "3 Aba Road, Port Harcourt, Rivers",
  "112 Awolowo Road, Ikoyi, Lagos",
  "9 Ogui Road, Enugu",
  "45 Ahmadu Bello Way, Kaduna",
  "8 Trans-Amadi Industrial Layout, Port Harcourt",
  "62 Allen Avenue, Ikeja, Lagos",
  "21 New Market Road, Onitsha, Anambra",
  "5 Sultan Bello Road, Kano",
];

const SOURCES: MandateSource[] = ["NIBSS", "CSCS", "KYC", "MANUAL_PUSH"];

export { FAILURE_REASONS };

// ── RNG helpers ───────────────────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(pool: T[]): T {
  return pool[randInt(0, pool.length - 1)];
}

function randomDigits(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += randInt(0, 9);
  return s;
}

let SHAREHOLDER_SEQ = 1;

export function makeShareholder(
  overrides: Partial<MandateShareholder> = {},
): MandateShareholder {
  const register = overrides.registerSymbol
    ? MOCK_REGISTERS.find((r) => r.symbol === overrides.registerSymbol)!
    : pick(MOCK_REGISTERS);
  const bank = pick(BANK_POOL);
  const name = overrides.name ?? pick(NAME_POOL);
  const divYear = 2024 + randInt(0, 2);
  const id = `SH-${SHAREHOLDER_SEQ++}`;
  return {
    id,
    name,
    registerSymbol: register.symbol,
    registerName: register.registerName,
    oldAccountNumber: `ACC-${randomDigits(6)}`,
    newAccountNumber: randomDigits(10),
    bank: bank.name,
    sortCode: bank.sortCode,
    bvn: randomDigits(11),
    address: pick(ADDRESS_POOL),
    dividendNumber: `${register.symbol}-DIV-${divYear}/${randInt(1, 4)}`,
    amount: randInt(2_500, 480_000),
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@shareholdermail.com`,
    source: pick(SOURCES),
    ...overrides,
  };
}

// Build a cross-register batch of shareholders spanning a few registers.
export function makeShareholders(count: number, registerSymbols?: string[]) {
  const rows: MandateShareholder[] = [];
  for (let i = 0; i < count; i++) {
    const sym = registerSymbols
      ? registerSymbols[i % registerSymbols.length]
      : undefined;
    rows.push(makeShareholder(sym ? { registerSymbol: sym } : {}));
  }
  return rows;
}

// ── Payment simulation ────────────────────────────────────────────────────────

function withProcessedPayments(
  rows: MandateShareholder[],
  failRatio = 0.12,
): MandateShareholder[] {
  return rows.map((r) => {
    const failed = Math.random() < failRatio;
    return {
      ...r,
      paymentStatus: (failed ? "FAILED" : "SUCCESS") as PaymentRowStatus,
      failureReason: failed ? pick(FAILURE_REASONS) : undefined,
    };
  });
}

export function processBatchPayments(rows: MandateShareholder[]) {
  return withProcessedPayments(rows, 0.1);
}

export function reRollFailedPayments(rows: MandateShareholder[]) {
  return rows.map((r) => {
    if (r.paymentStatus !== "FAILED") return r;
    const failed = Math.random() < 0.35;
    return {
      ...r,
      paymentStatus: (failed ? "FAILED" : "SUCCESS") as PaymentRowStatus,
      failureReason: failed ? pick(FAILURE_REASONS) : undefined,
    };
  });
}

// ── Batch factory ─────────────────────────────────────────────────────────────

let BATCH_SEQ = 1;

export function nextBatchRef() {
  return `NMB-2026/${String(1000 + BATCH_SEQ++).slice(1)}`;
}

const INITIATOR = "michael.uyanna@meristem.com";

function buildBatch(config: {
  batchRef: string;
  status: MandateBatchStatus;
  createdAt: string;
  registerSymbols: string[];
  count: number;
  initiatedBy?: string;
}): MandateBatch {
  const shareholders = makeShareholders(config.count, config.registerSymbols);
  return {
    id: config.batchRef,
    batchRef: config.batchRef,
    createdAt: config.createdAt,
    status: config.status,
    initiatedBy: config.initiatedBy ?? INITIATOR,
    shareholders,
    excluded: [],
    approvalTrail: [
      {
        stage: "Batch Creation",
        actor: config.initiatedBy ?? INITIATOR,
        action: "CREATED",
        date: config.createdAt,
      },
    ],
  };
}

export const SEED_BATCHES: MandateBatch[] = [
  buildBatch({
    batchRef: nextBatchRef(),
    status: "QUEUED",
    createdAt: "2026-07-22",
    registerSymbols: ["MTNN", "GTCO"],
    count: 14,
  }),
  buildBatch({
    batchRef: nextBatchRef(),
    status: "QUEUED",
    createdAt: "2026-07-23",
    registerSymbols: ["ZENITHBANK", "DANGCEM", "NESTLE"],
    count: 22,
  }),
  buildBatch({
    batchRef: nextBatchRef(),
    status: "PENDING_APPROVAL",
    createdAt: "2026-07-20",
    registerSymbols: ["MTNN", "DANGCEM"],
    count: 18,
  }),
  buildBatch({
    batchRef: nextBatchRef(),
    status: "PENDING_HOP",
    createdAt: "2026-07-19",
    registerSymbols: ["GTCO", "ZENITHBANK", "MTNN"],
    count: 26,
  }),
  buildBatch({
    batchRef: nextBatchRef(),
    status: "PENDING_ICU_1",
    createdAt: "2026-07-18",
    registerSymbols: ["DANGCEM", "NESTLE"],
    count: 20,
  }),
  buildBatch({
    batchRef: nextBatchRef(),
    status: "PENDING_REREVIEW",
    createdAt: "2026-07-16",
    registerSymbols: ["MTNN", "GTCO", "ZENITHBANK"],
    count: 31,
  }),
  buildBatch({
    batchRef: nextBatchRef(),
    status: "PENDING_ICU_2",
    createdAt: "2026-07-15",
    registerSymbols: ["ZENITHBANK", "DANGCEM", "MTNN", "NESTLE"],
    count: 40,
  }),
  buildBatch({
    batchRef: nextBatchRef(),
    status: "PENDING_MD",
    createdAt: "2026-07-14",
    registerSymbols: ["GTCO", "MTNN"],
    count: 24,
  }),
  (() => {
    const b = buildBatch({
      batchRef: nextBatchRef(),
      status: "PARTIALLY_PAID",
      createdAt: "2026-07-11",
      registerSymbols: ["ZENITHBANK", "DANGCEM"],
      count: 28,
    });
    b.shareholders = withProcessedPayments(b.shareholders, 0.2);
    b.gateway = "NIBSS";
    b.paymentRunRef = "PAY-NMB-90042";
    b.paymentInitiatedAt = "2026-07-12";
    return b;
  })(),
  (() => {
    const b = buildBatch({
      batchRef: nextBatchRef(),
      status: "PAID",
      createdAt: "2026-07-08",
      registerSymbols: ["MTNN", "GTCO", "NESTLE"],
      count: 19,
    });
    b.shareholders = withProcessedPayments(b.shareholders, 0);
    b.gateway = "NIBSS";
    b.paymentRunRef = "PAY-NMB-90017";
    b.paymentInitiatedAt = "2026-07-09";
    return b;
  })(),
];

// Shareholders excluded at 2nd ICU (or from rejected batches) land here and are
// surfaced under the Review Queue's "Rejected" view (§6.6).
export const SEED_REJECTED_SHAREHOLDERS: MandateShareholder[] = [
  makeShareholder({
    registerSymbol: "MTNN",
    excludedReason: "BVN mismatch against KYC record — pending re-verification.",
    excludedFromBatchRef: "NMB-2026/003",
  }),
  makeShareholder({
    registerSymbol: "ZENITHBANK",
    excludedReason: "Duplicate mandate — shareholder already in an earlier batch.",
    excludedFromBatchRef: "NMB-2026/007",
  }),
];

export const SEED_NOTIFICATION_LOG: MandateNotificationLogEntry[] = [];

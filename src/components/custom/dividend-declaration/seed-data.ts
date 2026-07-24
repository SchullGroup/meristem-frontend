import type {
  DividendFlowRecord,
  NotificationLogEntry,
  PrelistRow,
} from "@/types/dividend-declaration-flow";

export interface MockRegister {
  registerId: string;
  symbol: string;
  registerName: string;
  registerType: string;
  status: "ACTIVE" | "INACTIVE" | "TRANSACTION_DISABLED";
  currentStockInIssue: number;
  currentShareholdersSize: number;
}

export const MOCK_REGISTERS: MockRegister[] = [
  {
    registerId: "reg-mtnn",
    symbol: "MTNN",
    registerName: "MTN Nigeria Communications Plc",
    registerType: "Ordinary Shares",
    status: "ACTIVE",
    currentStockInIssue: 20_354_513_050,
    currentShareholdersSize: 312,
  },
  {
    registerId: "reg-dangcem",
    symbol: "DANGCEM",
    registerName: "Dangote Cement Plc",
    registerType: "Ordinary Shares",
    status: "ACTIVE",
    currentStockInIssue: 17_040_507_970,
    currentShareholdersSize: 189,
  },
  {
    registerId: "reg-zenithbank",
    symbol: "ZENITHBANK",
    registerName: "Zenith Bank Plc",
    registerType: "Ordinary Shares",
    status: "ACTIVE",
    currentStockInIssue: 31_396_493_787,
    currentShareholdersSize: 540,
  },
  {
    registerId: "reg-nestle",
    symbol: "NESTLE",
    registerName: "Nestlé Nigeria Plc",
    registerType: "Ordinary Shares",
    status: "ACTIVE",
    currentStockInIssue: 792_656_252,
    currentShareholdersSize: 97,
  },
  {
    registerId: "reg-gtco",
    symbol: "GTCO",
    registerName: "Guaranty Trust Holding Company Plc",
    registerType: "Ordinary Shares",
    status: "ACTIVE",
    currentStockInIssue: 29_431_179_224,
    currentShareholdersSize: 421,
  },
  {
    registerId: "reg-uacn",
    symbol: "UACN",
    registerName: "UAC of Nigeria Plc",
    registerType: "Ordinary Shares",
    status: "TRANSACTION_DISABLED",
    currentStockInIssue: 2_913_919_861,
    currentShareholdersSize: 64,
  },
];

export const MOCK_CURRENCIES = [
  { id: "cur-ngn", code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { id: "cur-usd", code: "USD", name: "US Dollar", symbol: "$" },
  { id: "cur-gbp", code: "GBP", name: "British Pound", symbol: "£" },
];

export const APPROVERS = [
  { role: "Ops Manager", name: "Amaka Eze", email: "amaka.eze@meristem.com" },
  {
    role: "ICU Officer",
    name: "Chioma Adaeze",
    email: "chioma.adaeze@meristem.com",
  },
  {
    role: "Head of Payments (HOP)",
    name: "Tunde Bello",
    email: "tunde.bello@meristem.com",
  },
  {
    role: "MD/CEO",
    name: "Dr. Wale Adeyemi",
    email: "wale.adeyemi@meristem.com",
  },
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
  "12 Adeola Odeku St, Victoria Island, Lagos",
  "45 Aminu Kano Cres, Wuse 2, Abuja",
  "8 Trans-Amadi Industrial Layout, Port Harcourt",
  "23 Ahmadu Bello Way, Kaduna",
  "5 New Market Rd, Onitsha, Anambra",
  "17 Oba Akran Ave, Ikeja, Lagos",
  "9 Ogui Rd, Enugu",
  "31 Ring Rd, Ibadan, Oyo",
  "2 Marina St, Lagos Island, Lagos",
  "14 Airport Rd, Benin City, Edo",
];

export const FAILURE_REASONS = [
  "Invalid account number",
  "Bank name / account name mismatch",
  "Account not found at destination bank",
  "BVN verification failed",
  "Duplicate transaction reference",
  "Destination bank timeout",
];

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

export function computeTier(amount: number): 1 | 2 | 3 | 4 {
  if (amount <= 500_000) return 1;
  if (amount <= 5_000_000) return 2;
  if (amount <= 50_000_000) return 3;
  return 4;
}

export function generatePrelist(
  register: MockRegister,
  rate: number,
  whtRate: number,
  count?: number,
): PrelistRow[] {
  const n = count ?? Math.min(register.currentShareholdersSize, 40);
  const rows: PrelistRow[] = [];
  for (let i = 0; i < n; i++) {
    const units = randInt(500, 250_000);
    const gross = Math.round(units * rate * 100) / 100;
    const wht = Math.round(gross * (whtRate / 100) * 100) / 100;
    const net = Math.round((gross - wht) * 100) / 100;
    const bank = pick(BANK_POOL);
    const holderName = pick(NAME_POOL);
    rows.push({
      id: `${register.symbol}-PL-${i + 1}`,
      accountNumber: `ACC-${randomDigits(6)}`,
      chn: `CHN${randomDigits(8)}`,
      holderName,
      email: `${holderName.toLowerCase().replace(/\s+/g, ".")}@shareholdermail.com`,
      address: pick(ADDRESS_POOL),
      // ~75% mandated (clean KYC), ~25% others (KYC conflict, needs mandating)
      category: Math.random() < 0.75 ? "MANDATED" : "OTHERS",
      bvn: randomDigits(11),
      nin: randomDigits(11),
      units,
      grossAmount: gross,
      whtAmount: wht,
      netAmount: net,
      bankName: bank.name,
      bankAccountNumber: randomDigits(10),
      sortCode: bank.sortCode,
    });
  }
  return rows;
}

function withProcessedPrelist(rows: PrelistRow[], failRatio = 0.15) {
  return rows.map((r) => {
    if (r.excluded) return r; // excluded rows are not paid
    const failed = Math.random() < failRatio;
    return {
      ...r,
      paymentStatus: (failed ? "FAILED" : "SUCCESS") as "FAILED" | "SUCCESS",
      failureReason: failed ? pick(FAILURE_REASONS) : undefined,
    };
  });
}

function summarize(prelist: PrelistRow[]) {
  return prelist.reduce(
    (acc, r) => {
      acc.grossLiability += r.grossAmount;
      acc.whtAmount += r.whtAmount;
      acc.netLiability += r.netAmount;
      return acc;
    },
    { grossLiability: 0, whtAmount: 0, netLiability: 0 },
  );
}

function buildSeedRecord(
  overrides: Partial<DividendFlowRecord> & {
    registerSymbol: string;
    rate: number;
    whtRate: number;
    status: DividendFlowRecord["status"];
    paymentNumber: string;
  },
): DividendFlowRecord {
  const register = MOCK_REGISTERS.find(
    (r) => r.symbol === overrides.registerSymbol,
  )!;
  const withPrelist = overrides.status !== "DRAFT";
  const prelist = withPrelist
    ? generatePrelist(register, overrides.rate, overrides.whtRate)
    : [];
  const totals = summarize(prelist);
  const grossLiability =
    totals.grossLiability ||
    register.currentStockInIssue * overrides.rate;
  const whtAmount =
    totals.whtAmount || grossLiability * (overrides.whtRate / 100);
  const netLiability = totals.netLiability || grossLiability - whtAmount;

  return {
    ...overrides,
    id: overrides.paymentNumber,
    paymentNumber: overrides.paymentNumber,
    registerSymbol: register.symbol,
    registerName: register.registerName,
    dividendType: overrides.dividendType ?? "FINAL",
    rate: overrides.rate,
    currency: overrides.currency ?? "NGN",
    qualificationDate: overrides.qualificationDate ?? "2026-03-15",
    closureDate: overrides.closureDate ?? "2026-03-22",
    paymentDate: overrides.paymentDate ?? "2026-04-05",
    fractionalRegister: overrides.fractionalRegister ?? false,
    narrative: overrides.narrative ?? "Final dividend for FY2025",
    whtRate: overrides.whtRate,
    isTaxExempt: overrides.isTaxExempt ?? false,
    tier: computeTier(grossLiability),
    grossLiability,
    whtAmount,
    netLiability,
    totalShareholders: prelist.length || register.currentShareholdersSize,
    status: overrides.status,
    initiatedBy: overrides.initiatedBy ?? "michael.uyanna@meristem.com",
    createdAt: overrides.createdAt ?? "2026-07-10",
    prelist,
    approvalTrail: overrides.approvalTrail ?? [
      {
        stage: "Initiation",
        actor: "michael.uyanna@meristem.com",
        action: "CREATED",
        date: "2026-07-10",
      },
    ],
  };
}

export const SEED_DIVIDEND_FLOWS: DividendFlowRecord[] = [
  buildSeedRecord({
    paymentNumber: "DIV-2026/101",
    registerSymbol: "MTNN",
    rate: 7.5,
    whtRate: 10,
    status: "DRAFT",
  }),
  buildSeedRecord({
    paymentNumber: "DIV-2026/102",
    registerSymbol: "DANGCEM",
    rate: 20,
    whtRate: 10,
    status: "PRELIST_GENERATED",
  }),
  buildSeedRecord({
    paymentNumber: "DIV-2026/103",
    registerSymbol: "ZENITHBANK",
    rate: 4,
    whtRate: 10,
    status: "PENDING_ICU_1",
  }),
  buildSeedRecord({
    paymentNumber: "DIV-2026/104",
    registerSymbol: "NESTLE",
    rate: 45,
    whtRate: 10,
    status: "REJECTED",
    rejectedAt: "ICU_1",
    rejectionComment:
      "Gross liability figure does not reconcile with the register's qualification-date stock. Please recompute and resubmit.",
  }),
  buildSeedRecord({
    paymentNumber: "DIV-2026/105",
    registerSymbol: "GTCO",
    rate: 8.5,
    whtRate: 10,
    status: "PENDING_HOP",
  }),
  buildSeedRecord({
    paymentNumber: "DIV-2026/106",
    registerSymbol: "MTNN",
    rate: 6,
    whtRate: 10,
    status: "PENDING_ICU_2",
  }),
  buildSeedRecord({
    paymentNumber: "DIV-2026/107",
    registerSymbol: "DANGCEM",
    rate: 18,
    whtRate: 10,
    status: "PENDING_MD",
  }),
  buildSeedRecord({
    paymentNumber: "DIV-2026/110",
    registerSymbol: "NESTLE",
    rate: 50,
    whtRate: 10,
    status: "MANUAL_PROCESSING",
  }),
  (() => {
    const rec = buildSeedRecord({
      paymentNumber: "DIV-2026/108",
      registerSymbol: "ZENITHBANK",
      rate: 3.5,
      whtRate: 10,
      status: "PARTIALLY_PAID",
    });
    rec.prelist = withProcessedPrelist(rec.prelist, 0.2);
    rec.gateway = "NIBSS";
    rec.paymentRunRef = "PAY-DIV-90031";
    rec.paymentInitiatedAt = "2026-07-15";
    return rec;
  })(),
  (() => {
    const rec = buildSeedRecord({
      paymentNumber: "DIV-2026/109",
      registerSymbol: "GTCO",
      rate: 7,
      whtRate: 10,
      status: "PAID",
    });
    rec.prelist = withProcessedPrelist(rec.prelist, 0);
    rec.gateway = "REMITA";
    rec.paymentRunRef = "PAY-DIV-90014";
    rec.paymentInitiatedAt = "2026-07-08";
    return rec;
  })(),
];

export const SEED_NOTIFICATION_LOG: NotificationLogEntry[] = [];

export function reRollFailedPayments(prelist: PrelistRow[]): PrelistRow[] {
  return prelist.map((r) => {
    if (r.paymentStatus !== "FAILED") return r;
    const failed = Math.random() < 0.35;
    return {
      ...r,
      paymentStatus: (failed ? "FAILED" : "SUCCESS") as "FAILED" | "SUCCESS",
      failureReason: failed ? pick(FAILURE_REASONS) : undefined,
    };
  });
}

export function processPayment(prelist: PrelistRow[]): PrelistRow[] {
  return withProcessedPrelist(prelist, 0.1);
}

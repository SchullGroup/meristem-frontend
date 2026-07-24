import type { ReversalRequest } from "@/types/dividend-reversal-flow";
import { MOCK_REGISTERS } from "@/components/custom/dividend-declaration/seed-data";

export { MOCK_REGISTERS };

const NAME_POOL = [
  "John Adeyemi",
  "Sarah Okafor",
  "Emeka Nwachukwu",
  "Fatimah Ibrahim",
  "Taiwo Adesanya",
  "Blessing Osei",
  "Ibrahim Musa",
  "Grace Adebayo",
  "Obinna Eze",
  "Halima Sani",
];

const REASONS_A = [
  "NIBSS returned the payment — beneficiary account closed. Confirmed against bank statement.",
  "Payment flagged as failed by NIBSS; funds never credited to shareholder.",
  "Bank returned funds — account name / number mismatch at destination.",
];

const REASONS_B = [
  "Business decision — shareholder under investigation; exclude from processing.",
  "Duplicate dividend record identified; should not be processed.",
  "Estate in probate — hold and exclude from the current payment run.",
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

let REV_SEQ = 1;

export function nextReversalRef() {
  return `REV-2026/${String(1000 + REV_SEQ++).slice(1)}`;
}

const REQUESTERS = [
  "amaka.eze@meristem.com",
  "michael.uyanna@meristem.com",
  "segun.aina@meristem.com",
];

const HOP = "tunde.bello@meristem.com";

function buildRequest(
  overrides: Partial<ReversalRequest> & {
    reversalType: ReversalRequest["reversalType"];
    status: ReversalRequest["status"];
    dateRequested: string;
  },
): ReversalRequest {
  const register = pick(MOCK_REGISTERS);
  const isA = overrides.reversalType === "TYPE_A";
  const id = overrides.id ?? nextReversalRef();
  const accountNumber = overrides.accountNumber ?? `ACC-${randomDigits(6)}`;
  return {
    id,
    holderName: overrides.holderName ?? pick(NAME_POOL),
    registerSymbol: overrides.registerSymbol ?? register.symbol,
    accountNumber,
    dividendNumber:
      overrides.dividendNumber ??
      `${register.symbol}-DIV-${2023 + randInt(0, 2)}/${randInt(1, 4)}`,
    amount: overrides.amount ?? randInt(5_000, 620_000),
    reversalType: overrides.reversalType,
    reason: overrides.reason ?? pick(isA ? REASONS_A : REASONS_B),
    supportingDocName:
      overrides.supportingDocName ??
      (isA ? `nibss_return_${randomDigits(5)}.pdf` : undefined),
    requestedBy: overrides.requestedBy ?? pick(REQUESTERS),
    dateRequested: overrides.dateRequested,
    status: overrides.status,
    decidedBy: overrides.decidedBy,
    decisionDate: overrides.decisionDate,
    decisionComment: overrides.decisionComment,
    sourceAccountNumber: accountNumber,
  };
}

export const SEED_REVERSALS: ReversalRequest[] = [
  buildRequest({
    reversalType: "TYPE_A",
    status: "PENDING",
    dateRequested: "2026-07-23",
  }),
  buildRequest({
    reversalType: "TYPE_B",
    status: "PENDING",
    dateRequested: "2026-07-22",
  }),
  buildRequest({
    reversalType: "TYPE_A",
    status: "PENDING",
    dateRequested: "2026-07-21",
  }),
  buildRequest({
    reversalType: "TYPE_A",
    status: "APPROVED",
    dateRequested: "2026-07-15",
    decidedBy: HOP,
    decisionDate: "2026-07-16",
    decisionComment: "NIBSS return confirmed. Approved for re-processing.",
  }),
  buildRequest({
    reversalType: "TYPE_B",
    status: "APPROVED",
    dateRequested: "2026-07-12",
    decidedBy: HOP,
    decisionDate: "2026-07-13",
    decisionComment: "Business decision upheld. Excluded from processing.",
  }),
  buildRequest({
    reversalType: "TYPE_A",
    status: "REJECTED",
    dateRequested: "2026-07-10",
    decidedBy: HOP,
    decisionDate: "2026-07-11",
    decisionComment:
      "No NIBSS return evidence attached and payment shows as settled. Rejected — please verify before resubmitting.",
  }),
];

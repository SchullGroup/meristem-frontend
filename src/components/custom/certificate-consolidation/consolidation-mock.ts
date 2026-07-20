// ── Types ──────────────────────────────────────────────────────────────────

export type ConsolidationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ConsolidationCert {
  id: string;
  certNo: string;
  units: number;
  issueDate: string;
  status: "ACTIVE" | "DEACTIVATED";
}

export interface ConsolidationRequest {
  id: string;
  createdAt: string;
  holderName: string;
  holderBvn: string;
  accountNo: string;
  register: string;
  registerName: string;
  certificates: ConsolidationCert[];
  newCertNo: string;
  totalUnits: number;
  reason: string;
  submittedBy: string;
  status: ConsolidationStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionComment?: string;
  rejectedBy?: string;
  rejectedAt?: string;
}

export interface MockAccountShare {
  register: string;
  registerName: string;
  certificates: ConsolidationCert[];
}

export interface MockAccount {
  accountNo: string;
  chn: string;
  shares: MockAccountShare[];
}

export interface MockHolder {
  id: string;
  name: string;
  bvn: string;
  phone: string;
  email: string;
  accounts: MockAccount[];
}

export interface SuggestedConsolidation {
  id: string;
  holderName: string;
  bvn: string;
  register: string;
  registerName: string;
  accounts: { accountNo: string; chn: string; certCount: number; totalUnits: number }[];
  combinedUnits: number;
}

// ── Mock Holders ──────────────────────────────────────────────────────────

export const MOCK_HOLDERS: MockHolder[] = [
  {
    id: "mh1",
    name: "NGOZI CHIDINMA OKAFOR",
    bvn: "22345678901",
    phone: "08033456789",
    email: "ngozi.okafor@email.com",
    accounts: [
      {
        accountNo: "MRX0023456",
        chn: "C0023456BK",
        shares: [
          {
            register: "DANGCEM",
            registerName: "Dangote Cement Plc",
            certificates: [
              { id: "cert-001", certNo: "DANGCEM/2019/001234", units: 15000, issueDate: "15 Mar 2019", status: "ACTIVE" },
              { id: "cert-002", certNo: "DANGCEM/2022/004567", units: 5000, issueDate: "10 Jun 2022", status: "ACTIVE" },
            ],
          },
          {
            register: "MTNN",
            registerName: "MTN Nigeria Communications Plc",
            certificates: [
              { id: "cert-003", certNo: "MTNN/2020/005678", units: 8000000, issueDate: "20 Jan 2020", status: "ACTIVE" },
            ],
          },
        ],
      },
      {
        accountNo: "MRX0034567",
        chn: "C0034567BK",
        shares: [
          {
            register: "DANGCEM",
            registerName: "Dangote Cement Plc",
            certificates: [
              { id: "cert-004", certNo: "DANGCEM/2020/003456", units: 8500, issueDate: "22 Jul 2020", status: "ACTIVE" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "mh2",
    name: "JOHN ADEYEMI BABATUNDE",
    bvn: "11234567890",
    phone: "08022345678",
    email: "john.babatunde@email.com",
    accounts: [
      {
        accountNo: "MRX0012345",
        chn: "C0012345AK",
        shares: [
          {
            register: "MTNN",
            registerName: "MTN Nigeria Communications Plc",
            certificates: [
              { id: "cert-005", certNo: "MTNN/2021/009012", units: 4500000, issueDate: "05 Sep 2021", status: "ACTIVE" },
            ],
          },
          {
            register: "DANGCEM",
            registerName: "Dangote Cement Plc",
            certificates: [
              { id: "cert-006", certNo: "DANGCEM/2018/002345", units: 25000, issueDate: "03 Nov 2018", status: "ACTIVE" },
            ],
          },
        ],
      },
      {
        accountNo: "MRX0098765",
        chn: "C0098765AK",
        shares: [
          {
            register: "MTNN",
            registerName: "MTN Nigeria Communications Plc",
            certificates: [
              { id: "cert-007", certNo: "MTNN/2019/001122", units: 2000000, issueDate: "12 Feb 2019", status: "ACTIVE" },
              { id: "cert-008", certNo: "MTNN/2023/012345", units: 500000, issueDate: "30 Oct 2023", status: "ACTIVE" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "mh3",
    name: "IBRAHIM USMAN HASSAN",
    bvn: "33456789012",
    phone: "08056789012",
    email: "ibrahim.hassan@email.com",
    accounts: [
      {
        accountNo: "MRX0078901",
        chn: "C0078901GK",
        shares: [
          {
            register: "UBA",
            registerName: "United Bank for Africa Plc",
            certificates: [
              { id: "cert-009", certNo: "UBA/2018/007654", units: 45000, issueDate: "10 Jun 2018", status: "ACTIVE" },
              { id: "cert-010", certNo: "UBA/2019/008765", units: 20000, issueDate: "14 Jan 2019", status: "ACTIVE" },
            ],
          },
        ],
      },
      {
        accountNo: "MRX0089012",
        chn: "C0089012GK",
        shares: [
          {
            register: "UBA",
            registerName: "United Bank for Africa Plc",
            certificates: [
              { id: "cert-011", certNo: "UBA/2021/009012", units: 30000, issueDate: "15 Mar 2021", status: "ACTIVE" },
            ],
          },
          {
            register: "GTCO",
            registerName: "Guaranty Trust Holding Company Plc",
            certificates: [
              { id: "cert-012", certNo: "GTCO/2022/004321", units: 60000, issueDate: "08 Aug 2022", status: "ACTIVE" },
            ],
          },
        ],
      },
      {
        accountNo: "MRX0090123",
        chn: "C0090123GK",
        shares: [
          {
            register: "UBA",
            registerName: "United Bank for Africa Plc",
            certificates: [
              { id: "cert-013", certNo: "UBA/2023/010123", units: 12000, issueDate: "02 May 2023", status: "ACTIVE" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "mh4",
    name: "FATIMA ABUBAKAR MUSA",
    bvn: "44567890123",
    phone: "08055678901",
    email: "fatima.musa@email.com",
    accounts: [
      {
        accountNo: "MRX0045678",
        chn: "C0045678DK",
        shares: [
          {
            register: "GTCO",
            registerName: "Guaranty Trust Holding Company Plc",
            certificates: [
              { id: "cert-014", certNo: "GTCO/2020/003214", units: 80000, issueDate: "20 Apr 2020", status: "ACTIVE" },
              { id: "cert-015", certNo: "GTCO/2021/007890", units: 40000, issueDate: "12 Apr 2021", status: "ACTIVE" },
            ],
          },
        ],
      },
      {
        accountNo: "MRX0056789",
        chn: "C0056789DK",
        shares: [
          {
            register: "GTCO",
            registerName: "Guaranty Trust Holding Company Plc",
            certificates: [
              { id: "cert-016", certNo: "GTCO/2022/006789", units: 25000, issueDate: "05 Jan 2022", status: "ACTIVE" },
            ],
          },
        ],
      },
    ],
  },
];

// ── System Suggested Consolidations ──────────────────────────────────────

export const MOCK_SUGGESTIONS: SuggestedConsolidation[] = [
  {
    id: "sug1",
    holderName: "NGOZI CHIDINMA OKAFOR",
    bvn: "22345678901",
    register: "DANGCEM",
    registerName: "Dangote Cement Plc",
    accounts: [
      { accountNo: "MRX0023456", chn: "C0023456BK", certCount: 2, totalUnits: 20000 },
      { accountNo: "MRX0034567", chn: "C0034567BK", certCount: 1, totalUnits: 8500 },
    ],
    combinedUnits: 28500,
  },
  {
    id: "sug2",
    holderName: "IBRAHIM USMAN HASSAN",
    bvn: "33456789012",
    register: "UBA",
    registerName: "United Bank for Africa Plc",
    accounts: [
      { accountNo: "MRX0078901", chn: "C0078901GK", certCount: 2, totalUnits: 65000 },
      { accountNo: "MRX0089012", chn: "C0089012GK", certCount: 1, totalUnits: 30000 },
      { accountNo: "MRX0090123", chn: "C0090123GK", certCount: 1, totalUnits: 12000 },
    ],
    combinedUnits: 107000,
  },
  {
    id: "sug3",
    holderName: "JOHN ADEYEMI BABATUNDE",
    bvn: "11234567890",
    register: "MTNN",
    registerName: "MTN Nigeria Communications Plc",
    accounts: [
      { accountNo: "MRX0012345", chn: "C0012345AK", certCount: 1, totalUnits: 4500000 },
      { accountNo: "MRX0098765", chn: "C0098765AK", certCount: 2, totalUnits: 2500000 },
    ],
    combinedUnits: 7000000,
  },
  {
    id: "sug4",
    holderName: "FATIMA ABUBAKAR MUSA",
    bvn: "44567890123",
    register: "GTCO",
    registerName: "Guaranty Trust Holding Company Plc",
    accounts: [
      { accountNo: "MRX0045678", chn: "C0045678DK", certCount: 2, totalUnits: 120000 },
      { accountNo: "MRX0056789", chn: "C0056789DK", certCount: 1, totalUnits: 25000 },
    ],
    combinedUnits: 145000,
  },
];

// ── Seed Consolidation Requests ──────────────────────────────────────────

export const SEED_CONSOLIDATION_REQUESTS: ConsolidationRequest[] = [
  {
    id: "CON001",
    createdAt: "07 Jul 2026",
    holderName: "NGOZI CHIDINMA OKAFOR",
    holderBvn: "22345678901",
    accountNo: "MRX0023456",
    register: "DANGCEM",
    registerName: "Dangote Cement Plc",
    certificates: [
      { id: "cert-001", certNo: "DANGCEM/2019/001234", units: 15000, issueDate: "15 Mar 2019", status: "ACTIVE" },
      { id: "cert-002", certNo: "DANGCEM/2022/004567", units: 5000, issueDate: "10 Jun 2022", status: "ACTIVE" },
      { id: "cert-004", certNo: "DANGCEM/2020/003456", units: 8500, issueDate: "22 Jul 2020", status: "ACTIVE" },
    ],
    newCertNo: "DANGCEM/CONS/2026/001",
    totalUnits: 28500,
    reason: "Account consolidation — multiple certificates across accounts in same register",
    submittedBy: "admin@meristem.com",
    status: "PENDING",
  },
  {
    id: "CON002",
    createdAt: "03 Jul 2026",
    holderName: "IBRAHIM USMAN HASSAN",
    holderBvn: "33456789012",
    accountNo: "MRX0078901",
    register: "UBA",
    registerName: "United Bank for Africa Plc",
    certificates: [
      { id: "cert-009", certNo: "UBA/2018/007654", units: 45000, issueDate: "10 Jun 2018", status: "DEACTIVATED" },
      { id: "cert-010", certNo: "UBA/2019/008765", units: 20000, issueDate: "14 Jan 2019", status: "DEACTIVATED" },
      { id: "cert-011", certNo: "UBA/2021/009012", units: 30000, issueDate: "15 Mar 2021", status: "DEACTIVATED" },
    ],
    newCertNo: "UBA/CONS/2026/001",
    totalUnits: 95000,
    reason: "Merging UBA certificates across multiple accounts per holder request",
    submittedBy: "admin@meristem.com",
    status: "APPROVED",
    approvedBy: "ICU Manager",
    approvedAt: "05 Jul 2026",
  },
  {
    id: "CON003",
    createdAt: "01 Jul 2026",
    holderName: "FATIMA ABUBAKAR MUSA",
    holderBvn: "44567890123",
    accountNo: "MRX0045678",
    register: "GTCO",
    registerName: "Guaranty Trust Holding Company Plc",
    certificates: [
      { id: "cert-014", certNo: "GTCO/2020/003214", units: 80000, issueDate: "20 Apr 2020", status: "ACTIVE" },
      { id: "cert-015", certNo: "GTCO/2021/007890", units: 40000, issueDate: "12 Apr 2021", status: "ACTIVE" },
      { id: "cert-016", certNo: "GTCO/2022/006789", units: 25000, issueDate: "05 Jan 2022", status: "ACTIVE" },
    ],
    newCertNo: "GTCO/CONS/2026/001",
    totalUnits: 145000,
    reason: "Consolidation of multiple GTCO accounts",
    submittedBy: "officer@meristem.com",
    status: "REJECTED",
    rejectionComment: "Certificate GTCO/2022/006789 has a pending transfer order. Resolve the pending transfer before consolidating.",
    rejectedBy: "ICU Manager",
    rejectedAt: "04 Jul 2026",
  },
  {
    id: "CON004",
    createdAt: "28 Jun 2026",
    holderName: "JOHN ADEYEMI BABATUNDE",
    holderBvn: "11234567890",
    accountNo: "MRX0012345",
    register: "MTNN",
    registerName: "MTN Nigeria Communications Plc",
    certificates: [
      { id: "cert-005", certNo: "MTNN/2021/009012", units: 4500000, issueDate: "05 Sep 2021", status: "ACTIVE" },
      { id: "cert-007", certNo: "MTNN/2019/001122", units: 2000000, issueDate: "12 Feb 2019", status: "ACTIVE" },
    ],
    newCertNo: "MTNN/CONS/2026/001",
    totalUnits: 6500000,
    reason: "Consolidation of MTNN holdings across two accounts",
    submittedBy: "admin@meristem.com",
    status: "PENDING",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

export function generateConsolidationCertNo(register: string, existing: ConsolidationRequest[]): string {
  const count = existing.filter(r => r.register === register).length + 1;
  const seq = String(count + 1).padStart(3, "0");
  return `${register}/CONS/2026/${seq}`;
}

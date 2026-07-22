// ── Types ──────────────────────────────────────────────────────────────────

export type DematStatus =
  | "PENDING_HOD"
  | "PENDING_COO"
  | "PENDING_ICU"
  | "APPROVED"
  | "LODGED"
  | "REJECTED"
  | "DELODGED";

export interface UploadedFile {
  name: string;
  size: string;
}

export interface DematRequest {
  id: string;
  createdAt: string;
  certificateNos: string[];
  holderName: string;
  holderChn: string;
  registerSymbol: string;
  stockbrokerName: string;
  stockbrokerId: string;
  totalUnits: number;
  unitPrice: number;
  status: DematStatus;
  lodgmentDate?: string;
  rejectionComment?: string;
  rejectedBy?: string;
  documents: {
    dematForms: UploadedFile[];
    scannedCerts: UploadedFile[];
  };
}

// ── Seed: Shareholders ─────────────────────────────────────────────────────

export interface DematShareholder {
  id: string;
  name: string;
  chn: string;
  accountNo: string;
  bvn: string;
  nin: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  lga: string;
  idType: string;
  idNumber: string;
  idExpiry: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountType: string;
  certificates: {
    certNo: string;
    register: string;
    units: number;
    dateIssued: string;
    status: string;
  }[];
}

export const DEMAT_SHAREHOLDERS: DematShareholder[] = [
  {
    id: "sh1",
    name: "NGOZI CHIDINMA OKAFOR",
    chn: "C0023456BK",
    accountNo: "MRX0023456",
    bvn: "22345678901",
    nin: "NIN234567890",
    phone: "08033456789",
    email: "ngozi.okafor@email.com",
    address: "14 Adelabu Street, Surulere",
    state: "Lagos",
    lga: "Surulere",
    idType: "National ID",
    idNumber: "NIN234567890",
    idExpiry: "31 Dec 2028",
    bankName: "First Bank of Nigeria",
    bankAccountNo: "3023456789",
    bankAccountType: "Savings",
    certificates: [
      { certNo: "DANGCEM/2019/001234", register: "DANGCEM", units: 15000, dateIssued: "15 Mar 2019", status: "ACTIVE" },
      { certNo: "DANGCEM/2022/004567", register: "DANGCEM", units: 5000, dateIssued: "10 Jun 2022", status: "ACTIVE" },
    ],
  },
  {
    id: "sh2",
    name: "JOHN ADEYEMI BABATUNDE",
    chn: "C0012345AK",
    accountNo: "MRX0012345",
    bvn: "11234567890",
    nin: "NIN123456789",
    phone: "08022345678",
    email: "john.babatunde@email.com",
    address: "25 Bourdillon Road, Ikoyi",
    state: "Lagos",
    lga: "Eti-Osa",
    idType: "International Passport",
    idNumber: "A12345678",
    idExpiry: "15 Aug 2029",
    bankName: "Zenith Bank",
    bankAccountNo: "2012345678",
    bankAccountType: "Current",
    certificates: [
      { certNo: "MTNN/2020/005678", register: "MTNN", units: 8000000, dateIssued: "20 Jan 2020", status: "ACTIVE" },
      { certNo: "MTNN/2021/009012", register: "MTNN", units: 4500000, dateIssued: "05 Sep 2021", status: "ACTIVE" },
      { certNo: "DANGCEM/2018/002345", register: "DANGCEM", units: 25000, dateIssued: "03 Nov 2018", status: "ACTIVE" },
    ],
  },
  {
    id: "sh3",
    name: "FATIMA ABUBAKAR MUSA",
    chn: "C0045678DK",
    accountNo: "MRX0045678",
    bvn: "44567890123",
    nin: "NIN456789012",
    phone: "08055678901",
    email: "fatima.musa@email.com",
    address: "8 Kwato Road, Maitama",
    state: "FCT",
    lga: "Maitama",
    idType: "Voter's Card",
    idNumber: "VIN20045678",
    idExpiry: "31 Dec 2027",
    bankName: "GTBank",
    bankAccountNo: "0045678901",
    bankAccountType: "Savings",
    certificates: [
      { certNo: "GTCO/2021/007890", register: "GTCO", units: 120000, dateIssued: "12 Apr 2021", status: "ACTIVE" },
    ],
  },
];

// ── Seed: Stockbrokers ─────────────────────────────────────────────────────

export interface DematMandate {
  id: string;
  accountNo: string;
  holderName: string;
  agentName: string;
  position: string;
  phone: string;
  email: string;
}

export interface DematStockbroker {
  id: string;
  firmName: string;
  cscsCode: string;
  phone: string;
  email: string;
  address: string;
  licenseNo: string;
  mandates: DematMandate[];
  mandateFile?: { name: string; url: string };
}

export const DEMAT_STOCKBROKERS: DematStockbroker[] = [
  {
    id: "sb1",
    firmName: "MERISTEM SECURITIES LIMITED",
    cscsCode: "MER001",
    phone: "01-7808790",
    email: "operations@meristem.com",
    address: "213 Herbert Macaulay Way, Yaba, Lagos",
    licenseNo: "SEC/BROKER/0012",
    mandateFile: { name: "meristem_mandate_list.pdf", url: "/uploads/mandates/meristem_mandate_list.pdf" },
    mandates: [
      { id: "mb1", accountNo: "MRX0023456", holderName: "NGOZI CHIDINMA OKAFOR", agentName: "CHUKWUEMEKA IHEJIRIKA", position: "Operations Manager", phone: "08123456789", email: "c.ihejirika@meristem.com" },
      { id: "mb2", accountNo: "MRX0012345", holderName: "JOHN ADEYEMI BABATUNDE", agentName: "ADAEZE NWOSU OKAFOR", position: "Client Relations", phone: "08234567890", email: "a.nwosu@meristem.com" },
    ],
  },
  {
    id: "sb2",
    firmName: "CARDINALSTONE SECURITIES",
    cscsCode: "CSL002",
    phone: "01-4470000",
    email: "demat@cardinalstone.com",
    address: "7 Akin Olugbade Street, Victoria Island, Lagos",
    licenseNo: "SEC/BROKER/0034",
    mandateFile: { name: "cardinalstone_mandate_list.jpg", url: "/uploads/mandates/cardinalstone_mandate_list.jpg" },
    mandates: [
      { id: "mb3", accountNo: "MRX0045678", holderName: "FATIMA ABUBAKAR MUSA", agentName: "IBRAHIM USMAN HASSAN", position: "Senior Dealer", phone: "08056789012", email: "i.hassan@cardinalstone.com" },
    ],
  },
  {
    id: "sb3",
    firmName: "STANBIC IBTC STOCKBROKERS",
    cscsCode: "SIB003",
    phone: "01-4221600",
    email: "securities@stanbicibtc.com",
    address: "IBTC Place, Walter Carrington Crescent, Victoria Island, Lagos",
    licenseNo: "SEC/BROKER/0055",
    mandateFile: { name: "stanbic_mandate_list.pdf", url: "/uploads/mandates/stanbic_mandate_list.pdf" },
    mandates: [
      { id: "mb4", accountNo: "MRX0056789", holderName: "SAMUEL OLUWASEUN ADELEKE", agentName: "OLUWASEUN ADEYEMI BELLO", position: "Account Manager", phone: "08067890123", email: "o.bello@stanbicibtc.com" },
    ],
  },
];

// ── Seed: Certificates ────────────────────────────────────────────────────

export interface DematCertificate {
  certNo: string;
  register: string;
  description: string;
  holderName: string;
  holderChn: string;
  accountNo: string;
  units: number;
  dateIssued: string;
  status: string;
}

export const DEMAT_CERTIFICATES: DematCertificate[] = [
  { certNo: "DANGCEM/2019/001234", register: "DANGCEM", description: "Dangote Cement Plc", holderName: "NGOZI CHIDINMA OKAFOR", holderChn: "C0023456BK", accountNo: "MRX0023456", units: 15000, dateIssued: "15 Mar 2019", status: "ACTIVE" },
  { certNo: "DANGCEM/2022/004567", register: "DANGCEM", description: "Dangote Cement Plc", holderName: "NGOZI CHIDINMA OKAFOR", holderChn: "C0023456BK", accountNo: "MRX0023456", units: 5000, dateIssued: "10 Jun 2022", status: "ACTIVE" },
  { certNo: "MTNN/2020/005678", register: "MTNN", description: "MTN Nigeria Communications Plc", holderName: "JOHN ADEYEMI BABATUNDE", holderChn: "C0012345AK", accountNo: "MRX0012345", units: 8000000, dateIssued: "20 Jan 2020", status: "ACTIVE" },
  { certNo: "MTNN/2021/009012", register: "MTNN", description: "MTN Nigeria Communications Plc", holderName: "JOHN ADEYEMI BABATUNDE", holderChn: "C0012345AK", accountNo: "MRX0012345", units: 4500000, dateIssued: "05 Sep 2021", status: "ACTIVE" },
  { certNo: "DANGCEM/2018/002345", register: "DANGCEM", description: "Dangote Cement Plc", holderName: "JOHN ADEYEMI BABATUNDE", holderChn: "C0012345AK", accountNo: "MRX0012345", units: 25000, dateIssued: "03 Nov 2018", status: "ACTIVE" },
  { certNo: "GTCO/2021/007890", register: "GTCO", description: "Guaranty Trust Holding Company Plc", holderName: "FATIMA ABUBAKAR MUSA", holderChn: "C0045678DK", accountNo: "MRX0045678", units: 120000, dateIssued: "12 Apr 2021", status: "ACTIVE" },
];

// ── Unit prices ───────────────────────────────────────────────────────────

export const UNIT_PRICES: Record<string, number> = {
  DANGCEM: 285,
  MTNN: 245,
  GTCO: 47,
  SEPLAT: 3800,
  UBA: 22,
  ZENITH: 38,
};

// ── Seed: Demat Requests ──────────────────────────────────────────────────

export const SEED_REQUESTS: DematRequest[] = [
  {
    id: "DR001",
    createdAt: "07 Jul 2026",
    certificateNos: ["DANGCEM/2019/001234"],
    holderName: "NGOZI CHIDINMA OKAFOR",
    holderChn: "C0023456BK",
    registerSymbol: "DANGCEM",
    stockbrokerName: "MERISTEM SECURITIES LIMITED",
    stockbrokerId: "sb1",
    totalUnits: 15000,
    unitPrice: 285,
    status: "PENDING_HOD",
    documents: {
      dematForms: [{ name: "demat_form_DR001.pdf", size: "245 KB" }],
      scannedCerts: [{ name: "cert_001234.pdf", size: "1.2 MB" }],
    },
  },
  {
    id: "DR002",
    createdAt: "06 Jul 2026",
    certificateNos: ["MTNN/2020/005678", "MTNN/2021/009012"],
    holderName: "JOHN ADEYEMI BABATUNDE",
    holderChn: "C0012345AK",
    registerSymbol: "MTNN",
    stockbrokerName: "CARDINALSTONE SECURITIES",
    stockbrokerId: "sb2",
    totalUnits: 12500000,
    unitPrice: 245,
    status: "PENDING_HOD",
    documents: {
      dematForms: [{ name: "demat_form_DR002.pdf", size: "312 KB" }],
      scannedCerts: [{ name: "cert_005678.pdf", size: "2.1 MB" }, { name: "cert_009012.pdf", size: "1.9 MB" }],
    },
  },
  {
    id: "DR003",
    createdAt: "05 Jul 2026",
    certificateNos: ["GTCO/2021/007890"],
    holderName: "FATIMA ABUBAKAR MUSA",
    holderChn: "C0045678DK",
    registerSymbol: "GTCO",
    stockbrokerName: "STANBIC IBTC STOCKBROKERS",
    stockbrokerId: "sb3",
    totalUnits: 120000,
    unitPrice: 47,
    status: "PENDING_ICU",
    documents: {
      dematForms: [{ name: "demat_form_DR003.pdf", size: "198 KB" }],
      scannedCerts: [{ name: "cert_007890.pdf", size: "987 KB" }],
    },
  },
  {
    id: "DR004",
    createdAt: "03 Jul 2026",
    certificateNos: ["DANGCEM/2022/004567"],
    holderName: "NGOZI CHIDINMA OKAFOR",
    holderChn: "C0023456BK",
    registerSymbol: "DANGCEM",
    stockbrokerName: "MERISTEM SECURITIES LIMITED",
    stockbrokerId: "sb1",
    totalUnits: 5000,
    unitPrice: 285,
    status: "APPROVED",
    documents: {
      dematForms: [{ name: "demat_form_DR004.pdf", size: "201 KB" }],
      scannedCerts: [{ name: "cert_004567.pdf", size: "756 KB" }],
    },
  },
  {
    id: "DR005",
    createdAt: "01 Jul 2026",
    certificateNos: ["DANGCEM/2018/002345"],
    holderName: "JOHN ADEYEMI BABATUNDE",
    holderChn: "C0012345AK",
    registerSymbol: "DANGCEM",
    stockbrokerName: "MERISTEM SECURITIES LIMITED",
    stockbrokerId: "sb1",
    totalUnits: 25000,
    unitPrice: 285,
    status: "REJECTED",
    rejectionComment: "Demat form signature does not match shareholder signature on file. Please resubmit with corrected documentation.",
    rejectedBy: "HOD",
    documents: {
      dematForms: [{ name: "demat_form_DR005.pdf", size: "223 KB" }],
      scannedCerts: [{ name: "cert_002345.pdf", size: "1.1 MB" }],
    },
  },
  {
    id: "DR006",
    createdAt: "28 Jun 2026",
    certificateNos: ["DANGCEM/2019/001234"],
    holderName: "NGOZI CHIDINMA OKAFOR",
    holderChn: "C0023456BK",
    registerSymbol: "DANGCEM",
    stockbrokerName: "MERISTEM SECURITIES LIMITED",
    stockbrokerId: "sb1",
    totalUnits: 15000,
    unitPrice: 285,
    status: "LODGED",
    lodgmentDate: "28 Jun 2026",
    documents: {
      dematForms: [{ name: "demat_form_DR006.pdf", size: "245 KB" }],
      scannedCerts: [{ name: "cert_001234_v2.pdf", size: "1.2 MB" }],
    },
  },
];

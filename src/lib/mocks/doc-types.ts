export interface DocTypeConfig {
  code: string;
  name: string;
  requiredFor: string[];
  fileTypes: string[];
  maxSizeMB: number;
  active: boolean;
}

export const FILE_TYPE_OPTIONS = ["PDF", "JPG", "PNG", "DOCX", "XLSX", "CSV"] as const;

export const FILE_TYPE_ACCEPT: Record<string, string> = {
  PDF:  ".pdf",
  JPG:  ".jpg,.jpeg",
  PNG:  ".png",
  DOCX: ".doc,.docx",
  XLSX: ".xls,.xlsx",
  CSV:  ".csv",
};

export const FILE_TYPE_COLORS: Record<string, string> = {
  PDF:  "bg-red-50    text-red-700    border-red-200",
  JPG:  "bg-sky-50    text-sky-700    border-sky-200",
  PNG:  "bg-violet-50 text-violet-700 border-violet-200",
  DOCX: "bg-blue-50   text-blue-700   border-blue-200",
  XLSX: "bg-green-50  text-green-700  border-green-200",
  CSV:  "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const MAX_SIZE_OPTIONS = [1, 2, 5, 10, 20] as const;

export const INIT_DOC_TYPES: DocTypeConfig[] = [
  {
    code: "DOC-1",
    name: "National ID",
    requiredFor: ["KYC", "Demat"],
    fileTypes: ["JPG", "PNG", "PDF"],
    maxSizeMB: 5,
    active: true,
  },
  {
    code: "DOC-2",
    name: "Passport",
    requiredFor: ["KYC"],
    fileTypes: ["JPG", "PNG", "PDF"],
    maxSizeMB: 5,
    active: true,
  },
  {
    code: "DOC-3",
    name: "Demat Form",
    requiredFor: ["Demat"],
    fileTypes: ["PDF"],
    maxSizeMB: 5,
    active: true,
  },
  {
    code: "DOC-4",
    name: "Court Order",
    requiredFor: ["ADMOR", "Caution"],
    fileTypes: ["PDF"],
    maxSizeMB: 10,
    active: true,
  },
  {
    code: "DOC-5",
    name: "Marriage Certificate",
    requiredFor: ["KYC"],
    fileTypes: ["PDF", "JPG", "PNG"],
    maxSizeMB: 5,
    active: false,
  },
  {
    code: "DOC-6",
    name: "Scanned Certificates",
    requiredFor: ["Demat"],
    fileTypes: ["PDF", "JPG", "PNG"],
    maxSizeMB: 20,
    active: true,
  },
  {
    code: "DOC-7",
    name: "Probate / Letters of Administration",
    requiredFor: ["ADMOR"],
    fileTypes: ["PDF"],
    maxSizeMB: 10,
    active: true,
  },
  {
    code: "DOC-8",
    name: "Corporate Resolution",
    requiredFor: ["KYC", "ADMOR"],
    fileTypes: ["PDF", "DOCX"],
    maxSizeMB: 10,
    active: true,
  },
];

export function getDocType(name: string): DocTypeConfig | undefined {
  return INIT_DOC_TYPES.find(d => d.name === name);
}

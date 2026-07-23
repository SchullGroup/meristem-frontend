"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import {
  Building2,
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Printer,
  CalendarRange,
  X,
  Mail,
  AlertCircle,
  Loader2,
  Search,
  Wand2,
  CheckCircle2,
  MousePointerClick,
} from "lucide-react";
import { EmailPreviewModal } from "@/components/custom/shareholder-outreach-modals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ICULodgment from "@/components/custom/ipo/lodgment";
import { CSCSReversalsWorkspace } from "@/components/custom/offer-administration/cscs-reversals-workspace";
import { ProvisionalAllotment } from "@/components/custom/rights-issue/provisional-allotment";
import { DispatchNotificationPanel } from "@/components/custom/offer-administration/dispatch-notification-panel";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { useReactToPrint } from "react-to-print";
import { formatCustomDate, formatDateOnly } from "@/utils/helperFunctions";
import ExportToExcel from "@/components/custom/ExportToExcel";

export interface BonusDeclaration {
  id: string;
  ref: string;
  registerId: string;
  registerName: string;
  bonusName: string;
  ratio: string;
  roundingRule: string;
  qualificationDate: string;
  closureDate: string;
  allotmentDate: string;
  narrative: string;
  status: string;
  totalShareholders: number;
  totalBonusShares: number;
  totalFractionalRemainder: number;
  icuApprovedBy: string;
  icuApprovedAt: string;
  authorizedBy?: string;
  authorizedAt?: string;
  authorizedReason?: string;
  submittedByName?: string;
  submittedAt?: string;
  totalCertificatedHolders?: number;
  totalCscsHolders?: number;
}

/* ─── constants & helpers ─── */

const PAGE_SIZE = 20;

interface BonusSetupProfile {
  id: string;
  name: string;
  register: string;
  ratio: string;
  qualificationDate: Date;
  closureDate: Date;
  allotmentDate: Date;
  roundingRule: string;
  narrative: string;
  status: "DRAFT" | "PENDING_AUTH" | "PENDING_ICU" | "ICU_APPROVED";
}

/** Mirrors the records created in Offer Setup → Bonus Issue Setup tab. */
const BONUS_SETUP_PROFILES: BonusSetupProfile[] = [
  {
    id: "bs-1",
    name: "Zenith Bank Bonus Issue 2024",
    register: "Zenith Bank Ord. Shares",
    ratio: "1 for 5",
    qualificationDate: new Date("2024-06-30"),
    closureDate: new Date("2024-07-15"),
    allotmentDate: new Date("2024-08-01"),
    roundingRule: "ROUND_DOWN",
    narrative: "One bonus share for every five held at qualification date.",
    status: "ICU_APPROVED",
  },
];

const BONUS_SETUP_STATUS_LABELS: Record<BonusSetupProfile["status"], string> = {
  DRAFT: "Draft",
  PENDING_AUTH: "Pending Approval",
  PENDING_ICU: "Pending ICU",
  ICU_APPROVED: "ICU Approved",
};

const BONUS_SETUP_STATUS_STYLES: Record<BonusSetupProfile["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_AUTH: "bg-amber-100 text-amber-800",
  PENDING_ICU: "bg-amber-100 text-amber-800",
  ICU_APPROVED: "bg-green-100 text-green-800",
};

const BONUS_REPORT_TYPES = [
  "Bonus Entitlement Register",
  "Shareholder Bonus Allotment List",
  "Summary of Bonus Shares Issued",
  "Exception and Rounding Report",
  "Bonus Report",
];

/* ─── mock data ─── */

const MOCK_USERS: Record<string, { name: string; role: string }> = {
  "user-001": { name: "Emeka Okonkwo", role: "Operations Manager" },
  "user-002": { name: "Chioma Nwosu", role: "ICU Analyst" },
};

const MOCK_ENTITLEMENTS: {
  id: string;
  accountNumber: string;
  name: string;
  shareholderName: string;
  unitsAtQualDate: number;
  bonusDue: number;
  fractionalRemainder: number;
  address: string;
  state: string;
}[] = [
  {
    id: "ent-01",
    accountNumber: "ZB2024-001",
    name: "ADEBISI OLUWASEUN PETERS",
    shareholderName: "ADEBISI OLUWASEUN PETERS",
    unitsAtQualDate: 50000,
    bonusDue: 10000,
    fractionalRemainder: 0.0,
    address: "12 Adeniyi Jones Avenue, Ikeja",
    state: "Lagos",
  },
  {
    id: "ent-02",
    accountNumber: "ZB2024-002",
    name: "CHUKWUEMEKA OBIORA OKAFOR",
    shareholderName: "CHUKWUEMEKA OBIORA OKAFOR",
    unitsAtQualDate: 75000,
    bonusDue: 15000,
    fractionalRemainder: 0.0,
    address: "45 Trans Amadi Road, Port Harcourt",
    state: "Rivers",
  },
  {
    id: "ent-03",
    accountNumber: "ZB2024-003",
    name: "FATIMA ABDULLAHI YUSUF",
    shareholderName: "FATIMA ABDULLAHI YUSUF",
    unitsAtQualDate: 22001,
    bonusDue: 4400,
    fractionalRemainder: 0.2,
    address: "8 Bompai Road, Kano",
    state: "Kano",
  },
  {
    id: "ent-04",
    accountNumber: "ZB2024-004",
    name: "MICHAEL KOLADE ADEYEMI",
    shareholderName: "MICHAEL KOLADE ADEYEMI",
    unitsAtQualDate: 137000,
    bonusDue: 27400,
    fractionalRemainder: 0.0,
    address: "22 Ring Road, Ibadan",
    state: "Oyo",
  },
  {
    id: "ent-05",
    accountNumber: "ZB2024-005",
    name: "NGOZI CHIDINMA OKAFOR",
    shareholderName: "NGOZI CHIDINMA OKAFOR",
    unitsAtQualDate: 11000,
    bonusDue: 2200,
    fractionalRemainder: 0.0,
    address: "7 Ogui Road, Enugu",
    state: "Enugu",
  },
  {
    id: "ent-06",
    accountNumber: "ZB2024-006",
    name: "IBRAHIM USMAN HASSAN",
    shareholderName: "IBRAHIM USMAN HASSAN",
    unitsAtQualDate: 83503,
    bonusDue: 16700,
    fractionalRemainder: 0.6,
    address: "15 Sultan Road, Sokoto",
    state: "Sokoto",
  },
  {
    id: "ent-07",
    accountNumber: "ZB2024-007",
    name: "BLESSING ADESANYA ORIMOTO",
    shareholderName: "BLESSING ADESANYA ORIMOTO",
    unitsAtQualDate: 213000,
    bonusDue: 42600,
    fractionalRemainder: 0.0,
    address: "33 Oba Akenzua Street, Benin City",
    state: "Edo",
  },
  {
    id: "ent-08",
    accountNumber: "ZB2024-008",
    name: "AMAKA CHISOM EZENWACHI",
    shareholderName: "AMAKA CHISOM EZENWACHI",
    unitsAtQualDate: 35700,
    bonusDue: 7140,
    fractionalRemainder: 0.0,
    address: "10 Nnamdi Azikiwe Road, Onitsha",
    state: "Anambra",
  },
  {
    id: "ent-09",
    accountNumber: "ZB2024-009",
    name: "TUNDE FASHOLA KAYODE",
    shareholderName: "TUNDE FASHOLA KAYODE",
    unitsAtQualDate: 98002,
    bonusDue: 19600,
    fractionalRemainder: 0.4,
    address: "56 Adeola Odeku Street, Victoria Island",
    state: "Lagos",
  },
  {
    id: "ent-10",
    accountNumber: "ZB2024-010",
    name: "AISHA IBRAHIM BELLO",
    shareholderName: "AISHA IBRAHIM BELLO",
    unitsAtQualDate: 57000,
    bonusDue: 11400,
    fractionalRemainder: 0.0,
    address: "28 Murtala Mohammed Way, Kaduna",
    state: "Kaduna",
  },
  {
    id: "ent-11",
    accountNumber: "ZB2024-011",
    name: "PETER OKOYE NWACHUKWU",
    shareholderName: "PETER OKOYE NWACHUKWU",
    unitsAtQualDate: 43000,
    bonusDue: 8600,
    fractionalRemainder: 0.0,
    address: "9 Aba Road, Port Harcourt",
    state: "Rivers",
  },
  {
    id: "ent-12",
    accountNumber: "ZB2024-012",
    name: "GRACE OMOLARA ADELEKE",
    shareholderName: "GRACE OMOLARA ADELEKE",
    unitsAtQualDate: 18700,
    bonusDue: 3740,
    fractionalRemainder: 0.0,
    address: "3 Akin Olugbade Street, Victoria Island",
    state: "Lagos",
  },
  {
    id: "ent-13",
    accountNumber: "ZB2024-013",
    name: "SAMUEL ADEWALE BABATUNDE",
    shareholderName: "SAMUEL ADEWALE BABATUNDE",
    unitsAtQualDate: 61000,
    bonusDue: 12200,
    fractionalRemainder: 0.0,
    address: "17 Zik Avenue, Awka",
    state: "Anambra",
  },
  {
    id: "ent-14",
    accountNumber: "ZB2024-014",
    name: "OBIAGELI NKECHI OKONKWO",
    shareholderName: "OBIAGELI NKECHI OKONKWO",
    unitsAtQualDate: 29001,
    bonusDue: 5800,
    fractionalRemainder: 0.2,
    address: "44 Oguta Road, Owerri",
    state: "Imo",
  },
  {
    id: "ent-15",
    accountNumber: "ZB2024-015",
    name: "JOHN EMEKA IGWE",
    shareholderName: "JOHN EMEKA IGWE",
    unitsAtQualDate: 71500,
    bonusDue: 14300,
    fractionalRemainder: 0.0,
    address: "6 Agbor Road, Asaba",
    state: "Delta",
  },
];

const MOCK_BROKER_SUMMARY = [
  {
    stockbroker: "Stanbic IBTC Stockbrokers",
    eligibleShareholders: 5412,
    unitsAtQualDate: 12450000,
    bonusSharesIssued: 2490000,
    fractionalUnits: 412.4,
    percentageOfTotalNewShares: 55.33,
  },
  {
    stockbroker: "Meristem Stockbrokers Ltd",
    eligibleShareholders: 4318,
    unitsAtQualDate: 7890000,
    bonusSharesIssued: 1578000,
    fractionalUnits: 231.8,
    percentageOfTotalNewShares: 35.07,
  },
  {
    stockbroker: "CardinalStone Securities",
    eligibleShareholders: 3117,
    unitsAtQualDate: 2160000,
    bonusSharesIssued: 432000,
    fractionalUnits: 89.2,
    percentageOfTotalNewShares: 9.6,
  },
];

const MOCK_BONUS_REPORT = [
  {
    shareAccountNo: "ZB2024-001",
    name: "ADEBISI OLUWASEUN PETERS",
    certificateNo: "CERT-BNS001",
    bonusUnits: 10000,
    unitsBefore: 50000,
    unitsAfter: 60000,
    email: "adebisi.peters@email.com",
    phone: "08012345678",
    chn: "C0045678AK",
    stockbroker: "Stanbic IBTC Stockbrokers",
    stockbrokerCode: "STANBIC",
  },
  {
    shareAccountNo: "ZB2024-002",
    name: "CHUKWUEMEKA OBIORA OKAFOR",
    certificateNo: "CERT-BNS002",
    bonusUnits: 15000,
    unitsBefore: 75000,
    unitsAfter: 90000,
    email: "chukwuemeka.okafor@email.com",
    phone: "08098765432",
    chn: "C0034521BK",
    stockbroker: "Meristem Stockbrokers Ltd",
    stockbrokerCode: "MERISTEM",
  },
  {
    shareAccountNo: "ZB2024-003",
    name: "FATIMA ABDULLAHI YUSUF",
    certificateNo: "CERT-BNS003",
    bonusUnits: 4400,
    unitsBefore: 22001,
    unitsAfter: 26401,
    email: "fatima.yusuf@email.com",
    phone: "07067891234",
    chn: "C0056712CK",
    stockbroker: "CardinalStone Securities",
    stockbrokerCode: "CARDINAL",
  },
  {
    shareAccountNo: "ZB2024-004",
    name: "MICHAEL KOLADE ADEYEMI",
    certificateNo: "CERT-BNS004",
    bonusUnits: 27400,
    unitsBefore: 137000,
    unitsAfter: 164400,
    email: "michael.adeyemi@email.com",
    phone: "08056789012",
    chn: "C0023456DK",
    stockbroker: "Stanbic IBTC Stockbrokers",
    stockbrokerCode: "STANBIC",
  },
  {
    shareAccountNo: "ZB2024-005",
    name: "NGOZI CHIDINMA OKAFOR",
    certificateNo: "CERT-BNS005",
    bonusUnits: 2200,
    unitsBefore: 11000,
    unitsAfter: 13200,
    email: "ngozi.okafor@email.com",
    phone: "09012345670",
    chn: "C0067890EK",
    stockbroker: "Meristem Stockbrokers Ltd",
    stockbrokerCode: "MERISTEM",
  },
  {
    shareAccountNo: "ZB2024-006",
    name: "IBRAHIM USMAN HASSAN",
    certificateNo: "CERT-BNS006",
    bonusUnits: 16700,
    unitsBefore: 83503,
    unitsAfter: 100203,
    email: "ibrahim.hassan@email.com",
    phone: "08034567890",
    chn: "C0012345FK",
    stockbroker: "Stanbic IBTC Stockbrokers",
    stockbrokerCode: "STANBIC",
  },
  {
    shareAccountNo: "ZB2024-007",
    name: "BLESSING ADESANYA ORIMOTO",
    certificateNo: "CERT-BNS007",
    bonusUnits: 42600,
    unitsBefore: 213000,
    unitsAfter: 255600,
    email: "blessing.orimoto@email.com",
    phone: "07089012345",
    chn: "C0078901GK",
    stockbroker: "CardinalStone Securities",
    stockbrokerCode: "CARDINAL",
  },
  {
    shareAccountNo: "ZB2024-008",
    name: "AMAKA CHISOM EZENWACHI",
    certificateNo: "CERT-BNS008",
    bonusUnits: 7140,
    unitsBefore: 35700,
    unitsAfter: 42840,
    email: "amaka.ezenwachi@email.com",
    phone: "08045678901",
    chn: "C0090123HK",
    stockbroker: "Meristem Stockbrokers Ltd",
    stockbrokerCode: "MERISTEM",
  },
  {
    shareAccountNo: "ZB2024-009",
    name: "TUNDE FASHOLA KAYODE",
    certificateNo: "CERT-BNS009",
    bonusUnits: 19600,
    unitsBefore: 98002,
    unitsAfter: 117602,
    email: "tunde.kayode@email.com",
    phone: "08023456789",
    chn: "C0034512IK",
    stockbroker: "Stanbic IBTC Stockbrokers",
    stockbrokerCode: "STANBIC",
  },
  {
    shareAccountNo: "ZB2024-010",
    name: "AISHA IBRAHIM BELLO",
    certificateNo: "CERT-BNS010",
    bonusUnits: 11400,
    unitsBefore: 57000,
    unitsAfter: 68400,
    email: "aisha.bello@email.com",
    phone: "07056789012",
    chn: "C0045623JK",
    stockbroker: "CardinalStone Securities",
    stockbrokerCode: "CARDINAL",
  },
  {
    shareAccountNo: "ZB2024-011",
    name: "PETER OKOYE NWACHUKWU",
    certificateNo: "CERT-BNS011",
    bonusUnits: 8600,
    unitsBefore: 43000,
    unitsAfter: 51600,
    email: "peter.nwachukwu@email.com",
    phone: "09034567890",
    chn: "C0056734KK",
    stockbroker: "Meristem Stockbrokers Ltd",
    stockbrokerCode: "MERISTEM",
  },
  {
    shareAccountNo: "ZB2024-012",
    name: "GRACE OMOLARA ADELEKE",
    certificateNo: "CERT-BNS012",
    bonusUnits: 3740,
    unitsBefore: 18700,
    unitsAfter: 22440,
    email: "grace.adeleke@email.com",
    phone: "08078901234",
    chn: "C0067845LK",
    stockbroker: "Stanbic IBTC Stockbrokers",
    stockbrokerCode: "STANBIC",
  },
  {
    shareAccountNo: "ZB2024-013",
    name: "SAMUEL ADEWALE BABATUNDE",
    certificateNo: "CERT-BNS013",
    bonusUnits: 12200,
    unitsBefore: 61000,
    unitsAfter: 73200,
    email: "samuel.babatunde@email.com",
    phone: "08089012345",
    chn: "C0078956MK",
    stockbroker: "CardinalStone Securities",
    stockbrokerCode: "CARDINAL",
  },
  {
    shareAccountNo: "ZB2024-014",
    name: "OBIAGELI NKECHI OKONKWO",
    certificateNo: "CERT-BNS014",
    bonusUnits: 5800,
    unitsBefore: 29001,
    unitsAfter: 34801,
    email: "obiageli.okonkwo@email.com",
    phone: "07045678901",
    chn: "C0090067NK",
    stockbroker: "Meristem Stockbrokers Ltd",
    stockbrokerCode: "MERISTEM",
  },
  {
    shareAccountNo: "ZB2024-015",
    name: "JOHN EMEKA IGWE",
    certificateNo: "CERT-BNS015",
    bonusUnits: 14300,
    unitsBefore: 71500,
    unitsAfter: 85800,
    email: "john.igwe@email.com",
    phone: "08012398765",
    chn: "C0023178OK",
    stockbroker: "Stanbic IBTC Stockbrokers",
    stockbrokerCode: "STANBIC",
  },
];

const MOCK_REPORT_DATA: Record<string, unknown[]> = {
  "bonus-entitlement-register": MOCK_ENTITLEMENTS,
  "shareholder-bonus-allotment-list": MOCK_ENTITLEMENTS,
  "exception-and-rounding-report": MOCK_ENTITLEMENTS.filter(
    (e) => e.fractionalRemainder > 0,
  ),
  "bonus-report": MOCK_BONUS_REPORT,
  "summary-of-bonus-shares-issued": MOCK_BROKER_SUMMARY,
};

const MOCK_SUMMARY_META = {
  totalShareholders: 12847,
  totalUnitsAtQualDate: 22500000,
  totalBonusSharesIssued: 4500000,
  totalFractionalUnits: 733.4,
  percentageOfTotalNewShares: 100.0,
};

const MOCK_ALLOTMENT_SUMMARY = {
  totalShareholders: 12847,
  totalBonusShares: 4500000,
  previousStockInIssue: 22500000,
  newStockInIssue: 27000000,
  totalPaperSharesCreated: 4230,
  totalCscShares: 8617,
  totalFractionalSharesRounded: 4,
};

const MOCK_CSCS_ERRORS = [
  {
    accountNumber: "ZB2024-003",
    name: "FATIMA ABDULLAHI YUSUF",
    chn: "C0056712CK",
    bonusDue: 4400,
    reason: "Invalid CHN format",
  },
  {
    accountNumber: "ZB2024-006",
    name: "IBRAHIM USMAN HASSAN",
    chn: "C0012345FK",
    bonusDue: 16700,
    reason: "Account dormant",
  },
  {
    accountNumber: "ZB2024-009",
    name: "TUNDE FASHOLA KAYODE",
    chn: "C0034512IK",
    bonusDue: 19600,
    reason: "Name mismatch on CSCS record",
  },
  {
    accountNumber: "ZB2024-014",
    name: "OBIAGELI NKECHI OKONKWO",
    chn: "C0090067NK",
    bonusDue: 5800,
    reason: "Duplicate entry detected",
  },
];
const MOCK_CSCS_CREDITED = MOCK_ENTITLEMENTS.filter(
  (e) =>
    !["ZB2024-003", "ZB2024-006", "ZB2024-009", "ZB2024-014"].includes(
      e.accountNumber,
    ),
);

const INITIAL_MOCK_DECLARATIONS: BonusDeclaration[] = [
  {
    id: "decl-pending-auth",
    ref: "BNS/2024/001",
    registerId: "reg-zenith",
    registerName: "Zenith Bank Ord. Shares",
    bonusName: "Zenith Bank Bonus Issue 2024",
    ratio: "1:5",
    roundingRule: "ROUND DOWN",
    qualificationDate: "2024-06-30",
    closureDate: "2024-07-15",
    allotmentDate: "2024-08-01",
    narrative: "One bonus share for every five held at qualification date.",
    status: "PENDING_AUTH",
    totalShareholders: 12847,
    totalBonusShares: 4500000,
    totalFractionalRemainder: 733.4,
    icuApprovedBy: "",
    icuApprovedAt: "",
    submittedByName: "Emeka Okonkwo",
    submittedAt: "2024-07-16T09:30:00Z",
    totalCertificatedHolders: 4230,
    totalCscsHolders: 8617,
  },
  {
    id: "decl-pending-icu",
    ref: "BNS/2024/002",
    registerId: "reg-zenith",
    registerName: "Zenith Bank Ord. Shares",
    bonusName: "Zenith Bank Bonus Issue 2024",
    ratio: "1:5",
    roundingRule: "ROUND DOWN",
    qualificationDate: "2024-06-30",
    closureDate: "2024-07-15",
    allotmentDate: "2024-08-01",
    narrative: "One bonus share for every five held at qualification date.",
    status: "PENDING_ICU",
    totalShareholders: 12847,
    totalBonusShares: 4500000,
    totalFractionalRemainder: 733.4,
    icuApprovedBy: "",
    icuApprovedAt: "",
    authorizedBy: "user-001",
    authorizedAt: "2024-07-17T10:15:00Z",
    authorizedReason: "All entitlement figures verified and in order.",
    submittedByName: "Emeka Okonkwo",
    submittedAt: "2024-07-16T09:30:00Z",
    totalCertificatedHolders: 4230,
    totalCscsHolders: 8617,
  },
  {
    id: "decl-icu-approved",
    ref: "BNS/2024/003",
    registerId: "reg-zenith",
    registerName: "Zenith Bank Ord. Shares",
    bonusName: "Zenith Bank Bonus Issue 2024",
    ratio: "1:5",
    roundingRule: "ROUND DOWN",
    qualificationDate: "2024-06-30",
    closureDate: "2024-07-15",
    allotmentDate: "2024-08-01",
    narrative: "One bonus share for every five held at qualification date.",
    status: "ICU_APPROVED",
    totalShareholders: 12847,
    totalBonusShares: 4500000,
    totalFractionalRemainder: 733.4,
    icuApprovedBy: "user-002",
    icuApprovedAt: "2024-07-18T11:00:00Z",
    authorizedBy: "user-001",
    authorizedAt: "2024-07-17T10:15:00Z",
    authorizedReason: "All entitlement figures verified and in order.",
    submittedByName: "Emeka Okonkwo",
    submittedAt: "2024-07-16T09:30:00Z",
    totalCertificatedHolders: 4230,
    totalCscsHolders: 8617,
  },
];

function getVisiblePages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function PaginationBar({
  page,
  total,
  onPageChange,
  pageSize = PAGE_SIZE,
  onPageSizeChange,
}: {
  page: number;
  total: number;
  onPageChange: (p: number) => void;
  pageSize?: number;
  onPageSizeChange?: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visible = getVisiblePages(page, totalPages);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 text-[13px]">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">
          Showing {start}–{end} of {total.toLocaleString()}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-6 w-16 text-[13px] px-2 py-0 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-[13px]">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">rows</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-[13px]"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        {visible.map((p, idx) =>
          p === "…" ? (
            <span
              key={`e${idx}`}
              className="px-1.5 text-muted-foreground select-none"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={page === p ? "default" : "outline"}
              size="sm"
              className="h-7 w-7 p-0 text-[13px]"
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-[13px]"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/* Shareholder rows shared by Approval, ICU, and Reports */
function BonusTableHead() {
  return (
    <thead className="mrpsl-table-header">
      <tr>
        <th className="px-4 py-2.5">#</th>
        <th className="px-4 py-2.5">ACCOUNT NO</th>
        <th className="px-4 py-2.5">HOLDER NAME</th>
        <th className="px-4 py-2.5 text-right">UNITS AT QUAL DATE</th>
        <th className="px-4 py-2.5 text-right">BONUS DUE</th>
        <th className="px-4 py-2.5 text-right">FRACTION</th>
      </tr>
    </thead>
  );
}

function EntitlementTableRows({
  rows,
  startIdx,
}: {
  rows: {
    accountNumber: string;
    name: string;
    unitsAtQualDate: number;
    bonusDue: number;
    fractionalRemainder: number;
    shareholderName: string;
  }[];
  startIdx?: number;
}) {
  if (!rows) return null;
  if (rows.length === 0) {
    return (
      <tr>
        <td
          colSpan={6}
          className="px-4 py-10 text-center text-muted-foreground font-sans text-sm"
        >
          No records found
        </td>
      </tr>
    );
  }
  return (
    <>
      {rows.map((s, i) => (
        <tr key={i} className="mrpsl-table-row font-mono text-[13px]">
          {typeof startIdx !== "undefined" && (
            <td className="px-4 py-2.5 text-muted-foreground">
              {startIdx + i + 1}
            </td>
          )}
          <td className="px-4 py-2.5">{s?.accountNumber}</td>
          <td className="px-4 py-2.5 font-sans font-medium">
            {s?.name || s?.shareholderName}
          </td>
          <td className="px-4 py-2.5 text-right">
            {s?.unitsAtQualDate?.toLocaleString()}
          </td>
          <td className="px-4 py-2.5 text-right text-green-600 font-bold">
            {s?.bonusDue?.toLocaleString()}
          </td>
          <td className="px-4 py-2.5 text-right text-amber-600">
            {s?.fractionalRemainder?.toFixed(4)}
          </td>
        </tr>
      ))}
    </>
  );
}

function EntitlementTfoot({
  rows,
  total,
}: {
  rows: {
    bonusDue: number;
    fractionalRemainder: number;
  }[];
  total: number;
}) {
  if (!rows) return null;
  return (
    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
      <tr>
        <td
          colSpan={4}
          className="px-4 py-2.5 text-right text-muted-foreground"
        >
          PAGE TOTALS ({total.toLocaleString()} total shareholders)
        </td>
        <td className="px-4 py-2.5 text-right text-green-600">
          {rows
            .reduce(
              (a: number, s: { bonusDue: number }) => a + (s.bonusDue || 0),
              0,
            )
            .toLocaleString()}
        </td>
        <td className="px-4 py-2.5 text-right text-amber-600">
          {rows
            .reduce(
              (a: number, s: { fractionalRemainder: number }) =>
                a + (s.fractionalRemainder || 0),
              0,
            )
            .toFixed(4)}
        </td>
      </tr>
    </tfoot>
  );
}

/* Declaration detail card — reused in both Approval and ICU */
function DeclDetailCard({ decl }: { decl: BonusDeclaration | null }) {
  if (!decl) return null;
  return (
    <Card className="mrpsl-card p-4">
      <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Declaration Details
      </p>
      <div className="grid grid-cols-4 gap-x-8 gap-y-3 text-sm">
        <div>
          <div className="mrpsl-section-title">Register</div>
          <div className="font-semibold mt-0.5">{decl.registerName}</div>
        </div>
        <div>
          <div className="mrpsl-section-title">Bonus Name</div>
          <div className="font-semibold mt-0.5">{decl.bonusName}</div>
        </div>
        <div>
          <div className="mrpsl-section-title">Bonus Ratio</div>
          <div className="font-mono mt-0.5">{decl.ratio}</div>
        </div>
        <div>
          <div className="mrpsl-section-title">Rounding Rule</div>
          <div className="mt-0.5">{decl.roundingRule}</div>
        </div>
        <div>
          <div className="mrpsl-section-title">Qualification Date</div>
          <div className="font-mono mt-0.5">
            {formatDateOnly(decl.qualificationDate)}
          </div>
        </div>
        <div>
          <div className="mrpsl-section-title">Closure Date</div>
          <div className="font-mono mt-0.5">
            {formatDateOnly(decl.closureDate)}
          </div>
        </div>
        <div>
          <div className="mrpsl-section-title">Allotment Date</div>
          <div className="font-mono mt-0.5">
            {formatDateOnly(decl.allotmentDate)}
          </div>
        </div>
        <div className="col-span-1">
          <div className="mrpsl-section-title">Narrative</div>
          <div className="text-muted-foreground mt-0.5 italic text-[13px]">
            &quot;{decl.narrative || "No narrative provided."}&quot;
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── main component ─── */

export default function BonusIssuePage() {
  const { shareholders } = useStore();

  const [activeTab, setActiveTab] = useState("declaration");

  // Approval (2-step)
  const [authReviewing, setAuthReviewing] = useState<string | null>(null);
  const [authComment, setAuthComment] = useState("");
  const [authPage, setAuthPage] = useState(1);

  // Approval modal
  const [approvalModal, setApprovalModal] = useState<{
    action: "approve" | "reject";
    section: "ops" | "icu";
  } | null>(null);
  const [modalComment, setModalComment] = useState("");

  // ICU Approval (2-step)
  const [icuReviewing, setIcuReviewing] = useState<string | null>(null);
  const [icuComment, setIcuComment] = useState("");
  const [icuPage, setIcuPage] = useState(1);

  // Allotment
  const [allotPage, setAllotPage] = useState(1);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [allotReviewing, setAllotReviewing] = useState<string | null>(null);
  const [allotReviewingRow, setAllotReviewingRow] =
    useState<BonusDeclaration | null>(null);
  const [allotmentProcessedMap, setAllotmentProcessedMap] = useState<
    Record<string, boolean>
  >({});
  const [isAllotmentProcessing, setIsAllotmentProcessing] = useState(false);
  const [isExportingAllotments, setIsExportingAllotments] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Auth tab list filters
  const [authListPage, setAuthListPage] = useState(1);
  const [authListPageSize, setAuthListPageSize] = useState(PAGE_SIZE);
  const [authListSearch, setAuthListSearch] = useState("");
  const [authListRegister, setAuthListRegister] = useState("");

  // ICU tab list filters
  const [icuListPage, setIcuListPage] = useState(1);
  const [icuListPageSize, setIcuListPageSize] = useState(PAGE_SIZE);
  const [icuListSearch, setIcuListSearch] = useState("");
  const [icuListRegister, setIcuListRegister] = useState("");

  // Allotment tab list filters
  const [allotListPage, setAllotListPage] = useState(1);
  const [allotListPageSize, setAllotListPageSize] = useState(PAGE_SIZE);
  const [allotListSearch, setAllotListSearch] = useState("");
  const [allotListRegister, setAllotListRegister] = useState("");

  // Reports
  const [selectedReport, setSelectedReport] = useState(BONUS_REPORT_TYPES[0]);
  const [reportRegister, setReportRegister] = useState("all");
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const reportDateRangeRef = useRef<DateRange | undefined>(undefined);
  const [reportCalOpen, setReportCalOpen] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printAreaRef,
    documentTitle: `${selectedReport} - Report`,
  });

  const handlePrintTrigger = () => {
    toast.info("Opening print dialog...");
    handlePrint();
  };

  // Mock declarations state
  const [mockDeclarations, setMockDeclarations] = useState<BonusDeclaration[]>(
    INITIAL_MOCK_DECLARATIONS,
  );

  // Declaration tab compute state
  const [computed, setComputed] = useState(false);
  const [sendingToIcu, setSendingToIcu] = useState(false);
  const [declarationPage, setDeclarationPage] = useState(1);

  // ICU approval flow — track just-approved state so review stays open
  const [icuJustApproved, setIcuJustApproved] = useState(false);

  // Lodgement tab
  const [lodgementReviewing, setLodgementReviewing] = useState<string | null>(
    null,
  );
  const [lodgementPage, setLodgementPage] = useState(1);

  // Reversals tab
  const [cscsFileUploaded, setCscsFileUploaded] = useState(false);
  const [cscsFile, setCscsFile] = useState<File | null>(null);
  const [cscsReviewingId, setCscsReviewingId] = useState<string | null>(null);

  // ── Derived data from mock ──

  const authDeclarationList = mockDeclarations.filter(
    (d) => d.status === "PENDING_AUTH",
  );
  const authDeclarationTotal = authDeclarationList.length;
  const isAuthDeclarationsLoading = false;

  const icuDeclarationList = mockDeclarations.filter(
    (d) => d.status === "PENDING_ICU",
  );
  const icuDeclarationTotal = icuDeclarationList.length;
  const isIcuDeclarationsLoading = false;

  const allotDeclarationList = mockDeclarations.filter(
    (d) => d.status === "ALLOTTED",
  );
  const allotDeclarationTotal = allotDeclarationList.length;
  const isAllotDeclarationsLoading = false;

  const currentReviewingId =
    activeTab === "auth" ? authReviewing : icuReviewing;
  const reviewPage = activeTab === "auth" ? authPage : icuPage;

  const activeReview = currentReviewingId
    ? (mockDeclarations.find((d) => d.id === currentReviewingId) ?? null)
    : null;
  const isActiveReviewLoading = false;

  const activeAllotment = allotReviewing ? allotReviewingRow : activeReview;

  // Entitlements (paginated mock)
  const PAGE_ENTS = 10;
  const entitlementList = MOCK_ENTITLEMENTS.slice(
    (reviewPage - 1) * PAGE_ENTS,
    reviewPage * PAGE_ENTS,
  );
  const entitlementTotal = MOCK_ENTITLEMENTS.length;
  const isEntitlementLoading = false;

  // Allotments (paginated mock)
  const allotmentsList = MOCK_ENTITLEMENTS.slice(
    (allotPage - 1) * PAGE_ENTS,
    allotPage * PAGE_ENTS,
  );
  const allotmentsTotal = MOCK_ENTITLEMENTS.length;
  const isAllotmentsLoading = false;

  // Declaration tab entitlement pagination
  const declarationEntitlementList = MOCK_ENTITLEMENTS.slice(
    (declarationPage - 1) * PAGE_ENTS,
    declarationPage * PAGE_ENTS,
  );

  // Lodgement tab derived data
  const lodgementDeclarationList = mockDeclarations.filter(
    (d) => d.status === "ICU_APPROVED",
  );
  const lodgementReviewingRow = lodgementReviewing
    ? (mockDeclarations.find((d) => d.id === lodgementReviewing) ?? null)
    : null;
  const lodgementEntitlementList = MOCK_ENTITLEMENTS.slice(
    (lodgementPage - 1) * PAGE_ENTS,
    lodgementPage * PAGE_ENTS,
  );

  // ICU rejected count — used for the amber banner on the ICU list view
  const icuRejectedCount = mockDeclarations.filter(
    (d) => d.status === "ICU_REJECTED",
  ).length;

  // User lookup
  const getUserByIdFn = (userId?: string) => {
    if (!userId) return { name: "-", role: "-" };
    return MOCK_USERS[userId] ?? { name: userId, role: "-" };
  };

  const userName = activeReview?.authorizedBy
    ? (MOCK_USERS[activeReview.authorizedBy]?.name ?? "-")
    : "-";
  const userRole = activeReview?.authorizedBy
    ? (MOCK_USERS[activeReview.authorizedBy]?.role ?? "-")
    : "-";
  const isUserDetailsLoading = false;

  // Report data
  const reportPath =
    selectedReport === "Shareholder Bonus Allotment List"
      ? "shareholder-bonus-allotment-list"
      : selectedReport === "Summary of Bonus Shares Issued"
        ? "summary-of-bonus-shares-issued"
        : selectedReport === "Exception and Rounding Report"
          ? "exception-and-rounding-report"
          : selectedReport === "Bonus Report"
            ? "bonus-report"
            : "bonus-entitlement-register";

  const reportDateFrom = reportDateRange?.from
    ? reportDateRange.from.toISOString().split("T")[0]
    : undefined;
  const reportDateTo = reportDateRange?.to
    ? reportDateRange.to.toISOString().split("T")[0]
    : undefined;

  const isReportLoading = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchedReportList: any[] = reportGenerated
    ? (MOCK_REPORT_DATA[reportPath] ?? [])
    : [];

  const fetchedReportData =
    reportPath === "summary-of-bonus-shares-issued" ? MOCK_SUMMARY_META : null;

  const fetchedReportTotal = fetchedReportList.length;

  const reportStart = (reportPage - 1) * PAGE_SIZE;
  const reportRows = fetchedReportList.slice(
    reportStart,
    reportStart + PAGE_SIZE,
  );
  const reportTotal = fetchedReportTotal;

  const reportDateLabel = reportDateRange?.from
    ? reportDateRange.to
      ? `${format(reportDateRange.from, "dd MMM yyyy")} – ${format(reportDateRange.to, "dd MMM yyyy")}`
      : format(reportDateRange.from, "dd MMM yyyy")
    : undefined;

  // ── Handlers ──

  const closeModal = () => {
    setApprovalModal(null);
    setModalComment("");
  };

  const handleAuthApprove = (mode: "ops" | "icu") => {
    const declId = authReviewing || icuReviewing;
    if (!declId) return;
    setIsConfirming(true);
    setTimeout(() => {
      if (mode === "ops") {
        setMockDeclarations((prev) =>
          prev.map((d) =>
            d.id === declId
              ? {
                  ...d,
                  status: "PENDING_ICU",
                  authorizedBy: "user-001",
                  authorizedAt: new Date().toISOString(),
                  authorizedReason: modalComment || "Approved by OPS.",
                }
              : d,
          ),
        );
        toast.success("Declaration approved successfully.");
        setAuthReviewing(null);
        setAuthComment("");
      } else {
        setMockDeclarations((prev) =>
          prev.map((d) =>
            d.id === declId
              ? {
                  ...d,
                  status: "ICU_APPROVED",
                  icuApprovedBy: "user-002",
                  icuApprovedAt: new Date().toISOString(),
                }
              : d,
          ),
        );
        toast.success("Declaration approved and cleared for allotment.");
        // Stay on the review screen — show success banner with email CTA
        setIcuJustApproved(true);
      }
      setIsConfirming(false);
      closeModal();
    }, 800);
  };

  const handleAuthReject = () => {
    const declId = authReviewing || icuReviewing;
    if (!declId) return;
    setIsConfirming(true);
    setTimeout(() => {
      setMockDeclarations((prev) =>
        prev.map((d) =>
          d.id === declId ? { ...d, status: "AUTH_REJECTED" } : d,
        ),
      );
      toast.success("Declaration rejected.");
      setAuthReviewing(null);
      setAuthComment("");
      setIsConfirming(false);
      closeModal();
    }, 600);
  };

  const handleIcuReturn = () => {
    const declId = icuReviewing;
    if (!declId) return;
    setIsConfirming(true);
    setTimeout(() => {
      setMockDeclarations((prev) =>
        prev.map((d) =>
          d.id === declId ? { ...d, status: "ICU_REJECTED" } : d,
        ),
      );
      toast.error(
        "Declaration rejected. It has been returned to Offer Setup for editing.",
      );
      setIcuReviewing(null);
      setIcuComment("");
      setIcuJustApproved(false);
      setIsConfirming(false);
      closeModal();
    }, 600);
  };

  const handleConfirmClick = () => {
    if (approvalModal?.section === "ops") {
      if (approvalModal.action === "approve") {
        handleAuthApprove("ops");
      } else {
        handleAuthReject();
      }
    } else {
      if (approvalModal?.action === "approve") {
        handleAuthApprove("icu");
      } else {
        handleIcuReturn();
      }
    }
  };

  const handleRunReport = () => {
    const loadingToast = toast.loading("Generating report...");
    setTimeout(() => {
      toast.dismiss(loadingToast);
      setReportGenerated(true);
      setReportPage(1);
      toast.success(`${selectedReport} generated.`);
    }, 800);
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    toast.info("Preparing Excel download...");
    setTimeout(() => {
      toast.success("Excel downloaded successfully.");
      setIsExportingExcel(false);
    }, 1000);
  };

  const handleProcessAllotment = (row: BonusDeclaration) => {
    if (!row?.id) return;
    setIsAllotmentProcessing(true);
    toast.info("Processing allotment…");
    setTimeout(() => {
      setMockDeclarations((prev) =>
        prev.map((d) => (d.id === row.id ? { ...d, status: "ALLOTTED" } : d)),
      );
      setAllotmentProcessedMap((p) => ({ ...p, [row.id]: true }));
      setAllotPage(1);
      setIsAllotmentProcessing(false);
      toast.success(
        "Allotment processed. Certificates and CSCS entries created.",
      );
    }, 1500);
  };

  const handleApproveAndCompute = (_id?: string) => {
    const loadingToast = toast.loading("Submitting for approval...");
    setTimeout(() => {
      toast.dismiss(loadingToast);
      toast.success("Declaration submitted for approval.");
    }, 800);
  };

  const handleExportAllotments = (rowId?: string) => {
    if (!rowId) {
      toast.error("No active allotment declaration selected.");
      return;
    }
    setIsExportingAllotments(true);
    toast.info("Exporting Excel report…");
    setTimeout(() => {
      toast.success("Excel report exported successfully.");
      setIsExportingAllotments(false);
    }, 1000);
  };

  const [selectedBonusOfferId, setSelectedBonusOfferId] = useState<string>("");
  const selectedBonusOffer =
    BONUS_SETUP_PROFILES.find((p) => p.id === selectedBonusOfferId) ?? null;

  const handleSelectBonusOffer = (id: string | null) => {
    if (!id) return;
    setSelectedBonusOfferId(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonus Issue Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Declare and automatically compute bonus share allotments
        </p>
      </div>

      {/* Active offer selector */}
      <Card className="mrpsl-card p-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Active Bonus Issue</span>
          </div>
          <div className="flex-1 min-w-60">
            <Select
              value={selectedBonusOfferId}
              onValueChange={handleSelectBonusOffer}
            >
              <SelectTrigger className="mrpsl-input h-9 w-full max-w-sm">
                <SelectValue placeholder="Select a bonus issue to work with…" />
              </SelectTrigger>
              <SelectContent>
                {BONUS_SETUP_PROFILES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedBonusOffer && (
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div>
                <span className="mrpsl-label mr-1">Register:</span>
                <span className="font-medium">
                  {selectedBonusOffer.register}
                </span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Ratio:</span>
                <span className="font-mono font-semibold">
                  {selectedBonusOffer.ratio}
                </span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Qual. Date:</span>
                <span className="font-mono">
                  {format(selectedBonusOffer.qualificationDate, "dd MMM yyyy")}
                </span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Allotment Date:</span>
                <span className="font-mono">
                  {format(selectedBonusOffer.allotmentDate, "dd MMM yyyy")}
                </span>
              </div>
              <Badge
                className={`border-0 text-[11px] ${BONUS_SETUP_STATUS_STYLES[selectedBonusOffer.status]}`}
              >
                {BONUS_SETUP_STATUS_LABELS[selectedBonusOffer.status]}
              </Badge>
            </div>
          )}
          {!selectedBonusOffer && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Select a bonus issue above to begin processing.
            </div>
          )}
        </div>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-full gap-0.5 flex-wrap justify-start">
          {[
            ["declaration", "Provisional Allotment"],
            ["auth", "Declaration Approval"],
            ["icu", "ICU Approval"],
            ["lodgement", "CSCS Lodgement"],
            ["reversals", "CSCS Reversals & Error Resolution"],
            ["allotment", "Notification & Prelist Dispatch"],
            ["reports", "Reports"],
          ].map(([v, label]) => (
            <TabsTrigger
              key={v}
              value={v}
              disabled={!selectedBonusOffer}
              className="flex-none rounded-lg cursor-pointer px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all disabled:pointer-events-none disabled:opacity-40"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          {/* ── Provisional Allotment ── */}
          <TabsContent value="declaration">
            {!selectedBonusOffer ? (
              <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center min-h-70 gap-3">
                <MousePointerClick className="h-10 w-10 text-muted-foreground/30" />
                <p className="font-semibold text-sm text-foreground">
                  No bonus issue selected
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Select a bonus issue from the dropdown above to view and
                  compute the provisional allotment schedule.
                </p>
              </Card>
            ) : !computed ? (
              <Card className="mrpsl-card p-8 space-y-6">
                <div>
                  <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Bonus Issue Setup
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="mrpsl-section-title">Bonus Name</div>
                      <div className="font-semibold mt-0.5">
                        {selectedBonusOffer.name}
                      </div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">Register</div>
                      <div className="font-semibold mt-0.5">
                        {selectedBonusOffer.register}
                      </div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">Bonus Ratio</div>
                      <div className="font-mono font-semibold mt-0.5">
                        {selectedBonusOffer.ratio}
                      </div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">
                        Qualification Date
                      </div>
                      <div className="font-mono mt-0.5">
                        {format(
                          selectedBonusOffer.qualificationDate,
                          "dd MMM yyyy",
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">Closure Date</div>
                      <div className="font-mono mt-0.5">
                        {format(selectedBonusOffer.closureDate, "dd MMM yyyy")}
                      </div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">Allotment Date</div>
                      <div className="font-mono mt-0.5">
                        {format(
                          selectedBonusOffer.allotmentDate,
                          "dd MMM yyyy",
                        )}
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className="mrpsl-section-title">Narrative</div>
                      <div className="text-muted-foreground mt-0.5 italic text-[13px]">
                        &quot;{selectedBonusOffer.narrative}&quot;
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-semibold"
                    disabled={sendingToIcu}
                    onClick={() => {
                      const loadingToast = toast.loading(
                        "Computing bonus allotment…",
                      );
                      setTimeout(() => {
                        toast.dismiss(loadingToast);
                        setComputed(true);
                        setDeclarationPage(1);
                        toast.success("Bonus allotment computed successfully.");
                      }, 1200);
                    }}
                  >
                    <Wand2 className="mr-2 h-5 w-5" /> Compute Bonus Allotment
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: "Total Shareholders",
                      value: (12847).toLocaleString(),
                      color: "text-foreground",
                    },
                    {
                      label: "Total Bonus Shares",
                      value: (4500000).toLocaleString(),
                      color: "text-green-700",
                    },
                    {
                      label: "Total Fractional",
                      value: "733.4",
                      color: "text-amber-600",
                    },
                    {
                      label: "Ratio Used",
                      value: selectedBonusOffer.ratio,
                      color: "text-foreground",
                    },
                  ].map((s) => (
                    <Card key={s.label} className="mrpsl-card p-3">
                      <div className="mrpsl-section-title">{s.label}</div>
                      <div
                        className={cn(
                          "text-xl font-mono font-bold mt-1",
                          s.color,
                        )}
                      >
                        {s.value}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Entitlement table */}
                <Card className="mrpsl-card overflow-hidden">
                  <div className="px-4 py-3 border-b bg-muted/10">
                    <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                      Provisional Allotment Schedule —{" "}
                      {MOCK_ENTITLEMENTS.length.toLocaleString()} shareholders
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <BonusTableHead />
                      <tbody className="divide-y">
                        <EntitlementTableRows
                          rows={declarationEntitlementList}
                          startIdx={(declarationPage - 1) * PAGE_ENTS}
                        />
                      </tbody>
                      <EntitlementTfoot
                        rows={declarationEntitlementList}
                        total={MOCK_ENTITLEMENTS.length}
                      />
                    </table>
                  </div>
                  <PaginationBar
                    page={declarationPage}
                    total={MOCK_ENTITLEMENTS.length}
                    onPageChange={setDeclarationPage}
                    pageSize={PAGE_ENTS}
                  />
                </Card>

                {/* Action buttons */}
                <div className="flex items-center gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => toast.success("Pre-list downloaded")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Pre-list
                    (CSV)
                  </Button>
                  <Button
                    size="lg"
                    disabled={sendingToIcu}
                    onClick={() => {
                      if (!selectedBonusOffer) return;
                      setSendingToIcu(true);
                      setTimeout(() => {
                        setMockDeclarations((prev) => [
                          ...prev,
                          {
                            id: `decl-new-${Date.now()}`,
                            ref: `BNS/2024/${String(prev.length + 1).padStart(3, "0")}`,
                            registerId: "reg-zenith",
                            registerName: selectedBonusOffer.register,
                            bonusName: selectedBonusOffer.name,
                            ratio: "1:5",
                            roundingRule: selectedBonusOffer.roundingRule,
                            qualificationDate:
                              selectedBonusOffer.qualificationDate
                                .toISOString()
                                .split("T")[0],
                            closureDate: selectedBonusOffer.closureDate
                              .toISOString()
                              .split("T")[0],
                            allotmentDate: selectedBonusOffer.allotmentDate
                              .toISOString()
                              .split("T")[0],
                            narrative: selectedBonusOffer.narrative,
                            status: "PENDING_ICU",
                            totalShareholders: 12847,
                            totalBonusShares: 4500000,
                            totalFractionalRemainder: 733.4,
                            icuApprovedBy: "",
                            icuApprovedAt: "",
                            authorizedBy: "user-001",
                            authorizedAt: new Date().toISOString(),
                            authorizedReason:
                              "Computed and submitted for ICU approval.",
                            submittedByName: "System",
                            submittedAt: new Date().toISOString(),
                            totalCertificatedHolders: 4230,
                            totalCscsHolders: 8617,
                          },
                        ]);
                        toast.success("Declaration sent to ICU for approval.");
                        setComputed(false);
                        setSendingToIcu(false);
                        setActiveTab("icu");
                      }, 1200);
                    }}
                  >
                    {sendingToIcu ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Sending…
                      </>
                    ) : (
                      "Send to ICU for Approval"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Approval ── */}
          <TabsContent value="auth" className="space-y-4">
            {authReviewing === null ? (
              <>
                <Card className="mrpsl-card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-3">DECLARATION REF</th>
                        <th className="px-4 py-3">REGISTER</th>
                        <th className="px-4 py-3">BONUS NAME</th>
                        <th className="px-4 py-3 text-center">RATIO</th>
                        <th className="px-4 py-3">QUAL DATE</th>
                        <th className="px-4 py-3">ALLOTMENT DATE</th>
                        <th className="px-4 py-3 text-right">ELIGIBLE SHs</th>
                        <th className="px-4 py-3 text-right">NEW SHARES</th>
                        <th className="px-4 py-3">SUBMITTED BY</th>
                        <th className="px-4 py-3">STATUS</th>
                        <th className="px-4 py-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {isAuthDeclarationsLoading ? (
                        Array.from({ length: PAGE_SIZE }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 11 }).map((__, j) => (
                              <td key={j} className="px-4 py-3">
                                <Skeleton className="h-4 w-24" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : !authDeclarationList ||
                        authDeclarationList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={11}
                            className="px-4 py-16 text-center text-sm text-muted-foreground font-medium"
                          >
                            No declarations found
                          </td>
                        </tr>
                      ) : (
                        authDeclarationList.map(
                          (declaration: BonusDeclaration) => (
                            <tr
                              key={declaration?.id}
                              className="mrpsl-table-row"
                            >
                              <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                                {declaration?.ref}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                {declaration?.registerName}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {declaration?.bonusName}
                              </td>
                              <td className="px-4 py-3 text-center font-mono">
                                {declaration?.ratio}
                              </td>
                              <td className="px-4 py-3 text-[13px] text-muted-foreground">
                                {formatDateOnly(declaration?.qualificationDate)}
                              </td>
                              <td className="px-4 py-3 text-[13px] text-muted-foreground">
                                {formatDateOnly(declaration?.allotmentDate)}
                              </td>
                              <td className="px-4 py-3 font-mono text-right">
                                {declaration?.totalShareholders?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 font-mono text-right text-green-700 font-semibold">
                                {declaration?.totalBonusShares?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-[13px] font-medium">
                                  {declaration?.submittedByName}
                                </div>
                                <div className="text-[13px] text-muted-foreground">
                                  {formatCustomDate(declaration?.submittedAt)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                                  {declaration?.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAuthPage(1);
                                    setAuthReviewing(declaration?.id);
                                    setIcuReviewing(null);
                                  }}
                                >
                                  Review
                                </Button>
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                  <PaginationBar
                    page={authListPage}
                    total={authDeclarationTotal}
                    onPageChange={setAuthListPage}
                    pageSize={authListPageSize}
                    onPageSizeChange={setAuthListPageSize}
                  />
                </Card>
              </>
            ) : isActiveReviewLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mx-auto" />
                <p className="text-base text-muted-foreground animate-pulse">
                  Loading declaration details...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 -ml-2"
                    onClick={() => {
                      setAuthReviewing(null);
                      setAuthComment("");
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Approval Queue
                  </Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <span className="font-mono text-sm font-semibold">
                    {activeReview?.ref}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    · {activeReview?.registerName} · {activeReview?.bonusName}
                  </span>
                  <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                    {activeReview?.status}
                  </Badge>
                  <div className="flex-1" />
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Downloading declaration...")}
                  >
                    <Download className="mr-1.5 h-4 w-4" /> Download
                  </Button> */}
                  <ExportToExcel
                    data={[activeReview]}
                    name="bonus-declaration"
                  />
                </div>

                {/* Declaration details */}
                <DeclDetailCard decl={activeReview} />

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: "Eligible Shareholders",
                      value: activeReview?.totalShareholders?.toLocaleString(),
                      color: "text-foreground",
                    },
                    {
                      label: "Total New Shares",
                      value: activeReview?.totalBonusShares?.toLocaleString(),
                      color: "text-green-700",
                    },
                    {
                      label: "Fractional Shares",
                      value:
                        activeReview?.totalFractionalRemainder?.toLocaleString(),
                      color: "text-amber-600",
                    },
                    {
                      label: "Total Shares After Issue",
                      // value: "18,000,301",
                      value:
                        MOCK_ALLOTMENT_SUMMARY.newStockInIssue.toLocaleString(),
                      color: "text-foreground",
                    },
                  ].map((s) => (
                    <Card key={s.label} className="mrpsl-card p-3">
                      <div className="mrpsl-section-title">{s.label}</div>
                      <div
                        className={cn(
                          "text-xl font-mono font-bold mt-1",
                          s.color,
                        )}
                      >
                        {s.value}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Shareholder table */}
                <Card className="mrpsl-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <BonusTableHead />
                      <tbody className="divide-y">
                        {isEntitlementLoading ? (
                          Array.from({ length: PAGE_SIZE }).map((_, i) => (
                            <tr key={i}>
                              {Array.from({ length: 6 }).map((__, j) => (
                                <td key={j} className="px-4 py-2.5">
                                  <Skeleton className="h-4 w-20" />
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <EntitlementTableRows
                            rows={entitlementList}
                            startIdx={(authPage - 1) * 10}
                          />
                        )}
                      </tbody>
                      <EntitlementTfoot
                        rows={entitlementList}
                        total={entitlementTotal}
                      />
                    </table>
                  </div>
                  <PaginationBar
                    page={authPage}
                    total={entitlementTotal}
                    onPageChange={setAuthPage}
                  />
                </Card>

                {/* Approve / Reject */}
                {activeReview?.status === "DRAFT" ? (
                  <Button
                    size="lg"
                    className="h-12 text-base font-semibold w-full"
                    onClick={() => handleApproveAndCompute(activeReview?.id)}
                    disabled={false}
                  >
                    Submit for Approval
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="destructive"
                      size="lg"
                      className="h-12 text-base font-semibold"
                      onClick={() =>
                        setApprovalModal({ action: "reject", section: "ops" })
                      }
                    >
                      Reject Declaration
                    </Button>
                    <Button
                      size="lg"
                      className="h-12 text-base font-semibold"
                      onClick={() =>
                        setApprovalModal({ action: "approve", section: "ops" })
                      }
                    >
                      Approve &amp; Forward to ICU
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu" className="space-y-4">
            {icuReviewing === null ? (
              <>
                {icuRejectedCount > 0 && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-sm font-medium text-amber-800">
                      {icuRejectedCount} declaration
                      {icuRejectedCount !== 1 ? "s" : ""} were rejected and
                      returned to Offer Setup for editing.
                    </p>
                  </div>
                )}
                <Card className="mrpsl-card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-3">DECLARATION REF</th>
                        <th className="px-4 py-3">REGISTER</th>
                        <th className="px-4 py-3">BONUS NAME</th>
                        <th className="px-4 py-3 text-center">RATIO</th>
                        <th className="px-4 py-3">QUAL DATE</th>
                        <th className="px-4 py-3">ALLOTMENT DATE</th>
                        <th className="px-4 py-3 text-right">ELIGIBLE SHs</th>
                        <th className="px-4 py-3 text-right">NEW SHARES</th>
                        <th className="px-4 py-3">OPS APPROVAL</th>
                        <th className="px-4 py-3">STATUS</th>
                        <th className="px-4 py-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {isIcuDeclarationsLoading ? (
                        Array.from({ length: PAGE_SIZE }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 11 }).map((__, j) => (
                              <td key={j} className="px-4 py-3">
                                <Skeleton className="h-4 w-24" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : !icuDeclarationList ||
                        icuDeclarationList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={11}
                            className="px-4 py-16 text-center text-sm text-muted-foreground font-medium"
                          >
                            No declarations found
                          </td>
                        </tr>
                      ) : (
                        icuDeclarationList.map(
                          (declaration: BonusDeclaration) => (
                            <tr
                              key={declaration?.id}
                              className="mrpsl-table-row"
                            >
                              <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                                {declaration?.ref}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                {declaration?.registerName}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {declaration?.bonusName}
                              </td>
                              <td className="px-4 py-3 text-center font-mono">
                                {declaration?.ratio}
                              </td>
                              <td className="px-4 py-3 text-[13px] text-muted-foreground">
                                {formatDateOnly(declaration?.qualificationDate)}
                              </td>
                              <td className="px-4 py-3 text-[13px] text-muted-foreground">
                                {formatDateOnly(declaration?.allotmentDate)}
                              </td>
                              <td className="px-4 py-3 font-mono text-right">
                                {declaration?.totalShareholders?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 font-mono text-right text-green-700 font-semibold">
                                {declaration?.totalBonusShares?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-[13px] font-medium">
                                  {declaration?.submittedByName}
                                </div>
                                <div className="text-[13px] text-muted-foreground">
                                  {formatCustomDate(declaration?.submittedAt)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                                  {declaration?.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setIcuPage(1);
                                    setIcuReviewing(declaration?.id);
                                    setAuthReviewing(null);
                                  }}
                                >
                                  ICU Review
                                </Button>
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                  <PaginationBar
                    page={icuListPage}
                    total={icuDeclarationTotal}
                    onPageChange={setIcuListPage}
                    pageSize={icuListPageSize}
                    onPageSizeChange={setIcuListPageSize}
                  />
                </Card>
              </>
            ) : isActiveReviewLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mx-auto" />
                <p className="text-base text-muted-foreground animate-pulse">
                  Loading declaration details...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 -ml-2"
                    onClick={() => {
                      setIcuReviewing(null);
                      setIcuComment("");
                      setIcuJustApproved(false);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to ICU Queue
                  </Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <span className="font-mono text-sm font-semibold">
                    {activeReview?.ref}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    · {activeReview?.registerName} · {activeReview?.bonusName}
                  </span>
                  <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                    {activeReview?.status}
                  </Badge>
                  <div className="flex-1" />
                  <ExportToExcel
                    data={[activeReview]}
                    name="bonus-declaration"
                  />
                </div>

                {/* Ops approval audit trail */}
                <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
                  <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Operations Approval Record
                  </p>
                  <div className="flex items-center gap-8 text-sm flex-wrap">
                    <div>
                      <div className="mrpsl-section-title">Approved By</div>
                      <div className="font-semibold mt-0.5">
                        {!isUserDetailsLoading ? userName : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">Role</div>
                      <div className="mt-0.5">
                        {!isUserDetailsLoading ? userRole : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">
                        Approval Date &amp; Time
                      </div>
                      <div className="font-mono mt-0.5">
                        {formatCustomDate(activeReview?.authorizedAt)}
                      </div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">Comment</div>
                      <div className="text-muted-foreground mt-0.5 italic">
                        {activeReview?.authorizedReason || "_"}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Declaration details */}
                <DeclDetailCard decl={activeReview} />

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: "Eligible Shareholders",
                      value: activeReview?.totalShareholders?.toLocaleString(),
                      color: "text-foreground",
                    },
                    {
                      label: "Total New Shares",
                      value: activeReview?.totalBonusShares?.toLocaleString(),
                      color: "text-green-700",
                    },
                    {
                      label: "Fractional Shares",
                      value:
                        activeReview?.totalFractionalRemainder?.toLocaleString(),
                      color: "text-amber-600",
                    },
                    {
                      label: "Total Shares After Issue",
                      // value: "18,000,301",
                      value:
                        MOCK_ALLOTMENT_SUMMARY.newStockInIssue.toLocaleString(),
                      color: "text-foreground",
                    },
                  ].map((s) => (
                    <Card key={s.label} className="mrpsl-card p-3">
                      <div className="mrpsl-section-title">{s.label}</div>
                      <div
                        className={cn(
                          "text-xl font-mono font-bold mt-1",
                          s.color,
                        )}
                      >
                        {s.value}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Shareholder table */}
                <Card className="mrpsl-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <BonusTableHead />
                      <tbody className="divide-y">
                        {isEntitlementLoading ? (
                          Array.from({ length: PAGE_SIZE }).map((_, i) => (
                            <tr key={i}>
                              {Array.from({ length: 6 }).map((__, j) => (
                                <td key={j} className="px-4 py-2.5">
                                  <Skeleton className="h-4 w-20" />
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <EntitlementTableRows
                            rows={entitlementList}
                            startIdx={(icuPage - 1) * 10}
                          />
                        )}
                      </tbody>
                      <EntitlementTfoot
                        rows={entitlementList}
                        total={entitlementTotal}
                      />
                    </table>
                  </div>
                  <PaginationBar
                    page={icuPage}
                    total={entitlementTotal}
                    onPageChange={setIcuPage}
                  />
                </Card>

                {/* Approve / Reject — or success banner if just approved */}
                {icuJustApproved ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">
                        Declaration approved and cleared for allotment.
                      </p>
                      <p className="text-xs text-green-700 mt-0.5">
                        A circular email can now be sent to shareholders.
                      </p>
                    </div>
                    <Button onClick={() => setEmailPreviewOpen(true)}>
                      <Mail className="mr-2 h-4 w-4" /> Send Circular Email
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="destructive"
                      size="lg"
                      className="h-12 text-base font-semibold"
                      onClick={() =>
                        setApprovalModal({ action: "reject", section: "icu" })
                      }
                    >
                      Reject Declaration
                    </Button>
                    <Button
                      size="lg"
                      className="h-12 text-base font-semibold"
                      onClick={() =>
                        setApprovalModal({ action: "approve", section: "icu" })
                      }
                    >
                      ICU Approve &amp; Clear for Allotment
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── CSCS Lodgement ── */}
          <TabsContent value="lodgement" className="space-y-4">
            {lodgementReviewing === null ? (
              <Card className="mrpsl-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">DECLARATION REF</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">BONUS NAME</th>
                      <th className="px-4 py-3 text-center">RATIO</th>
                      <th className="px-4 py-3 text-right">ELIGIBLE SHs</th>
                      <th className="px-4 py-3 text-right">NEW SHARES</th>
                      <th className="px-4 py-3">ICU APPROVER</th>
                      <th className="px-4 py-3">ICU DATE</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lodgementDeclarationList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-16 text-center text-sm text-muted-foreground font-medium"
                        >
                          No declarations pending CSCS lodgement
                        </td>
                      </tr>
                    ) : (
                      lodgementDeclarationList.map((declaration) => (
                        <tr key={declaration.id} className="mrpsl-table-row">
                          <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                            {declaration.ref}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {declaration.registerName}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {declaration.bonusName}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {declaration.ratio}
                          </td>
                          <td className="px-4 py-3 font-mono text-right">
                            {declaration.totalShareholders?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono text-right text-green-700 font-semibold">
                            {declaration.totalBonusShares?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-[13px]">
                            {getUserByIdFn(declaration.icuApprovedBy)?.name}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-muted-foreground">
                            {formatDateOnly(
                              declaration.icuApprovedAt?.split("T")[0],
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                              ICU Approved
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLodgementReviewing(declaration.id);
                                setLodgementPage(1);
                              }}
                            >
                              View Allotment
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <PaginationBar
                  page={1}
                  total={lodgementDeclarationList.length}
                  onPageChange={() => {}}
                />
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Back button */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 -ml-2"
                    onClick={() => setLodgementReviewing(null)}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Lodgement Queue
                  </Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <span className="font-mono text-sm font-semibold">
                    {lodgementReviewingRow?.ref}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    · {lodgementReviewingRow?.registerName} ·{" "}
                    {lodgementReviewingRow?.bonusName}
                  </span>
                  <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                    ICU Approved
                  </Badge>
                </div>

                {/* Declaration detail card */}
                <DeclDetailCard decl={lodgementReviewingRow} />

                {/* 4 stat cards */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: "Eligible Shareholders",
                      value:
                        lodgementReviewingRow?.totalShareholders?.toLocaleString(),
                      color: "text-foreground",
                    },
                    {
                      label: "Total New Shares",
                      value:
                        lodgementReviewingRow?.totalBonusShares?.toLocaleString(),
                      color: "text-green-700",
                    },
                    {
                      label: "Fractional Shares",
                      value:
                        lodgementReviewingRow?.totalFractionalRemainder?.toLocaleString(),
                      color: "text-amber-600",
                    },
                    {
                      label: "Total Shares After Issue",
                      value:
                        MOCK_ALLOTMENT_SUMMARY.newStockInIssue.toLocaleString(),
                      color: "text-foreground",
                    },
                  ].map((s) => (
                    <Card key={s.label} className="mrpsl-card p-3">
                      <div className="mrpsl-section-title">{s.label}</div>
                      <div
                        className={cn(
                          "text-xl font-mono font-bold mt-1",
                          s.color,
                        )}
                      >
                        {s.value}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Entitlement table (read-only) */}
                <Card className="mrpsl-card overflow-hidden">
                  <div className="px-4 py-3 border-b bg-muted/10">
                    <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                      Entitlement Schedule
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <BonusTableHead />
                      <tbody className="divide-y">
                        <EntitlementTableRows
                          rows={lodgementEntitlementList}
                          startIdx={(lodgementPage - 1) * PAGE_ENTS}
                        />
                      </tbody>
                      <EntitlementTfoot
                        rows={lodgementEntitlementList}
                        total={MOCK_ENTITLEMENTS.length}
                      />
                    </table>
                  </div>
                  <PaginationBar
                    page={lodgementPage}
                    total={MOCK_ENTITLEMENTS.length}
                    onPageChange={setLodgementPage}
                    pageSize={PAGE_ENTS}
                  />
                </Card>

                {/* Action buttons */}
                <div className="flex items-center gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      toast.success("CSCS lodgement file downloaded")
                    }
                  >
                    <Download className="mr-2 h-4 w-4" /> Download CSCS
                    Lodgement File
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      if (!lodgementReviewing) return;
                      setMockDeclarations((prev) =>
                        prev.map((d) =>
                          d.id === lodgementReviewing
                            ? { ...d, status: "CSCS_LODGED" }
                            : d,
                        ),
                      );
                      toast.success("Marked as lodged successfully");
                      setLodgementReviewing(null);
                    }}
                  >
                    Mark as Lodged
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── CSCS Reversals & Error Resolution ── */}
          <TabsContent value="reversals" className="space-y-4">
            {!cscsFileUploaded ? (
              <Card className="mrpsl-card p-8">
                <div className="text-center space-y-4">
                  <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                    Upload CSCS Response File
                  </p>
                  <div
                    className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer hover:border-primary transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) setCscsFile(file);
                    }}
                    onClick={() =>
                      document.getElementById("cscs-file-input")?.click()
                    }
                  >
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">
                      {cscsFile
                        ? cscsFile.name
                        : "Drag & drop CSCS response file here"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse — accepts .csv, .xlsx
                    </p>
                    <input
                      id="cscs-file-input"
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCscsFile(file);
                      }}
                    />
                  </div>
                  <Button
                    size="lg"
                    disabled={!cscsFile}
                    onClick={() => {
                      if (!cscsFile) return;
                      const loadingToast = toast.loading(
                        "Processing CSCS response file…",
                      );
                      setTimeout(() => {
                        toast.dismiss(loadingToast);
                        setCscsFileUploaded(true);
                        toast.success("CSCS response file processed.");
                      }, 1200);
                    }}
                  >
                    Process File
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Summary counts bar */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-green-700">
                    {MOCK_CSCS_CREDITED.length} holders credited
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm font-semibold text-red-700">
                    {MOCK_CSCS_ERRORS.length} holders with errors
                  </span>
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCscsFileUploaded(false);
                      setCscsFile(null);
                      setCscsReviewingId(null);
                    }}
                  >
                    Upload New File
                  </Button>
                </div>

                {/* Two-panel result view */}
                <div className="grid grid-cols-2 gap-4">
                  {/* LEFT: Successfully Lodged */}
                  <Card className="mrpsl-card overflow-hidden border-green-200">
                    <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                      <p className="text-[13px] font-bold text-green-800 uppercase tracking-widest">
                        Successfully Lodged ({MOCK_CSCS_CREDITED.length})
                      </p>
                    </div>
                    <div className="divide-y max-h-120 overflow-y-auto">
                      {MOCK_CSCS_CREDITED.map((e) => (
                        <div
                          key={e.id}
                          className="px-4 py-2.5 flex items-center gap-3 text-[13px]"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{e.name}</div>
                            <div className="text-muted-foreground">
                              {e.accountNumber}
                            </div>
                          </div>
                          <div className="text-green-700 font-mono font-semibold shrink-0">
                            +{e.bonusDue.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* RIGHT: Lodgement Errors */}
                  <Card className="mrpsl-card overflow-hidden border-red-200">
                    <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center gap-3">
                      <p className="text-[13px] font-bold text-red-800 uppercase tracking-widest flex-1">
                        Lodgement Errors ({MOCK_CSCS_ERRORS.length})
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[12px] h-7 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() =>
                          toast.success(
                            "Error list downloaded. Send to Verification Team for processing.",
                          )
                        }
                      >
                        <Download className="mr-1.5 h-3 w-3" />
                        Download Error List
                      </Button>
                      <Button
                        size="sm"
                        className="text-[12px] h-7 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() =>
                          toast.success(
                            `Reversal initiated for ${MOCK_CSCS_ERRORS.length} accounts. Forwarded to Verification Team.`,
                          )
                        }
                      >
                        Initiate All Reversals
                      </Button>
                    </div>
                    <div className="divide-y">
                      {MOCK_CSCS_ERRORS.map((e) => (
                        <div
                          key={e.accountNumber}
                          className="px-4 py-3 space-y-2"
                        >
                          <div className="flex items-start gap-3 text-[13px]">
                            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{e.name}</div>
                              <div className="text-muted-foreground">
                                {e.accountNumber} · {e.chn}
                              </div>
                              <div className="text-red-600 text-[12px] mt-0.5">
                                {e.reason}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-mono text-[13px]">
                                {e.bonusDue.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[12px] h-7 border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() =>
                              toast.success(
                                `Reversal initiated for ${e.name}. Forwarded to Verification Team.`,
                              )
                            }
                          >
                            Initiate Reversal
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Notification & Prelist Dispatch ── */}
          <TabsContent value="allotment" className="space-y-4">
            {allotReviewing === null ? (
              <>
                {/* Queue table */}
                <Card className="mrpsl-card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-3">DECLARATION REF</th>
                        <th className="px-4 py-3">REGISTER</th>
                        <th className="px-4 py-3">BONUS NAME</th>
                        <th className="px-4 py-3 text-center">RATIO</th>
                        <th className="px-4 py-3 text-right">ELIGIBLE SHs</th>
                        <th className="px-4 py-3 text-right">NEW SHARES</th>
                        <th className="px-4 py-3">ICU APPROVER</th>
                        <th className="px-4 py-3">ICU DATE</th>
                        <th className="px-4 py-3">STATUS</th>
                        <th className="px-4 py-3 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {isAllotDeclarationsLoading ? (
                        Array.from({ length: PAGE_SIZE }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 10 }).map((__, j) => (
                              <td key={j} className="px-4 py-3">
                                <Skeleton className="h-4 w-24" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : !allotDeclarationList ||
                        allotDeclarationList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={10}
                            className="px-4 py-16 text-center text-sm text-muted-foreground font-medium"
                          >
                            No declarations found
                          </td>
                        </tr>
                      ) : (
                        allotDeclarationList.map(
                          (declaration: BonusDeclaration) => (
                            <tr
                              key={declaration?.id}
                              className="mrpsl-table-row hover:bg-muted/40 transition-colors"
                            >
                              <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                                {declaration?.ref}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                {declaration?.registerName}
                              </td>
                              <td className="px-4 py-3 text-[13px]">
                                {declaration?.bonusName}
                              </td>
                              <td className="px-4 py-3 font-mono text-center">
                                {declaration?.ratio}
                              </td>
                              <td className="px-4 py-3 text-right font-mono">
                                {declaration?.totalShareholders?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-green-700">
                                {declaration?.totalBonusShares?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-[13px]">
                                {
                                  getUserByIdFn(declaration?.icuApprovedBy)
                                    ?.name
                                }
                              </td>
                              <td className="px-4 py-3 text-[13px] text-muted-foreground">
                                {formatDateOnly(
                                  declaration?.icuApprovedAt?.split("T")[0],
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {declaration?.status === "ICU_APPROVED" ? (
                                  <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px] uppercase">
                                    Pending Allotment
                                  </Badge>
                                ) : declaration?.status === "CSCS_LODGED" ? (
                                  <Badge className="bg-purple-100 text-purple-800 border-0 text-[13px] uppercase">
                                    CSCS Lodged
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800 border-0 text-[13px] uppercase">
                                    Allotted
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-semibold cursor-pointer"
                                  onClick={() => {
                                    setAllotReviewing(declaration?.id);
                                    setAllotReviewingRow(declaration);
                                  }}
                                >
                                  View Allotment
                                </Button>
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                  <PaginationBar
                    page={allotListPage}
                    total={allotDeclarationTotal}
                    onPageChange={setAllotListPage}
                    pageSize={allotListPageSize}
                    onPageSizeChange={setAllotListPageSize}
                  />
                </Card>
              </>
            ) : (
              (() => {
                const row = allotReviewingRow;
                const isDone = row
                  ? row.status !== "ICU_APPROVED" ||
                    (allotmentProcessedMap[row.id] ?? false)
                  : false;
                return (
                  <div className="space-y-4">
                    {/* Back + breadcrumb */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 -ml-2"
                        onClick={() => setAllotReviewing(null)}
                      >
                        <ArrowLeft className="h-4 w-4" /> Back to Allotment
                        Queue
                      </Button>
                      <div className="h-5 w-px bg-border mx-1" />
                      <span className="font-mono text-sm font-semibold">
                        {row?.ref}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        · {row?.registerName} · {row?.bonusName}
                      </span>
                      {row?.status === "ICU_APPROVED" ? (
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                          Pending Allotment
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                          Allotted
                        </Badge>
                      )}
                    </div>

                    {/* ICU approval record */}
                    <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
                      <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        ICU Approval Record
                      </p>
                      <div className="flex items-center gap-8 text-sm flex-wrap">
                        <div>
                          <div className="mrpsl-section-title">Register</div>
                          <div className="font-semibold mt-0.5">
                            {row?.registerName}
                          </div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">Bonus Name</div>
                          <div className="mt-0.5">{row?.bonusName}</div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">Ratio</div>
                          <div className="font-mono mt-0.5">{row?.ratio}</div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">
                            ICU Approver
                          </div>
                          <div className="font-semibold mt-0.5">
                            {getUserByIdFn(row?.icuApprovedBy)?.name}
                          </div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">ICU Date</div>
                          <div className="font-mono mt-0.5">
                            {formatDateOnly(row?.icuApprovedAt?.split("T")[0])}
                          </div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">
                            Eligible SHs
                          </div>
                          <div className="font-mono font-semibold mt-0.5">
                            {row?.totalShareholders?.toLocaleString() || "0"}
                          </div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">New Shares</div>
                          <div className="font-mono font-semibold mt-0.5 text-green-700">
                            {row?.totalBonusShares?.toLocaleString() || "0"}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {!isDone ? (
                      <>
                        <div className="grid grid-cols-4 gap-4">
                          <Card className="mrpsl-card p-4">
                            <div className="mrpsl-section-title">
                              Eligible Shareholders
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1">
                              {row?.totalShareholders?.toLocaleString() || "0"}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4">
                            <div className="mrpsl-section-title">
                              Total New Shares
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-green-600">
                              {row?.totalBonusShares?.toLocaleString() || "0"}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4">
                            <div className="mrpsl-section-title">
                              Certificated Holders
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-blue-600">
                              {row?.totalCertificatedHolders?.toLocaleString() ||
                                "0"}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4">
                            <div className="mrpsl-section-title">
                              Electronic (CSCS)
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-purple-600">
                              {row?.totalCscsHolders?.toLocaleString() || "0"}
                            </div>
                          </Card>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() =>
                              toast.info("Downloading pre-allotment report…")
                            }
                          >
                            <Download className="mr-2 h-4 w-4" /> Preview Report
                          </Button>
                          <Button
                            size="lg"
                            disabled={isAllotmentProcessing}
                            onClick={() => row && handleProcessAllotment(row)}
                          >
                            {isAllotmentProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Process Allotment"
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-4 gap-4">
                          <Card className="mrpsl-card p-4 border-t-4 border-t-green-500">
                            <div className="mrpsl-section-title">
                              Shareholders Allotted
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-green-600">
                              {MOCK_ALLOTMENT_SUMMARY.totalShareholders.toLocaleString()}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4 border-t-4 border-t-blue-500">
                            <div className="mrpsl-section-title">
                              New Shares Issued
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-blue-600">
                              {MOCK_ALLOTMENT_SUMMARY.totalBonusShares.toLocaleString()}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4 border-t-4 border-t-purple-500">
                            <div className="mrpsl-section-title">
                              Previous Stock in Issue
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-purple-600">
                              {MOCK_ALLOTMENT_SUMMARY.previousStockInIssue.toLocaleString()}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4 border-t-4 border-t-amber-500">
                            <div className="mrpsl-section-title">
                              New Stock in Issue
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
                              {MOCK_ALLOTMENT_SUMMARY.newStockInIssue.toLocaleString()}
                            </div>
                          </Card>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <Card className="mrpsl-card p-4">
                            <div className="mrpsl-section-title">
                              Paper Certificates Created
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1">
                              {MOCK_ALLOTMENT_SUMMARY.totalPaperSharesCreated.toLocaleString()}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4">
                            <div className="mrpsl-section-title">
                              CSCS Entries Updated
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1">
                              {MOCK_ALLOTMENT_SUMMARY.totalCscShares.toLocaleString()}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4">
                            <div className="mrpsl-section-title">
                              Fractional Shares Rounded
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
                              {MOCK_ALLOTMENT_SUMMARY.totalFractionalSharesRounded.toLocaleString()}
                            </div>
                          </Card>
                        </div>
                        <Card className="mrpsl-card overflow-hidden">
                          <div className="px-4 py-3 border-b bg-muted/10 flex items-center gap-3">
                            <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground flex-1">
                              Allotment List
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isExportingAllotments}
                              onClick={() => handleExportAllotments(row?.id)}
                            >
                              {isExportingAllotments ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  Exporting...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-1.5 h-3.5 w-3.5" />{" "}
                                  Excel
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.info("Printing…")}
                            >
                              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
                            </Button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px]">
                              <BonusTableHead />
                              <tbody className="divide-y">
                                {isAllotmentsLoading ? (
                                  Array.from({ length: PAGE_SIZE }).map(
                                    (_, i) => (
                                      <tr key={i}>
                                        {Array.from({ length: 6 }).map(
                                          (__, j) => (
                                            <td key={j} className="px-4 py-2.5">
                                              <Skeleton className="h-4 w-20" />
                                            </td>
                                          ),
                                        )}
                                      </tr>
                                    ),
                                  )
                                ) : (
                                  <EntitlementTableRows
                                    rows={allotmentsList}
                                    startIdx={(allotPage - 1) * 10}
                                  />
                                )}
                              </tbody>
                              <EntitlementTfoot
                                rows={allotmentsList}
                                total={allotmentsTotal}
                              />
                            </table>
                          </div>
                          <PaginationBar
                            page={allotPage}
                            total={allotmentsTotal}
                            onPageChange={setAllotPage}
                          />
                        </Card>
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setEmailPreviewOpen(true)}
                          >
                            <Mail className="mr-2 h-4 w-4" /> Email Shareholders
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()
            )}
          </TabsContent>

          {/* ── Reports ── */}
          <TabsContent value="reports" className="space-y-6">
            {/* Report type pills */}
            <Card className="mrpsl-card">
              <div className="p-4 border-b bg-muted/20">
                <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  Report Type
                </p>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {BONUS_REPORT_TYPES.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedReport(r);
                      setReportGenerated(false);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors",
                      selectedReport === r
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Card>

            <Button
              size="xl"
              className="px-6 font-semibold shrink-0"
              onClick={handleRunReport}
            >
              Generate Report
            </Button>

            {isReportLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-background border rounded-2xl border-dashed">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm font-semibold text-muted-foreground mt-3">
                  Retrieving {selectedReport} data...
                </span>
              </div>
            ) : (
              <>
                {!reportGenerated && (
                  <div className="flex flex-col items-center justify-center py-20 bg-background border rounded-2xl border-dashed text-muted-foreground text-center animate-in fade-in">
                    <CalendarRange className="h-10 w-10 text-muted-foreground/35 mb-3" />
                    <h3 className="font-semibold text-sm text-foreground">
                      Ready to generate
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-70">
                      Configure your parameters above and click &quot;Generate
                      Report&quot; to view results.
                    </p>
                  </div>
                )}
                {reportGenerated && (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Export bar */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-medium">
                        {selectedReport} — {fetchedReportList?.length} records
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportExcel}
                          disabled={isExportingExcel}
                        >
                          {isExportingExcel ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                          )}
                          Excel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrintTrigger}
                        >
                          <Download className="mr-1.5 h-4 w-4" /> PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrintTrigger}
                        >
                          <Printer className="mr-1.5 h-4 w-4" /> Print
                        </Button>
                      </div>
                    </div>

                    <div ref={printAreaRef} className="space-y-4">
                      {/* Print header (visible only in print preview / save as PDF) */}
                      <div className="hidden print:block mb-6 border-b pb-4">
                        <h2 className="text-xl font-bold uppercase">
                          {selectedReport}
                        </h2>
                        <div className="text-sm text-muted-foreground mt-1 flex justify-between">
                          <span>Register: {"All Registers"}</span>
                          <span>
                            Generated:{" "}
                            {format(new Date(), "dd MMM yyyy, HH:mm")}
                          </span>
                        </div>
                      </div>

                      {selectedReport === "Summary of Bonus Shares Issued" ? (
                        /* Summary table — grouped by broker/category */
                        <Card className="mrpsl-card overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead className="mrpsl-table-header">
                                <tr>
                                  <th className="px-4 py-3">STOCKBROKER</th>
                                  <th className="px-4 py-3 text-right">
                                    ELIGIBLE SHs
                                  </th>
                                  <th className="px-4 py-3 text-right">
                                    UNITS AT QUAL DATE
                                  </th>
                                  <th className="px-4 py-3 text-right">
                                    BONUS SHARES ISSUED
                                  </th>
                                  <th className="px-4 py-3 text-right">
                                    FRACTIONAL UNITS
                                  </th>
                                  <th className="px-4 py-3 text-right">
                                    % OF TOTAL NEW SHARES
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y text-[13px] font-mono">
                                {fetchedReportList?.map(
                                  (
                                    list: {
                                      stockbroker: string;
                                      eligibleShareholders: number;
                                      unitsAtQualDate: number;
                                      bonusSharesIssued: number;
                                      fractionalUnits: number;
                                      percentageOfTotalNewShares: number;
                                    },
                                    i: number,
                                  ) => (
                                    <tr key={i} className="mrpsl-table-row">
                                      <td className="px-4 py-2.5 font-sans font-medium">
                                        {list.stockbroker}
                                      </td>
                                      <td className="px-4 py-2.5 text-right">
                                        {list.eligibleShareholders.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2.5 text-right">
                                        {list.unitsAtQualDate.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2.5 text-right text-green-700 font-bold">
                                        {list.bonusSharesIssued.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2.5 text-right text-amber-600">
                                        {list.fractionalUnits}
                                      </td>
                                      <td className="px-4 py-2.5 text-right">
                                        {list.percentageOfTotalNewShares}%
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                              <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                                <tr>
                                  <td className="px-4 py-2.5 text-muted-foreground">
                                    TOTALS
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {fetchedReportData?.totalShareholders?.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {fetchedReportData?.totalUnitsAtQualDate?.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-green-700">
                                    {fetchedReportData?.totalBonusSharesIssued?.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-amber-600">
                                    {fetchedReportData?.totalFractionalUnits}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {fetchedReportData?.percentageOfTotalNewShares ||
                                      100.0}{" "}
                                    %
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </Card>
                      ) : selectedReport === "Exception and Rounding Report" ? (
                        /* Exception report — only shareholders with fractions */
                        <Card className="mrpsl-card overflow-hidden">
                          <div className="p-3 border-b bg-amber-50 text-[13px] font-semibold text-amber-800">
                            Showing {fetchedReportList?.length} shareholders
                            with fractional entitlements — fractions pooled to
                            fractional account.
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px]">
                              <thead className="mrpsl-table-header">
                                <tr>
                                  <th className="px-4 py-2.5">#</th>
                                  <th className="px-4 py-2.5">ACCOUNT NO</th>
                                  <th className="px-4 py-2.5">HOLDER NAME</th>
                                  <th className="px-4 py-2.5 text-right">
                                    UNITS AT QUAL DATE
                                  </th>
                                  <th className="px-4 py-2.5 text-right">
                                    EXACT ENTITLEMENT
                                  </th>
                                  <th className="px-4 py-2.5 text-right">
                                    BONUS ISSUED (ROUNDED)
                                  </th>
                                  <th className="px-4 py-2.5 text-right">
                                    FRACTION POOLED
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y font-mono">
                                {fetchedReportList?.length > 0 ? (
                                  reportRows.map(
                                    (
                                      s: {
                                        unitsAtQualDate: number;
                                        accountNumber: string;
                                        accountHolderName: string;
                                        bonusDue: number;
                                        fractionalRemainder: number;
                                        name: string;
                                      },
                                      i: number,
                                    ) => {
                                      const exact = s.unitsAtQualDate / 4;
                                      return (
                                        <tr key={i} className="mrpsl-table-row">
                                          <td className="px-4 py-2.5 text-muted-foreground">
                                            {reportStart + i + 1}
                                          </td>
                                          <td className="px-4 py-2.5">
                                            {s.accountNumber}
                                          </td>
                                          <td className="px-4 py-2.5 font-sans font-medium">
                                            {s.name}
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            {s.unitsAtQualDate?.toLocaleString()}
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            {exact.toFixed(4)}
                                          </td>
                                          <td className="px-4 py-2.5 text-right text-green-600 font-bold">
                                            {s.bonusDue?.toLocaleString()}
                                          </td>
                                          <td className="px-4 py-2.5 text-right text-amber-600">
                                            {s.fractionalRemainder?.toFixed(4)}
                                          </td>
                                        </tr>
                                      );
                                    },
                                  )
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                      No exception shareholders found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                              <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="px-4 py-2.5 text-right text-muted-foreground"
                                  >
                                    TOTALS ({fetchedReportList?.length}{" "}
                                    exception shareholders)
                                  </td>
                                  {/* <td className="px-4 py-2.5 text-right text-green-600">
                                {fetchedReportList.length > 0
                                  ? reportRows
                                      .reduce(
                                        (a: number, s: any) =>
                                          a + (s.bonusDue || 0),
                                        0,
                                      )
                                      .toLocaleString()
                                  : reportRows
                                      .reduce(
                                        (
                                          a: number,
                                          s: {
                                            holdings: number;
                                          },
                                        ) => a + Math.floor(s.holdings / 4),
                                        0,
                                      )
                                      .toLocaleString()}
                              </td> */}
                                  {/* <td className="px-4 py-2.5 text-right text-amber-600">
                                {fetchedReportList.length > 0
                                  ? reportRows
                                      .reduce(
                                        (a: number, s: any) =>
                                          a + (s.fractionalRemainder || 0),
                                        0,
                                      )
                                      .toFixed(4)
                                  : reportRows
                                      .reduce(
                                        (
                                          a: number,
                                          s: {
                                            holdings: number;
                                          },
                                        ) =>
                                          a +
                                          (s.holdings / 4 -
                                            Math.floor(s.holdings / 4)),
                                        0,
                                      )
                                      .toFixed(4)}
                              </td> */}
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          <PaginationBar
                            page={reportPage}
                            total={fetchedReportList.length}
                            onPageChange={setReportPage}
                          />
                        </Card>
                      ) : selectedReport === "Bonus Report" ? (
                        /* Bonus Report — Share Account No., Name, Cert No., Bonus Units, Before, After, Email, Phone, CHN, Broker */
                        <Card className="mrpsl-card overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px]">
                              <thead className="mrpsl-table-header">
                                <tr>
                                  <th className="px-3 py-2.5 font-medium">
                                    Acct No.
                                  </th>
                                  <th className="px-3 py-2.5 font-medium">
                                    Shareholder Name
                                  </th>
                                  <th className="px-3 py-2.5 font-medium">
                                    Cert No.
                                  </th>
                                  <th className="px-3 py-2.5 font-medium text-right">
                                    Bonus Units
                                  </th>
                                  <th className="px-3 py-2.5 font-medium text-right">
                                    Units Before
                                  </th>
                                  <th className="px-3 py-2.5 font-medium text-right">
                                    Units After
                                  </th>
                                  <th className="px-3 py-2.5 font-medium">
                                    Email
                                  </th>
                                  <th className="px-3 py-2.5 font-medium">
                                    Phone
                                  </th>
                                  <th className="px-3 py-2.5 font-medium">
                                    CHN
                                  </th>
                                  <th className="px-3 py-2.5 font-medium">
                                    Stockbroker / Code
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y font-mono text-xs">
                                {fetchedReportList?.map(
                                  (
                                    row: {
                                      accountNo?: string;
                                      shareAccountNo?: string;
                                      name?: string;
                                      holderName?: string;
                                      certificateNo?: string;
                                      certNo?: string;
                                      bonusUnits?: number;
                                      unitsBefore?: number;
                                      unitsHeld?: number;
                                      unitsAfter?: number;
                                      email?: string;
                                      emailAddress?: string;
                                      phone?: string;
                                      phoneNumber?: string;
                                      chn?: string;
                                      stockbroker?: string;
                                      stockbrokerCode?: string;
                                    },
                                    idx: number,
                                  ) => (
                                    <tr key={idx} className="mrpsl-table-row">
                                      <td className="px-3 py-2">
                                        {row.shareAccountNo ||
                                          row.accountNo ||
                                          "—"}
                                      </td>
                                      <td className="px-3 py-2 font-sans font-medium">
                                        {row.name || row.holderName || "—"}
                                      </td>
                                      <td className="px-3 py-2">
                                        {row.certificateNo || row.certNo || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-right text-primary font-semibold">
                                        {row.bonusUnits?.toLocaleString() ??
                                          "—"}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {(
                                          row.unitsBefore ?? row.unitsHeld
                                        )?.toLocaleString() ?? "—"}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {row.unitsAfter?.toLocaleString() ??
                                          "—"}
                                      </td>
                                      <td className="px-3 py-2 font-sans">
                                        {row.email || row.emailAddress || "—"}
                                      </td>
                                      <td className="px-3 py-2">
                                        {row.phone || row.phoneNumber || "—"}
                                      </td>
                                      <td className="px-3 py-2">
                                        {row.chn || "—"}
                                      </td>
                                      <td className="px-3 py-2 font-sans">
                                        {row.stockbroker || "—"}
                                        {row.stockbrokerCode && (
                                          <span className="ml-1 text-muted-foreground">
                                            / {row.stockbrokerCode}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ),
                                )}
                                {fetchedReportList?.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={10}
                                      className="px-4 py-10 text-center text-muted-foreground font-sans"
                                    >
                                      No bonus report records found.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          <PaginationBar
                            page={reportPage}
                            total={fetchedReportList?.length ?? 0}
                            onPageChange={setReportPage}
                          />
                        </Card>
                      ) : (
                        /* Bonus Entitlement Register & Shareholder Bonus Allotment List */
                        <Card className="mrpsl-card overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px]">
                              <BonusTableHead />
                              <tbody className="divide-y">
                                <EntitlementTableRows
                                  rows={reportRows}
                                  startIdx={reportStart}
                                />
                              </tbody>
                              {reportRows.length > 0 && (
                                <EntitlementTfoot
                                  rows={reportRows}
                                  total={reportTotal}
                                />
                              )}
                            </table>
                          </div>
                          <PaginationBar
                            page={reportPage}
                            total={reportTotal}
                            onPageChange={setReportPage}
                          />
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Outreach modals ── */}
      <EmailPreviewModal
        mode="bonus"
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        offerType="bonus"
        companyName={activeAllotment?.registerName || ""}
        issueId={activeAllotment?.id}
        offerName={activeAllotment?.bonusName || ""}
        ratio={activeAllotment?.ratio || ""}
        allotDate={activeAllotment?.allotmentDate || ""}
        contactEmail="BonusIssue@meristemregistrars.com"
        shareholders={
          allotReviewing && allotmentsList?.length
            ? allotmentsList.slice(0, 5).map((s) => ({
                id: s.id || "",
                accountNumber: s.accountNumber || "",
                name: s.shareholderName || s.name || "",
                address: s.address || "No Address Provided",
                state: s.state || "",
                holdings: s.unitsAtQualDate || 0,
              }))
            : shareholders.slice(0, 5).map((s) => ({
                id: s.id,
                accountNumber: s.accountNumber,
                name: `${s.firstName} ${s.lastName}`.trim(),
                address: s.address,
                state: s.state,
                holdings: s.holdings,
              }))
        }
        totalCount={
          allotReviewing
            ? allotmentsTotal
            : activeReview?.totalShareholders || shareholders.length
        }
      />

      {/* Approval / Rejection modal */}
      <Dialog
        open={approvalModal !== null}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalModal?.section === "ops"
                ? approvalModal.action === "approve"
                  ? "Approve Declaration"
                  : "Reject Declaration"
                : approvalModal?.action === "approve"
                  ? "ICU Approve Declaration"
                  : "Return to Operations"}
            </DialogTitle>
            <DialogDescription>
              {approvalModal?.action === "approve"
                ? "Add an optional comment before forwarding."
                : "Please provide a reason — this will be visible to the submitter."}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-1.5">
              <label className="mrpsl-label">
                {approvalModal?.action === "approve"
                  ? "Comment (optional)"
                  : "Reason for rejection *"}
              </label>
              <Textarea
                value={modalComment}
                onChange={(e) => setModalComment(e.target.value)}
                placeholder={
                  approvalModal?.action === "approve"
                    ? "Add a note…"
                    : "Explain the reason…"
                }
                rows={3}
                className="resize-none text-sm focus-visible:ring-primary rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant={
                  approvalModal?.action === "reject" ? "destructive" : "default"
                }
                className="flex-1"
                onClick={handleConfirmClick}
                disabled={isConfirming}
              >
                Confirm{" "}
                {approvalModal?.action === "approve" ? "Approval" : "Rejection"}
                {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

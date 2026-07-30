"use client";

import { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GET_BONUS_OFFERS } from "@/actions/offerSetUp";
import { useGetOrCreateBonusDeclaration } from "@/hooks/useBonus";
import { BonusProvisional } from "@/components/custom/bonus-issue/bonus-provisional";
import { BonusDeclarationApproval } from "@/components/custom/bonus-issue/bonus-declaration-approval";
import { BonusIcuReview } from "@/components/custom/bonus-issue/bonus-icu-review";
import { BonusCscsLodgement } from "@/components/custom/bonus-issue/bonus-cscs-lodgement";
import { BonusCscsReversals } from "@/components/custom/bonus-issue/bonus-cscs-reversals";
import { BonusReports } from "@/components/custom/bonus-issue/bonus-reports";
import { BonusDispatch } from "@/components/custom/bonus-issue/bonus-dispatch";
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
  certNo: string;
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
    certNo: "CERT-00001",
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
    certNo: "CERT-00002",
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
    certNo: "CERT-00003",
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
    certNo: "CERT-00004",
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
    certNo: "CERT-00005",
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
    certNo: "CERT-00006",
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
    certNo: "CERT-00007",
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
    certNo: "CERT-00008",
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
    certNo: "CERT-00009",
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
    certNo: "CERT-00010",
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
    certNo: "CERT-00011",
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
    certNo: "CERT-00012",
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
    certNo: "CERT-00013",
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
    certNo: "CERT-00014",
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
    certNo: "CERT-00015",
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
        <th className="px-4 py-2.5">CERT NO</th>
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
    certNo?: string;
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
          colSpan={7}
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
          <td className="px-4 py-2.5 text-muted-foreground">
            {s?.certNo || "—"}
          </td>
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
          colSpan={5}
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
  const { shareholders, currentUser } = useStore();

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
  const [bonusDeclarationId, setBonusDeclarationId] = useState<string>("");

  // Real Offer-Setup bonus offers (replaces the demo profile array).
  const { data: bonusOffersRes } = useQuery({
    queryKey: ["bonus-offers", "admin-selector"],
    queryFn: () => GET_BONUS_OFFERS({ size: 100 }),
  });

  const bonusOffers: BonusSetupProfile[] = useMemo(() => {
    const raw = bonusOffersRes?.data?.content ?? bonusOffersRes?.content ?? [];
    return raw.map(
      (o: {
        id: number | string;
        name: string;
        registerId?: string;
        ratioNumerator?: number;
        ratioDenominator?: number;
        qualificationDate?: string | null;
        closureDate?: string | null;
        allotmentDate?: string | null;
        roundingRule?: string;
        narrative?: string;
      }) => ({
        id: String(o.id),
        name: o.name,
        register: o.registerId ?? "",
        ratio: `1 for ${o.ratioDenominator ?? 1}`,
        qualificationDate: o.qualificationDate ? new Date(o.qualificationDate) : null,
        closureDate: o.closureDate ? new Date(o.closureDate) : null,
        allotmentDate: o.allotmentDate ? new Date(o.allotmentDate) : null,
        roundingRule: o.roundingRule ?? "ROUND_DOWN",
        narrative: o.narrative ?? "",
        status: "DRAFT",
      }),
    ) as BonusSetupProfile[];
  }, [bonusOffersRes]);

  const selectedBonusOffer = bonusOffers.find((p) => p.id === selectedBonusOfferId) ?? null;

  const getOrCreateDeclaration = useGetOrCreateBonusDeclaration();
  const handleSelectBonusOffer = (id: string | null) => {
    setSelectedBonusOfferId(id ?? "");
    setBonusDeclarationId("");
    if (!id) return;
    getOrCreateDeclaration.mutate(
      { offerId: id, createdBy: currentUser?.email },
      {
        onSuccess: (res) => setBonusDeclarationId(String(res?.data?.id ?? "")),
        onError: (err) => toast.error((err as Error).message),
      },
    );
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
                {bonusOffers.map((p) => (
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
            <BonusProvisional
              declarationId={bonusDeclarationId || undefined}
              offerName={selectedBonusOffer?.name}
              ratioLabel={selectedBonusOffer?.ratio}
            />
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <BonusDeclarationApproval />
          </TabsContent>

          <TabsContent value="icu" className="space-y-4">
            <BonusIcuReview />
          </TabsContent>

          <TabsContent value="lodgement" className="space-y-4">
            <BonusCscsLodgement />
          </TabsContent>

          <TabsContent value="reversals" className="space-y-4">
            <BonusCscsReversals declarationId={bonusDeclarationId || undefined} />
          </TabsContent>

          <TabsContent value="allotment" className="space-y-4">
            <BonusDispatch declarationId={bonusDeclarationId || undefined} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <BonusReports
              declarationId={bonusDeclarationId || undefined}
              registerId={selectedBonusOffer?.register}
            />
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

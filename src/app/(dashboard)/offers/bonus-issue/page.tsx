"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import {
  Info,
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
} from "lucide-react";
import { EmailPreviewModal } from "@/components/custom/shareholder-outreach-modals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ICULodgment from "@/components/custom/ipo/lodgment";
import { CSCSReversalsWorkspace } from "@/components/custom/offer-administration/cscs-reversals-workspace";
import { ProvisionalAllotment } from "@/components/custom/rights-issue/provisional-allotment";
import { DispatchNotificationPanel } from "@/components/custom/offer-administration/dispatch-notification-panel";
import { Card } from "@/components/ui/card";
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
import { useGetRegisters } from "@/hooks/useRegisters";
import { useReactToPrint } from "react-to-print";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CREATE_BONUS_ISSUE_DECLARATION,
  GET_DECLARATIONS,
  GET_SHAREHOLDERS_BY_DECLARATION_ID,
  GET_DECLARATION_BY_ID,
  APPROVE_DECLARATION,
  SUBMIT_DECLARATION_FOR_APPROVAL,
  COMPUTE_BONUS_ISSUE_DECLARATION,
  REJECT_DECLARATION,
  APPROVE_DECLARATION_BY_ICU,
  RETURN_DECLARATION_TO_OPS,
  GET_DELCARED_BONUS_ALLOTMENTS,
  PROCESS_BONUS_ISSUE_ALLOTMENT,
  EXPORT_DELCARED_BONUS_ALLOTMENTS,
  GENERATE_BONUS_REPORT,
} from "@/actions/bonusIssuesAction";
import { GET_USERS } from "@/actions/userAction";
import { getUser } from "@/services/AuthServices";
import { useUserDetails } from "@/hooks/useUserDetails";
import { formatCustomDate, formatDateOnly } from "@/utils/helperFunctions";
import ExportToExcel from "@/components/custom/ExportToExcel";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";

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
function DeclDetailCard({
  decl,
}: {
  decl: {
    registerName: string;
    bonusName: string;
    ratio: string;
    roundingRule: string;
    qualificationDate: string;
    closureDate: string;
    allotmentDate: string;
    narrative: string;
  };
}) {
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
  const { data: registersData, isLoading: loadingRegisters } =
    useGetRegisters();
  const queryClient = useQueryClient();
  const user = getUser();
  const registerList = registersData?.content;
  const { shareholders } = useStore();

  const [activeTab, setActiveTab] = useState("declaration");

  // Declaration
  const [computed, setComputed] = useState(false);
  const [computePage, setComputePage] = useState(1);
  const [date1, setDate1] = useState<Date>();
  const [date2, setDate2] = useState<Date>();
  const [date3, setDate3] = useState<Date>();
  const [selectedRegister, setSelectedRegister] = useState<string>("");
  const [bonusName, setBonusName] = useState<string>("");
  const [ratioNumerator, setRatioNumerator] = useState<string>("1");
  const [ratioDenominator, setRatioDenominator] = useState<string>("4");
  const [roundingRule, setRoundingRule] = useState<string>("ROUND_DOWN");
  const [narrative, setNarrative] = useState<string>("");
  const [activeSetupId, setActiveSetupId] = useState<string | null>(null);

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
  const [allotmentProcessed, setAllotmentProcessed] = useState(false);
  const [allotPage, setAllotPage] = useState(1);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [allotReviewing, setAllotReviewing] = useState<string | null>(null);
  const [allotReviewingRow, setAllotReviewingRow] =
    useState<BonusDeclaration | null>(null);
  const [allotmentProcessedMap, setAllotmentProcessedMap] = useState<
    Record<string, boolean>
  >({});

  // Auth tab list filters
  const [authListPage, setAuthListPage] = useState(1);
  const [authListPageSize, setAuthListPageSize] = useState(PAGE_SIZE);
  const [authListSearch, setAuthListSearch] = useState("");
  const [authListRegister, setAuthListRegister] = useState("");
  const debouncedAuthSearch = useDebounce(authListSearch, 500);

  // ICU tab list filters
  const [icuListPage, setIcuListPage] = useState(1);
  const [icuListPageSize, setIcuListPageSize] = useState(PAGE_SIZE);
  const [icuListSearch, setIcuListSearch] = useState("");
  const [icuListRegister, setIcuListRegister] = useState("");
  const debouncedIcuSearch = useDebounce(icuListSearch, 500);

  // Allotment tab list filters
  const [allotListPage, setAllotListPage] = useState(1);
  const [allotListPageSize, setAllotListPageSize] = useState(PAGE_SIZE);
  const [allotListSearch, setAllotListSearch] = useState("");
  const [allotListRegister, setAllotListRegister] = useState("");
  const [allotListStatus, setAllotListStatus] = useState("ICU_APPROVED");
  const debouncedAllotSearch = useDebounce(allotListSearch, 500);

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

  const [createdDeclarationId, setCreatedDeclarationId] = useState<
    string | null
  >(null);
  const [resTotalBonusShares, setResTotalBonusShares] = useState<number>(0);
  const [resTotalFractionalRemainder, setResTotalFractionalRemainder] =
    useState<number>(0);

  // Rejected banner (declaration tab) — lightweight, no pagination needed
  const { data: rejectedBannerData } = useQuery({
    queryKey: ["bonus-declarations", "banner"],
    queryFn: () => GET_DECLARATIONS({ pageSize: 50 }),
  });
  const rejectedList = rejectedBannerData?.data?.content?.filter(
    (declaration: { status: string }) =>
      declaration.status === "AUTH_REJECTED" ||
      declaration.status === "ICU_REJECTED",
  );

  // Auth tab — paginated, filterable
  const { data: authDeclarationsData, isLoading: isAuthDeclarationsLoading } =
    useQuery({
      queryKey: [
        "bonus-declarations",
        "auth",
        authListPage,
        authListPageSize,
        debouncedAuthSearch,
        authListRegister,
      ],
      queryFn: () =>
        GET_DECLARATIONS({
          page: authListPage,
          pageSize: authListPageSize,
          search: debouncedAuthSearch || undefined,
          registerId: authListRegister || undefined,
          status: "PENDING_AUTH",
        }),
    });
  const authDeclarationList = authDeclarationsData?.data?.content;
  const authDeclarationTotal = authDeclarationsData?.data?.totalElements ?? 0;

  // ICU tab — paginated, status fixed to PENDING_ICU
  const { data: icuDeclarationsData, isLoading: isIcuDeclarationsLoading } =
    useQuery({
      queryKey: [
        "bonus-declarations",
        "icu",
        icuListPage,
        icuListPageSize,
        debouncedIcuSearch,
        icuListRegister,
      ],
      queryFn: () =>
        GET_DECLARATIONS({
          page: icuListPage,
          pageSize: icuListPageSize,
          search: debouncedIcuSearch || undefined,
          registerId: icuListRegister || undefined,
          status: "PENDING_ICU",
        }),
    });
  const icuDeclarationList = icuDeclarationsData?.data?.content;
  const icuDeclarationTotal = icuDeclarationsData?.data?.totalElements ?? 0;

  // Allotment tab — paginated, filterable
  const { data: allotDeclarationsData, isLoading: isAllotDeclarationsLoading } =
    useQuery({
      queryKey: [
        "bonus-declarations",
        "allotment",
        allotListPage,
        allotListPageSize,
        debouncedAllotSearch,
        allotListRegister,
        allotListStatus,
      ],
      queryFn: () =>
        GET_DECLARATIONS({
          page: allotListPage,
          pageSize: allotListPageSize,
          search: debouncedAllotSearch || undefined,
          registerId: allotListRegister || undefined,
          status: allotListStatus,
        }),
    });
  const allotDeclarationList = allotDeclarationsData?.data?.content;
  const allotDeclarationTotal = allotDeclarationsData?.data?.totalElements ?? 0;
  const currentReviewingId =
    activeTab === "auth" ? authReviewing : icuReviewing;

  const reviewPage = activeTab === "auth" ? authPage : icuPage;

  const { data: activeReviewData, isLoading: isActiveReviewLoading } = useQuery(
    {
      queryKey: ["bonus-declaration", currentReviewingId],
      queryFn: () => GET_DECLARATION_BY_ID(currentReviewingId as string),
      enabled: !!currentReviewingId,
    },
  );

  const activeReview = activeReviewData?.data;

  const activeAllotment = allotReviewing ? allotReviewingRow : activeReview;

  const {
    userName,
    userRole,
    isLoading: isUserDetailsLoading,
  } = useUserDetails(activeReview?.authorizedBy);

  const { data: entitlementData, isLoading: isEntitlementLoading } = useQuery({
    queryKey: ["bonus-entitlements", currentReviewingId, reviewPage],
    queryFn: () =>
      GET_SHAREHOLDERS_BY_DECLARATION_ID(currentReviewingId as string, {
        page: reviewPage,
        pageSize: 10,
      }),
    enabled: !!currentReviewingId,
  });

  const entitlementList = entitlementData?.data?.entitlements?.content;
  const entitlementTotal =
    entitlementData?.data?.entitlements?.totalElements || 0;

  const { data: computeEntitlementData, isLoading: isComputeLoading } =
    useQuery({
      queryKey: [
        "bonus-entitlements-compute",
        createdDeclarationId,
        computePage,
      ],
      queryFn: () =>
        GET_SHAREHOLDERS_BY_DECLARATION_ID(createdDeclarationId as string, {
          page: computePage,
          pageSize: 10,
        }),
      enabled: !!createdDeclarationId,
    });

  const computeEntitlementList =
    computeEntitlementData?.data?.entitlements?.content;
  const computeEntitlementTotal =
    computeEntitlementData?.data?.entitlements?.totalElements || 0;

  const { data: allotmentsData, isLoading: isAllotmentsLoading } = useQuery({
    queryKey: ["bonus-allotments", allotReviewing, allotPage],
    queryFn: () =>
      GET_DELCARED_BONUS_ALLOTMENTS(allotReviewing as string, {
        page: allotPage,
        pageSize: 10,
      }),
    enabled: !!allotReviewing,
  });

  const allotmentsList = allotmentsData?.data?.entitlements?.content;
  const allotmentsTotal =
    allotmentsData?.data?.entitlements?.totalElements || 0;

  const { data: allUsersData } = useQuery({
    queryKey: ["users"],
    queryFn: GET_USERS,
  });

  const getUserByIdFn = (userId?: string) => {
    if (!userId) return { name: "-", role: "-" };
    const user = allUsersData?.data?.find(
      (u: {
        id: string;
        firstName: string;
        lastName: string;
        roles: string[];
      }) => u.id === userId,
    );
    if (!user) {
      return { name: userId, role: "-" };
    }
    return {
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.roles?.join(", ") || "-",
    };
  };

  const createDeclarationMutation = useMutation({
    mutationFn: CREATE_BONUS_ISSUE_DECLARATION,
    onSuccess: (data) => {
      const createdId = data?.data?.id;
      const fractional = data?.data?.totalFractionalRemainder;
      const totalBonus = data?.data?.totalBonusShares;

      setCreatedDeclarationId(createdId);
      setResTotalFractionalRemainder(fractional);
      setResTotalBonusShares(totalBonus);

      toast.success("Declaration created successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bonus-declarations"],
      });

      setComputed(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const approveDeclarationMutation = useMutation({
    mutationFn: APPROVE_DECLARATION,
    onSuccess: () => {
      toast.success("Declaration approved successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bonus-declarations"],
      });
      setAuthReviewing(null);
      setAuthComment("");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const approveDeclarationByIcuMutation = useMutation({
    mutationFn: APPROVE_DECLARATION_BY_ICU,
    onSuccess: () => {
      toast.success("Declaration approved successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bonus-declarations"],
      });
      setAuthReviewing(null);
      setAuthComment("");
      setIcuReviewing(null);
      setIcuComment("");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectDeclarationMutation = useMutation({
    mutationFn: REJECT_DECLARATION,
    onSuccess: () => {
      toast.success("Declaration rejected successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bonus-declarations"],
      });
      setAuthReviewing(null);
      setAuthComment("");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const icuReturnMutation = useMutation({
    mutationFn: RETURN_DECLARATION_TO_OPS,
    onSuccess: () => {
      toast.success("Declaration returned successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bonus-declarations"],
      });
      setAuthReviewing(null);
      setAuthComment("");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAuthApprove = (mode: "ops" | "icu") => {
    if (mode === "ops") {
      const payload = {
        decision: "APPROVED",
        comment: modalComment,
        createdBy: user?.email,
      };
      approveDeclarationMutation.mutate({
        declarationId: authReviewing || icuReviewing,
        payload,
      });
    } else {
      const payload = {
        decision: "APPROVED",
        comment: modalComment,
        createdBy: user?.email,
      };
      approveDeclarationByIcuMutation.mutate({
        declarationId: authReviewing || icuReviewing,
        payload,
      });
    }
  };

  const handleAuthReject = () => {
    const payload = {
      decision: "REJECTED",
      comment: modalComment,
      createdBy: user?.email,
    };
    rejectDeclarationMutation.mutate({
      declarationId: authReviewing || icuReviewing,
      payload,
    });
  };

  const handleIcuReturn = () => {
    const payload = {
      decision: "REJECTED",
      comment: modalComment,
      createdBy: user?.email,
    };

    icuReturnMutation.mutate({
      declarationId: icuReviewing,
      payload,
    });
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

  const closeModal = () => {
    setApprovalModal(null);
    setModalComment("");
  };

  const submitForApprovalMutation = useMutation({
    mutationFn: SUBMIT_DECLARATION_FOR_APPROVAL,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bonus-declarations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["bonus-declaration", authReviewing || icuReviewing],
      });
      queryClient.invalidateQueries({
        queryKey: ["bonus-entitlements", authReviewing || icuReviewing],
      });
      toast.success("Declaration submitted successfully.");
      // Keep review screen open to see updated status/buttons
      // setAuthReviewing(null);
      setAuthComment("");
      setComputed(false);
      setSelectedRegister("");
      setBonusName("");
      setRatioNumerator("");
      setRatioDenominator("");
      setRoundingRule("");
      setDate1(undefined);
      setDate2(undefined);
      setDate3(undefined);
      setNarrative("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const computeMutation = useMutation({
    mutationFn: COMPUTE_BONUS_ISSUE_DECLARATION,
    onSuccess: () => {
      toast.success("Declaration computed successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bonus-declarations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["bonus-declaration", activeReview?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["bonus-entitlements", activeReview?.id],
      });
      submitForApprovalMutation.mutate({
        declarationId: activeReview?.id,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  /* handlers */
  const handleApprove = () => {
    submitForApprovalMutation.mutate({
      declarationId: createdDeclarationId,
    });
  };

  const handleApproveAndCompute = (id: string) => {
    computeMutation.mutate({
      declarationId: id,
    });
  };

  const handleCompute = () => {
    if (!selectedRegister) {
      toast.error("Please select a register");
      return;
    }
    if (!bonusName) {
      toast.error("Please enter a bonus name");
      return;
    }
    if (!ratioNumerator || !ratioDenominator) {
      toast.error("Please enter a bonus ratio");
      return;
    }
    if (!roundingRule) {
      toast.error("Please select a rounding rule");
      return;
    }
    if (!date1 || !date2 || !date3) {
      toast.error("Please select all dates");
      return;
    }
    const payload = {
      declarationId: createdDeclarationId,
      createdBy: user?.email,
      registerId: selectedRegister,
      bonusName,
      ratio: `${ratioNumerator}:${ratioDenominator}`,
      roundingRule,
      qualificationDate: format(date1, "yyyy-MM-dd"),
      closureDate: format(date2, "yyyy-MM-dd"),
      allotmentDate: format(date3, "yyyy-MM-dd"),
      narrative,
    };

    createDeclarationMutation.mutate(payload);
  };

  const processAllotmentMutation = useMutation({
    mutationFn: PROCESS_BONUS_ISSUE_ALLOTMENT,
    onSuccess: () => {
      toast.success("Allotment processed successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bonus-declarations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["bonus-allotments", allotReviewing],
      });
      queryClient.invalidateQueries({
        queryKey: ["bonus-declaration", activeReview?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["bonus-entitlements", activeReview?.id],
      });
      setAllotmentProcessed(true);
      setAllotPage(1);
      toast.success(
        "Allotment processed. Certificates and CSCS entries created.",
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const exportAllotmentsMutation = useMutation({
    mutationFn: EXPORT_DELCARED_BONUS_ALLOTMENTS,
    onSuccess: (data) => {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `allotment-report-${allotReviewing || "export"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Excel report exported successfully.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to export Excel report.");
    },
  });

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

  const {
    data: fetchedReportResponse,
    isLoading: isReportLoading,
    refetch: refetchReport,
  } = useQuery({
    queryKey: [
      "bonusReport",
      reportPath,
      reportRegister,
      reportDateFrom,
      reportDateTo,
    ],
    queryFn: () =>
      GENERATE_BONUS_REPORT(reportPath, {
        registerId: reportRegister === "all" ? undefined : reportRegister,
        dateFrom: reportDateFrom,
        dateTo: reportDateTo,
      }),
    enabled: false,
  });

  const fetchedReportData = fetchedReportResponse?.data;

  const fetchedReportList = (() => {
    if (!fetchedReportData) return [];
    if (reportPath === "summary-of-bonus-shares-issued") {
      return fetchedReportData.brokerSummary || [];
    }
    if (reportPath === "bonus-entitlement-register") {
      return (
        fetchedReportData.entitlements?.content ||
        fetchedReportData.entitlements ||
        []
      );
    }
    if (reportPath === "exception-and-rounding-report") {
      return fetchedReportData.exceptions || [];
    }
    if (reportPath === "shareholder-bonus-allotment-list") {
      return (
        fetchedReportData.allotments?.content ||
        fetchedReportData.allotments ||
        []
      );
    }
    if (reportPath === "bonus-report") {
      return (
        fetchedReportData.bonusReport?.content ||
        fetchedReportData.bonusReport ||
        fetchedReportData.entitlements?.content ||
        []
      );
    }
    return [];
  })();

  const fetchedReportTotal = (() => {
    if (!fetchedReportData) return 0;
    if (reportPath === "summary-of-bonus-shares-issued") {
      return fetchedReportData.total || fetchedReportList.length;
    }
    if (reportPath === "bonus-entitlement-register") {
      return (
        fetchedReportData.entitlements?.totalElements ||
        fetchedReportData.total ||
        fetchedReportList.length
      );
    }
    if (reportPath === "exception-and-rounding-report") {
      return fetchedReportData.total || fetchedReportList.length;
    }
    if (reportPath === "shareholder-bonus-allotment-list") {
      return (
        fetchedReportData.allotments?.totalElements ||
        fetchedReportData.total ||
        fetchedReportList.length
      );
    }
    if (reportPath === "bonus-report") {
      return (
        fetchedReportData.bonusReport?.totalElements ||
        fetchedReportData.total ||
        fetchedReportList.length
      );
    }
    return 0;
  })();

  const handleRunReport = async () => {
    const loadingToast = toast.loading("Generating report...");
    try {
      const result = await refetchReport();
      toast.dismiss(loadingToast);
      if (result.error) {
        toast.error(result.error?.message || "Failed to generate report");
        return;
      }
      setReportGenerated(true);
      setReportPage(1);
      toast.success(`${selectedReport} generated.`);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(
        (err as { message: string })?.message || "Failed to generate report",
      );
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    const filename = `${selectedReport.toLowerCase().replace(/\s+/g, "-")}-report.xlsx`;
    toast.info("Preparing Excel download...");
    try {
      const data = await GENERATE_BONUS_REPORT(reportPath, {
        registerId: reportRegister === "all" ? undefined : reportRegister,
        dateFrom: reportDateFrom,
        dateTo: reportDateTo,
        format: "excel",
      });

      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Excel downloaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download Excel report.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleEditDeclaration = (decl: BonusDeclaration) => {
    const matchingRegister = registerList?.find(
      (r: { registerName: string; registerId: string }) =>
        r.registerName === decl.registerName,
    );
    setSelectedRegister(matchingRegister?.registerId || decl.registerId || "");
    setBonusName(decl.bonusName || "");

    if (decl.ratio && decl.ratio.includes(":")) {
      const [num, den] = decl.ratio.split(":");
      setRatioNumerator(num);
      setRatioDenominator(den);
    }

    setRoundingRule(decl.roundingRule || "ROUND_DOWN");
    setNarrative(decl.narrative || "");

    if (decl.qualificationDate) {
      const date = new Date(decl.qualificationDate);
      if (!isNaN(date.getTime())) setDate1(date);
    }
    if (decl.closureDate) {
      const date = new Date(decl.closureDate);
      if (!isNaN(date.getTime())) setDate2(date);
    }
    if (decl.allotmentDate) {
      const date = new Date(decl.allotmentDate);
      if (!isNaN(date.getTime())) setDate3(date);
    }

    setCreatedDeclarationId(decl.id);
    setResTotalBonusShares(decl.totalBonusShares || 0);
    setResTotalFractionalRemainder(decl.totalFractionalRemainder || 0);
    setComputed(true);

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadSetup = (setup: BonusSetupProfile) => {
    setBonusName(setup.name);
    const parts = setup.ratio.match(/(\d+)\s+for\s+(\d+)/);
    if (parts) {
      setRatioNumerator(parts[1]);
      setRatioDenominator(parts[2]);
    }
    setRoundingRule(setup.roundingRule);
    setNarrative(setup.narrative);
    setDate1(setup.qualificationDate);
    setDate2(setup.closureDate);
    setDate3(setup.allotmentDate);
    const matchedReg = registerList?.find((r: { registerName: string; registerId: string }) =>
      r.registerName.toLowerCase().includes(setup.register.toLowerCase().split(" ")[0]),
    );
    if (matchedReg) setSelectedRegister(matchedReg.registerId);
    setActiveSetupId(setup.id);
    toast.success(`Form pre-populated from "${setup.name}".`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reportStart = (reportPage - 1) * PAGE_SIZE;

  const reportRows = fetchedReportList.slice(
    reportStart,
    reportStart + PAGE_SIZE,
  );
  const reportTotal = fetchedReportTotal;

  /* date range label helper */
  const reportDateLabel = reportDateRange?.from
    ? reportDateRange.to
      ? `${format(reportDateRange.from, "dd MMM yyyy")} – ${format(reportDateRange.to, "dd MMM yyyy")}`
      : format(reportDateRange.from, "dd MMM yyyy")
    : undefined;

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

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-full gap-0.5 flex-wrap">
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
              className="rounded-lg cursor-pointer px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          {/* ── Provisional Allotment ── */}
          <TabsContent value="declaration">
            <ProvisionalAllotment
              offerName="Zenith Bank Bonus Issue 2024"
              ratioLabel="1 bonus share for every 5 held"
              ratioDenominator={5}
              pricePerShare={null}
              qualificationDateLabel="30 Jun 2024"
              entitlementLabel="Bonus Shares Due"
            />
          </TabsContent>

          {/* ── Approval ── */}
          <TabsContent value="auth" className="space-y-4">
            {authReviewing === null ? (
              <>
                {/* Filters */}
                <Card className="mrpsl-card p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search ref or bonus name..."
                        value={authListSearch}
                        onChange={(e) => {
                          setAuthListSearch(e.target.value);
                          setAuthListPage(1);
                        }}
                        className="pl-9 mrpsl-input"
                      />
                    </div>
                    <Select
                      value={authListRegister || "all"}
                      onValueChange={(v) => {
                        setAuthListRegister(v === "all" ? "" : (v ?? ""));
                        setAuthListPage(1);
                      }}
                    >
                      <SelectTrigger className="mrpsl-input w-48">
                        <SelectValue placeholder="All Registers" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingRegisters ? (
                          <div className="py-10 flex items-center justify-center">
                            <Loader2 className="animate-spin w-4 h-4" />
                          </div>
                        ) : (
                          <>
                            <SelectItem value="all">All Registers</SelectItem>
                            {registerList?.map((r) => (
                              <SelectItem
                                key={r.registerId}
                                value={r.registerId}
                              >
                                <span className="font-bold">
                                  {r.registerName}
                                </span>{" "}
                                -{" "}
                                <span className="text-xs translate-y-0.5">
                                  {r.symbol}
                                </span>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

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
                        activeReview?.totalSharesAfterIssue?.toLocaleString() ||
                        0,
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
                    disabled={
                      computeMutation.isPending ||
                      submitForApprovalMutation.isPending
                    }
                  >
                    Submit for Approval
                    {(computeMutation.isPending ||
                      submitForApprovalMutation.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
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
                {/* Filters */}
                <Card className="mrpsl-card p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search ref or bonus name..."
                        value={icuListSearch}
                        onChange={(e) => {
                          setIcuListSearch(e.target.value);
                          setIcuListPage(1);
                        }}
                        className="pl-9 mrpsl-input"
                      />
                    </div>
                    <Select
                      value={icuListRegister || "all"}
                      onValueChange={(v) => {
                        setIcuListRegister(v === "all" ? "" : (v ?? ""));
                        setIcuListPage(1);
                      }}
                    >
                      <SelectTrigger className="mrpsl-input w-48">
                        <SelectValue placeholder="All Registers" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingRegisters ? (
                          <div className="py-10 flex items-center justify-center">
                            <Loader2 className="animate-spin w-4 h-4" />
                          </div>
                        ) : (
                          <>
                            <SelectItem value="all">All Registers</SelectItem>
                            {registerList?.map((r) => (
                              <SelectItem
                                key={r.registerId}
                                value={r.registerId}
                              >
                                <span className="font-bold">
                                  {r.registerName}
                                </span>{" "}
                                -{" "}
                                <span className="text-xs translate-y-0.5">
                                  {r.symbol}
                                </span>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

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
                        activeReview?.totalSharesAfterIssue?.toLocaleString() ||
                        0,
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

                {/* Approve / Return to Ops */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-12 text-base font-semibold"
                    onClick={() =>
                      setApprovalModal({ action: "reject", section: "icu" })
                    }
                  >
                    Return to Ops
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
              </div>
            )}
          </TabsContent>

          {/* ── CSCS Lodgement ── */}
          <TabsContent value="lodgement" className="space-y-4">
            <ICULodgment tab="lodgement" />
          </TabsContent>

          {/* ── CSCS Reversals & Error Resolution ── */}
          <TabsContent value="reversals">
            <CSCSReversalsWorkspace />
          </TabsContent>

          {/* ── Notification & Prelist Dispatch ── */}
          <TabsContent value="allotment" className="space-y-4">
            {allotReviewing === null ? (
              <>
                {/* Filters */}
                <Card className="mrpsl-card p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search ref or bonus name..."
                        value={allotListSearch}
                        onChange={(e) => {
                          setAllotListSearch(e.target.value);
                          setAllotListPage(1);
                        }}
                        className="pl-9 mrpsl-input"
                      />
                    </div>
                    <Select
                      value={allotListRegister || "all"}
                      onValueChange={(v) => {
                        setAllotListRegister(v === "all" ? "" : (v ?? ""));
                        setAllotListPage(1);
                      }}
                    >
                      <SelectTrigger className="mrpsl-input w-48">
                        <SelectValue placeholder="All Registers" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingRegisters ? (
                          <div className="py-10 flex items-center justify-center">
                            <Loader2 className="animate-spin w-4 h-4" />
                          </div>
                        ) : (
                          <>
                            <SelectItem value="all">All Registers</SelectItem>
                            {registerList?.map((r) => (
                              <SelectItem
                                key={r.registerId}
                                value={r.registerId}
                              >
                                <span className="font-bold">
                                  {r.registerName}
                                </span>{" "}
                                -{" "}
                                <span className="text-xs translate-y-0.5">
                                  {r.symbol}
                                </span>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <Select
                      value={allotListStatus}
                      onValueChange={(v) => {
                        setAllotListStatus(v ?? "ICU_APPROVED");
                        setAllotListPage(1);
                      }}
                    >
                      <SelectTrigger className="mrpsl-input w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ICU_APPROVED">
                          Pending Allotment
                        </SelectItem>
                        <SelectItem value="ALLOTTED">Allotted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

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
                            disabled={processAllotmentMutation.isPending}
                            onClick={() => {
                              if (!row?.id) return;
                              toast.info("Processing allotment…");
                              processAllotmentMutation.mutate(
                                { declarationId: row.id },
                                {
                                  onSuccess: () => {
                                    setAllotmentProcessedMap((p) => ({
                                      ...p,
                                      [row.id]: true,
                                    }));
                                  },
                                },
                              );
                            }}
                          >
                            {processAllotmentMutation.isPending ? (
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
                              {allotmentsData?.data?.totalShareholders?.toLocaleString() ??
                                row?.totalShareholders?.toLocaleString() ??
                                "0"}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4 border-t-4 border-t-blue-500">
                            <div className="mrpsl-section-title">
                              New Shares Issued
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-blue-600">
                              {allotmentsData?.data?.totalBonusShares?.toLocaleString() ??
                                row?.totalBonusShares?.toLocaleString() ??
                                "0"}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4 border-t-4 border-t-purple-500">
                            <div className="mrpsl-section-title">
                              Previous Stock in Issue
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-purple-600">
                              {/* 18,000,000 */} 0
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4 border-t-4 border-t-amber-500">
                            <div className="mrpsl-section-title">
                              New Stock in Issue
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
                              {/* 22,500,000 */} 0
                            </div>
                          </Card>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <Card className="mrpsl-card p-4">
                            <div className="mrpsl-section-title">
                              Paper Certificates Created
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1">
                              {allotmentsData?.data?.totalPaperSharesCreated?.toLocaleString() ||
                                0}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4">
                            <div className="mrpsl-section-title">
                              CSCS Entries Updated
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1">
                              {allotmentsData?.data?.totalCscShares?.toLocaleString() ??
                                Math.floor(
                                  (row?.totalShareholders || 0) * 0.65,
                                ).toLocaleString()}
                            </div>
                          </Card>
                          <Card className="mrpsl-card p-4">
                            <div className="mrpsl-section-title">
                              Fractional Shares Rounded
                            </div>
                            <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
                              {allotmentsData?.data?.totalFractionalSharesRounded?.toLocaleString() ??
                                "0"}
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
                              disabled={exportAllotmentsMutation.isPending}
                              onClick={() => {
                                if (!row?.id) {
                                  toast.error(
                                    "No active allotment declaration selected.",
                                  );
                                  return;
                                }
                                toast.info("Exporting Excel report…");
                                exportAllotmentsMutation.mutate(row.id);
                              }}
                            >
                              {exportAllotmentsMutation.isPending ? (
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

            {/* Filters */}
            <Card className="mrpsl-card p-5">
              <div className="flex gap-6 mb-1.5">
                <label className="mrpsl-label w-64">Register</label>
                <label className="mrpsl-label w-64">Date Range</label>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={reportRegister}
                  onValueChange={(v) => {
                    setReportRegister(v ?? "all");
                    setReportGenerated(false);
                  }}
                >
                  <SelectTrigger className="mrpsl-input w-64">
                    <SelectValue placeholder="All Registers" />
                  </SelectTrigger>
                  <SelectContent className="w-max">
                    {loadingRegisters ? (
                      <div className="py-10 flex items-center justify-center">
                        <Loader2 className="animate-spin w-4 h-4" />
                      </div>
                    ) : (
                      <>
                        <SelectItem value="">All Register</SelectItem>
                        {registerList?.map((r) => (
                          <SelectItem key={r.registerId} value={r.symbol}>
                            <span className="font-bold">{r.registerName}</span>{" "}
                            -{" "}
                            <span className="text-xs translate-y-0.5">
                              {r.symbol}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <Popover
                  open={reportCalOpen}
                  onOpenChange={(v, eventDetails) => {
                    if (!v) {
                      if (
                        eventDetails.reason === "outside-press" ||
                        eventDetails.reason === "escape-key" ||
                        eventDetails.reason === "trigger-press"
                      ) {
                        setReportCalOpen(false);
                      }
                      return;
                    }
                    setReportCalOpen(v);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mrpsl-input w-64 justify-start gap-2 px-3 font-normal text-sm",
                        !reportDateLabel && "text-muted-foreground",
                      )}
                    >
                      <CalendarRange className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">
                        {reportDateLabel ?? "Select date range"}
                      </span>
                      {reportDateRange && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            reportDateRangeRef.current = undefined;
                            setReportDateRange(undefined);
                          }}
                          className="ml-auto rounded-full hover:bg-muted p-0.5"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={reportDateRange}
                      onSelect={(r) => {
                        reportDateRangeRef.current = r;
                        setReportDateRange(r);
                        if (r?.from && r?.to) setReportCalOpen(false);
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  size="xl"
                  className="px-6 font-semibold shrink-0"
                  onClick={handleRunReport}
                >
                  Generate Report
                </Button>
              </div>
            </Card>

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
                          <span>
                            Register:{" "}
                            {registerList?.find(
                              (r) => r.symbol === reportRegister,
                            )?.registerName || "All Registers"}
                          </span>
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
                                  <th className="px-3 py-2.5 font-medium">Acct No.</th>
                                  <th className="px-3 py-2.5 font-medium">Shareholder Name</th>
                                  <th className="px-3 py-2.5 font-medium">Cert No.</th>
                                  <th className="px-3 py-2.5 font-medium text-right">Bonus Units</th>
                                  <th className="px-3 py-2.5 font-medium text-right">Units Before</th>
                                  <th className="px-3 py-2.5 font-medium text-right">Units After</th>
                                  <th className="px-3 py-2.5 font-medium">Email</th>
                                  <th className="px-3 py-2.5 font-medium">Phone</th>
                                  <th className="px-3 py-2.5 font-medium">CHN</th>
                                  <th className="px-3 py-2.5 font-medium">Stockbroker / Code</th>
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
                                      <td className="px-3 py-2">{row.shareAccountNo || row.accountNo || "—"}</td>
                                      <td className="px-3 py-2 font-sans font-medium">{row.name || row.holderName || "—"}</td>
                                      <td className="px-3 py-2">{row.certificateNo || row.certNo || "—"}</td>
                                      <td className="px-3 py-2 text-right text-primary font-semibold">{row.bonusUnits?.toLocaleString() ?? "—"}</td>
                                      <td className="px-3 py-2 text-right">{(row.unitsBefore ?? row.unitsHeld)?.toLocaleString() ?? "—"}</td>
                                      <td className="px-3 py-2 text-right">{row.unitsAfter?.toLocaleString() ?? "—"}</td>
                                      <td className="px-3 py-2 font-sans">{row.email || row.emailAddress || "—"}</td>
                                      <td className="px-3 py-2">{row.phone || row.phoneNumber || "—"}</td>
                                      <td className="px-3 py-2">{row.chn || "—"}</td>
                                      <td className="px-3 py-2 font-sans">
                                        {row.stockbroker || "—"}
                                        {row.stockbrokerCode && (
                                          <span className="ml-1 text-muted-foreground">/ {row.stockbrokerCode}</span>
                                        )}
                                      </td>
                                    </tr>
                                  ),
                                )}
                                {fetchedReportList?.length === 0 && (
                                  <tr>
                                    <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground font-sans">
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
        companyName={
          activeAllotment?.registerName || activeAllotment?.register || ""
        }
        issueId={activeAllotment?.id}
        offerName={activeAllotment?.bonusName || ""}
        ratio={activeAllotment?.ratio || ""}
        allotDate={
          activeAllotment?.allotmentDate || activeAllotment?.allotDate || ""
        }
        contactEmail="BonusIssue@meristemregistrars.com"
        shareholders={
          allotReviewing && allotmentsList?.length
            ? allotmentsList
                .slice(0, 5)
                .map(
                  (s: {
                    name: string;
                    shareholderId: string;
                    id: string;
                    accountNumber: string;
                    address: string;
                    state: string;
                    unitsAtQualDate: number;
                    holdings: number;
                  }) => {
                    const nameParts = (s.name || "").trim().split(/\s+/);
                    return {
                      id: s.shareholderId || s.id || "",
                      accountNumber: s.accountNumber || "",
                      firstName: nameParts[0] || "",
                      lastName: nameParts.slice(1).join(" ") || "",
                      address: s.address || "No Address Provided",
                      state: s.state || "",
                      holdings: s.unitsAtQualDate || s.holdings || 0,
                    };
                  },
                )
            : shareholders.slice(0, 5).map((s) => ({
                id: s.id,
                accountNumber: s.accountNumber,
                firstName: s.firstName,
                lastName: s.lastName,
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
                disabled={
                  approveDeclarationMutation.isPending ||
                  approveDeclarationByIcuMutation.isPending ||
                  rejectDeclarationMutation.isPending ||
                  icuReturnMutation.isPending
                }
              >
                Confirm{" "}
                {approvalModal?.action === "approve" ? "Approval" : "Rejection"}
                {(approveDeclarationMutation.isPending ||
                  approveDeclarationByIcuMutation.isPending ||
                  rejectDeclarationMutation.isPending ||
                  icuReturnMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

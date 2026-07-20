"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
// import { format } from "date-fns"; // re-enable alongside useGetAdmons below
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PaginationBar } from "../../pagination-bar";
import {
  // useGetAdmons, // TODO: re-enable once GET /admon is live — see backend_changes.md
  useBatchAuthoriseAdmons,
  useBatchRejectAdmons,
  useBatchReturnAdmons,
} from "@/hooks/useAccountMaintenance";
import { useGetRegisters } from "@/hooks/useRegisters";
import { Admon, AdmonListResponse } from "@/types/account-maintenance";
import { ApiResponse } from "@/types";
import { DateRange } from "react-day-picker";
import { EntitlementTableSkeleton } from "../../rights-issue/loaders";
import { DateRangePicker } from "../../date-range-picker";
import { DataErrorState } from "../../ipo/loaders";
import { formatDate } from "@/lib/utils/format";
import { useRolePermission } from "@/hooks/usePermission";
import { AdmonReviewDialog } from "./admon-review";

// ── Demo mock row for backend demonstration ──
// Remove this once the backend returns real data with administrators[] and deceasedAccounts[].

const MOCK_DEMO_ADMONS: Admon[] = [
  {
    id: -1,
    registerId: "MRL",
    deceasedAccountIds: ["ACC-001", "ACC-002", "ACC-003"],
    deceasedAccountNumbers: ["MR00001234", "MR00005678", "MR00009012"],
    deceasedAccounts: [
      {
        accountNumber: "MR00001234",
        holderName: "John Adeyemi Okafor",
        registerSymbol: "MRL",
        chn: "CHN-8891",
        holdings: 1500000,
      },
      {
        accountNumber: "MR00005678",
        holderName: "John Adeyemi Okafor",
        registerSymbol: "MRL",
        chn: "CHN-8891",
        holdings: 500000,
      },
      {
        accountNumber: "MR00009012",
        holderName: "John A. Okafor",
        registerSymbol: "MRP",
        chn: "CHN-8891",
        holdings: 250000,
      },
    ],
    deceasedHolderName: "John Adeyemi Okafor",
    admonType: "ADMINISTRATOR",
    adminName: "Folake Okafor",
    probateCourt: "High Court of Lagos State — Ikeja Division",
    probateNumber: "P/2026/0042/LS",
    probateDate: "2026-04-15",
    probatePage: "342-348",
    lodgementDate: "2026-06-01",
    adminAddress: "15B Adeola Odeku Street",
    adminCity: "Victoria Island",
    adminState: "Lagos",
    memo: "Deceased passed intestate. Application filed by surviving spouse.",
    changeNameToEstate: true,
    estateNamePreview: "Estate of John Adeyemi Okafor",
    probateDocs: [
      {
        name: "letters_of_administration.pdf",
        url: "https://example.com/docs/letters.pdf",
      },
      {
        name: "death_certificate.pdf",
        url: "https://example.com/docs/death_cert.pdf",
      },
    ],
    administrators: [
      {
        adminName: "Folake Okafor",
        isExecutor: false,
        email: "folake.okafor@email.com",
        phone: "+234 803 555 1234",
        altPhone: "+234 809 555 5678",
        bvn: "22334455667",
        nin: "98765432109",
        idType: "International Passport",
        relationship: "Spouse",
        adminAddress: "15B Adeola Odeku Street",
        adminCity: "Victoria Island",
        adminState: "Lagos",
        memo: "Primary applicant — wife of the deceased.",
        documents: [
          {
            name: "folake_id.jpg",
            url: "https://example.com/docs/folake_id.jpg",
          },
        ],
      },
      {
        adminName: "Emeka Okafor",
        isExecutor: false,
        email: "emeka.okafor@email.com",
        phone: "+234 802 444 9876",
        bvn: "11223344556",
        nin: "87654321098",
        idType: "National ID",
        relationship: "Son",
        adminAddress: "42B Coker Road, Ilupeju",
        adminCity: "Ilupeju",
        adminState: "Lagos",
        documents: [],
      },
    ],
    status: "PENDING_AUTH",
    initiatorId: "ops001@email.com",
    initiatorName: "Amara Eze",
    authorisedBy: "",
    authorisedAt: "",
    icuApprovedBy: "",
    icuApprovedAt: "",
    rejectionComment: "",
    createdAt: "2026-07-08T10:30:00",
    decidedAt: "",
  },
  {
    id: -2,
    registerId: "MRP",
    deceasedAccountIds: ["ACC-004"],
    deceasedAccountNumbers: ["MRP0000456"],
    deceasedAccounts: [
      {
        accountNumber: "MRP0000456",
        holderName: "Grace Nwosu",
        registerSymbol: "MRP",
        chn: "CHN-5512",
        holdings: 320000,
      },
    ],
    deceasedHolderName: "Grace Nwosu",
    admonType: "EXECUTOR",
    adminName: "Charles Nwosu",
    probateCourt: "Probate Registry — Enugu",
    probateNumber: "P/2026/0089/EN",
    probateDate: "2026-05-20",
    probatePage: "112-115",
    lodgementDate: "2026-06-15",
    adminAddress: "7 Independence Layout",
    adminCity: "Enugu",
    adminState: "Enugu",
    memo: "",
    changeNameToEstate: true,
    estateNamePreview: "Estate of Grace Nwosu",
    probateDocs: [
      {
        name: "grant_of_probate.pdf",
        url: "https://example.com/docs/grant_probate.pdf",
      },
    ],
    administrators: [
      {
        adminName: "Charles Nwosu",
        isExecutor: true,
        email: "charles.nwosu@email.com",
        phone: "+234 806 111 2233",
        bvn: "99887766554",
        nin: "55443322110",
        idType: "Driver's License",
        relationship: "Spouse",
        adminAddress: "7 Independence Layout",
        adminCity: "Enugu",
        adminState: "Enugu",
        documents: [
          {
            name: "charles_id.pdf",
            url: "https://example.com/docs/charles_id.pdf",
          },
        ],
      },
    ],
    status: "PENDING_AUTH",
    initiatorId: "ops002@email.com",
    initiatorName: "Blessing Ugwu",
    authorisedBy: "",
    authorisedAt: "",
    icuApprovedBy: "",
    icuApprovedAt: "",
    rejectionComment: "",
    createdAt: "2026-07-09T14:00:00",
    decidedAt: "",
  },
  {
    id: -3,
    registerId: "MRL",
    deceasedAccountIds: ["ACC-005"],
    deceasedAccountNumbers: ["MR00007890"],
    deceasedAccounts: [
      {
        accountNumber: "MR00007890",
        holderName: "Aliyu Bello",
        registerSymbol: "MRL",
        chn: "CHN-7733",
        holdings: 890000,
      },
    ],
    deceasedHolderName: "Aliyu Bello",
    admonType: "ADMINISTRATOR",
    adminName: "Fatima Bello",
    probateCourt: "Sharia Court of Appeal — Kaduna",
    probateNumber: "P/2026/0155/KD",
    probateDate: "2026-06-01",
    probatePage: "201-204",
    lodgementDate: "2026-06-20",
    adminAddress: "12 Ahmadu Bello Way",
    adminCity: "Kaduna",
    adminState: "Kaduna",
    memo: "",
    changeNameToEstate: false,
    estateNamePreview: "",
    probateDocs: [],
    administrators: [
      {
        adminName: "Fatima Bello",
        isExecutor: false,
        email: "fatima.bello@email.com",
        phone: "+234 807 333 4455",
        bvn: "66554433221",
        nin: "44332211009",
        idType: "National ID",
        relationship: "Daughter",
        adminAddress: "12 Ahmadu Bello Way",
        adminCity: "Kaduna",
        adminState: "Kaduna",
        documents: [],
      },
    ],
    status: "PENDING_ICU",
    initiatorId: "ops003@email.com",
    initiatorName: "Ibrahim Musa",
    authorisedBy: "chioma.okafor@email.com",
    authorisedAt: "2026-07-06T10:00:00",
    icuApprovedBy: "",
    icuApprovedAt: "",
    rejectionComment: "",
    createdAt: "2026-07-05T09:00:00",
    decidedAt: "",
  },
];

// ──────────────────────────────────────────────────

export default function PendingAdmon({ tab }: { tab: string }) {
  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });
  const { currentUser } = useStore();
  const canApprove = useRolePermission(
    "account_maintenance.admon_approve.approve",
  );
  const canIcu = useRolePermission("account_maintenance.admon_icu.approve");

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [registerId, setRegisterId] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [stage, setStage] = useState("PENDING_AUTH"); // PENDING_AUTH | PENDING_ICU

  const [selected, setSelected] = useState<Admon | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ── Return / Reject dialog state ──
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<Admon | null>(null);
  const [returnComment, setReturnComment] = useState("");
  const [returnBatch, setReturnBatch] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Admon | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectBatch, setRejectBatch] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState(false);

  function openReview(row: Admon) {
    setSelected(row);
    setReviewOpen(true);
  }

  // TODO: Re-enable once GET /admon?status=PENDING_AUTH|PENDING_ICU is live on the API.
  // Until then, the table always shows MOCK_DEMO_ADMONS (see `displayAdmons` below).
  // const { data, isLoading, error, isError, refetch } = useGetAdmons(
  //   {
  //     registerId: registerId !== "" ? registerId : undefined,
  //     from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
  //     to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  //     page: currentPage,
  //     pageSize,
  //     status: stage,
  //   },
  //   { enabled: tab === "pending" },
  // );
  const data: ApiResponse<AdmonListResponse> = {
    isSuccessful: true,
    responseMessage: "Admons fetched successfully",
    responseCode: "200",
    statusCode: "200",
    time: new Date().toISOString(),
    data: {
      data: MOCK_DEMO_ADMONS,
      page: 1,
      pageSize: 20,
      total: MOCK_DEMO_ADMONS.length,
      totalPages: 1,
    },
  };
  const isLoading = false;
  const isError = false;
  const error = null as Error | null;
  const refetch = () => {};

  const batchApproveMutation = useBatchAuthoriseAdmons();
  const batchRejectMutation = useBatchRejectAdmons();
  const batchReturnMutation = useBatchReturnAdmons();

  const pendingAdmons = data?.data?.data || [];
  const displayAdmons =
    pendingAdmons.length === 0 ? MOCK_DEMO_ADMONS : pendingAdmons;
  const totalPages = data?.data?.totalPages || 1;
  const total = data?.data?.total || 0;

  // An OPS Authoriser may only act on PENDING_AUTH rows; ICU may only act on
  // PENDING_ICU rows — never each other's stage, even though both stages
  // can appear in the same table (e.g. the demo mock data mixes them).
  function canActOn(row: Admon): boolean {
    if (row.status === "PENDING_AUTH") return canApprove;
    if (row.status === "PENDING_ICU") return canIcu;
    return false;
  }
  const hasAnyApprovalRole = canApprove || canIcu;

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSelectAll(ids: number[]) {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }

  // ── Batch handlers ──
  function handleBatchApprove() {
    if (selectedIds.size === 0 || !currentUser) return;
    batchApproveMutation.mutate(
      {
        ids: Array.from(selectedIds).map(String),
        comment: "Batch approved",
        authorisedBy: currentUser.email,
      },
      {
        onSuccess: () => {
          toast.success(`${selectedIds.size} approved.`);
          setSelectedIds(new Set());
          refetch();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function openBatchReturn() {
    setReturnBatch(true);
    setReturnComment("");
    setReturnOpen(true);
  }
  function openBatchReject() {
    setRejectBatch(true);
    setRejectComment("");
    setRejectConfirm(false);
    setRejectOpen(true);
  }

  function handleReturn() {
    const comment = returnComment.trim();
    if (!comment) {
      toast.error("Please enter a reason for returning.");
      return;
    }
    if (!currentUser) return;
    const targetIds = returnBatch
      ? Array.from(selectedIds).map(String)
      : [String(returnTarget?.id ?? "")];
    batchReturnMutation.mutate(
      {
        ids: targetIds,
        comment,
        authorisedBy: currentUser.email,
      },
      {
        onSuccess: () => {
          toast.success(
            returnBatch
              ? `${selectedIds.size} returned to initiator.`
              : "Returned to initiator.",
          );
          setReturnOpen(false);
          setReviewOpen(false);
          setSelectedIds(new Set());
          setReturnTarget(null);
          refetch();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleRejectTerminal() {
    const comment = rejectComment.trim();
    if (!comment) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    if (!currentUser) return;
    const targetIds = rejectBatch
      ? Array.from(selectedIds).map(String)
      : [String(rejectTarget?.id ?? "")];
    batchRejectMutation.mutate(
      {
        ids: targetIds,
        comment: `[REJECTED] ${comment}`,
        authorisedBy: currentUser.email,
      },
      {
        onSuccess: () => {
          toast.error(
            rejectBatch
              ? `${selectedIds.size} permanently rejected.`
              : "Request permanently rejected.",
          );
          setRejectOpen(false);
          setRejectConfirm(false);
          setSelectedIds(new Set());
          setRejectTarget(null);
          refetch();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  // ── Single-row action openers ──
  function openReturn(row: Admon) {
    setReturnBatch(false);
    setReturnTarget(row);
    setReturnComment("");
    setReturnOpen(true);
  }
  function openReject(row: Admon) {
    setRejectBatch(false);
    setRejectTarget(row);
    setRejectComment("");
    setRejectConfirm(false);
    setRejectOpen(true);
  }

  const visibleIds = displayAdmons
    .filter((r) => r.id > 0 && canActOn(r))
    .map((r) => r.id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  // Every administrator/executor must have at least one supporting document.
  function hasDocuments(row: Admon): boolean {
    if (!row.administrators || row.administrators.length === 0) return false;
    return row.administrators.every((a) => (a.documents?.length ?? 0) > 0);
  }

  function stageBadge(s: string) {
    if (s === "PENDING_ICU")
      return (
        <Badge
          variant="outline"
          className="text-[10px] bg-purple-50 text-purple-700 border-purple-200"
        >
          ICU
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
      >
        Auth
      </Badge>
    );
  }

  if (isLoading) return <EntitlementTableSkeleton />;

  return (
    <>
      <div className="flex gap-2 items-center flex-wrap">
        <Select
          value={registerId}
          onValueChange={(v) => setRegisterId(v || "")}
        >
          <SelectTrigger className="w-44 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Registers</SelectItem>
            {activeRegisters?.content?.map((r) => (
              <SelectItem key={r.registerId} value={r.symbol}>
                {r.registerName} · {r.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stage filter */}
        <Select
          value={stage}
          onValueChange={(v) => setStage(v || "PENDING_AUTH")}
        >
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING_AUTH">Pending Authorisation</SelectItem>
            <SelectItem value="PENDING_ICU">Pending ICU</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-1.5">
          <DateRangePicker
            className="mt-0"
            date={dateRange}
            setDate={setDateRange}
          />
        </div>
      </div>

      {/* ── Batch action bar ── */}
      {hasAnyApprovalRole && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={openBatchReject}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={openBatchReturn}
            >
              Return to Initiator
            </Button>
            <Button
              size="sm"
              disabled={batchApproveMutation.isPending}
              onClick={handleBatchApprove}
            >
              {batchApproveMutation.isPending
                ? "Approving..."
                : "Approve Selected"}
            </Button>
          </div>
        </div>
      )}

      <Card className="mrpsl-card overflow-hidden">
        {isError ? (
          <DataErrorState
            message={error?.message || "Failed to load ADMORs."}
            onRetry={refetch}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                {hasAnyApprovalRole && (
                  <th className="p-3 w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleSelectAll(visibleIds)}
                    />
                  </th>
                )}
                <th className="p-3">STAGE</th>
                <th className="p-3">DATE</th>
                <th className="p-3">ACCOUNT</th>
                <th className="p-3">ORIGINAL DECEASED</th>
                <th className="p-3">PROBATE NO</th>
                <th className="p-3">DOCUMENTS</th>
                <th className="p-3">SUBMITTED BY</th>
                <th className="p-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {displayAdmons.length > 0 ? (
                displayAdmons.map((row) => (
                  <tr key={row.id} className="mrpsl-table-row">
                    {hasAnyApprovalRole && (
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          disabled={row.id <= 0 || !canActOn(row)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </td>
                    )}
                    <td className="p-3">{stageBadge(row.status)}</td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="p-3 font-mono">
                      {row.deceasedAccountNumbers?.join(", ")}
                    </td>
                    <td className="p-3 font-medium">
                      {row.deceasedHolderName}
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {row.probateNumber}
                    </td>
                    <td className="p-3">
                      {hasDocuments(row) ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-300 text-[11px]"
                        >
                          Complete
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-300 text-[11px]"
                        >
                          Pending
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {row.initiatorName}
                    </td>
                    <td className="p-3">
                      {canActOn(row) ? (
                        <div className="flex items-center gap-1">
                          <Button size="sm" onClick={() => openReview(row)}>
                            Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-300 text-amber-700 hover:bg-amber-50 text-[11px] px-2"
                            onClick={() => openReturn(row)}
                          >
                            Return
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50 text-[11px] px-2"
                            onClick={() => openReject(row)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReview(row)}
                        >
                          View Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={hasAnyApprovalRole ? 9 : 8}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No pending ADMORs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
      <PaginationBar
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        total={total}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <AdmonReviewDialog
        reviewOpen={reviewOpen}
        setReviewOpen={setReviewOpen}
        selected={selected}
        canApprove={selected ? canActOn(selected) : false}
        onSuccess={refetch}
        onReturn={() => {
          if (selected) openReturn(selected);
        }}
      />

      {/* ── Return to Initiator dialog ── */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return to Initiator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <p className="text-[13px] text-muted-foreground">
              This sends the request back to the initiator as a draft. They can
              edit and resubmit.
            </p>
            <div className="space-y-2">
              <label className="mrpsl-label">Reason (required)</label>
              <Textarea
                value={returnComment}
                onChange={(e) => setReturnComment(e.target.value)}
                placeholder="e.g. Bank confirmation missing passport stamp"
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReturnOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleReturn}
                disabled={batchReturnMutation.isPending}
              >
                {batchReturnMutation.isPending
                  ? "Processing..."
                  : returnBatch
                    ? "Return Selected to Initiator"
                    : "Return to Initiator"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reject (terminal) dialog ── */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Request{rejectBatch ? "s" : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-800 flex items-start gap-2">
              <span className="text-lg shrink-0">⚠️</span>
              <span>
                This action <strong>cannot be undone</strong>. The initiator
                will not be able to edit or reuse this form. It will be
                permanently archived.
              </span>
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Rejection Reason (required)</label>
              <Textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="e.g. Suspected forged documents, Court order denied..."
                className="resize-none"
              />
            </div>
            {!rejectConfirm ? (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!rejectComment.trim()) {
                      toast.error("Please enter a rejection reason.");
                      return;
                    }
                    setRejectConfirm(true);
                  }}
                >
                  Continue
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] font-semibold text-destructive text-center">
                  Are you sure you want to completely reject{" "}
                  {rejectBatch
                    ? `these ${selectedIds.size} requests`
                    : "this request"}
                  ?
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setRejectConfirm(false)}
                  >
                    Go Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRejectTerminal}
                    disabled={batchRejectMutation.isPending}
                  >
                    {batchRejectMutation.isPending
                      ? "Rejecting..."
                      : `Yes — Reject ${rejectBatch ? selectedIds.size : ""} Permanently`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

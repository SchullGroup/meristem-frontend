"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, Scissors, AlertCircle, X, Pencil, Loader2, Plus, History } from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  APPROVE_CERTIFICATE_SPLIT,
  BATCH_CERTIFICATE_SPLIT_DECISION,
  DISABLE_CERTIFICATE,
  GET_CSCS_SHAREHOLDER_LOOKUP,
  GET_PENDING_SPLIT_REQUESTS,
  REJECT_CERTIFICATE_SPLIT,
  SUBMIT_CERTIFICATE_SPLIT_FOR_APPROVAL,
} from "@/actions/certSplitAction";
import { getUser } from "@/services/AuthServices";
import { formatCustomDate, generateCertString } from "@/utils/helperFunctions";

type PendingSplit = {
  id: string;
  date: string;
  origCert: string;
  holder: string;
  account: string;
  register: string;
  totalUnits: number;
  parts: number;
  partUnits: number[];
  partUnitsIds?: string[];
  submittedBy: string;
  registerSymbol: string;
  sourceCertId?: string;
  authorizedBy?: string;
  authorizerRole?: string;
  authorizedAt?: string;
  status: string;
  comment?: string;
};

type SplitProp = {
  id: string;
  sourceCertId?: string;
  status: string;
  reason?: string;
  submittedAt: string;
  sourceCertNumber: string;
  holderName: string;
  accountNumber: string;
  registerId: string;
  registerSymbol: string;
  totalUnits: number;
  parts: number;
  submittedBy: string;
  splits: { units: number; certNumber: string }[];
  authoriserComment?: string;
  authorizedBy?: string;
  authorizerRole?: string;
  authorizedAt?: string;
  certificateId: string;
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function SplitPage() {
  const user = getUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("history");
  const [activeCert, setActiveCert] = useState<SplitProp | null>(null);
  const [certFound, setCertFound] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<PendingSplit | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [lastRejComment, setLastRejComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchComment, setBatchComment] = useState("");
  const [editingRejected, setEditingRejected] = useState<PendingSplit | null>(null);
  const [numParts, setNumParts] = useState("2");
  const [partUnits, setPartUnits] = useState(["", ""]);
  const [splitReason, setSplitReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const { data: lookUpData, isLoading: isLookUpLoading } = useQuery({
    queryKey: ["cscs-shareholder-lookup", activeSearchTerm],
    queryFn: () => GET_CSCS_SHAREHOLDER_LOOKUP(activeSearchTerm),
    enabled: !!activeSearchTerm,
  });

  const [lookUpDataState, setLookUpDataState] = useState<any>(null);

  useEffect(() => {
    if (lookUpData?.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLookUpDataState(lookUpData?.data);
    }
  }, [lookUpData]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast.error("Search term is required");
      return;
    }
    setActiveSearchTerm(searchTerm);
    setCertFound(true);
  };

  // Prefill + auto-search when navigated from the certificate enquiry page
  const searchParams = useSearchParams();
  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      //eslint-disable-next-line
      setSearchTerm(search);
      setActiveSearchTerm(search);
      setCertFound(true);
      setActiveTab("split");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: splitsData } = useQuery({
    queryKey: ["pending-splits"],
    queryFn: GET_PENDING_SPLIT_REQUESTS,
  });

  const splitslist = splitsData?.data?.content;

  // All splits for the history tab
  const allMappedSplits: PendingSplit[] = (splitslist || []).map((s: SplitProp) => ({
    id: s.id,
    date: s.submittedAt ? formatCustomDate(s.submittedAt) : "-",
    origCert: s.sourceCertNumber || "-",
    holder: s.holderName || "-",
    account: s.accountNumber || "-",
    register: s.registerId || "-",
    registerSymbol: s.registerSymbol || "-",
    totalUnits: s.totalUnits || 0,
    parts: s.parts || 0,
    partUnits: s.splits?.map((split: { units: number }) => split.units) || [],
    partUnitsIds: s.splits?.map((p: { certNumber: string }) => p.certNumber) || [],
    submittedBy: s.submittedBy || "-",
    sourceCertId: s.sourceCertId,
    authorizedBy: s.authorizedBy || "-",
    authorizerRole: s.authorizerRole || "-",
    authorizedAt: formatCustomDate(s.authorizedAt) || "-",
    status: s.status || "-",
    comment: s.reason || "",
  }));

  const mappedSplits: PendingSplit[] = (splitslist || [])
    ?.filter((s: { status: string }) => s?.status !== "REJECTED")
    .map((s: SplitProp) => ({
      id: s.id,
      date: s.submittedAt ? formatCustomDate(s.submittedAt) : "-",
      origCert: s.sourceCertNumber || "-",
      holder: s.holderName || "-",
      account: s.accountNumber || "-",
      register: s.registerId || "-",
      registerSymbol: s.registerSymbol || "-",
      totalUnits: s.totalUnits || 0,
      parts: s.parts || 0,
      partUnits: s.splits?.map((split: { units: number }) => split.units) || [],
      partUnitsIds: s.splits?.map((partNumber: { certNumber: string }) => partNumber.certNumber) || [],
      submittedBy: s.submittedBy || "-",
      sourceCertId: s.sourceCertId,
      authorizedBy: s.authorizedBy || "-",
      authorizerRole: s.authorizerRole || "-",
      authorizedAt: formatCustomDate(s.authorizedAt) || "-",
      status: s.status || "-",
    }));

  const disableCertificateMutation = useMutation({
    mutationFn: DISABLE_CERTIFICATE,
    onSuccess: (data) => {
      toast.success(data.data.message || "Certificate disabled successfully!");
      queryClient.invalidateQueries({ queryKey: ["pending-splits"] });
      setReviewOpen(false);
      setActiveCert(null);
      setCertFound(false);
      setPartUnits([""]);
      setNumParts("1");
      setSplitReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disable certificate");
    },
  });

  const sumbitForApprovalMutation = useMutation({
    mutationFn: SUBMIT_CERTIFICATE_SPLIT_FOR_APPROVAL,
    onSuccess: () => {
      toast.success("Split request submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["pending-splits"] });
      setEditingRejected(null);
      setCertFound(false);
      setPartUnits([""]);
      setNumParts("1");
      setSplitReason("");
      setActiveCert(null);
      setLookUpDataState(null);
      setActiveSearchTerm("");
      setSearchTerm("");
      setActiveTab("history");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit split request");
    },
  });

  const approveSplitMutation = useMutation({
    mutationFn: APPROVE_CERTIFICATE_SPLIT,
    onSuccess: (data) => {
      toast.success(data.data.message || "Split request approved successfully!");
      queryClient.invalidateQueries({ queryKey: ["pending-splits"] });
      setReviewOpen(false);
      disableCertificateMutation.mutate({
        id: selected?.sourceCertId || "",
        reason: "Certificate split",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve split request");
    },
  });

  const rejectSplitMutation = useMutation({
    mutationFn: REJECT_CERTIFICATE_SPLIT,
    onSuccess: (data) => {
      toast.success(data.data.message || "Split request rejected successfully!");
      queryClient.invalidateQueries({ queryKey: ["pending-splits"] });
      setReviewOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject split request");
    },
  });

  const batchApproveMutation = useMutation({
    mutationFn: BATCH_CERTIFICATE_SPLIT_DECISION,
    onSuccess: (data) => {
      toast.success(data.data.message || "Split request approved successfully!");
      queryClient.invalidateQueries({ queryKey: ["pending-splits"] });
      setReviewOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject split request");
    },
  });

  function handleBatchApprove() {
    const payload = {
      approveIds: [...selectedIds],
      rejectIds: [],
      rejectComment: "",
      authorisedBy: user?.email,
    };
    batchApproveMutation.mutate({ payload });
    setSelectedIds(new Set());
  }

  const handleSubmit = () => {
    if (!activeCert?.certificateId) {
      toast.error("Please select a certificate");
      return;
    }
    if (partUnits.some((u) => !u || Number(u) <= 0 || isNaN(Number(u)))) {
      toast.error("Please enter valid units for all parts");
      return;
    }
    if (!splitReason) {
      toast.error("Please enter a reason");
      return;
    }
    const payload = {
      sourceCertId: activeCert?.certificateId || activeCert?.sourceCertId,
      splits: partUnits.map((unit) => ({
        certNumber: generateCertString(activeCert?.registerSymbol),
        units: Number(unit),
      })),
      reason: splitReason,
      submittedBy: user?.email,
    };
    sumbitForApprovalMutation.mutate({ payload });
  };

  const handleApproveSplit = () => {
    const payload = {
      comment: rejectComment,
      authorisedBy: user?.email,
    };
    if (selected) {
      approveSplitMutation.mutate({ payload, splitId: selected.id });
    }
  };

  const handleRejectSplit = () => {
    if (!rejectComment.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    const payload = {
      comment: rejectComment,
      authorisedBy: user?.email,
    };
    if (selected) {
      rejectSplitMutation.mutate({ payload, splitId: selected.id });
    }
  };

  function openReview(row: PendingSplit) {
    setSelected(row);
    setRejectComment("");
    setReviewOpen(true);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll(ids: string[]) {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }

  function handleBatchReject() {
    if (!batchComment.trim()) {
      toast.error("Comment required for rejection.");
      return;
    }
    const payload = {
      approveIds: [],
      rejectIds: [...selectedIds],
      rejectComment: batchComment,
      authorisedBy: user?.email,
    };
    batchApproveMutation.mutate({ payload });
    setRejectedIds((prev) => new Set([...prev, ...selectedIds]));
    setLastRejComment(batchComment);
    setSelectedIds(new Set());
    setBatchComment("");
    setBatchRejectOpen(false);
  }

  // Navigate to New Split tab pre-filled with rejected split data
  function handleEditFromHistory(split: PendingSplit) {
    setActiveCert({
      id: split.id,
      sourceCertId: split.sourceCertId,
      certificateId: split.sourceCertId || split.id,
      registerSymbol: split.registerSymbol,
      status: split.status,
      submittedAt: split.date,
      sourceCertNumber: split.origCert,
      holderName: split.holder,
      accountNumber: split.account,
      registerId: split.register,
      totalUnits: split.totalUnits,
      parts: split.parts,
      submittedBy: split.submittedBy,
      splits: split.partUnits.map((u, i) => ({
        units: u,
        certNumber: split.partUnitsIds?.[i] || "",
      })),
      authorizedBy: split.authorizedBy,
      authorizerRole: split.authorizerRole,
      authorizedAt: split.authorizedAt,
    });
    setEditingRejected(split);
    setCertFound(true);
    setNumParts(String(split.parts));
    setPartUnits(split.partUnits.map(String));
    setSplitReason("");
    setActiveTab("split");
  }

  const pendingSplits = mappedSplits.filter(
    (row) => row.status === "PENDING" && !rejectedIds.has(row.id),
  );
  const approvedSplits = mappedSplits.filter(
    (row) => row.status === "APPROVED",
  );
  const allSplitsPg = usePagination(allMappedSplits);
  const splitPg = usePagination(pendingSplits);
  const approvedPg = usePagination(approvedSplits);
  const visibleSplitIds = splitPg.paged.map((r) => r.id);
  const splitAllSelected =
    visibleSplitIds.length > 0 &&
    visibleSplitIds.every((id) => selectedIds.has(id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Split
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Split a single certificate into multiple smaller denominations
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "history")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            All Certificate Splits
          </TabsTrigger>
          <TabsTrigger
            value="split"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Split
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Approved
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">

          {/* ── All Certificate Splits (history) ── */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Full history of all certificate split requests across all statuses.
                </p>
              </div>
              <Button
                className="gap-1.5"
                onClick={() => {
                  setEditingRejected(null);
                  setActiveCert(null);
                  setCertFound(false);
                  setPartUnits(["", ""]);
                  setNumParts("2");
                  setSplitReason("");
                  setActiveTab("split");
                }}
              >
                <Plus className="h-4 w-4" />
                New Certificate Split
              </Button>
            </div>

            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ORIGINAL CERT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3 text-right">TOTAL UNITS</th>
                    <th className="p-3">PARTS</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {allSplitsPg.paged.map((row) => (
                    <tr
                      key={row.id}
                      className={`mrpsl-table-row ${row.status === "REJECTED" ? "bg-red-50/30" : ""}`}
                    >
                      <td className="p-3 text-muted-foreground whitespace-nowrap">{row.date}</td>
                      <td className="p-3 font-mono whitespace-nowrap">{row.origCert}</td>
                      <td className="p-3 font-medium whitespace-nowrap">{row.holder}</td>
                      <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">{row.account}</td>
                      <td className="p-3 text-right tabular-nums font-semibold whitespace-nowrap">
                        {row.totalUnits.toLocaleString()}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-[12px]">
                          {row.parts} parts
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">{row.submittedBy}</td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          className={`border-0 text-[12px] ${STATUS_BADGE[row.status] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {row.status === "PENDING" ? "Pending Approval" : row.status === "APPROVED" ? "Approved" : "Rejected"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {row.status === "REJECTED" ? (
                          <div className="flex flex-col items-end gap-1.5">
                            {row.comment && (
                              <p className="text-[11px] text-red-600 max-w-45 text-right leading-tight">
                                {row.comment}
                              </p>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50 gap-1.5"
                              onClick={() => handleEditFromHistory(row)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit Certificate Split
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReview(row)}
                          >
                            View
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allSplitsPg.total === 0 && (
                    <tr>
                      <td colSpan={9} className="p-14 text-center text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        No certificate split requests yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={allSplitsPg.page}
              pageSize={allSplitsPg.pageSize}
              totalPages={allSplitsPg.totalPages}
              from={allSplitsPg.from}
              to={allSplitsPg.to}
              total={allSplitsPg.total}
              onPageChange={allSplitsPg.setPage}
              onPageSizeChange={allSplitsPg.setPageSize}
            />
          </TabsContent>

          {/* ── New Split ── */}
          <TabsContent value="split" className="space-y-4">
            {editingRejected && (
              <Card className="mrpsl-card p-3 border-l-4 border-l-amber-400 bg-amber-50/60 border-amber-200 flex items-center gap-3">
                <Pencil className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-[13px] text-amber-800 font-medium flex-1">
                  Editing rejected request for{" "}
                  <span className="font-semibold">{editingRejected.origCert}</span>
                  {editingRejected.comment && (
                    <span className="ml-1 font-normal text-amber-700">
                      — Rejection reason: &ldquo;{editingRejected.comment}&rdquo;
                    </span>
                  )}
                  . Make your changes below and resubmit.
                </p>
                <button
                  onClick={() => {
                    setEditingRejected(null);
                    setCertFound(false);
                    setActiveCert(null);
                  }}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )}
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-2 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Find Certificate
                </h3>
                <Card className="mrpsl-card p-4 space-y-4">
                  <Input
                    placeholder="Name, Account No, or CHN"
                    className="mrpsl-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleSearch}>
                    Search
                  </Button>
                  {isLookUpLoading ? (
                    <div className="mt-4 pt-4 border-t text-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : lookUpDataState?.length > 0 ? (
                    <div className="mt-4 pt-4 border-t animate-in fade-in space-y-4 max-h-100 overflow-y-auto">
                      {lookUpDataState?.map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => setActiveCert(item)}
                          className={`space-y-2 cursor-pointer p-4 rounded-xl border transition-colors ${activeCert?.id === item.id
                              ? "bg-primary/5 border-primary"
                              : "hover:bg-muted/50 border-transparent"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-lg font-bold">
                              {item?.registerName}
                            </div>
                            {item.status === "ACTIVE" && (
                              <Badge className="bg-green-100 text-green-700 border-0 text-[12px]">
                                ACTIVE
                              </Badge>
                            )}
                          </div>
                          <div className="text-[12px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded inline-block">
                            {item?.registerId}
                          </div>
                          <div className="text-sm">
                            Holder:{" "}
                            <span className="font-medium">
                              {item.firstName + " " + item.lastName}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {item.accountNumber || item.chn || "N/A"}
                          </div>
                          <div className="text-3xl tabular-nums font-bold mt-2">
                            {item?.holdings?.toLocaleString() || 0}
                          </div>
                          <div className="text-[13px] text-muted-foreground">
                            units
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeSearchTerm ? (
                    <div className="mt-4 pt-4 border-t text-center py-6 text-sm text-muted-foreground">
                      No certificates found for &quot;{activeSearchTerm}&quot;
                    </div>
                  ) : null}
                </Card>
              </div>

              <div className="col-span-3 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Configure Split
                </h3>
                {activeCert?.certificateId ? (
                  <Card className="mrpsl-card p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="mrpsl-label">Number of Parts</label>
                        <Select
                          value={numParts}
                          onValueChange={(v) => {
                            const n = v ?? "2";
                            setNumParts(n);
                            setPartUnits(Array(Number(n)).fill(""));
                          }}
                        >
                          <SelectTrigger className="mrpsl-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Parts</SelectItem>
                            <SelectItem value="3">3 Parts</SelectItem>
                            <SelectItem value="4">4 Parts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: Number(numParts) }, (_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <span className="text-sm font-medium w-16">
                            Part {i + 1}
                          </span>
                          <Input
                            type="number"
                            value={partUnits[i] ?? ""}
                            onChange={(e) =>
                              setPartUnits((prev) => {
                                const next = [...prev];
                                next[i] = e.target.value;
                                return next;
                              })
                            }
                            className="mrpsl-input font-mono w-32"
                          />
                          <span className="text-sm text-muted-foreground">
                            units
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-green-50 border border-green-200 text-green-800 p-2 rounded text-sm font-mono text-center">
                      Sum:{" "}
                      {partUnits
                        .reduce((s, v) => s + (Number(v) || 0), 0)
                        .toLocaleString()}{" "}
                      /{" "}
                      {editingRejected
                        ? editingRejected.totalUnits.toLocaleString()
                        : "—"}{" "}
                      units{" "}
                      {partUnits.reduce((s, v) => s + (Number(v) || 0), 0) ===
                        (editingRejected?.totalUnits ?? 0) && editingRejected
                        ? "✓"
                        : ""}
                    </div>
                    <Textarea
                      value={splitReason}
                      onChange={(e) => setSplitReason(e.target.value)}
                      placeholder="Reason for split..."
                      className="focus-visible:ring-primary"
                    />
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={sumbitForApprovalMutation.isPending}
                    >
                      {editingRejected
                        ? "Resubmit for Approval"
                        : "Submit for Approval"}
                      {sumbitForApprovalMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </Button>
                  </Card>
                ) : (
                  <Card className="mrpsl-card p-12 text-center text-muted-foreground flex flex-col items-center">
                    <Scissors className="h-8 w-8 mb-4 opacity-20" />
                    Search for a certificate first to configure a split.
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Pending Approvals ── */}
          <TabsContent value="auth" className="space-y-4">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                <span className="text-sm font-semibold text-primary">
                  {selectedIds.size} selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => setBatchRejectOpen(true)}
                  >
                    Reject Selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBatchApprove}
                    disabled={batchApproveMutation.isPending}
                  >
                    Approve Selected
                    {batchApproveMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={splitAllSelected}
                        onCheckedChange={() => toggleSelectAll(visibleSplitIds)}
                      />
                    </th>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ORIGINAL CERT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3 text-right">TOTAL UNITS</th>
                    <th className="p-3">PARTS</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {splitPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </td>
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.origCert}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {row.account}
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        {row.totalUnits.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                          {row.parts} parts
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.submittedBy}
                      </td>
                      <td className="p-3 text-right">
                        {row?.status === "APPROVED" ? (
                          <Button
                            className="bg-green-50 text-green-700 border-green-300"
                            size="sm"
                            onClick={() => openReview(row)}
                          >
                            Approved
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => openReview(row)}>
                            Review &amp; Decide
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {splitPg.total === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-12 text-center text-muted-foreground"
                      >
                        No pending split approvals.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={splitPg.page}
              pageSize={splitPg.pageSize}
              totalPages={splitPg.totalPages}
              from={splitPg.from}
              to={splitPg.to}
              total={splitPg.total}
              onPageChange={splitPg.setPage}
              onPageSizeChange={splitPg.setPageSize}
            />
          </TabsContent>

          {/* ── Approved ── */}
          <TabsContent value="approved" className="space-y-4">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ORIGINAL CERT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3 text-right">TOTAL UNITS</th>
                    <th className="p-3">PARTS</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3">APPROVED BY</th>
                    <th className="p-3 text-right">APPROVED AT</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {approvedPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.origCert}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {row.account}
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        {row.totalUnits.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                          {row.parts} parts
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.submittedBy}
                      </td>
                      <td className="p-3 font-medium">{row.authorizedBy}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        {row.authorizedAt}
                      </td>
                    </tr>
                  ))}
                  {approvedPg.total === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-12 text-center text-muted-foreground"
                      >
                        No approved splits yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={approvedPg.page}
              pageSize={approvedPg.pageSize}
              totalPages={approvedPg.totalPages}
              from={approvedPg.from}
              to={approvedPg.to}
              total={approvedPg.total}
              onPageChange={approvedPg.setPage}
              onPageSizeChange={approvedPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Review dialog ── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Certificate Split</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 px-6 pb-6 overflow-y-auto max-h-[75vh]">
              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="mrpsl-section-title mb-0.5">
                      Original Certificate
                    </div>
                    <div className="font-mono font-bold text-sm">
                      {selected.origCert}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded shrink-0">
                    {selected.registerSymbol} - {selected.register}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                  <div>
                    <div className="mrpsl-section-title">Holder</div>
                    <div className="font-semibold text-sm mt-0.5">
                      {selected.holder}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Account</div>
                    <div className="font-mono text-[13px] text-muted-foreground mt-0.5">
                      {selected.account}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Total Units</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      {selected.totalUnits.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Parts</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      {selected.parts}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  Split Distribution
                </div>
                <table className="w-full text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-2 text-left">PART</th>
                      <th className="px-4 py-2">UNITS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {selected.partUnits.map((u, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2 font-medium">Part {i + 1}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-semibold">
                          {u.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/20">
                      <td className="px-4 py-2 text-[13px] font-bold text-muted-foreground uppercase tracking-wide">
                        Total
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold">
                        {selected.totalUnits.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                  Approval Chain
                </h4>
                <div className="space-y-4">
                  {((): Array<{
                    label: string;
                    done: boolean;
                    pending?: boolean;
                    time?: string | null;
                  }> => [
                      {
                        label: `Submitted by ${selected.submittedBy}`,
                        done: selected.submittedBy ? true : false,
                        time: selected.date,
                      },
                      {
                        label: `Authorised by ${selected.authorizedBy} (${selected.authorizerRole})`,
                        done: selected.authorizedBy !== "-" ? true : false,
                        time: selected.authorizedAt,
                      },
                    ])().map(
                      (step, i) =>
                        step.done && (
                          <div key={i} className="flex items-start gap-3">
                            <div
                              className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "bg-green-500" : step.pending ? "bg-amber-200 animate-pulse" : "border-2 border-muted bg-background"}`}
                            >
                              {step.done && (
                                <Check
                                  className="h-3 w-3 text-white"
                                  style={{ strokeWidth: 3 }}
                                />
                              )}
                            </div>
                            <div>
                              <div className="text-sm">{step.label}</div>
                              {step.time && (
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {step.time}
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                    )}
                </div>
              </div>

              {selected?.status !== "APPROVED" && (
                <div className="space-y-2">
                  <label className="mrpsl-label">Comment</label>
                  <Textarea
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="Required for rejection..."
                    className="resize-none"
                  />
                </div>
              )}

              {selected?.status !== "APPROVED" && (
                <div className="flex gap-3 pt-4 border-t border-border/60">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleRejectSplit}
                    disabled={rejectSplitMutation.isPending}
                  >
                    Reject
                    {rejectSplitMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleApproveSplit}
                    disabled={approveSplitMutation.isPending}
                  >
                    Approve Split
                    {approveSplitMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Batch reject dialog ── */}
      <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Reject {selectedIds.size} Record
              {selectedIds.size !== 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              This comment will be applied to all selected records and sent to
              the initiator.
            </p>
            <div className="space-y-2">
              <label className="mrpsl-label">
                Rejection Comment <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={batchComment}
                onChange={(e) => setBatchComment(e.target.value)}
                placeholder="State reason for rejection..."
                className="resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-2 border-t">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setBatchRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleBatchReject}
                disabled={batchApproveMutation.isPending}
              >
                Confirm Rejection
                {batchApproveMutation.isPending && (
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

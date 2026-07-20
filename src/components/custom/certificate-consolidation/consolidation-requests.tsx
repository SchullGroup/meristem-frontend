"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  X,
  CheckSquare,
  AlertCircle,
  Pencil,
} from "lucide-react";
import {
  MOCK_HOLDERS,
  SEED_CONSOLIDATION_REQUESTS,
  ConsolidationRequest,
  MockHolder,
  MockAccountShare,
  generateConsolidationCertNo,
} from "./consolidation-mock";
import { formatNumber } from "@/lib/utils/format";
import { toast } from "sonner";

interface Props {
  requests: ConsolidationRequest[];
  onCreateRequest: (req: ConsolidationRequest) => void;
  onEditRequest: (id: string, updates: Partial<ConsolidationRequest>) => void;
  prefillHolder?: MockHolder | null;
  prefillRegister?: string;
  onPrefillConsumed?: () => void;
}

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export function ConsolidationRequests({
  requests,
  onCreateRequest,
  onEditRequest,
  prefillHolder,
  prefillRegister,
  onPrefillConsumed,
}: Props) {
  // ── View ──────────────────────────────────────────────────────────────────
  const [view, setView] = useState<"list" | "new" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── List state ────────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [viewDetails, setViewDetails] = useState<ConsolidationRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Form state ────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MockHolder[]>([]);
  const [foundHolder, setFoundHolder] = useState<MockHolder | null>(null);
  const [selectedRegister, setSelectedRegister] = useState<string | null>(null);
  const [expandedRegisters, setExpandedRegisters] = useState<Set<string>>(new Set());
  const [selectedCertIds, setSelectedCertIds] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");

  // ── Prefill effect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (prefillHolder && view === "list") {
      setFoundHolder(prefillHolder);
      if (prefillRegister) {
        setSelectedRegister(prefillRegister);
        const expanded = prefillHolder.accounts
          .filter((a) => a.shares.some((s) => s.register === prefillRegister))
          .map((a) => a.accountNo);
        setExpandedRegisters(new Set(expanded));
      } else {
        setExpandedRegisters(new Set(prefillHolder.accounts.map((a) => a.accountNo)));
      }
      setView("new");
      onPrefillConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillHolder]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function resetForm() {
    setSearchTerm("");
    setSearchResults([]);
    setFoundHolder(null);
    setSelectedRegister(null);
    setExpandedRegisters(new Set());
    setSelectedCertIds(new Set());
    setReason("");
    setEditingId(null);
  }

  function handleSearch() {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return;
    const results = MOCK_HOLDERS.filter(
      (h) =>
        h.name.toLowerCase().includes(term) ||
        h.accounts.some(
          (a) =>
            a.accountNo.toLowerCase().includes(term) ||
            a.chn.toLowerCase().includes(term)
        )
    );
    setSearchResults(results);
  }

  function handleSelectHolder(holder: MockHolder) {
    setFoundHolder(holder);
    setSearchResults([]);
    setSearchTerm("");
    setSelectedRegister(null);
    setSelectedCertIds(new Set());
    setExpandedRegisters(new Set(holder.accounts.map((a) => a.accountNo)));
  }

  function getUniqueRegisters(holder: MockHolder) {
    const map = new Map<
      string,
      {
        register: string;
        registerName: string;
        accountCount: number;
        totalCerts: number;
        totalUnits: number;
      }
    >();
    for (const account of holder.accounts) {
      for (const share of account.shares) {
        const existing = map.get(share.register);
        const certCount = share.certificates.length;
        const units = share.certificates.reduce((s, c) => s + c.units, 0);
        if (existing) {
          existing.accountCount += 1;
          existing.totalCerts += certCount;
          existing.totalUnits += units;
        } else {
          map.set(share.register, {
            register: share.register,
            registerName: share.registerName,
            accountCount: 1,
            totalCerts: certCount,
            totalUnits: units,
          });
        }
      }
    }
    return Array.from(map.values());
  }

  function getAccountsForRegister(holder: MockHolder, register: string) {
    return holder.accounts.filter((a) =>
      a.shares.some((s) => s.register === register)
    );
  }

  function getSelectedCerts() {
    if (!foundHolder || !selectedRegister) return [] as { cert: ConsolidationRequest["certificates"][number]; accountNo: string }[];
    const result: { cert: ConsolidationRequest["certificates"][number]; accountNo: string }[] = [];
    for (const account of foundHolder.accounts) {
      for (const share of account.shares) {
        if (share.register !== selectedRegister) continue;
        for (const cert of share.certificates) {
          if (selectedCertIds.has(cert.id)) {
            result.push({ cert, accountNo: account.accountNo });
          }
        }
      }
    }
    return result;
  }

  function handleToggleCert(certId: string) {
    setSelectedCertIds((prev) => {
      const next = new Set(prev);
      if (next.has(certId)) next.delete(certId);
      else next.add(certId);
      return next;
    });
  }

  function handleToggleAccount(accountNo: string) {
    setExpandedRegisters((prev) => {
      const next = new Set(prev);
      if (next.has(accountNo)) next.delete(accountNo);
      else next.add(accountNo);
      return next;
    });
  }

  function handleSubmit() {
    if (!foundHolder || !selectedRegister) return;

    const selectedCerts = getSelectedCerts();

    if (selectedCerts.length < 2) {
      toast.error("Select at least 2 certificates to consolidate");
      return;
    }

    const accountNos = new Set(selectedCerts.map((s) => s.accountNo));
    if (accountNos.size < 2) {
      toast.error("Select certificates from at least 2 different accounts");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please enter a reason");
      return;
    }

    let registerName = "";
    for (const account of foundHolder.accounts) {
      const share = account.shares.find((s) => s.register === selectedRegister);
      if (share) {
        registerName = share.registerName;
        break;
      }
    }

    const firstAccountNo = selectedCerts[0].accountNo;

    const newReq: ConsolidationRequest = {
      id: "CON" + String(Date.now()).slice(-4),
      createdAt: "16 Jul 2026",
      holderName: foundHolder.name,
      holderBvn: foundHolder.bvn,
      accountNo: firstAccountNo,
      register: selectedRegister,
      registerName,
      certificates: selectedCerts.map((s) => s.cert),
      newCertNo: generateConsolidationCertNo(selectedRegister, requests),
      totalUnits: selectedCerts.reduce((s, c) => s + c.cert.units, 0),
      reason: reason.trim(),
      submittedBy: "admin@meristem.com",
      status: "PENDING",
    };

    if (view === "edit" && editingId) {
      onEditRequest(editingId, { ...newReq, status: "PENDING" });
    } else {
      onCreateRequest(newReq);
    }

    toast.success("Consolidation request submitted for ICU approval.");
    resetForm();
    setView("list");
  }

  // ── Filtered requests ─────────────────────────────────────────────────────

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === "ALL") return true;
    return r.status === filterStatus;
  });

  // ── Derived form values ───────────────────────────────────────────────────

  const uniqueRegisters = foundHolder ? getUniqueRegisters(foundHolder) : [];
  const accountsForRegister =
    foundHolder && selectedRegister
      ? getAccountsForRegister(foundHolder, selectedRegister)
      : [];
  const selectedCerts = getSelectedCerts();
  const totalSelectedUnits = selectedCerts.reduce((s, c) => s + c.cert.units, 0);

  // ── LIST VIEW ─────────────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Consolidation Requests</h3>
            <Badge variant="secondary">{requests.length}</Badge>
          </div>
          <Button onClick={() => setView("new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Consolidation Request
          </Button>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2 mt-3">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map(
            (status) => (
              <Button
                key={status}
                size="sm"
                variant={filterStatus === status ? "default" : "outline"}
                onClick={() => setFilterStatus(status)}
              >
                {status === "ALL"
                  ? "All"
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </Button>
            )
          )}
        </div>

        {/* Table */}
        <Card className="mrpsl-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">DATE</th>
                <th className="p-3">HOLDER</th>
                <th className="p-3">REGISTER</th>
                <th className="p-3">CERTS #</th>
                <th className="p-3">TOTAL UNITS</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  className={`mrpsl-table-row${req.status === "REJECTED" ? " bg-red-50/30" : ""}`}
                >
                  <td className="p-3 font-mono text-xs">{req.id}</td>
                  <td className="p-3 text-muted-foreground">{req.createdAt}</td>
                  <td className="p-3 font-medium">{req.holderName}</td>
                  <td className="p-3">
                    <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded dark:bg-blue-950 dark:text-blue-300">
                      {req.register}
                    </span>
                  </td>
                  <td className="p-3 tabular-nums">{req.certificates.length}</td>
                  <td className="p-3 tabular-nums font-semibold">
                    {formatNumber(req.totalUnits)}
                  </td>
                  <td className="p-3">
                    {req.status === "PENDING" && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                        Pending ICU Review
                      </Badge>
                    )}
                    {req.status === "APPROVED" && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300">
                        Approved
                      </Badge>
                    )}
                    {req.status === "REJECTED" && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300">
                        Rejected
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {req.status === "REJECTED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
                        onClick={() => {
                          const editHolder =
                            MOCK_HOLDERS.find((h) => h.bvn === req.holderBvn) ??
                            null;
                          setEditingId(req.id);
                          setFoundHolder(editHolder);
                          setSelectedRegister(req.register);
                          setSelectedCertIds(
                            new Set(req.certificates.map((c) => c.id))
                          );
                          setReason(req.reason);
                          if (editHolder) {
                            const expanded = editHolder.accounts
                              .filter((a) =>
                                a.shares.some((s) => s.register === req.register)
                              )
                              .map((a) => a.accountNo);
                            setExpandedRegisters(new Set(expanded));
                          }
                          setView("edit");
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit & Resubmit
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setViewDetails(req);
                          setDetailOpen(true);
                        }}
                      >
                        View
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Layers className="h-10 w-10 opacity-30" />
                      <span>No consolidation requests found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* Detail Dialog */}
        {viewDetails && (
          <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  Consolidation Request — {viewDetails.id}
                  {viewDetails.status === "APPROVED" && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300">
                      Approved
                    </Badge>
                  )}
                  {viewDetails.status === "PENDING" && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                      Pending ICU Review
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Holder</p>
                    <p className="font-medium">{viewDetails.holderName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Register</p>
                    <p className="font-mono text-xs">
                      {viewDetails.register} — {viewDetails.registerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">New Cert No</p>
                    <p className="font-mono text-xs">{viewDetails.newCertNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Total Units</p>
                    <p className="font-semibold tabular-nums">
                      {formatNumber(viewDetails.totalUnits)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Reason</p>
                    <p>{viewDetails.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Submitted By</p>
                    <p>{viewDetails.submittedBy}</p>
                  </div>
                </div>

                {/* Cert table */}
                <div>
                  <p className="font-medium mb-2">Certificates</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border rounded-lg overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left font-medium">CERT NO</th>
                          <th className="p-2 text-right font-medium">UNITS</th>
                          <th className="p-2 text-left font-medium">ISSUE DATE</th>
                          <th className="p-2 text-left font-medium">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {viewDetails.certificates.map((cert) => (
                          <tr key={cert.id}>
                            <td className="p-2 font-mono">{cert.certNo}</td>
                            <td className="p-2 text-right tabular-nums">
                              {formatNumber(cert.units)}
                            </td>
                            <td className="p-2">{cert.issueDate}</td>
                            <td className="p-2">
                              {cert.status === "DEACTIVATED" ? (
                                <span className="text-red-600 font-medium">
                                  DEACTIVATED
                                </span>
                              ) : (
                                <span className="text-green-600">{cert.status}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Rejection box */}
                {viewDetails.status === "REJECTED" &&
                  viewDetails.rejectionComment && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                            Rejection Reason
                          </p>
                          <p className="text-amber-700 dark:text-amber-400">
                            {viewDetails.rejectionComment}
                          </p>
                          {viewDetails.rejectedBy && (
                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                              By {viewDetails.rejectedBy}
                              {viewDetails.rejectedAt
                                ? ` · ${viewDetails.rejectedAt}`
                                : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setDetailOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // ── CREATE / EDIT FORM VIEW ───────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetForm();
            setView("list");
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h3 className="text-lg font-semibold">
          {view === "edit"
            ? "Edit Consolidation Request"
            : "New Consolidation Request"}
        </h3>
      </div>

      {/* STEP 1 — Holder */}
      <Card className="mrpsl-card p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Step 1 — Select Holder
        </p>

        {!foundHolder ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search by holder name, account no or CHN"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((holder) => (
                  <div
                    key={holder.id}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelectHolder(holder)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{holder.name}</p>
                        <p className="text-xs text-muted-foreground">
                          BVN: {holder.bvn}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{holder.accounts.length} account(s)</p>
                        <p>
                          {holder.accounts.reduce(
                            (s, a) =>
                              s +
                              a.shares.reduce(
                                (ss, sh) => ss + sh.certificates.length,
                                0
                              ),
                            0
                          )}{" "}
                          cert(s)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchTerm && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No holders found. Try a different search term.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between border rounded-lg p-3 bg-accent/30">
            <div>
              <p className="font-semibold text-sm">{foundHolder.name}</p>
              <p className="text-xs text-muted-foreground">BVN: {foundHolder.bvn}</p>
              <p className="text-xs text-muted-foreground">
                {foundHolder.phone} · {foundHolder.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {foundHolder.accounts.length} account(s)
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFoundHolder(null);
                setSelectedRegister(null);
                setSelectedCertIds(new Set());
                setExpandedRegisters(new Set());
                setSearchTerm("");
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Change
            </Button>
          </div>
        )}
      </Card>

      {/* STEP 2 — Select Register */}
      {foundHolder && (
        <Card className="mrpsl-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Step 2 — Select Register to Consolidate
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {uniqueRegisters.map((reg) => {
              const canConsolidate = reg.accountCount >= 2;
              const isSelected = selectedRegister === reg.register;
              return (
                <div
                  key={reg.register}
                  className={[
                    "border rounded-lg p-3 transition-colors select-none",
                    canConsolidate
                      ? "cursor-pointer hover:bg-accent"
                      : "opacity-50 cursor-not-allowed",
                    isSelected ? "ring-2 ring-primary" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (!canConsolidate) return;
                    setSelectedRegister(reg.register);
                    setSelectedCertIds(new Set());
                    const expanded = getAccountsForRegister(
                      foundHolder,
                      reg.register
                    ).map((a) => a.accountNo);
                    setExpandedRegisters(new Set(expanded));
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded dark:bg-blue-950 dark:text-blue-300 shrink-0">
                      {reg.register}
                    </span>
                    {canConsolidate ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs dark:bg-green-900/30 dark:text-green-300 whitespace-nowrap">
                        Consolidation Recommended
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        Single Account
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-sm">{reg.registerName}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>{reg.accountCount} account(s)</span>
                    <span>{reg.totalCerts} cert(s)</span>
                    <span>{formatNumber(reg.totalUnits)} units</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* STEP 3 — Select Certificates */}
      {foundHolder && selectedRegister && (
        <Card className="mrpsl-card p-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Step 3 — Select Certificates
          </p>

          {accountsForRegister.map((account) => {
            const share = account.shares.find(
              (s) => s.register === selectedRegister
            );
            if (!share) return null;
            const isExpanded = expandedRegisters.has(account.accountNo);

            return (
              <div
                key={account.accountNo}
                className="border rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors text-sm text-left"
                  onClick={() => handleToggleAccount(account.accountNo)}
                >
                  <span className="font-mono font-medium">
                    {account.accountNo}{" "}
                    <span className="font-sans font-normal text-muted-foreground">
                      (CHN: {account.chn})
                    </span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="p-2 w-8"></th>
                          <th className="p-2 text-left font-medium">CERT NO</th>
                          <th className="p-2 text-right font-medium">UNITS</th>
                          <th className="p-2 text-left font-medium">ISSUE DATE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {share.certificates.map((cert) => {
                          const checked = selectedCertIds.has(cert.id);
                          return (
                            <tr
                              key={cert.id}
                              className={`cursor-pointer hover:bg-accent transition-colors${checked ? " bg-primary/5" : ""}`}
                              onClick={() => handleToggleCert(cert.id)}
                            >
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleToggleCert(cert.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded cursor-pointer"
                                />
                              </td>
                              <td className="p-2 font-mono">{cert.certNo}</td>
                              <td className="p-2 text-right tabular-nums">
                                {formatNumber(cert.units)}
                              </td>
                              <td className="p-2">{cert.issueDate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary bar */}
          <div className="rounded-lg bg-muted/50 border p-3 text-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span>
                <span className="font-semibold">{selectedCertIds.size}</span>{" "}
                certificate(s) selected
                {selectedCertIds.size > 0 && (
                  <>
                    {" "}
                    — Total:{" "}
                    <span className="font-semibold tabular-nums">
                      {formatNumber(totalSelectedUnits)}
                    </span>{" "}
                    units
                  </>
                )}
              </span>
              {selectedCertIds.size >= 2 && (
                <span className="text-xs text-muted-foreground font-mono">
                  New cert: {generateConsolidationCertNo(selectedRegister, requests)}
                </span>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reason</label>
            <Textarea
              placeholder="Reason for consolidation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button className="w-full" onClick={handleSubmit}>
            <CheckSquare className="h-4 w-4 mr-2" />
            {view === "edit"
              ? "Update Consolidation Request"
              : "Create Consolidation Request"}
          </Button>
        </Card>
      )}
    </div>
  );
}

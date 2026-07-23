"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, User, Building2, FileText, X, ScrollText, Pencil, Check } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import {
  DEMAT_SHAREHOLDERS,
  DEMAT_STOCKBROKERS,
  DematShareholder,
  DematStockbroker,
  DematMandate,
} from "./demat-types";

// ── Shareholder panel ──────────────────────────────────────────────────────

type ShareholderTab = "personal" | "certificates" | "kyc" | "signatures";

function ShareholderProfile({
  sh,
  onCertificateClick,
}: {
  sh: DematShareholder;
  onCertificateClick?: (certNo: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<ShareholderTab>("personal");
  const [registrarAccountNo, setRegistrarAccountNo] = useState(sh.accountNo);
  const [editingAccount, setEditingAccount] = useState(false);
  const [accountDraft, setAccountDraft] = useState(sh.accountNo);

  const tabs: { key: ShareholderTab; label: string }[] = [
    { key: "personal", label: "Personal Info" },
    { key: "certificates", label: "Certificates" },
    { key: "kyc", label: "KYC & Bank" },
    { key: "signatures", label: "Signatures & Docs" },
  ];

  return (
    <div className="mt-4 space-y-5">
      {/* Profile header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold leading-tight">{sh.name}</p>
            <p className="font-mono text-muted-foreground">{sh.chn}</p>
            <p className="text-muted-foreground">{registrarAccountNo}</p>
          </div>
        </div>
        <Badge className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          ACTIVE
        </Badge>
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={[
              "rounded-t cursor-pointer px-4 py-2 font-medium transition-colors",
              activeTab === t.key
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "personal" && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {/* Editable registrar account number — full width */}
          <div className="col-span-2">
            <p className="mrpsl-label mb-0.5">Registrar Account No.</p>
            {editingAccount ? (
              <div className="flex items-center gap-2">
                <Input
                  className="mrpsl-input h-8 text-sm font-mono flex-1 max-w-56"
                  value={accountDraft}
                  autoFocus
                  onChange={(e) => setAccountDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setRegistrarAccountNo(accountDraft.trim() || registrarAccountNo);
                      setEditingAccount(false);
                      toast.success("Registrar account number updated.");
                    }
                    if (e.key === "Escape") {
                      setAccountDraft(registrarAccountNo);
                      setEditingAccount(false);
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                  onClick={() => {
                    setRegistrarAccountNo(accountDraft.trim() || registrarAccountNo);
                    setEditingAccount(false);
                    toast.success("Registrar account number updated.");
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground cursor-pointer"
                  onClick={() => {
                    setAccountDraft(registrarAccountNo);
                    setEditingAccount(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-mono">{registrarAccountNo}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => {
                    setAccountDraft(registrarAccountNo);
                    setEditingAccount(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {[
            { label: "BVN", value: sh.bvn },
            { label: "NIN", value: sh.nin },
            { label: "Phone", value: sh.phone },
            { label: "Email", value: sh.email },
            { label: "State", value: sh.state },
            { label: "LGA", value: sh.lga },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="mrpsl-label mb-0.5">{label}</p>
              <p className="">{value}</p>
            </div>
          ))}
          <div className="col-span-2">
            <p className="mrpsl-label mb-0.5">Address</p>
            <p className="">{sh.address}</p>
          </div>
        </div>
      )}

      {activeTab === "certificates" && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="px-4 py-3 text-left font-medium">CERT NO</th>
                <th className="px-4 py-3 text-left font-medium">REGISTER</th>
                <th className="px-4 py-3 text-right font-medium">UNITS</th>
                <th className="px-4 py-3 text-left font-medium">DATE ISSUED</th>
                <th className="px-4 py-3 text-left font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {sh.certificates.map((cert) => {
                const isActive = cert.status === "ACTIVE";
                return (
                  <tr
                    key={cert.certNo}
                    className={[
                      "mrpsl-table-row",
                      isActive && onCertificateClick
                        ? "cursor-pointer hover:bg-primary/5"
                        : "",
                    ].join(" ")}
                    onClick={() =>
                      isActive && onCertificateClick?.(cert.certNo)
                    }
                    title={isActive ? "Open in Certificate Capture" : undefined}
                  >
                    <td className="px-4 py-3 font-mono">{cert.certNo}</td>
                    <td className="px-4 py-3">{cert.register}</td>
                    <td className="px-4 py-3 text-right">
                      {formatNumber(cert.units)}
                    </td>
                    <td className="px-4 py-3">{cert.dateIssued}</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
                        {cert.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "kyc" && (
        <div className="space-y-5">
          <div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {[
                { label: "ID Type", value: sh.idType },
                { label: "ID Number", value: sh.idNumber },
                { label: "ID Expiry", value: sh.idExpiry },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="mrpsl-label mb-0.5">{label}</p>
                  <p className="text-xs">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="mb-2 font-semibold uppercase tracking-wide text-muted-foreground">
              Bank
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {[
                { label: "Bank Name", value: sh.bankName },
                { label: "Account No", value: sh.bankAccountNo },
                { label: "Account Type", value: sh.bankAccountType },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="mrpsl-label mb-0.5">{label}</p>
                  <p className="text-xs">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "signatures" && (
        <div className="space-y-4">
          {/* Signature placeholder */}
          <div className="rounded-lg border border-border p-4">
            <p className="mrpsl-label mb-2">Signature</p>
            <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/30">
              <span className="text-muted-foreground">Signature on file</span>
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-lg border border-border p-4">
            <p className="mrpsl-label mb-2">Documents</p>
            <ul className="space-y-2">
              {["National ID", "Utility Bill", "Passport Photo"].map((doc) => (
                <li
                  key={doc}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">{doc}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() =>
                      toast.success(`Opening ${doc}`, {
                        description:
                          "Document viewer is not available in this environment.",
                      })
                    }
                  >
                    View
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mandate detail dialog ──────────────────────────────────────────────────

function MandateDialog({
  mandate,
  open,
  onClose,
}: {
  mandate: DematMandate | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!mandate) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogTitle className="sr-only">Mandate Holder Details</DialogTitle>

        {/* Header — px-8 pt-8 pb-6 from DialogHeader */}
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-lg font-bold leading-tight">
                {mandate.agentName}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-primary/10 text-primary text-xs">
                  {mandate.position}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {mandate.accountNo}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {mandate.holderName}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 -mt-1 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Body — px-8 pb-6 matches DialogHeader side padding */}
        <div className="px-8 pb-6 space-y-5">
          {/* Contact */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="mrpsl-label mb-1">Phone</p>
              <p className="text-sm font-medium">{mandate.phone}</p>
            </div>
            <div>
              <p className="mrpsl-label mb-1">Email</p>
              <p className="text-sm font-medium break-all">{mandate.email}</p>
            </div>
          </div>

          {/* Signature & Passport */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <p className="mrpsl-label">Signature</p>
              <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
                <span className="text-sm text-muted-foreground">
                  Signature on file
                </span>
              </div>
            </div>
            <div className="w-28 space-y-2">
              <p className="mrpsl-label">Passport Photo</p>
              <div
                className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex-col gap-1 text-muted-foreground"
                style={{ aspectRatio: "3/4", height: "8rem" }}
              >
                <User className="h-5 w-5 opacity-40" />
                <span className="text-xs text-center">
                  Passport
                  <br />
                  Photo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — px-8 py-6 bg-muted/30 border-t from DialogFooter */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function DematVerification({
  onCertificateClick,
}: {
  onCertificateClick?: (certNo: string) => void;
}) {
  // Shareholder state
  const [shQuery, setShQuery] = useState("");
  const [shSearch, setShSearch] = useState("");
  const [selectedSh, setSelectedSh] = useState<DematShareholder | null>(null);

  // Stockbroker state
  const [sbQuery, setSbQuery] = useState("");
  const [sbSearch, setSbSearch] = useState("");
  const [selectedSb, setSelectedSb] = useState<DematStockbroker | null>(null);

  // Mandate dialog state
  const [mandateOpen, setMandateOpen] = useState(false);
  const [selectedMandate, setSelectedMandate] = useState<DematMandate | null>(
    null,
  );

  // Mandate list preview state
  const [mandateListOpen, setMandateListOpen] = useState(false);

  // Filtered lists
  const filteredShareholders = shSearch.trim()
    ? DEMAT_SHAREHOLDERS.filter((sh) => {
        const q = shSearch.trim().toLowerCase();
        return (
          sh.name.toLowerCase().includes(q) ||
          sh.chn.toLowerCase().includes(q) ||
          sh.accountNo.toLowerCase().includes(q)
        );
      })
    : [];

  const filteredBrokers = sbSearch.trim()
    ? DEMAT_STOCKBROKERS.filter((sb) => {
        const q = sbSearch.trim().toLowerCase();
        return (
          sb.firmName.toLowerCase().includes(q) ||
          sb.cscsCode.toLowerCase().includes(q)
        );
      })
    : [];

  function handleShSearch() {
    setShSearch(shQuery);
    setSelectedSh(null);
  }

  function handleSbSearch() {
    setSbSearch(sbQuery);
    setSelectedSb(null);
  }

  function openMandateDialog(mandate: DematMandate) {
    setSelectedMandate(mandate);
    setMandateOpen(true);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* ── LEFT: Shareholder Verification ────────────────────────────── */}
      <Card className="mrpsl-card py-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2  font-semibold">
            <User className="h-4 w-4 text-primary" />
            Shareholder Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search row */}
          <div className="flex gap-2">
            <Input
              className="mrpsl-input flex-1"
              placeholder="Search by name, CHN or account no…"
              value={shQuery}
              onChange={(e) => setShQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleShSearch()}
            />
            <Button size="xl" onClick={handleShSearch} className="shrink-0">
              <Search className="h-4 w-4" />
              <span className="ml-1.5">Search</span>
            </Button>
          </div>

          {/* Results list */}
          {shSearch.trim() && !selectedSh && (
            <div className="space-y-1">
              {filteredShareholders.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No shareholders found for &quot;{shSearch}&quot;
                </p>
              ) : (
                filteredShareholders.map((sh) => {
                  const registers = [...new Set(sh.certificates.map(c => c.register))];
                  return (
                    <button
                      key={sh.id}
                      onClick={() => setSelectedSh(sh)}
                      className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                    >
                      <p className="font-semibold">{sh.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {sh.chn} · {sh.accountNo}
                      </p>
                      {registers.length > 0 && (
                        <p className="mt-1 text-[11px] font-medium text-green-600 dark:text-green-500">
                          {registers.join(" · ")}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{sh.address}</p>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Selected shareholder profile */}
          {selectedSh && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted-foreground">
                  Showing profile for selected shareholder
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setSelectedSh(null);
                    setShSearch("");
                    setShQuery("");
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ShareholderProfile sh={selectedSh} onCertificateClick={onCertificateClick} />
            </div>
          )}

          {!shSearch.trim() && !selectedSh && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                Search for a shareholder to view their profile
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── RIGHT: Stockbroker Verification ───────────────────────────── */}
      <Card className="mrpsl-card py-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-semibold">
            <Building2 className="h-4 w-4 text-primary" />
            Stockbroker Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search row */}
          <div className="flex gap-2">
            <Input
              className="mrpsl-input flex-1"
              placeholder="Search by firm name or CSCS code…"
              value={sbQuery}
              onChange={(e) => setSbQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSbSearch()}
            />
            <Button size="xl" onClick={handleSbSearch} className="shrink-0">
              <Search className="h-4 w-4" />
              <span className="ml-1.5">Search</span>
            </Button>
          </div>

          {/* Results list */}
          {sbSearch.trim() && !selectedSb && (
            <div className="space-y-1">
              {filteredBrokers.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No stockbrokers found for &quot;{sbSearch}&quot;
                </p>
              ) : (
                filteredBrokers.map((sb) => (
                  <button
                    key={sb.id}
                    onClick={() => setSelectedSb(sb)}
                    className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <p className="font-semibold">{sb.firmName}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {sb.cscsCode} · {sb.licenseNo}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{sb.email}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{sb.address}</p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected broker profile */}
          {selectedSb && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center">
                <p>Showing profile for selected shareholder</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => {
                    setSelectedSb(null);
                    setSbSearch("");
                    setSbQuery("");
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">
                      {selectedSb.firmName}
                    </p>
                    <p className="font-mono text-muted-foreground">
                      {selectedSb.cscsCode}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedSb.licenseNo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact row */}
              <div className="grid grid-cols-1 gap-1 rounded-lg bg-muted/40 px-4 py-3 sm:grid-cols-3">
                <span className="text-muted-foreground">
                  {selectedSb.phone}
                </span>
                <span className="text-muted-foreground">
                  {selectedSb.email}
                </span>
                <span className="text-muted-foreground">
                  {selectedSb.address}
                </span>
              </div>

              {/* Mandate table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold">
                    Mandate Holders ({selectedSb.mandates.length})
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs cursor-pointer"
                    onClick={() => setMandateListOpen(true)}
                  >
                    <ScrollText className="h-3.5 w-3.5" />
                    View Mandate List
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="mrpsl-table-header">
                        <th className="px-4 py-3 text-left font-medium">
                          ACCOUNT NO
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          HOLDER NAME
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          AGENT NAME
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          POSITION
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSb.mandates.map((m) => (
                        <tr key={m.id} className="mrpsl-table-row">
                          <td className="px-4 py-3 font-mono">{m.accountNo}</td>
                          <td className="px-4 py-3">{m.holderName}</td>
                          <td className="px-4 py-3">{m.agentName}</td>
                          <td className="px-4 py-3">{m.position}</td>
                          <td className="px-4 py-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => openMandateDialog(m)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!sbSearch.trim() && !selectedSb && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                Search for a stockbroker to view their profile
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Mandate list preview dialog ─────────────────────────────────── */}
      {selectedSb?.mandateFile && (
        <Dialog open={mandateListOpen} onOpenChange={(v) => !v && setMandateListOpen(false)}>
          <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0" showCloseButton={false}>
            <DialogTitle className="sr-only">Mandate List Preview</DialogTitle>

            {/* Header bar */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <ScrollText className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{selectedSb.firmName}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedSb.mandateFile.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setMandateListOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Document viewer */}
            <div className="flex-1 overflow-hidden bg-muted/20">
              {/\.(jpe?g|png|gif|webp|bmp)$/i.test(selectedSb.mandateFile.url) ? (
                <div className="h-full overflow-auto flex items-start justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedSb.mandateFile.url}
                    alt={`${selectedSb.firmName} mandate list`}
                    className="max-w-full rounded shadow"
                  />
                </div>
              ) : (
                <iframe
                  src={selectedSb.mandateFile.url}
                  title={`${selectedSb.firmName} mandate list`}
                  className="w-full h-full border-0"
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-border shrink-0">
              <Button variant="outline" onClick={() => setMandateListOpen(false)} className="cursor-pointer">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Mandate detail dialog ───────────────────────────────────────── */}
      <MandateDialog
        mandate={selectedMandate}
        open={mandateOpen}
        onClose={() => setMandateOpen(false)}
      />
    </div>
  );
}

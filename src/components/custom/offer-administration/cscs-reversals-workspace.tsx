"use client";

import { useState, useRef, useCallback } from "react";
import {
  CloudUpload,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  Eye,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CscsError {
  id: string;
  appRef: string;
  firstName: string;
  lastName: string;
  chn: string;
  cscsAccountNo: string;
  errorCode: string;
  errorLabel: string;
  unitsAllotted: number;
  amountPaid: number;
  sentName: string;
  sentChn: string;
  sentCscsAccountNo: string;
}

const ERROR_LABELS: Record<string, string> = {
  ERR_04: "Invalid CHN",
  ERR_09: "Account Dormant",
  ERR_12: "Name Mismatch",
  ERR_17: "Account Closed",
  ERR_21: "CHN Not Found",
};

const MOCK_ERRORS: CscsError[] = [
  {
    id: "e1",
    appRef: "IPO-2024-05001",
    firstName: "Adebisi",
    lastName: "Okonkwo",
    chn: "10012345678",
    cscsAccountNo: "0023456789",
    errorCode: "ERR_12",
    errorLabel: "Name Mismatch",
    unitsAllotted: 5000,
    amountPaid: 112500,
    sentName: "Adebesi Okonkwo",
    sentChn: "10012345678",
    sentCscsAccountNo: "0023456789",
  },
  {
    id: "e2",
    appRef: "IPO-2024-05002",
    firstName: "Kemi",
    lastName: "Adeyemi",
    chn: "10087654321",
    cscsAccountNo: "0034567890",
    errorCode: "ERR_09",
    errorLabel: "Account Dormant",
    unitsAllotted: 12000,
    amountPaid: 270000,
    sentName: "Kemi Adeyemi",
    sentChn: "10087654321",
    sentCscsAccountNo: "0034567890",
  },
  {
    id: "e3",
    appRef: "IPO-2024-05003",
    firstName: "Emeka",
    lastName: "Nwachukwu",
    chn: "1009876543",
    cscsAccountNo: "0045678901",
    errorCode: "ERR_04",
    errorLabel: "Invalid CHN",
    unitsAllotted: 3000,
    amountPaid: 67500,
    sentName: "Emeka Nwachukwu",
    sentChn: "1009876543",
    sentCscsAccountNo: "0045678901",
  },
  {
    id: "e4",
    appRef: "IPO-2024-05004",
    firstName: "Amina",
    lastName: "Bello",
    chn: "10065432109",
    cscsAccountNo: "0056789012",
    errorCode: "ERR_17",
    errorLabel: "Account Closed",
    unitsAllotted: 20000,
    amountPaid: 450000,
    sentName: "Amina Bello",
    sentChn: "10065432109",
    sentCscsAccountNo: "0056789012",
  },
  {
    id: "e5",
    appRef: "IPO-2024-05005",
    firstName: "Sunday",
    lastName: "Okeke",
    chn: "10054321098",
    cscsAccountNo: "0067890123",
    errorCode: "ERR_21",
    errorLabel: "CHN Not Found",
    unitsAllotted: 8000,
    amountPaid: 180000,
    sentName: "Sunday Okeke",
    sentChn: "10054321098",
    sentCscsAccountNo: "0067890123",
  },
  {
    id: "e6",
    appRef: "IPO-2024-05006",
    firstName: "Ngozi",
    lastName: "Eze",
    chn: "10043210987",
    cscsAccountNo: "0078901234",
    errorCode: "ERR_12",
    errorLabel: "Name Mismatch",
    unitsAllotted: 15000,
    amountPaid: 337500,
    sentName: "Ngodz Eze",
    sentChn: "10043210987",
    sentCscsAccountNo: "0078901234",
  },
];

const ERROR_BADGE_COLORS: Record<string, string> = {
  ERR_04: "bg-red-100 text-red-700",
  ERR_09: "bg-amber-100 text-amber-800",
  ERR_12: "bg-orange-100 text-orange-700",
  ERR_17: "bg-red-100 text-red-700",
  ERR_21: "bg-red-100 text-red-700",
};

type ResolutionAction = "requeue" | "certificate" | "refund" | null;

interface RequeuedEntry {
  id: string;
  appRef: string;
  firstName: string;
  lastName: string;
  chn: string;
  cscsAccountNo: string;
  unitsAllotted: number;
  amountPaid: number;
}

export function CSCSReversalsWorkspace() {
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<CscsError[]>(MOCK_ERRORS);
  const [selected, setSelected] = useState<CscsError | null>(null);
  const [search, setSearch] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    chn: "",
    cscsAccountNo: "",
  });
  const [confirmAction, setConfirmAction] = useState<ResolutionAction>(null);
  const [requeuedEntries, setRequeuedEntries] = useState<RequeuedEntry[]>([]);
  const [showRequeueModal, setShowRequeueModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async () => {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setUploading(false);
    setUploaded(true);
    toast.success("CSCS confirmation file parsed: 12,400 rows processed.");
  }, []);

  const openRecord = (err: CscsError) => {
    setSelected(err);
    setForm({
      firstName: err.firstName,
      lastName: err.lastName,
      chn: err.chn,
      cscsAccountNo: err.cscsAccountNo,
    });
  };

  const handleRequeue = () => {
    if (!selected) return;
    setRequeuedEntries((prev) => [
      ...prev,
      {
        id: selected.id,
        appRef: selected.appRef,
        firstName: form.firstName,
        lastName: form.lastName,
        chn: form.chn,
        cscsAccountNo: form.cscsAccountNo,
        unitsAllotted: selected.unitsAllotted,
        amountPaid: selected.amountPaid,
      },
    ]);
    setErrors((prev) => prev.filter((e) => e.id !== selected.id));
    toast.success(
      `${selected.appRef} corrected and queued for next CSCS submission.`,
    );
    setSelected(null);
    setConfirmAction(null);
  };

  const downloadRequeueCsv = () => {
    const headers = [
      "App Ref",
      "First Name",
      "Last Name",
      "CHN",
      "CSCS Account No",
      "Units Allotted",
      "Amount Paid (N)",
    ];
    const rows = requeuedEntries.map((e) => [
      e.appRef,
      e.firstName,
      e.lastName,
      e.chn,
      e.cscsAccountNo,
      e.unitsAllotted,
      e.amountPaid,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cscs-requeue-file.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCertificate = () => {
    if (!selected) return;
    setErrors((prev) => prev.filter((e) => e.id !== selected.id));
    toast.success(
      `${selected.appRef} converted to physical share certificate.`,
    );
    setSelected(null);
    setConfirmAction(null);
  };

  const handleRefund = () => {
    if (!selected) return;
    setErrors((prev) => prev.filter((e) => e.id !== selected.id));
    toast.success(
      `Allotment reversed. ₦${selected.amountPaid.toLocaleString()} pushed to Return Monies Queue.`,
    );
    setSelected(null);
    setConfirmAction(null);
  };

  const filteredErrors = errors.filter((e) => {
    const matchSearch =
      !search ||
      `${e.firstName} ${e.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      e.appRef.toLowerCase().includes(search.toLowerCase());
    const matchCode = !filterCode || e.errorCode === filterCode;
    return matchSearch && matchCode;
  });

  if (!uploaded) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Upload the CSCS confirmation status file (.txt or .csv) received
            after submitting the lodgement file. The system will parse successes
            vs. failures and route errors here for resolution.
          </p>
        </div>
        <Card
          className={cn(
            "mrpsl-card border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile();
          }}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">
                Parsing CSCS return file…
              </p>
            </div>
          ) : (
            <>
              <CloudUpload
                className={cn(
                  "h-10 w-10",
                  dragging ? "text-primary" : "text-muted-foreground",
                )}
              />
              <div className="text-center">
                <p className="font-semibold text-sm">
                  Upload CSCS Confirmation Status File
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Accepts .txt and .csv — drag & drop or click to browse
                </p>
              </div>
            </>
          )}
        </Card>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.csv"
          className="hidden"
          onChange={() => handleFile()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload summary banner */}
      <Card className="mrpsl-card p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">File Processed</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Total Rows:{" "}
              <strong className="text-foreground font-mono">12,400</strong>
            </span>
            <span>
              Successfully Saved:{" "}
              <strong className="text-green-700 font-mono">12,150</strong>
            </span>
            <span>
              Failed Rejections:{" "}
              <strong className="text-red-600 font-mono">
                {errors.length > 0
                  ? `${errors.length} remaining`
                  : "250 (all resolved)"}
              </strong>
            </span>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => setShowRequeueModal(true)}>
            <Eye />
            View Re-queue File
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUploaded(false);
              setSelected(null);
              setErrors(MOCK_ERRORS);
            }}
          >
            <Upload />
            Upload New File
          </Button>
        </div>
      </Card>

      {/* Split workspace */}
      <div className="flex gap-4 min-h-130">
        {/* Left: Error list */}
        <Card className="mrpsl-card w-80 shrink-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <input
                className="mrpsl-input pl-8 h-8 w-full text-xs"
                placeholder="Search by name or ref…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="mrpsl-input h-8 w-full text-xs"
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
            >
              <option value="">All error types</option>
              {Object.entries(ERROR_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {code}: {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredErrors.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {errors.length === 0
                  ? "All errors resolved."
                  : "No errors match your filter."}
              </div>
            ) : (
              filteredErrors.map((err) => (
                <button
                  key={err.id}
                  onClick={() => openRecord(err)}
                  className={cn(
                    "w-full text-left p-3 border-b border-border cursor-pointer hover:bg-muted/40 transition-colors",
                    selected?.id === err.id ? "bg-primary/5" : "",
                  )}
                >
                  <p className="text-xs font-semibold truncate">
                    {err.firstName} {err.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {err.appRef}
                  </p>
                  <Badge
                    className={cn(
                      "mt-1 border-0 text-[10px]",
                      ERROR_BADGE_COLORS[err.errorCode] ||
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {err.errorCode}: {err.errorLabel}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right: Resolution workspace */}
        <Card className="mrpsl-card flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
              <p className="font-medium text-sm">No record selected</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Click an error record on the left to view its details and
                resolve it.
              </p>
            </div>
          ) : (
            <>
              {/* Summary header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {selected.firstName} {selected.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {selected.appRef}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "border-0 text-xs shrink-0",
                      ERROR_BADGE_COLORS[selected.errorCode] ||
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {selected.errorCode}: {selected.errorLabel}
                  </Badge>
                </div>
              </div>

              {/* What was sent vs what failed */}
              <div className="p-5 border-b border-border bg-muted/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Sent to CSCS vs. Error Details
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {[
                    {
                      label: "Full Name",
                      sent: selected.sentName,
                      system: `${selected.firstName} ${selected.lastName}`,
                    },
                    {
                      label: "CHN",
                      sent: selected.sentChn,
                      system: selected.chn,
                    },
                    {
                      label: "CSCS Account",
                      sent: selected.sentCscsAccountNo,
                      system: selected.cscsAccountNo,
                    },
                    {
                      label: "Units Allotted",
                      sent: selected.unitsAllotted.toLocaleString(),
                      system: selected.unitsAllotted.toLocaleString(),
                    },
                  ].map(({ label, sent, system }) => (
                    <div key={label} className="space-y-0.5">
                      <p className="text-muted-foreground">{label}</p>
                      <p
                        className={cn(
                          "font-medium",
                          sent !== system ? "text-orange-700" : "",
                        )}
                      >
                        {sent}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inline editor */}
              <div className="p-5 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Edit Record
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { label: "First Name", key: "firstName" },
                      { label: "Last Name", key: "lastName" },
                      { label: "CHN (Clearing House Number)", key: "chn" },
                      { label: "CSCS Account Number", key: "cscsAccountNo" },
                    ] as const
                  ).map(({ label, key }) => (
                    <div key={key} className="space-y-1">
                      <label className="mrpsl-label">{label}</label>
                      <input
                        className="mrpsl-input h-9 w-full"
                        value={form[key]}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t border-border flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setConfirmAction("requeue")}
                >
                  Save & Re-queue for CSCS
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setConfirmAction("refund")}
                >
                  Reverse Allotment & Full Refund
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Confirmation dialogs */}
      <Dialog
        open={confirmAction === "requeue"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save & Re-queue for CSCS</DialogTitle>
            <DialogDescription>
              The corrected record for <strong>{selected?.appRef}</strong> will
              be saved and included in the next CSCS lodgement batch.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 px-6 pb-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleRequeue}>
              Confirm Re-queue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmAction === "certificate"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Convert to Physical Certificate</DialogTitle>
            <DialogDescription>
              <strong>{selected?.appRef}</strong> will bypass CSCS and be
              scheduled for a physical share certificate print. The investor
              receives a paper certificate instead of a dematerialized account
              credit.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 px-6 pb-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-slate-300"
              onClick={handleCertificate}
            >
              Confirm Certificate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmAction === "refund"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reverse Allotment & Full Refund</DialogTitle>
            <DialogDescription>
              This will permanently cancel the allotment for{" "}
              <strong>{selected?.appRef}</strong> and push{" "}
              <strong>₦{selected?.amountPaid.toLocaleString()}</strong> into the
              Return Monies Queue for a full bank refund. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 px-6 pb-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleRefund}
            >
              Confirm Reversal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Re-queue file preview modal */}
      <Dialog open={showRequeueModal} onOpenChange={setShowRequeueModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Re-queue File Preview
            </DialogTitle>
            <DialogDescription>
              {requeuedEntries.length === 0
                ? "No entries have been re-queued yet. Resolve an error record and choose 'Save & Re-queue for CSCS' to add entries here."
                : `${requeuedEntries.length} entr${requeuedEntries.length === 1 ? "y" : "ies"} queued for the next CSCS lodgement batch.`}
            </DialogDescription>
          </DialogHeader>

          {requeuedEntries.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border mx-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-3 py-2.5 font-medium">#</th>
                    <th className="text-left px-3 py-2.5 font-medium">App Ref</th>
                    <th className="text-left px-3 py-2.5 font-medium">Name</th>
                    <th className="text-left px-3 py-2.5 font-medium">CHN</th>
                    <th className="text-left px-3 py-2.5 font-medium">CSCS Account</th>
                    <th className="text-right px-3 py-2.5 font-medium">Units</th>
                    <th className="text-right px-3 py-2.5 font-medium">Amount Paid (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {requeuedEntries.map((e, i) => (
                    <tr key={e.id} className="mrpsl-table-row">
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{e.appRef}</td>
                      <td className="px-3 py-2.5 font-medium">{e.firstName} {e.lastName}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{e.chn}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{e.cscsAccountNo}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{e.unitsAllotted.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-mono">₦{e.amountPaid.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-muted/20">
                  <tr>
                    <td colSpan={5} className="px-3 py-2.5 text-xs font-bold text-muted-foreground">
                      TOTAL ({requeuedEntries.length} records)
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold">
                      {requeuedEntries.reduce((s, e) => s + e.unitsAllotted, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold">
                      ₦{requeuedEntries.reduce((s, e) => s + e.amountPaid, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="mx-8 rounded-lg border border-dashed border-border p-10 flex flex-col items-center gap-3 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No re-queued entries yet</p>
            </div>
          )}

          <div className="flex justify-end gap-3 px-8 pb-8 pt-1">
            <Button variant="outline" onClick={() => setShowRequeueModal(false)}>
              Close
            </Button>
            {requeuedEntries.length > 0 && (
              <Button onClick={downloadRequeueCsv}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

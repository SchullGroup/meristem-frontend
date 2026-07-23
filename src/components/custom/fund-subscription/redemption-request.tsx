"use client";

import { useState, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  Upload,
  X,
  FileText,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import { useGetRegistersByType } from "@/hooks/useRegisters";
import { toast } from "sonner";

type EntryMode = "single" | "bulk";

interface UnitHolder {
  id: string;
  accountNo: string;
  name: string;
  chn: string;
  email: string;
  fundManagerEmail: string;
  availableUnits: number;
  fund: string;
}

const MOCK_HOLDERS: UnitHolder[] = [
  {
    id: "h1",
    accountNo: "FND-00123456",
    name: "Adebayo Oluwaseun",
    chn: "CHN-0012345678",
    email: "adebayo@email.com",
    fundManagerEmail: "fm@stanbicastset.com",
    availableUnits: 15_000,
    fund: "Stanbic IBTC Dollar Fund",
  },
  {
    id: "h2",
    accountNo: "FND-00234567",
    name: "Chinwe Okafor-Nwosu",
    chn: "CHN-0023456789",
    email: "chinwe@email.com",
    fundManagerEmail: "fm@armgroup.net",
    availableUnits: 8_500,
    fund: "ARM Discovery Balanced Fund",
  },
  {
    id: "h3",
    accountNo: "FND-00345678",
    name: "Emeka Nwachukwu",
    chn: "CHN-0034567890",
    email: "emeka@email.com",
    fundManagerEmail: "fm@stanbicastset.com",
    availableUnits: 42_000,
    fund: "Stanbic IBTC Dollar Fund",
  },
  {
    id: "h4",
    accountNo: "FND-00456789",
    name: "Fatima Garba Abubakar",
    chn: "CHN-0045678901",
    email: "fatima@email.com",
    fundManagerEmail: "fm@coronationam.com",
    availableUnits: 120_000,
    fund: "Coronation Money Market Fund",
  },
];

let refCounter = 1;
function generateRef() {
  const ref = `REDM-2024-${String(refCounter).padStart(6, "0")}`;
  refCounter++;
  return ref;
}

function HolderDropdown({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (h: UnitHolder) => void;
}) {
  if (!query || query.length < 2) return null;
  const matches = MOCK_HOLDERS.filter(
    (h) =>
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.accountNo.toLowerCase().includes(query.toLowerCase()) ||
      h.chn.toLowerCase().includes(query.toLowerCase()),
  );
  if (!matches.length)
    return (
      <div className="absolute z-10 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-background shadow-md p-3 text-sm text-muted-foreground">
        No matching unit holders found.
      </div>
    );
  return (
    <div className="absolute z-10 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-background shadow-md overflow-hidden">
      {matches.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => onSelect(h)}
          className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors text-sm"
        >
          <p className="font-medium">{h.name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {h.accountNo} · {h.chn} · {h.availableUnits.toLocaleString()} units
            available
          </p>
        </button>
      ))}
    </div>
  );
}

function DocumentUploadArea({
  documents,
  onChange,
}: {
  documents: File[];
  onChange: (files: File[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onChange([...documents, ...Array.from(e.dataTransfer.files)]);
  };

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
      >
        <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
        <p className="text-sm font-medium">
          Drop redemption forms here or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          PDF, JPG, PNG — multiple files allowed
        </p>
        <input
          ref={ref}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) =>
            onChange([...documents, ...Array.from(e.target.files ?? [])])
          }
        />
      </div>
      {documents.length > 0 && (
        <div className="space-y-1.5">
          {documents.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 text-[13px]"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono truncate flex-1">{f.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(documents.filter((_, idx) => idx !== i));
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MandateView({
  holder,
  documents,
}: {
  holder: UnitHolder | null;
  documents: File[];
}) {
  const [signatureMatch, setSignatureMatch] = useState<boolean | null>(null);

  if (!holder) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl text-muted-foreground text-center">
        <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-semibold text-sm text-foreground">
          No unit holder selected
        </p>
        <p className="text-xs mt-1 max-w-72">
          Select a unit holder on the Redemption Request tab to view their
          mandate and compare signatures.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="mrpsl-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{holder.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {holder.accountNo} · {holder.chn} · {holder.fund}
            </p>
          </div>
          {signatureMatch !== null &&
            (signatureMatch ? (
              <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
                <ShieldCheck className="h-4 w-4" />
                Signatures Match
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-destructive text-sm font-medium">
                <ShieldAlert className="h-4 w-4" />
                Mismatch — Review Required
              </div>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="mrpsl-label">Mandate on File</p>
            <div className="h-52 rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs font-medium">Mandate signature on record</p>
              <p className="text-[11px] font-mono text-muted-foreground/60">
                MANDATE-{holder.accountNo}.pdf
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="mrpsl-label">Submitted Redemption Form</p>
            {documents.length > 0 ? (
              <div className="h-52 rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileText className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs font-medium">{documents[0].name}</p>
                {documents.length > 1 && (
                  <p className="text-[11px] text-muted-foreground/60">
                    +{documents.length - 1} more file
                    {documents.length > 2 ? "s" : ""}
                  </p>
                )}
              </div>
            ) : (
              <div className="h-52 rounded-xl border border-dashed border-border bg-muted/10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileText className="h-8 w-8 text-muted-foreground/25" />
                <p className="text-xs">No form uploaded yet</p>
                <p className="text-[11px] text-muted-foreground/60">
                  Upload forms in the section above
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mr-auto">
            After reviewing both signatures, record your assessment:
          </p>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setSignatureMatch(false)}
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
            Mismatch
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setSignatureMatch(true)}
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Signatures Match
          </Button>
        </div>
      </Card>

      {documents.length > 1 && (
        <Card className="mrpsl-card p-4">
          <p className="mrpsl-label mb-2">
            All Uploaded Documents ({documents.length})
          </p>
          <div className="space-y-1.5">
            {documents.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 text-[13px]"
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-mono truncate">{f.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export function RedemptionRequest() {
  const { data: fundRegisters, isLoading: loadingRegisters } =
    useGetRegistersByType("Fund");

  const [entryMode, setEntryMode] = useState<EntryMode>("single");

  /* single entry state */
  const [fundRegister, setFundRegister] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHolder, setSelectedHolder] = useState<UnitHolder | null>(null);
  const [unitsRequested, setUnitsRequested] = useState("");
  const [redemptionDate, setRedemptionDate] = useState<Date | null>(null);
  const [datePayable, setDatePayable] = useState<Date | null>(null);
  const [narration, setNarration] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [adviseNote, setAdviseNote] = useState("");

  /* bulk state */
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const bulkRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");

  const parsedUnits = parseInt(unitsRequested, 10) || 0;
  const insufficient = !!(
    selectedHolder &&
    parsedUnits > 0 &&
    parsedUnits > selectedHolder.availableUnits
  );

  const canSubmitSingle = !!(
    fundRegister &&
    selectedHolder &&
    parsedUnits > 0 &&
    !insufficient &&
    redemptionDate &&
    datePayable
  );

  const handleSelectHolder = (h: UnitHolder) => {
    setSelectedHolder(h);
    setSearchQuery(h.name);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    const ref = generateRef();
    setSubmittedRef(ref);
    setSubmitting(false);
    setSubmitted(true);
    toast.success(
      `Redemption request ${ref} submitted. Pending Team Lead approval.`,
    );
  };

  const handleReset = () => {
    setFundRegister("");
    setSearchQuery("");
    setSelectedHolder(null);
    setUnitsRequested("");
    setRedemptionDate(null);
    setDatePayable(null);
    setNarration("");
    setDocuments([]);
    setAdviseNote("");
    setBulkFile(null);
    setSubmitted(false);
    setSubmittedRef("");
    setEntryMode("single");
  };

  if (submitted) {
    return (
      <Card className="mrpsl-card p-8 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-lg">Redemption Request Submitted</p>
          <p className="font-mono text-sm text-muted-foreground mt-0.5">
            {submittedRef}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Pending review and approval. On approval, units will be deducted
            and the Fund Manager notified.
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          Submit Another Request
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Single / Bulk toggle */}
      <div className="flex gap-2">
        {(["single", "bulk"] as EntryMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setEntryMode(mode)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors border ${
              entryMode === mode
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {mode === "single" ? "Single Entry" : "Bulk Upload"}
          </button>
        ))}
      </div>

      {entryMode === "single" ? (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
                <Card className="mrpsl-card p-5 space-y-4">
                  {/* Fund Register */}
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Fund Register *</label>
                    <Select
                      value={fundRegister}
                      onValueChange={(v) => setFundRegister(v ?? "")}
                    >
                      <SelectTrigger className="mrpsl-input">
                        <SelectValue placeholder="Select Fund Register" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingRegisters ? (
                          <div className="py-6 flex items-center justify-center">
                            <Loader2 className="animate-spin h-4 w-4" />
                          </div>
                        ) : fundRegisters && fundRegisters.length > 0 ? (
                          fundRegisters.map((r) => (
                            <SelectItem key={r.registerId} value={r.registerId}>
                              {r.registerName}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="stanbic-dollar">
                              Stanbic IBTC Dollar Fund
                            </SelectItem>
                            <SelectItem value="arm-discovery">
                              ARM Discovery Balanced Fund
                            </SelectItem>
                            <SelectItem value="coronation-mm">
                              Coronation Money Market Fund
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Unit Holder search */}
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">
                      Unit Holder (Account No., Name, or CHN) *
                    </label>
                    <div className="relative">
                      <Input
                        className="mrpsl-input"
                        placeholder="Start typing to search…"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedHolder(null);
                        }}
                      />
                      <HolderDropdown
                        query={searchQuery}
                        onSelect={handleSelectHolder}
                      />
                    </div>
                    {selectedHolder && (
                      <div className="rounded-xl bg-muted/40 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {selectedHolder.name}
                          </span>
                          <span className="font-mono font-bold text-primary">
                            {selectedHolder.availableUnits.toLocaleString()}{" "}
                            units available
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedHolder.fund} · {selectedHolder.accountNo}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Units requested */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="mrpsl-label">
                        Units Requested for Redemption *
                      </label>
                      <Input
                        className={`mrpsl-input font-mono ${insufficient ? "border-destructive" : ""}`}
                        type="number"
                        min={1}
                        placeholder="0"
                        value={unitsRequested}
                        onChange={(e) => setUnitsRequested(e.target.value)}
                      />
                      {insufficient && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Insufficient units. Available:{" "}
                          {selectedHolder!.availableUnits.toLocaleString()}.
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="mrpsl-label">
                        Available Units (read-only)
                      </label>
                      <Input
                        className="mrpsl-input font-mono bg-muted/30"
                        readOnly
                        value={
                          selectedHolder
                            ? selectedHolder.availableUnits.toLocaleString()
                            : "—"
                        }
                      />
                    </div>
                  </div>

                  {/* Advise note when insufficient */}
                  {insufficient && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-amber-700">
                        <Info className="h-3.5 w-3.5" />
                        Advise the unit holder that their requested units exceed
                        available balance. Document your advice below.
                      </div>
                      <Textarea
                        className="mrpsl-input resize-none"
                        rows={2}
                        placeholder="Note to unit holder / fund manager regarding insufficient units…"
                        value={adviseNote}
                        onChange={(e) => setAdviseNote(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <DateInput
                      label="Redemption Date *"
                      date={redemptionDate}
                      setDate={(d: Date) => setRedemptionDate(d)}
                    />
                    <DateInput
                      label="Date Payable *"
                      date={datePayable}
                      setDate={(d: Date) => setDatePayable(d)}
                    />
                  </div>

                  {/* Form upload */}
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Redemption Form(s)</label>
                    <DocumentUploadArea
                      documents={documents}
                      onChange={setDocuments}
                    />
                  </div>

                  {/* Narration */}
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Narration</label>
                    <Textarea
                      className="mrpsl-input resize-none"
                      rows={2}
                      placeholder="Optional narration or description for this redemption…"
                      value={narration}
                      onChange={(e) => setNarration(e.target.value)}
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !canSubmitSingle || insufficient}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Submit Redemption Request"
                      )}
                    </Button>
                  </div>
                </Card>
                <MandateView holder={selectedHolder} documents={documents} />
              </div>

              {/* Right info panel */}
              <div className="space-y-3">
                <Card className="mrpsl-card p-4 text-sm space-y-3">
                  <p className="font-semibold">Redemption Flow</p>
                  <ol className="space-y-2 text-muted-foreground text-xs list-none">
                    {[
                      "Submit redemption request for Team Lead review.",
                      "Team Lead reviews and approves or rejects.",
                      "On approval: units deducted from holder balance.",
                      "E-notification sent immediately to Fund Manager.",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </Card>
                <Card className="mrpsl-card p-4 text-xs text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-sm text-foreground">Rules</p>
                  <p>
                    • Redemption is voluntary — triggered by the unit holder or
                    fund manager, not by any system event.
                  </p>
                  <p>
                    • If units requested exceed available balance, submission is
                    blocked. Document your advice to the holder in the note
                    field.
                  </p>
                  <p>
                    • This flow is independent of IPO/Rights Issue Return Money
                    queues.
                  </p>
                </Card>
              </div>
            </div>
          ) : (
            /* Bulk Upload */
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2">
                <Card className="mrpsl-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Bulk Redemption Upload
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast.info("Template download coming soon")
                      }
                    >
                      Download Template
                    </Button>
                  </div>

                  <div
                    onClick={() => bulkRef.current?.click()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) setBulkFile(f);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                  >
                    <Upload className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">
                      Drop your bulk upload file here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      .xlsx or .csv files only
                    </p>
                    <input
                      ref={bulkRef}
                      type="file"
                      accept=".xlsx,.csv"
                      className="hidden"
                      onChange={(e) =>
                        setBulkFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>

                  {bulkFile && (
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 text-[13px]">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono truncate flex-1">
                        {bulkFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBulkFile(null)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !bulkFile}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        "Upload & Submit"
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              <div>
                <Card className="mrpsl-card p-4 text-xs text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-sm text-foreground">
                    Template Columns
                  </p>
                  {[
                    "Fund Register",
                    "Account No.",
                    "CHN",
                    "Units Requested",
                    "Redemption Date",
                    "Date Payable",
                    "Narration",
                  ].map((col) => (
                    <p key={col}>• {col}</p>
                  ))}
                </Card>
              </div>
            </div>
          )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  User,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  FileText,
  X,
  Download,
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
import { useGetRegistersByType } from "@/hooks/useRegisters";
import { toast } from "sonner";

type SubscriberType = "new" | "existing";
type EntryMode = "single" | "bulk";

interface ExistingHolder {
  id: string;
  accountNo: string;
  name: string;
  chn: string;
  email: string;
  currentFund: string;
  availableUnits: number;
}

const MOCK_HOLDERS: ExistingHolder[] = [
  {
    id: "h1",
    accountNo: "FND-00123456",
    name: "Adebayo Oluwaseun",
    chn: "CHN-0012345678",
    email: "adebayo@email.com",
    currentFund: "Stanbic IBTC Dollar Fund",
    availableUnits: 15_000,
  },
  {
    id: "h2",
    accountNo: "FND-00234567",
    name: "Chinwe Okafor-Nwosu",
    chn: "CHN-0023456789",
    email: "chinwe@email.com",
    currentFund: "ARM Discovery Balanced Fund",
    availableUnits: 8_500,
  },
  {
    id: "h3",
    accountNo: "FND-00345678",
    name: "Emeka Nwachukwu",
    chn: "CHN-0034567890",
    email: "emeka@email.com",
    currentFund: "Stanbic IBTC Dollar Fund",
    availableUnits: 42_000,
  },
  {
    id: "h4",
    accountNo: "FND-00456789",
    name: "Fatima Garba Abubakar",
    chn: "CHN-0045678901",
    email: "fatima@email.com",
    currentFund: "Coronation Money Market Fund",
    availableUnits: 120_000,
  },
];

function SearchDropdown({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (h: ExistingHolder) => void;
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
            {h.accountNo} · {h.chn}
          </p>
        </button>
      ))}
    </div>
  );
}

function DocumentUploadArea({
  files,
  onAdd,
  onRemove,
}: {
  files: File[];
  onAdd: (list: FileList | null) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div
        className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onAdd(e.dataTransfer.files);
        }}
        onClick={() =>
          document.getElementById("doc-upload-input")?.click()
        }
      >
        <Upload className="h-5 w-5 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground text-center">
          Drag & drop documents or <span className="text-primary font-medium">browse</span>
          <br />
          Application forms, ID, etc. — multiple files allowed
        </p>
        <input
          id="doc-upload-input"
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
          onChange={(e) => onAdd(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 text-[13px]"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate font-mono">{f.name}</span>
              <span className="text-muted-foreground shrink-0">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
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

export function NewSubscription() {
  const { data: fundRegisters, isLoading: loadingRegisters } =
    useGetRegistersByType("Fund");

  const [subscriberType, setSubscriberType] = useState<SubscriberType>("new");
  const [newEntryMode, setNewEntryMode] = useState<EntryMode>("single");
  const [existingEntryMode, setExistingEntryMode] = useState<EntryMode>("single");
  const [fundRegister, setFundRegister] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // New subscriber — single entry
  const [subscriptionDate, setSubscriptionDate] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bvn, setBvn] = useState("");
  const [nextOfKin, setNextOfKin] = useState("");
  const [units, setUnits] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [narration, setNarration] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);

  // New subscriber — bulk
  const [newBulkFile, setNewBulkFile] = useState<File | null>(null);

  // Existing unit holder — single entry
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHolder, setSelectedHolder] = useState<ExistingHolder | null>(null);
  const [targetFundMode, setTargetFundMode] = useState<"same" | "different">("same");
  const [targetFund, setTargetFund] = useState("");
  const [existingUnits, setExistingUnits] = useState("");
  const [existingAmount, setExistingAmount] = useState("");
  const [existingSubDate, setExistingSubDate] = useState("");
  const [existingNarration, setExistingNarration] = useState("");
  const [existingDocuments, setExistingDocuments] = useState<File[]>([]);

  // Existing unit holder — bulk
  const [existingBulkFile, setExistingBulkFile] = useState<File | null>(null);

  const bvnValid = bvn.length === 0 || /^\d{11}$/.test(bvn);

  const canSubmitNew =
    newEntryMode === "bulk"
      ? !!(newBulkFile && fundRegister)
      : !!(
          fundRegister &&
          name &&
          phone &&
          email &&
          bvnValid &&
          bvn.length === 11 &&
          units &&
          narration
        );

  const canSubmitExisting =
    existingEntryMode === "bulk"
      ? !!(existingBulkFile && fundRegister)
      : !!(
          selectedHolder &&
          existingUnits &&
          existingNarration &&
          (targetFundMode === "same" || targetFund)
        );

  const handleSelectHolder = (h: ExistingHolder) => {
    setSelectedHolder(h);
    setSearchQuery(h.name);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
    toast.success(
      subscriberType === "new"
        ? newEntryMode === "bulk"
          ? `Bulk new subscribers uploaded. Pending Team Lead approval.`
          : `New subscriber "${name}" created on ${fundRegisters?.find((r) => r.registerId === fundRegister)?.registerName ?? fundRegister}. Pending Team Lead approval.`
        : existingEntryMode === "bulk"
          ? `Bulk additional subscriptions uploaded. Pending Team Lead approval.`
          : `Additional units recorded for ${selectedHolder?.name}. Pending Team Lead approval.`,
    );
  };

  const handleReset = () => {
    setSubscriptionDate("");
    setName("");
    setAddress("");
    setPhone("");
    setEmail("");
    setBvn("");
    setNextOfKin("");
    setUnits("");
    setAmountPaid("");
    setNarration("");
    setDocuments([]);
    setNewBulkFile(null);
    setSearchQuery("");
    setSelectedHolder(null);
    setExistingUnits("");
    setExistingAmount("");
    setExistingSubDate("");
    setExistingNarration("");
    setExistingDocuments([]);
    setExistingBulkFile(null);
    setTargetFundMode("same");
    setTargetFund("");
    setFundRegister("");
    setNewEntryMode("single");
    setExistingEntryMode("single");
    setSubmitted(false);
  };

  const FundRegisterSelect = () => (
    <div className="space-y-1.5">
      <label className="mrpsl-label">Fund Register *</label>
      <Select value={fundRegister} onValueChange={(v) => setFundRegister(v ?? "")}>
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
                <span className="font-semibold">{r.registerName}</span>
                <span className="text-xs text-muted-foreground ml-2">{r.symbol}</span>
              </SelectItem>
            ))
          ) : (
            <>
              <SelectItem value="stanbic-dollar">Stanbic IBTC Dollar Fund</SelectItem>
              <SelectItem value="arm-discovery">ARM Discovery Balanced Fund</SelectItem>
              <SelectItem value="coronation-mm">Coronation Money Market Fund</SelectItem>
              <SelectItem value="vetiva-equity">Vetiva Griffin Fund</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );

  if (submitted) {
    return (
      <Card className="mrpsl-card p-8 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-lg">Subscription Submitted</p>
          <p className="text-sm text-muted-foreground mt-1">
            The subscription is pending approval by the CSCS Liaison and Recon Team Lead.
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          Submit Another Subscription
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Subscriber type toggle */}
      <Card className="mrpsl-card p-4">
        <p className="mrpsl-label mb-3">Subscriber Type</p>
        <div className="flex gap-3">
          {(["new", "existing"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSubscriberType(type)}
              className={`flex cursor-pointer items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                subscriberType === type
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {type === "new" ? (
                <User className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {type === "new" ? "New Subscriber" : "Existing Unit Holder"}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Card className="mrpsl-card p-5 space-y-4">
            <FundRegisterSelect />

            {subscriberType === "new" ? (
              /* ── New Subscriber ── */
              <div className="space-y-4">
                {/* Single / Bulk toggle */}
                <div className="flex gap-2 p-1 rounded-xl bg-muted/40 w-fit">
                  {(["single", "bulk"] as EntryMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewEntryMode(m)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        newEntryMode === m
                          ? "bg-background shadow text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "single" ? "Single Entry" : "Bulk Upload"}
                    </button>
                  ))}
                </div>

                {newEntryMode === "bulk" ? (
                  /* ── New Subscriber Bulk Upload ── */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-muted-foreground">
                        Upload a CSV file with multiple new subscribers. Each row will create a new unit holder entry.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() =>
                          toast.success("New subscriber CSV template downloaded.")
                        }
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download Template
                      </Button>
                    </div>
                    <div
                      className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files[0];
                        if (f) setNewBulkFile(f);
                      }}
                      onClick={() =>
                        document.getElementById("new-bulk-input")?.click()
                      }
                    >
                      <Upload className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">
                        {newBulkFile ? newBulkFile.name : "Drag & drop CSV file here"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse — accepts .csv
                      </p>
                      <input
                        id="new-bulk-input"
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setNewBulkFile(f);
                        }}
                      />
                    </div>
                    {newBulkFile && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 text-[13px]">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1 font-mono truncate">{newBulkFile.name}</span>
                        <span className="text-muted-foreground">
                          {(newBulkFile.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewBulkFile(null)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── New Subscriber Single Entry ── */
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Subscription Date</label>
                        <Input
                          className="mrpsl-input"
                          type="date"
                          value={subscriptionDate}
                          onChange={(e) => setSubscriptionDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">BVN *</label>
                        <Input
                          className={`mrpsl-input font-mono ${!bvnValid ? "border-destructive" : ""}`}
                          placeholder="11-digit BVN"
                          maxLength={11}
                          value={bvn}
                          onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                        />
                        {!bvnValid && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> BVN must be exactly 11 digits.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Full Name *</label>
                        <Input
                          className="mrpsl-input"
                          placeholder="e.g. John Adewale Okafor"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Next of Kin</label>
                        <Input
                          className="mrpsl-input"
                          placeholder="Next of kin full name"
                          value={nextOfKin}
                          onChange={(e) => setNextOfKin(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="mrpsl-label">Address *</label>
                      <Textarea
                        className="mrpsl-input resize-none"
                        rows={2}
                        placeholder="Full residential address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Phone *</label>
                        <Input
                          className="mrpsl-input"
                          placeholder="+234…"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Email *</label>
                        <Input
                          className="mrpsl-input"
                          type="email"
                          placeholder="subscriber@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Units Subscribed *</label>
                        <Input
                          className="mrpsl-input font-mono"
                          type="number"
                          min={1}
                          placeholder="0"
                          value={units}
                          onChange={(e) => setUnits(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Amount Paid (₦)</label>
                        <Input
                          className="mrpsl-input font-mono"
                          type="number"
                          min={0}
                          placeholder="0.00"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="mrpsl-label">Narration *</label>
                      <Textarea
                        className="mrpsl-input resize-none"
                        rows={2}
                        placeholder="Description / narration for this subscription"
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="mrpsl-label">Supporting Documents</label>
                      <DocumentUploadArea
                        files={documents}
                        onAdd={(list) =>
                          setDocuments((prev) => [
                            ...prev,
                            ...Array.from(list ?? []),
                          ])
                        }
                        onRemove={(i) =>
                          setDocuments((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ── Existing Unit Holder ── */
              <div className="space-y-4">
                {/* Single / Bulk toggle */}
                <div className="flex gap-2 p-1 rounded-xl bg-muted/40 w-fit">
                  {(["single", "bulk"] as EntryMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setExistingEntryMode(m)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        existingEntryMode === m
                          ? "bg-background shadow text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "single" ? "Single Entry" : "Bulk Upload"}
                    </button>
                  ))}
                </div>

                {existingEntryMode === "bulk" ? (
                  /* ── Existing Bulk Upload ── */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-muted-foreground">
                        Upload a CSV file for multiple additional subscriptions. Each row matches an existing unit holder by account number or CHN.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() =>
                          toast.success("Additional subscription CSV template downloaded.")
                        }
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download Template
                      </Button>
                    </div>
                    <div
                      className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files[0];
                        if (f) setExistingBulkFile(f);
                      }}
                      onClick={() =>
                        document.getElementById("existing-bulk-input")?.click()
                      }
                    >
                      <Upload className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">
                        {existingBulkFile
                          ? existingBulkFile.name
                          : "Drag & drop CSV file here"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse — accepts .csv
                      </p>
                      <input
                        id="existing-bulk-input"
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setExistingBulkFile(f);
                        }}
                      />
                    </div>
                    {existingBulkFile && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 text-[13px]">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1 font-mono truncate">
                          {existingBulkFile.name}
                        </span>
                        <span className="text-muted-foreground">
                          {(existingBulkFile.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => setExistingBulkFile(null)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Existing Single Entry ── */
                  <>
                    <div className="space-y-1.5">
                      <label className="mrpsl-label">
                        Search Unit Holder (Account No., Name, or CHN) *
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
                        <SearchDropdown
                          query={searchQuery}
                          onSelect={handleSelectHolder}
                        />
                      </div>
                    </div>

                    {selectedHolder && (
                      <div className="rounded-xl bg-muted/40 p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{selectedHolder.name}</span>
                          <span className="text-xs font-mono text-muted-foreground">
                            {selectedHolder.accountNo}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Current fund: {selectedHolder.currentFund}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          CHN: {selectedHolder.chn}
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="mrpsl-label">Target Fund *</label>
                      <div className="flex gap-3">
                        {(["same", "different"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setTargetFundMode(mode)}
                            className={`flex-1 cursor-pointer py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                              targetFundMode === mode
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border text-muted-foreground hover:border-muted-foreground"
                            }`}
                          >
                            {mode === "same"
                              ? "Same Fund (add to balance)"
                              : "Different Fund (new entry)"}
                          </button>
                        ))}
                      </div>
                      {targetFundMode === "different" && (
                        <Select
                          value={targetFund}
                          onValueChange={(v) => setTargetFund(v ?? "")}
                        >
                          <SelectTrigger className="mrpsl-input mt-2">
                            <SelectValue placeholder="Select different fund register" />
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
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Units Subscribed *</label>
                        <Input
                          className="mrpsl-input font-mono"
                          type="number"
                          min={1}
                          placeholder="0"
                          value={existingUnits}
                          onChange={(e) => setExistingUnits(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Amount Paid (₦)</label>
                        <Input
                          className="mrpsl-input font-mono"
                          type="number"
                          min={0}
                          placeholder="0.00"
                          value={existingAmount}
                          onChange={(e) => setExistingAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Date of Subscription</label>
                        <Input
                          className="mrpsl-input"
                          type="date"
                          value={existingSubDate}
                          onChange={(e) => setExistingSubDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="mrpsl-label">Narration *</label>
                      <Textarea
                        className="mrpsl-input resize-none"
                        rows={2}
                        placeholder="Description / narration for this additional subscription"
                        value={existingNarration}
                        onChange={(e) => setExistingNarration(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="mrpsl-label">Supporting Documents</label>
                      <DocumentUploadArea
                        files={existingDocuments}
                        onAdd={(list) =>
                          setExistingDocuments((prev) => [
                            ...prev,
                            ...Array.from(list ?? []),
                          ])
                        }
                        onRemove={(i) =>
                          setExistingDocuments((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (subscriberType === "new" ? !canSubmitNew : !canSubmitExisting)
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…
                  </>
                ) : (
                  "Submit Subscription"
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: summary / help panel */}
        <div className="space-y-3">
          <Card className="mrpsl-card p-4 text-sm space-y-3">
            <p className="font-semibold text-sm">What happens next</p>
            <ol className="space-y-2 text-muted-foreground text-xs list-none">
              {[
                "Subscription submitted for Team Lead review.",
                "CSCS Liaison and Recon Team Lead approves.",
                "Unit holder entry is confirmed on the fund register.",
                "Automatic email notification sent to the Fund Manager.",
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
            <p>• New subscribers are created fresh on the fund register.</p>
            <p>
              • Existing holders subscribing to the <em>same</em> fund have
              their balance incremented.
            </p>
            <p>
              • Existing holders subscribing to a <em>different</em> fund get a
              new entry on that register.
            </p>
            <p>• BVN is mandatory and must be exactly 11 digits.</p>
            <p>• Narration is required for all subscriptions.</p>
            <p>• Amount paid is optional at the time of entry.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

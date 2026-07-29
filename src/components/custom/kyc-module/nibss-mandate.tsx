"use client";

import { useState } from "react";
import {
  Loader2,
  Send,
  ShieldCheck,
  Upload,
  Users,
  FileSpreadsheet,
  Landmark,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { downloadCsvTemplate } from "@/lib/utils/csv-template";
import { ShareholderAccount } from "@/types/account-maintenance";
import { fullName } from "@/lib/utils/shareholder";
import {
  MANDATE_REASONS,
  type KycDoc,
  type MandateValidation,
  type MandateFields,
  type KycFieldChange,
} from "@/types/kyc-module";
import {
  useCreateNibssSingleRequest,
  useNibssNameEnquiry,
  useCreateNibssBatch,
} from "@/hooks/useKycModule";
import { ACCOUNT_TYPES, BANK_POOL } from "./seed-data";
import { valResultClass, valResultLabel } from "./helpers";
import { DetailHeader } from "./detail-header";
import { AccountSearch } from "./account-search";
import { DocAttach } from "./doc-attach";
import { NibssBatchView } from "./nibss-batch-view";

export function NibssMandate({ onBack }: { onBack: () => void }) {
  const [sub, setSub] = useState<"entry" | "single" | "bulk" | "batch">("entry");
  const [batchRef, setBatchRef] = useState<string | null>(null);

  if (sub === "single") return <NibssSingle onBack={() => setSub("entry")} />;
  if (sub === "bulk")
    return (
      <NibssBulkUpload
        onBack={() => setSub("entry")}
        onCreated={(ref) => {
          setBatchRef(ref);
          setSub("batch");
        }}
      />
    );
  if (sub === "batch" && batchRef)
    return <NibssBatchView batchRef={batchRef} onBack={() => setSub("entry")} />;

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to KYC Home"
        onBack={onBack}
        title="NIBSS Live Mandate"
        subtitle="Update bank mandate details — a single shareholder or a bulk upload."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setSub("single")}
          className="text-left rounded-xl border p-6 hover:border-primary/50 hover:bg-muted/20 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3">
            <Landmark className="h-5 w-5 text-indigo-700" />
          </div>
          <h3 className="font-semibold">Single Mandate</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            Search a shareholder and update their bank mandate with live validation.
          </p>
        </button>
        <button
          onClick={() => setSub("bulk")}
          className="text-left rounded-xl border p-6 hover:border-primary/50 hover:bg-muted/20 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3">
            <Users className="h-5 w-5 text-indigo-700" />
          </div>
          <h3 className="font-semibold">Bulk Upload</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            Upload a CSV/XLSX of mandate changes and process them in a batch view.
          </p>
        </button>
      </div>
    </div>
  );
}

// ── Single mandate ───────────────────────────────────────────────────────────

function NibssSingle({ onBack }: { onBack: () => void }) {
  const { currentUser } = useStore();
  const [account, setAccount] = useState<ShareholderAccount | null>(null);
  const [fields, setFields] = useState<MandateFields | null>(null);
  const [reasonCode, setReasonCode] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [docs, setDocs] = useState<KycDoc[]>([]);
  const [validation, setValidation] = useState<MandateValidation | null>(null);

  const validateMutation = useNibssNameEnquiry();
  const createMutation = useCreateNibssSingleRequest();

  function selectAccount(acc: ShareholderAccount) {
    setAccount(acc);
    setValidation(null);
    setDocs([]);
    setReasonCode("");
    setReasonNote("");
    setFields({
      bankName: acc.bankName ?? "",
      bankCode: BANK_POOL.find((b) => b.name === acc.bankName)?.code ?? "",
      nuban: acc.bankAccountNumber ?? "",
      accountName: fullName(acc),
      bvn: acc.bvn ?? "",
      accountType: "Savings",
    });
  }

  function set<K extends keyof MandateFields>(k: K, v: string) {
    setFields((f) => (f ? { ...f, [k]: v } : f));
    setValidation(null);
  }

  function runValidation() {
    validateMutation.mutate(undefined, {
      onSuccess: (v) => {
        setValidation(v);
        toast.info("Validation complete — review results below.");
      },
    });
  }

  function changes(): KycFieldChange[] {
    if (!account || !fields) return [];
    const defs: { field: keyof MandateFields; label: string; old: string }[] = [
      { field: "bankName", label: "Bank Name", old: account.bankName ?? "" },
      { field: "bankCode", label: "Bank Code", old: BANK_POOL.find((b) => b.name === account.bankName)?.code ?? "" },
      { field: "nuban", label: "NUBAN Account No", old: account.bankAccountNumber ?? "" },
      { field: "accountName", label: "Account Name", old: fullName(account) },
      { field: "bvn", label: "BVN", old: account.bvn ?? "" },
      { field: "accountType", label: "Account Type", old: "Savings" },
    ];
    return defs
      .filter((d) => fields[d.field] !== d.old)
      .map((d) => ({ field: d.field, label: d.label, oldValue: d.old, newValue: fields[d.field] }));
  }

  const reasonText = reasonCode === "Other" ? reasonNote : reasonCode;
  const changeList = changes();

  function submit() {
    if (!account || !fields) return;
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    if (!reasonCode) return toast.error("Select a reason for the mandate change.");
    if (reasonCode === "Other" && !reasonNote.trim()) return toast.error("Enter the reason.");
    if (changeList.length === 0) return toast.error("No mandate fields have been changed.");
    if (!validation) return toast.error("Run validation before submitting.");
    if (docs.length === 0) return toast.error("Attach a supporting document.");

    createMutation.mutate(
      {
        accountNumber: account.accountNumber,
        chn: account.chn,
        holderName: fullName(account),
        registerSymbol: account.registerSymbol,
        registerName: account.registerSymbol,
        changes: changeList,
        documents: docs,
        submittedBy: currentUser.email,
        reason: reasonText,
        validation,
      },
      {
        onSuccess: (r) => {
          toast.success(`${r.requestId} submitted for approval.`);
          setAccount(null);
          setFields(null);
        },
        onError: (err) => toast.error(err?.message || "Failed to submit mandate."),
      },
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to NIBSS"
        onBack={onBack}
        title="NIBSS Single Mandate"
        subtitle="Only the bank mandate block is editable; all other KYC fields are locked."
      />

      {!account || !fields ? (
        <AccountSearch onSelect={selectAccount} />
      ) : (
        <>
          {/* Locked identity */}
          <Card className="mrpsl-card p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-bold text-lg">{fullName(account)}</p>
                <p className="text-[13px] text-muted-foreground font-mono">
                  {account.accountNumber} · {account.registerSymbol} · CHN {account.chn || "—"}
                </p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {account.address || "—"} · Holdings: {account.holdings?.toLocaleString() ?? "—"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAccount(null)}>
                Change account
              </Button>
            </div>
          </Card>

          {/* Editable mandate block */}
          <Card className="mrpsl-card p-5 space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Bank Mandate Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Bank Name</label>
                <Select
                  value={fields.bankName}
                  onValueChange={(v) => {
                    set("bankName", v || "");
                    set("bankCode", BANK_POOL.find((b) => b.name === v)?.code ?? "");
                  }}
                >
                  <SelectTrigger className="mrpsl-input">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_POOL.map((b) => (
                      <SelectItem key={b.code} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Bank Code" value={fields.bankCode} onChange={(v) => set("bankCode", v)} />
              <Field label="NUBAN Account No" value={fields.nuban} onChange={(v) => set("nuban", v)} />
              <Field label="Account Name" value={fields.accountName} onChange={(v) => set("accountName", v)} />
              <Field label="BVN" value={fields.bvn} onChange={(v) => set("bvn", v)} />
              <div className="space-y-1.5">
                <label className="mrpsl-label">Account Type</label>
                <Select value={fields.accountType} onValueChange={(v) => set("accountType", v || "")}>
                  <SelectTrigger className="mrpsl-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Reason *</label>
                <Select value={reasonCode} onValueChange={(v) => setReasonCode(v || "")}>
                  <SelectTrigger className="mrpsl-input">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {MANDATE_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {reasonCode === "Other" && (
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Specify reason *</label>
                  <Input
                    className="mrpsl-input"
                    value={reasonNote}
                    onChange={(e) => setReasonNote(e.target.value)}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Validation */}
          <Card className="mrpsl-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Automated Validation</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={runValidation}
                disabled={validateMutation.isPending}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Run Validation
                {validateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </Button>
            </div>
            {validation ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ValChip label="NUBAN Check-digit" v={validation.nuban} />
                <ValChip label="NIBSS Name Enquiry" v={validation.nameEnquiry} note={validation.nameEnquiryResult} />
                <ValChip label="BVN-to-Name Match" v={validation.bvnMatch} />
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Run validation to check NUBAN, name enquiry and BVN match before submitting.
              </p>
            )}
          </Card>

          <Card className="mrpsl-card p-5 space-y-4">
            <h3 className="font-semibold text-sm">Supporting Document *</h3>
            <DocAttach docs={docs} onChange={setDocs} />
          </Card>

          <div className="flex justify-end">
            <Button size="lg" className="gap-1.5" onClick={submit} disabled={createMutation.isPending}>
              <Send className="h-4 w-4" /> Submit for Approval
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="mrpsl-label">{label}</label>
      <Input className="mrpsl-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ValChip({
  label,
  v,
  note,
}: {
  label: string;
  v: import("@/types/kyc-module").ValResult;
  note?: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <Badge className={`border-0 mt-1 ${valResultClass(v)}`}>{valResultLabel(v)}</Badge>
      {note && <div className="text-[12px] text-muted-foreground mt-1">{note}</div>}
    </div>
  );
}

// ── Bulk upload entry ────────────────────────────────────────────────────────

function NibssBulkUpload({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (batchRef: string) => void;
}) {
  const { currentUser } = useStore();
  const createBatch = useCreateNibssBatch();

  function handleFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    createBatch.mutate(
      { registerSymbol: "MTNN", uploadedBy: currentUser.email },
      {
        onSuccess: (b) => {
          toast.success(`Uploaded — batch ${b.batchRef} created (${b.rows.length} rows).`);
          onCreated(b.batchRef);
        },
        onError: (err) => toast.error(err?.message || "Failed to process upload."),
      },
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to NIBSS"
        onBack={onBack}
        title="NIBSS Bulk Upload"
        subtitle="Download the template, fill it, and upload to create a batch."
      />
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() =>
            downloadCsvTemplate(
              ["chn", "account_number", "new_bank", "new_account_no", "bvn", "reason"],
              "nibss_mandate_template.csv",
            )
          }
        >
          <FileSpreadsheet className="h-4 w-4" /> Download Template
        </Button>
      </div>
      <label className="block">
        <input
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-colors">
          {createBatch.isPending ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Validating upload…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <p className="text-sm font-medium">Click to upload CSV/XLSX</p>
              <p className="text-[12px]">The file is validated and routed to a batch view.</p>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

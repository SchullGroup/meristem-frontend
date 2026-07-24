"use client";

import { useRef, useState } from "react";
import {
  Loader2,
  FileSpreadsheet,
  Paperclip,
  FolderArchive,
  RefreshCw,
  Trash2,
  Send,
  Pencil,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { downloadCsvData } from "@/lib/utils/csv-template";
import { TablePagination } from "@/components/custom/table-pagination";
import type { NibssBatchRow } from "@/types/kyc-module";
import {
  useNibssBatch,
  useUpdateNibssRow,
  useAttachDocsToRows,
  useAttachByFilename,
  useRevalidateBatch,
  useRemoveNibssRows,
  useSubmitNibssBatch,
} from "@/hooks/useKycModule";
import { rowValidationClass } from "./helpers";
import { DetailHeader } from "./detail-header";
import { DocAttach } from "./doc-attach";

const PAGE_SIZE = 15;

export function NibssBatchView({
  batchRef,
  onBack,
}: {
  batchRef: string;
  onBack: () => void;
}) {
  const { currentUser } = useStore();
  const { data: batch, isLoading } = useNibssBatch(batchRef);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const attachToSelected = useAttachDocsToRows();
  const attachByFilename = useAttachByFilename();
  const revalidate = useRevalidateBatch();
  const removeRows = useRemoveNibssRows();
  const submitBatch = useSubmitNibssBatch();

  const selectedDocRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  if (isLoading || !batch) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to NIBSS" onBack={onBack} title="Loading batch…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (openRow !== null) {
    return (
      <NibssRowDetail
        batchRef={batchRef}
        rowNo={openRow}
        onBack={() => setOpenRow(null)}
      />
    );
  }

  const active = batch.rows.filter((r) => r.rowStatus !== "REMOVED");
  const stats = {
    total: active.length,
    valid: active.filter((r) => r.validationStatus === "VALID").length,
    warnings: active.filter((r) => r.validationStatus === "WARNING").length,
    failed: active.filter((r) => r.validationStatus === "FAILED").length,
    missingDocs: active.filter((r) => !r.documentAttached).length,
  };
  const submitted = batch.status !== "DRAFT";

  const totalPages = Math.max(1, Math.ceil(batch.rows.length / PAGE_SIZE));
  const pageRows = batch.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectableIds = pageRows.filter((r) => r.rowStatus !== "REMOVED").map((r) => r.rowNo);
  const allSel = selectableIds.length > 0 && selectableIds.every((n) => selected.has(n));

  function toggle(n: number) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(n)) s.delete(n);
      else s.add(n);
      return s;
    });
  }
  function toggleAll() {
    setSelected((prev) =>
      selectableIds.every((n) => prev.has(n)) ? new Set() : new Set(selectableIds),
    );
  }

  function attachSelectedDoc(files: FileList | null) {
    if (!files?.[0]) return;
    if (selected.size === 0) return toast.error("Select rows to attach to.");
    attachToSelected.mutate(
      {
        ref: batchRef,
        rowNos: Array.from(selected),
        doc: { name: files[0].name, url: "#", type: files[0].type || "application/pdf" },
      },
      {
        onSuccess: () => {
          toast.success(`Document attached to ${selected.size} row(s).`);
          setSelected(new Set());
        },
      },
    );
    if (selectedDocRef.current) selectedDocRef.current.value = "";
  }

  function attachZip(files: FileList | null) {
    if (!files || files.length === 0) return;
    const names = Array.from(files).map((f) => f.name);
    attachByFilename.mutate(
      { ref: batchRef, filenames: names },
      {
        onSuccess: (res) => {
          toast.success(
            `Matched ${res.matched} document(s).${res.unmatched.length ? ` ${res.unmatched.length} unmatched.` : ""}`,
          );
        },
      },
    );
    if (zipRef.current) zipRef.current.value = "";
  }

  function exportCsv() {
    downloadCsvData(
      ["Row", "CHN", "Account No", "Name", "Current Bank", "Current Acct", "New Bank", "New Acct", "BVN", "Reason", "Validation", "Name Enquiry", "Doc", "Status"],
      batch!.rows.map((r) => [
        String(r.rowNo),
        r.chn,
        r.accountNumber,
        r.holderName,
        r.currentBank,
        r.currentAccountNo,
        r.newBank,
        r.newAccountNo,
        r.bvn,
        r.reason,
        r.validationStatus,
        r.nameEnquiryResult,
        r.documentAttached ? "Y" : "N",
        r.rowStatus,
      ]),
      `nibss_batch_${batchRef}.csv`,
    );
    toast.success("Batch exported as CSV.");
  }

  function removeSelected() {
    if (selected.size === 0) return toast.error("Select rows to remove.");
    removeRows.mutate(
      { ref: batchRef, rowNos: Array.from(selected) },
      { onSuccess: () => { toast.success(`${selected.size} row(s) removed.`); setSelected(new Set()); } },
    );
  }

  function submit() {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    submitBatch.mutate(
      { ref: batchRef, submittedBy: currentUser.email },
      {
        onSuccess: () => {
          toast.success("Batch submitted for approval.");
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to submit batch."),
      },
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to NIBSS"
        onBack={onBack}
        title={`Batch #${batch.batchRef}`}
        subtitle={`KYC › NIBSS Live Mandate › Batch #${batch.batchRef} · ${batch.registerSymbol}`}
        actions={
          <>
            <Button variant="outline" className="gap-1.5" onClick={exportCsv}>
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
            {!submitted && (
              <Button className="gap-1.5" onClick={submit} disabled={submitBatch.isPending}>
                <Send className="h-4 w-4" /> Submit for Approval
                {submitBatch.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              </Button>
            )}
          </>
        }
      />

      {/* Header band */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <BandCard label="Total Rows" value={stats.total} />
        <BandCard label="Valid" value={stats.valid} tone="text-green-700" />
        <BandCard label="Warnings" value={stats.warnings} tone="text-amber-600" />
        <BandCard label="Failed" value={stats.failed} tone="text-red-600" />
        <BandCard label="Missing Docs" value={stats.missingDocs} tone="text-red-600" />
      </div>

      {stats.failed + stats.missingDocs > 0 && !submitted && (
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-[13px]">
          Submission is blocked until every row is valid-with-document or removed —{" "}
          <strong>{stats.failed}</strong> failed, <strong>{stats.missingDocs}</strong> missing documents.
        </div>
      )}

      {/* Batch actions */}
      {!submitted && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => selectedDocRef.current?.click()}>
            <Paperclip className="h-3.5 w-3.5" /> Attach Doc to Selected ({selected.size})
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => zipRef.current?.click()}>
            <FolderArchive className="h-3.5 w-3.5" /> Bulk Attach by Filename
            {attachByFilename.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => revalidate.mutate({ ref: batchRef })}
            disabled={revalidate.isPending}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Revalidate Batch
            {revalidate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
            onClick={removeSelected}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove Selected
          </Button>
          <input ref={selectedDocRef} type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => attachSelectedDoc(e.target.files)} />
          <input ref={zipRef} type="file" multiple className="hidden" accept="image/*,.pdf" onChange={(e) => attachZip(e.target.files)} />
        </div>
      )}

      {/* Batch table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                {!submitted && (
                  <th className="px-3 py-2 w-10">
                    <Checkbox checked={allSel} onCheckedChange={toggleAll} />
                  </th>
                )}
                <th className="px-3 py-2">ROW</th>
                <th className="px-3 py-2">CHN / ACCT</th>
                <th className="px-3 py-2">NAME</th>
                <th className="px-3 py-2">CURRENT BANK</th>
                <th className="px-3 py-2">CURRENT ACCT</th>
                <th className="px-3 py-2">NEW BANK</th>
                <th className="px-3 py-2">NEW ACCT</th>
                <th className="px-3 py-2">BVN</th>
                <th className="px-3 py-2">REASON</th>
                <th className="px-3 py-2">VALIDATION</th>
                <th className="px-3 py-2">NAME ENQUIRY</th>
                <th className="px-3 py-2 text-center">DOC</th>
                <th className="px-3 py-2">ROW STATUS</th>
                <th className="px-3 py-2 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px] font-mono">
              {pageRows.map((r) => {
                const removed = r.rowStatus === "REMOVED";
                return (
                  <tr
                    key={r.rowNo}
                    className={`mrpsl-table-row ${removed ? "opacity-40 line-through" : ""} ${selected.has(r.rowNo) ? "bg-primary/5" : ""}`}
                  >
                    {!submitted && (
                      <td className="px-3 py-2">
                        {!removed && (
                          <Checkbox checked={selected.has(r.rowNo)} onCheckedChange={() => toggle(r.rowNo)} />
                        )}
                      </td>
                    )}
                    <td className="px-3 py-2 text-muted-foreground">{r.rowNo}</td>
                    <td className="px-3 py-2">
                      {r.chn}
                      <div className="text-[11px] text-muted-foreground">{r.accountNumber}</div>
                    </td>
                    <td className="px-3 py-2 font-sans">{r.holderName}</td>
                    <td className="px-3 py-2 font-sans">{r.currentBank}</td>
                    <td className="px-3 py-2">{r.currentAccountNo}</td>
                    <td className="px-3 py-2 font-sans font-medium">{r.newBank}</td>
                    <td className="px-3 py-2">{r.newAccountNo}</td>
                    <td className="px-3 py-2">{r.bvn}</td>
                    <td className="px-3 py-2 font-sans">{r.reason}</td>
                    <td className="px-3 py-2">
                      <Badge className={`border-0 text-[11px] ${rowValidationClass(r.validationStatus)}`}>
                        {r.validationStatus}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-sans text-muted-foreground">{r.nameEnquiryResult}</td>
                    <td className="px-3 py-2 text-center">
                      {r.documentAttached ? (
                        <span className="text-green-700 font-bold">Y</span>
                      ) : (
                        <span className="text-red-600 font-bold">N</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          r.rowStatus === "VALID"
                            ? "text-green-700"
                            : r.rowStatus === "NEEDS_FIX"
                              ? "text-amber-600"
                              : "text-muted-foreground"
                        }
                      >
                        {r.rowStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {!removed && !submitted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-[12px]"
                          onClick={() => setOpenRow(r.rowNo)}
                        >
                          <Pencil className="h-3 w-3" /> Fix
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <TablePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        from={batch.rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
        to={Math.min(page * PAGE_SIZE, batch.rows.length)}
        total={batch.rows.length}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
      />
    </div>
  );
}

function BandCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="p-4">
      <div className="mrpsl-section-title">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tone ?? ""}`}>{value.toLocaleString()}</div>
    </Card>
  );
}

// ── Row detail (fix values + attach docs) ────────────────────────────────────

function NibssRowDetail({
  batchRef,
  rowNo,
  onBack,
}: {
  batchRef: string;
  rowNo: number;
  onBack: () => void;
}) {
  const { data: batch } = useNibssBatch(batchRef);
  const updateRow = useUpdateNibssRow();
  const attach = useAttachDocsToRows();
  const revalidate = useRevalidateBatch();

  const row = batch?.rows.find((r) => r.rowNo === rowNo);
  const [draft, setDraft] = useState<Partial<NibssBatchRow>>({});

  if (!row) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to Batch" onBack={onBack} title="Row not found" />
      </div>
    );
  }

  const val = <K extends keyof NibssBatchRow>(k: K): string =>
    String(draft[k] ?? row[k] ?? "");

  function saveField<K extends keyof NibssBatchRow>(k: K, v: string) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function persist() {
    updateRow.mutate(
      { ref: batchRef, rowNo, patch: draft },
      { onSuccess: () => { toast.success("Row updated."); setDraft({}); } },
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to Batch"
        onBack={onBack}
        title={`Row ${rowNo} — ${row.holderName}`}
        subtitle={`Batch #${batchRef} · ${row.chn} · ${row.accountNumber}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => revalidate.mutate({ ref: batchRef })}
            disabled={revalidate.isPending}
          >
            Revalidate
            {revalidate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </Button>
        }
      />

      <Card className="mrpsl-card p-5 space-y-4">
        <h3 className="font-semibold text-sm border-b pb-2">Correct Mandate Values</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="New Bank" value={val("newBank")} onChange={(v) => saveField("newBank", v)} />
          <Field label="New Account No" value={val("newAccountNo")} onChange={(v) => saveField("newAccountNo", v)} />
          <Field label="BVN" value={val("bvn")} onChange={(v) => saveField("bvn", v)} />
          <Field label="Reason" value={val("reason")} onChange={(v) => saveField("reason", v)} />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={persist} disabled={updateRow.isPending || Object.keys(draft).length === 0}>
            Save Changes
            {updateRow.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin ml-1.5" />}
          </Button>
        </div>
      </Card>

      <Card className="mrpsl-card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Supporting Document</h3>
        <DocAttach
          docs={row.documents}
          onChange={(docs) => {
            const last = docs[docs.length - 1];
            if (last) attach.mutate({ ref: batchRef, rowNos: [rowNo], doc: last });
          }}
        />
      </Card>
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

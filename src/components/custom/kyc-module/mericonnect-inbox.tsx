"use client";

import { useState } from "react";
import { RefreshCw, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useKycRequests, useSyncLog, useMericonnectSync } from "@/hooks/useKycModule";
import { KYC_REGISTERS } from "./seed-data";
import { requestStatusClass, requestStatusLabel, formatDate } from "./helpers";
import { DetailHeader } from "./detail-header";
import { InboxReview } from "./inbox-review";

export function MericonnectInbox({ onBack }: { onBack: () => void }) {
  const { currentUser } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [register, setRegister] = useState("");
  const [status, setStatus] = useState("");
  const [showLog, setShowLog] = useState(false);

  const { data: rows = [], isLoading } = useKycRequests({
    channel: "MERICONNECT",
    registerSymbol: register || undefined,
    status: (status || undefined) as never,
  });
  const { data: syncLog = [] } = useSyncLog();
  const syncMutation = useMericonnectSync();
  const lastSync = syncLog[0];

  function syncNow() {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    syncMutation.mutate(
      { ranBy: currentUser.email },
      {
        onSuccess: (e) =>
          toast.success(`Sync complete — ${e.recordsPulled} record(s) pulled, ${e.errors} error(s).`),
      },
    );
  }

  if (openId) {
    return (
      <InboxReview
        id={openId}
        onBack={() => setOpenId(null)}
        backLabel="Back to Mericonnect Inbox"
        allowRequestDoc
      />
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to KYC Home"
        onBack={onBack}
        title="KYC Portal (Mericonnect)"
        subtitle="Shareholder-submitted changes pulled from Mericonnect on a scheduled sync."
        actions={
          <>
            <Button variant="outline" className="gap-1.5" onClick={() => setShowLog((s) => !s)}>
              <History className="h-4 w-4" /> Sync Log
            </Button>
            <Button className="gap-1.5" onClick={syncNow} disabled={syncMutation.isPending}>
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} /> Sync Now
            </Button>
          </>
        }
      />

      <div className="text-[13px] text-muted-foreground">
        Last sync: {lastSync ? `${new Date(lastSync.ranAt).toLocaleString()} · ${lastSync.recordsPulled} pulled · ${lastSync.errors} error(s)` : "—"}
      </div>

      {showLog && (
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/20 border-b text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
            Sync Log
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-2">RAN AT</th>
                  <th className="px-4 py-2">RAN BY</th>
                  <th className="px-4 py-2 text-center">RECORDS PULLED</th>
                  <th className="px-4 py-2 text-center">ERRORS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {syncLog.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2">{new Date(s.ranAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-muted-foreground">{s.ranBy}</td>
                    <td className="px-4 py-2 text-center">{s.recordsPulled}</td>
                    <td className={`px-4 py-2 text-center ${s.errors ? "text-red-600 font-semibold" : ""}`}>
                      {s.errors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 items-end">
        <Filter label="Register" value={register} onChange={setRegister} placeholder="All Registers"
          options={KYC_REGISTERS.map((r) => [r.symbol, r.symbol])} />
        <Filter label="Status" value={status} onChange={setStatus} placeholder="All Statuses"
          options={[["DRAFT", "New"], ["SUBMITTED", "Submitted"], ["REJECTED", "Rejected"]]} />
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REQUEST ID</th>
                <th className="px-4 py-3">SHAREHOLDER</th>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">REQUEST TYPE</th>
                <th className="px-4 py-3 text-center">DOCS</th>
                <th className="px-4 py-3">DATE SUBMITTED</th>
                <th className="px-4 py-3">MERICONNECT REF</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    No Mericonnect requests.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-muted-foreground">{r.requestId}</td>
                    <td className="px-4 py-3 font-medium">{r.holderName}</td>
                    <td className="px-4 py-3 font-mono">{r.chn}</td>
                    <td className="px-4 py-3 font-semibold">{r.registerSymbol}</td>
                    <td className="px-4 py-3">{r.requestType ?? "—"}</td>
                    <td className="px-4 py-3 text-center">{r.documents.length}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(r.receivedDate)}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{r.externalRef}</td>
                    <td className="px-4 py-3">
                      <Badge className={`border-0 text-[12px] ${requestStatusClass(r.status)}`}>
                        {requestStatusLabel(r.status)}
                      </Badge>
                      {r.docsRequested && (
                        <div className="text-[11px] text-amber-600 mt-0.5">Doc requested</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" onClick={() => setOpenId(r.id)}>
                        {r.status === "DRAFT" ? "Review" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: [string, string][];
}) {
  return (
    <div className="flex flex-col">
      <label className="mrpsl-label">{label}</label>
      <Select value={value} onValueChange={(v) => onChange(v || "")}>
        <SelectTrigger className="w-44 mrpsl-input">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{placeholder}</SelectItem>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

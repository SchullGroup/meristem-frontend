"use client";

import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { formatNumber } from "@/lib/utils/format";
import { DematDetailDialog, StatusBadge, fmtDate } from "./demat-shared";
import { useGetAllCertificateDemat } from "@/hooks/useCertDematerialisation";
import type { Demat, DematStatus } from "@/actions/certDematActions";

const STATUSES: DematStatus[] = ["DRAFT", "CALLOVER", "AUTHORISED", "COO_APPROVED", "ICU_APPROVED", "LODGED", "LODGMENT_FAILED", "REJECTED"];

export function DematHistory() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DematStatus | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const { data, isLoading, isError, error } = useGetAllCertificateDemat({
    chn: search || undefined,
    status: status || undefined,
    page,
    size,
  });
  const records = useMemo(() => data?.content ?? [], [data]);
  const total = data?.totalElements ?? 0;

  const [detail, setDetail] = useState<Demat | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="mrpsl-input pl-9" placeholder="Search CHN…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={status || "__all"} onValueChange={(v) => { setStatus((v === "__all" ? "" : v) as DematStatus | ""); setPage(0); }}>
          <SelectTrigger className="w-48 mrpsl-input"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">HOLDER</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3 text-right">CERTS</th>
                <th className="px-4 py-3 text-right">TOTAL UNITS</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">CAPTURED</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…</td></tr>
              )}
              {isError && !isLoading && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-red-600 text-sm">{(error as Error)?.message ?? "Failed to load."}</td></tr>
              )}
              {!isLoading && !isError && records.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{r.chn}</td>
                  <td className="px-4 py-3 font-medium text-sm">{r.holderName || "—"}</td>
                  <td className="px-4 py-3"><Badge className="border-0 text-[12px] bg-gray-100 text-gray-800">{r.register}</Badge></td>
                  <td className="px-4 py-3 text-right font-mono">{r.certificates?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatNumber(r.totalUnits ?? 0)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{r.capturedBy || "—"}<br /><span className="text-[11px]">{fmtDate(r.capturedAt)}</span></td>
                  <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => setDetail(r)}>View</Button></td>
                </tr>
              ))}
              {!isLoading && !isError && records.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && (
          <PaginationBar page={page} total={total} pageSize={size} onPageChange={setPage} onPageSizeChange={(s) => { setSize(s); setPage(0); }} pageBase={0} />
        )}
      </Card>

      <DematDetailDialog record={detail} open={detail !== null} onClose={() => setDetail(null)} />
    </div>
  );
}

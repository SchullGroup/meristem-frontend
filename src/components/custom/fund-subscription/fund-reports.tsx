"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { CalendarRange, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import { useGetRegistersByType } from "@/hooks/useRegisters";
import {
  GET_SUBSCRIPTION_SUMMARY,
  GET_PENDING_SUBSCRIPTIONS_REPORT,
  GET_REJECTED_SUBSCRIPTIONS_REPORT,
  GET_REDEMPTION_SUMMARY,
  GET_PENDING_REDEMPTIONS_REPORT,
  GET_REGISTER_MOVEMENT,
  type SubscriptionSummaryReport,
  type RedemptionSummaryReport,
  type RegisterMovementReport,
} from "@/actions/fundActions";

type Kind = "sub" | "redm" | "movement";
interface ReportOption {
  key: string;
  label: string;
  kind: Kind;
  fn: (p: { fundRegisterId?: string; from?: string; to?: string }) => Promise<unknown>;
}

const SUB_REPORTS: ReportOption[] = [
  { key: "sub-summary", label: "Subscription Summary", kind: "sub", fn: GET_SUBSCRIPTION_SUMMARY },
  { key: "sub-pending", label: "Pending Subscriptions", kind: "sub", fn: GET_PENDING_SUBSCRIPTIONS_REPORT },
  { key: "sub-rejected", label: "Rejected Subscriptions", kind: "sub", fn: GET_REJECTED_SUBSCRIPTIONS_REPORT },
  { key: "movement", label: "Fund Register Movement", kind: "movement", fn: GET_REGISTER_MOVEMENT },
];
const REDM_REPORTS: ReportOption[] = [
  { key: "redm-summary", label: "Redemption Summary", kind: "redm", fn: GET_REDEMPTION_SUMMARY },
  { key: "redm-pending", label: "Pending Redemptions", kind: "redm", fn: GET_PENDING_REDEMPTIONS_REPORT },
  { key: "movement", label: "Fund Register Movement", kind: "movement", fn: GET_REGISTER_MOVEMENT },
];

const iso = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : undefined);
const fmtDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : format(d, "dd MMM yyyy");
};
const naira = (v?: number | null) => (v != null ? `₦${formatNumber(v)}` : "—");

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <Card className="mrpsl-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-mono font-bold text-lg mt-1 ${tone ?? ""}`}>{value}</p>
    </Card>
  );
}

export function FundReports({ variant }: { variant: "subscription" | "redemption" | "all" }) {
  const options =
    variant === "subscription" ? SUB_REPORTS
    : variant === "redemption" ? REDM_REPORTS
    : [...SUB_REPORTS, ...REDM_REPORTS.filter((r) => r.key !== "movement")];
  const { data: fundRegisters } = useGetRegistersByType("Fund");

  const [selectedKey, setSelectedKey] = useState(options[0].key);
  const [register, setRegister] = useState("");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [committed, setCommitted] = useState<{ opt: ReportOption; params: { fundRegisterId?: string; from?: string; to?: string } } | null>(null);

  const selected = options.find((o) => o.key === selectedKey)!;

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["funds", "report", committed?.opt.key, committed?.params],
    queryFn: () => committed!.opt.fn(committed!.params),
    enabled: !!committed,
  });

  const generate = () => {
    const params = { fundRegisterId: register || undefined, from: iso(range?.from), to: iso(range?.to) };
    if (selected.kind === "movement" && (!params.fundRegisterId || !params.from || !params.to)) {
      toast.error("Fund Register Movement requires a fund register and a date range.");
      return;
    }
    setCommitted({ opt: selected, params });
  };

  return (
    <div className="space-y-4">
      <Card className="mrpsl-card">
        <div className="p-4 border-b bg-muted/20">
          <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">Report Type</p>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {options.map((r) => (
            <button
              key={r.key}
              onClick={() => setSelectedKey(r.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                selectedKey === r.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mrpsl-card p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={register || "__all"} onValueChange={(v) => setRegister(v === "__all" ? "" : (v ?? ""))}>
            <SelectTrigger className="mrpsl-input h-9 w-56"><SelectValue placeholder="All Fund Registers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Fund Registers</SelectItem>
              {(fundRegisters ?? []).map((r) => (
                <SelectItem key={r.registerId} value={r.registerId}>{r.registerName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker date={range} setDate={setRange} placeholder="Select date range" className="w-72" />
          <Button size="xl" onClick={generate} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CalendarRange className="h-3.5 w-3.5 mr-1.5" />}
            Generate Report
          </Button>
        </div>
        {selected.kind === "movement" && (
          <p className="text-xs text-muted-foreground mt-2">Register movement needs a specific fund register and date range.</p>
        )}
      </Card>

      {!committed ? (
        <div className="flex flex-col items-center justify-center py-20 bg-background border rounded-2xl border-dashed text-muted-foreground text-center">
          <CalendarRange className="h-10 w-10 text-muted-foreground/35 mb-3" />
          <h3 className="font-semibold text-sm text-foreground">Ready to generate</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-72">Configure your parameters above and click &quot;Generate Report&quot;.</p>
        </div>
      ) : isFetching ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Generating…</div>
      ) : isError ? (
        <div className="py-16 text-center text-red-600 text-sm">{(error as Error)?.message ?? "Failed to generate report."}</div>
      ) : committed.opt.kind === "sub" ? (
        <SubReport report={data as SubscriptionSummaryReport} />
      ) : committed.opt.kind === "redm" ? (
        <RedmReport report={data as RedemptionSummaryReport} />
      ) : (
        <MovementReport report={data as RegisterMovementReport} />
      )}
    </div>
  );
}

function SubReport({ report }: { report: SubscriptionSummaryReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Subscriptions" value={formatNumber(report.totalSubscriptions)} />
        <Stat label="Units Subscribed" value={formatNumber(report.totalUnitsSubscribed)} />
        <Stat label="Amount Paid" value={naira(report.totalAmountPaid)} />
        <Stat label="New / Existing" value={`${report.newSubscribers} / ${report.existingHolders}`} />
        <Stat label="Pending" value={formatNumber(report.pendingCount)} tone="text-amber-600" />
        <Stat label="Approved" value={formatNumber(report.approvedCount)} tone="text-green-600" />
        <Stat label="Rejected" value={formatNumber(report.rejectedCount)} tone="text-red-600" />
      </div>
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REF</th><th className="px-4 py-3">HOLDER</th><th className="px-4 py-3">TYPE</th>
                <th className="px-4 py-3 text-right">UNITS</th><th className="px-4 py-3 text-right">AMOUNT</th>
                <th className="px-4 py-3">DATE</th><th className="px-4 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {report.rows.map((r) => (
                <tr key={r.ref} className="mrpsl-table-row">
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{r.ref}</td>
                  <td className="px-4 py-3 font-medium">{r.holderName || "—"}</td>
                  <td className="px-4 py-3">{r.subscriberType === "NEW" ? "New" : "Existing"}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatNumber(r.unitsSubscribed)}</td>
                  <td className="px-4 py-3 text-right font-mono">{naira(r.amountPaid)}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{fmtDate(r.subscriptionDate)}</td>
                  <td className="px-4 py-3"><Badge className="border-0 text-[11px] bg-gray-100 text-gray-800">{r.status}{r.ageInDays != null ? ` · ${r.ageInDays}d` : ""}</Badge></td>
                </tr>
              ))}
              {report.rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">No records in range.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function RedmReport({ report }: { report: RedemptionSummaryReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Redemptions" value={formatNumber(report.totalRedemptions)} />
        <Stat label="Units Redeemed" value={formatNumber(report.totalUnitsRedeemed)} />
        <Stat label="Pending" value={formatNumber(report.pendingCount)} tone="text-amber-600" />
        <Stat label="Approved" value={formatNumber(report.approvedCount)} tone="text-green-600" />
      </div>
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REF</th><th className="px-4 py-3">HOLDER</th>
                <th className="px-4 py-3 text-right">UNITS</th><th className="px-4 py-3">REDEMPTION DATE</th>
                <th className="px-4 py-3">DATE PAYABLE</th><th className="px-4 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {report.rows.map((r) => (
                <tr key={r.ref} className="mrpsl-table-row">
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{r.ref}</td>
                  <td className="px-4 py-3 font-medium">{r.holderName || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatNumber(r.unitsRequested)}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{fmtDate(r.redemptionDate)}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{fmtDate(r.datePayable)}</td>
                  <td className="px-4 py-3"><Badge className="border-0 text-[11px] bg-gray-100 text-gray-800">{r.status}{r.ageInDays != null ? ` · ${r.ageInDays}d` : ""}</Badge></td>
                </tr>
              ))}
              {report.rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">No records in range.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MovementReport({ report }: { report: RegisterMovementReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Opening Balance" value={formatNumber(report.openingBalance)} />
        <Stat label="Subscribed" value={formatNumber(report.totalSubscribed)} tone="text-green-600" />
        <Stat label="Redeemed" value={formatNumber(report.totalRedeemed)} tone="text-red-600" />
        <Stat label="Closing Balance" value={formatNumber(report.closingBalance)} />
      </div>
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">DATE</th><th className="px-4 py-3">REF</th><th className="px-4 py-3">HOLDER</th>
                <th className="px-4 py-3">TYPE</th><th className="px-4 py-3 text-right">UNITS</th><th className="px-4 py-3 text-right">RUNNING BALANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {report.rows.map((r, i) => (
                <tr key={`${r.ref}-${i}`} className="mrpsl-table-row">
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{fmtDate(r.date)}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{r.ref}</td>
                  <td className="px-4 py-3 font-medium">{r.holderName || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={`border-0 text-[11px] ${r.type === "REDEMPTION" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800"}`}>{r.type}</Badge>
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${r.type === "REDEMPTION" ? "text-red-600" : "text-green-600"}`}>
                    {r.type === "REDEMPTION" ? "−" : "+"}{formatNumber(r.units)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatNumber(r.runningBalance)}</td>
                </tr>
              ))}
              {report.rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">No movements in range.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

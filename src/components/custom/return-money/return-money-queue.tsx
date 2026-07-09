"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OfferType = "IPO" | "Rights Issue";
type RefundStatus = "Pending" | "Batched" | "Dispatched" | "Confirmed" | "Failed";
type RefundReason = "Over-subscription" | "Rejected — KYC" | "Rejected — Funds";

export interface RefundRecord {
  id: string;
  offerType: OfferType;
  offerName: string;
  register: string;
  accountNo: string;
  holderName: string;
  amountApplied: number;
  amountAllotted: number;
  refundAmount: number;
  reason: RefundReason;
  status: RefundStatus;
  dateQueued: Date;
}

const MOCK_RECORDS: RefundRecord[] = [
  { id: "r01", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", register: "ACCESS", accountNo: "ACC-00123456", holderName: "Adebayo Oluwaseun", amountApplied: 250_000, amountAllotted: 92_500, refundAmount: 157_500, reason: "Over-subscription", status: "Pending", dateQueued: new Date("2024-09-01") },
  { id: "r02", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", register: "ACCESS", accountNo: "ACC-00234567", holderName: "Chinwe Okafor-Nwosu", amountApplied: 500_000, amountAllotted: 0, refundAmount: 500_000, reason: "Rejected — KYC", status: "Batched", dateQueued: new Date("2024-09-01") },
  { id: "r03", offerType: "Rights Issue", offerName: "Fidelity Bank PLC Rights Issue 2024", register: "FIDELITY", accountNo: "ACC-00345678", holderName: "Emeka Nwachukwu", amountApplied: 185_000, amountAllotted: 92_500, refundAmount: 92_500, reason: "Over-subscription", status: "Pending", dateQueued: new Date("2024-09-02") },
  { id: "r04", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", register: "ACCESS", accountNo: "ACC-00456789", holderName: "Fatima Garba Abubakar", amountApplied: 1_000_000, amountAllotted: 0, refundAmount: 1_000_000, reason: "Rejected — Funds", status: "Dispatched", dateQueued: new Date("2024-08-31") },
  { id: "r05", offerType: "Rights Issue", offerName: "Fidelity Bank PLC Rights Issue 2024", register: "FIDELITY", accountNo: "ACC-00567890", holderName: "Yemi Olatunde-Bello", amountApplied: 141_700, amountAllotted: 90_000, refundAmount: 51_700, reason: "Over-subscription", status: "Confirmed", dateQueued: new Date("2024-08-30") },
  { id: "r06", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", register: "ACCESS", accountNo: "ACC-00678901", holderName: "Ngozi Eze", amountApplied: 370_000, amountAllotted: 185_000, refundAmount: 185_000, reason: "Over-subscription", status: "Pending", dateQueued: new Date("2024-09-02") },
  { id: "r07", offerType: "Rights Issue", offerName: "Fidelity Bank PLC Rights Issue 2024", register: "FIDELITY", accountNo: "ACC-00789012", holderName: "Tunde Adewale Bakare", amountApplied: 84_175, amountAllotted: 0, refundAmount: 84_175, reason: "Rejected — KYC", status: "Failed", dateQueued: new Date("2024-09-01") },
  { id: "r08", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", register: "ACCESS", accountNo: "ACC-00890123", holderName: "Amaka Chidinma Nnaji", amountApplied: 2_500_000, amountAllotted: 1_250_000, refundAmount: 1_250_000, reason: "Over-subscription", status: "Batched", dateQueued: new Date("2024-09-01") },
  { id: "r09", offerType: "Rights Issue", offerName: "Fidelity Bank PLC Rights Issue 2024", register: "FIDELITY", accountNo: "ACC-00901234", holderName: "Sunday Okonkwo", amountApplied: 308_025, amountAllotted: 0, refundAmount: 308_025, reason: "Rejected — Funds", status: "Confirmed", dateQueued: new Date("2024-08-29") },
  { id: "r10", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", register: "ACCESS", accountNo: "ACC-01012345", holderName: "Halima Mohammed", amountApplied: 73_025, amountAllotted: 36_512, refundAmount: 36_513, reason: "Over-subscription", status: "Pending", dateQueued: new Date("2024-09-02") },
  { id: "r11", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", register: "ACCESS", accountNo: "ACC-01123456", holderName: "Chukwuemeka Obasi", amountApplied: 150_000, amountAllotted: 0, refundAmount: 150_000, reason: "Rejected — KYC", status: "Pending", dateQueued: new Date("2024-09-03") },
  { id: "r12", offerType: "Rights Issue", offerName: "Fidelity Bank PLC Rights Issue 2024", register: "FIDELITY", accountNo: "ACC-01234567", holderName: "Blessing Okeke", amountApplied: 231_250, amountAllotted: 92_500, refundAmount: 138_750, reason: "Over-subscription", status: "Dispatched", dateQueued: new Date("2024-09-01") },
];

const STATUS_STYLES: Record<RefundStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 border-0",
  Batched: "bg-blue-100 text-blue-800 border-0",
  Dispatched: "bg-purple-100 text-purple-800 border-0",
  Confirmed: "bg-green-100 text-green-800 border-0",
  Failed: "bg-red-100 text-red-800 border-0",
};

const REASON_STYLES: Record<RefundReason, string> = {
  "Over-subscription": "bg-slate-100 text-slate-700 border-0",
  "Rejected — KYC": "bg-orange-100 text-orange-700 border-0",
  "Rejected — Funds": "bg-red-100 text-red-700 border-0",
};

const ALL_STATUSES: RefundStatus[] = ["Pending", "Batched", "Dispatched", "Confirmed", "Failed"];
const ALL_REASONS: RefundReason[] = ["Over-subscription", "Rejected — KYC", "Rejected — Funds"];

export function ReturnMoneyQueue() {
  const [search, setSearch] = useState("");
  const [filterOfferType, setFilterOfferType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterReason, setFilterReason] = useState<string>("");

  const filtered = MOCK_RECORDS.filter((r) => {
    if (search && !r.holderName.toLowerCase().includes(search.toLowerCase()) && !r.accountNo.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterOfferType && r.offerType !== filterOfferType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterReason && r.reason !== filterReason) return false;
    return true;
  });

  const totalRefundable = filtered
    .filter((r) => r.status === "Pending")
    .reduce((s, r) => s + r.refundAmount, 0);

  const statusCounts = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, MOCK_RECORDS.filter((r) => r.status === s).length])
  );

  const hasFilters = !!(search || filterOfferType || filterStatus || filterReason);

  return (
    <div className="space-y-4">
      {/* Status summary strip */}
      <div className="grid grid-cols-5 gap-3">
        {ALL_STATUSES.map((s) => (
          <Card
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
            className={`mrpsl-card p-3 cursor-pointer transition-all ${filterStatus === s ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-center justify-between">
              <p className="mrpsl-label">{s}</p>
              <Badge className={STATUS_STYLES[s]}>{statusCounts[s]}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mrpsl-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-9 mrpsl-input"
              placeholder="Search by account or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterOfferType} onValueChange={(v) => setFilterOfferType(v ?? "")}>
            <SelectTrigger className="mrpsl-input h-9 w-40">
              <SelectValue placeholder="All Offer Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Offer Types</SelectItem>
              <SelectItem value="IPO">IPO</SelectItem>
              <SelectItem value="Rights Issue">Rights Issue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "")}>
            <SelectTrigger className="mrpsl-input h-9 w-36">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterReason} onValueChange={(v) => setFilterReason(v ?? "")}>
            <SelectTrigger className="mrpsl-input h-9 w-48">
              <SelectValue placeholder="All Reasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Reasons</SelectItem>
              {ALL_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => { setSearch(""); setFilterOfferType(""); setFilterStatus(""); setFilterReason(""); }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{filtered.length} of {MOCK_RECORDS.length} records</span>
            {filtered.some((r) => r.status === "Pending") && (
              <span className="ml-2 text-amber-700 font-medium">
                · ₦{(totalRefundable / 1e6).toFixed(2)}M pending dispatch
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">Offer Type</th>
                <th className="text-left px-4 py-2.5 font-medium">Offer Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Register</th>
                <th className="text-left px-4 py-2.5 font-medium">Account No.</th>
                <th className="text-left px-4 py-2.5 font-medium">Holder Name</th>
                <th className="text-right px-4 py-2.5 font-medium">Applied (₦)</th>
                <th className="text-right px-4 py-2.5 font-medium">Allotted (₦)</th>
                <th className="text-right px-4 py-2.5 font-medium">Refund (₦)</th>
                <th className="text-left px-4 py-2.5 font-medium">Reason</th>
                <th className="text-center px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Date Queued</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-2.5">
                    <Badge className={r.offerType === "IPO" ? "bg-blue-100 text-blue-800 border-0" : "bg-violet-100 text-violet-800 border-0"}>
                      {r.offerType}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs max-w-40 truncate" title={r.offerName}>{r.offerName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.register}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                  <td className="px-4 py-2.5 font-medium text-sm">{r.holderName}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">₦{r.amountApplied.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">₦{r.amountAllotted.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-primary">₦{r.refundAmount.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={REASON_STYLES[r.reason]}>{r.reason}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge className={STATUS_STYLES[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{format(r.dateQueued, "dd MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
            {filtered.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No records match the current filters.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Shareholder, Register } from "@/lib/types";

const STATUS_BADGE: Record<Shareholder["status"], string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DORMANT: "bg-gray-100 text-gray-600",
  CAUTIONED: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

function maskBvn(bvn: string) {
  return `***${bvn.slice(-4)}`;
}

function DetailPanel({
  shareholder,
  register,
  onClose,
}: {
  shareholder: Shareholder;
  register: Register | undefined;
  onClose: () => void;
}) {
  return (
    <Card className="mt-4 border rounded-lg">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-sm">
              {shareholder.firstName[0]}
              {shareholder.lastName[0]}
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm">
              {shareholder.lastName}, {shareholder.firstName}
              {shareholder.otherNames ? ` ${shareholder.otherNames}` : ""}
            </p>
            <p className="text-[13px] text-muted-foreground font-mono">
              {shareholder.accountNumber}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 p-5 text-sm">
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground border-b pb-1.5 mb-2">
            Contact
          </p>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">Email</span>
            <span className="break-all">{shareholder.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">Phone</span>
            <span className="font-mono">{shareholder.phone}</span>
          </div>
          {shareholder.phone2 && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-24 shrink-0">
                Alt Phone
              </span>
              <span className="font-mono">{shareholder.phone2}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">Address</span>
            <span className="leading-snug">
              {shareholder.address}, {shareholder.state}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground border-b pb-1.5 mb-2">
            Financial
          </p>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Bank</span>
            <span>{shareholder.bankName}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">
              Account No
            </span>
            <span className="font-mono">{shareholder.bankAccountNumber}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">BVN</span>
            <span className="font-mono">{maskBvn(shareholder.bvn)}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground border-b pb-1.5 mb-2">
            Register
          </p>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">
              Register
            </span>
            <span>
              {register ? `${register.name} (${register.symbol})` : "—"}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">CHN</span>
            <span className="font-mono">{shareholder.chn}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">
              Holdings
            </span>
            <span className="font-mono font-semibold">
              {shareholder.holdings.toLocaleString()}
            </span>
          </div>
          {shareholder.cautionReason && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-24 shrink-0">
                Caution
              </span>
              <span className="text-amber-700">
                {shareholder.cautionReason}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function ShareholderRegisterPage() {
  const { shareholders, registers } = useStore();

  const [registerFilter, setRegisterFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Shareholder | null>(null);

  const activeRegisters = useMemo(
    () => registers.filter((r) => r.status === "ACTIVE"),
    [registers],
  );

  const registerMap = useMemo(
    () => new Map(registers.map((r) => [r.id, r])),
    [registers],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return shareholders.filter((s) => {
      if (registerFilter !== "all" && s.registerId !== registerFilter)
        return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (term) {
        const haystack =
          `${s.firstName} ${s.lastName} ${s.accountNumber} ${s.chn}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [shareholders, registerFilter, search, statusFilter]);

  const totalHoldings = useMemo(
    () => filtered.reduce((sum, s) => sum + s.holdings, 0),
    [filtered],
  );
  const activeCount = useMemo(
    () => filtered.filter((s) => s.status === "ACTIVE").length,
    [filtered],
  );
  const dormantCount = useMemo(
    () => filtered.filter((s) => s.status === "DORMANT").length,
    [filtered],
  );

  const {
    page,
    pageSize,
    totalPages,
    paged,
    from,
    to,
    total,
    setPage,
    setPageSize,
  } = usePagination(filtered, 15);

  function clearFilters() {
    setRegisterFilter("all");
    setSearch("");
    setStatusFilter("all");
    setSelected(null);
  }

  const hasFilters =
    registerFilter !== "all" || search.trim() !== "" || statusFilter !== "all";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Shareholder Register
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all shareholders across registers
        </p>
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex gap-3 items-end flex-nowrap">
          <Select
            value={registerFilter}
            onValueChange={(v) => {
              if (v !== null) setRegisterFilter(v);
              setSelected(null);
            }}
          >
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <SelectValue placeholder="All Registers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Registers</SelectItem>
              {activeRegisters.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8 h-9 text-sm"
              placeholder="Search name, account no, CHN…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelected(null);
              }}
            />
            {search && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              if (v !== null) setStatusFilter(v);
              setSelected(null);
            }}
          >
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DORMANT">Dormant</SelectItem>
              <SelectItem value="CAUTIONED">Cautioned</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total Shareholders",
            value: filtered.length.toLocaleString(),
          },
          { label: "Total Holdings", value: totalHoldings.toLocaleString() },
          { label: "Active", value: activeCount.toLocaleString() },
          { label: "Dormant", value: dormantCount.toLocaleString() },
        ].map((stat) => (
          <Card key={stat.label} className="px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </p>
            <p className="text-xl font-bold tabular-nums mt-0.5">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-10">
                  #
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Account No
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Holder Name
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  CHN
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  Holdings
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Register
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Holder Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    No shareholders match the current filters.
                  </td>
                </tr>
              ) : (
                paged.map((s, idx) => {
                  const reg = registerMap.get(s.registerId);
                  const isSelected = selected?.id === s.id;
                  const rowNum = from + idx;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelected(isSelected ? null : s)}
                      className={`cursor-pointer transition-colors text-[13px] ${
                        isSelected
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground tabular-nums">
                        {rowNum}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-medium">
                        {s.accountNumber}
                      </td>
                      <td className="px-3 py-2.5">
                        {s.lastName}, {s.firstName}
                        {s.otherNames ? ` ${s.otherNames}` : ""}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">
                        {s.chn}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                        {s.holdings.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          className={`${STATUS_BADGE[s.status]} border-0 text-[11px] font-semibold`}
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {reg?.symbol ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {s.holderType}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-3 border-t">
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            from={from}
            to={to}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      {selected && (
        <DetailPanel
          shareholder={selected}
          register={registerMap.get(selected.registerId)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

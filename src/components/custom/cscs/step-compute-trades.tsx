"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";

export interface TradeBalance {
  id: string;
  register: string;
  chn: string;
  shareholderName: string;
  originalUnits: number;
  totalBuys: number;
  totalSells: number;
  balanceAfter: number;
  status: "BALANCED" | "FLAGGED";
}

export interface MultiAccountGroup {
  shareholderName: string;
  register: string;
  rows: TradeBalance[];
}

const SEED_TRADE_BALANCES: TradeBalance[] = [
  { id: "1",  register: "DANGCEM", chn: "C0012345AK", shareholderName: "JOHN ADEYEMI BABATUNDE",   originalUnits: 50000,  totalBuys: 2500,  totalSells: 1200,  balanceAfter: 51300,  status: "BALANCED" },
  { id: "2",  register: "DANGCEM", chn: "C0023456BK", shareholderName: "NGOZI CHIDINMA OKAFOR",    originalUnits: 12000,  totalBuys: 500,   totalSells: 13500, balanceAfter: -1000,  status: "FLAGGED"  },
  // Second CHN for same holder in same register — multi-account scenario
  { id: "2b", register: "DANGCEM", chn: "C0023456BK-2", shareholderName: "NGOZI CHIDINMA OKAFOR", originalUnits: 3000,   totalBuys: 0,     totalSells: 0,     balanceAfter: 3000,   status: "BALANCED" },
  { id: "3",  register: "DANGCEM", chn: "C0033211DK", shareholderName: "TUNDE ABIODUN SALAMI",     originalUnits: 8750,   totalBuys: 1000,  totalSells: 800,   balanceAfter: 8950,   status: "BALANCED" },
  { id: "4",  register: "MTNN",    chn: "C0034567CK", shareholderName: "SAMUEL OLUWASEUN ADELEKE", originalUnits: 75000,  totalBuys: 10000, totalSells: 5000,  balanceAfter: 80000,  status: "BALANCED" },
  { id: "5",  register: "MTNN",    chn: "C0045678DK", shareholderName: "FATIMA ABUBAKAR MUSA",     originalUnits: 8000,   totalBuys: 0,     totalSells: 9500,  balanceAfter: -1500,  status: "FLAGGED"  },
  { id: "6",  register: "MTNN",    chn: "C0046789EK", shareholderName: "ADAEZE CHIBUIKE IROEGBU",  originalUnits: 31000,  totalBuys: 2000,  totalSells: 1500,  balanceAfter: 31500,  status: "BALANCED" },
  { id: "7",  register: "SEPLAT",  chn: "C0056789EK", shareholderName: "EMEKA CHUKWUEMEKA EZE",    originalUnits: 120000, totalBuys: 5000,  totalSells: 2000,  balanceAfter: 123000, status: "BALANCED" },
  { id: "8",  register: "SEPLAT",  chn: "C0067890FK", shareholderName: "AMAKA NGOZI OKONKWO",      originalUnits: 34500,  totalBuys: 1200,  totalSells: 36000, balanceAfter: -300,   status: "FLAGGED"  },
  { id: "9",  register: "UBA",     chn: "C0078901GK", shareholderName: "IBRAHIM USMAN HASSAN",     originalUnits: 67000,  totalBuys: 3000,  totalSells: 2500,  balanceAfter: 67500,  status: "BALANCED" },
  // Second CHN for same holder in same register — multi-account scenario
  { id: "9b", register: "UBA",     chn: "C0078901GK-2", shareholderName: "IBRAHIM USMAN HASSAN",  originalUnits: 15000,  totalBuys: 800,   totalSells: 0,     balanceAfter: 15800,  status: "BALANCED" },
  { id: "10", register: "UBA",     chn: "C0089012HK", shareholderName: "BLESSING CHISOM NWOSU",    originalUnits: 45000,  totalBuys: 0,     totalSells: 48000, balanceAfter: -3000,  status: "FLAGGED"  },
  { id: "11", register: "UBA",     chn: "C0099123IK", shareholderName: "CHUKWUEMEKA OKAFOR",       originalUnits: 23000,  totalBuys: 1500,  totalSells: 1000,  balanceAfter: 23500,  status: "BALANCED" },
  { id: "12", register: "UBA",     chn: "C0109234JK", shareholderName: "YETUNDE ADEFOPE ADEYEMI",  originalUnits: 55000,  totalBuys: 2200,  totalSells: 1800,  balanceAfter: 55400,  status: "BALANCED" },
];

const REGISTERS = Array.from(new Set(SEED_TRADE_BALANCES.map((r) => r.register)));

function deriveMultiAccountGroups(rows: TradeBalance[]): Map<string, TradeBalance[]> {
  const map = new Map<string, TradeBalance[]>();
  for (const row of rows) {
    const key = `${row.register}|${row.shareholderName}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  // Keep only keys with more than one CHN
  for (const [k, v] of map) {
    if (v.length <= 1) map.delete(k);
  }
  return map;
}

const multiAccountMap = deriveMultiAccountGroups(SEED_TRADE_BALANCES);

function isMultiAccount(row: TradeBalance): boolean {
  return multiAccountMap.has(`${row.register}|${row.shareholderName}`);
}

function hasActiveTrades(row: TradeBalance): boolean {
  return row.totalBuys > 0 || row.totalSells > 0;
}

interface StepComputeTradesProps {
  batchRef: string;
  onProceed: (excluded: MultiAccountGroup[]) => void;
  initialRegister?: string;
}

export function StepComputeTrades({ batchRef: _batchRef, onProceed, initialRegister }: StepComputeTradesProps) {
  const router = useRouter();
  const [registerFilter, setRegisterFilter] = useState(initialRegister ?? "All");

  const allFiltered = registerFilter === "All"
    ? SEED_TRADE_BALANCES
    : SEED_TRADE_BALANCES.filter((r) => r.register === registerFilter);

  // Split into single-account (main table) and multi-account (excluded)
  const singleAccountRows = allFiltered.filter((r) => !isMultiAccount(r));
  const multiAccountRows  = allFiltered.filter((r) => isMultiAccount(r));

  const balancedCount = singleAccountRows.filter((r) => r.status === "BALANCED").length;
  const flaggedCount  = singleAccountRows.filter((r) => r.status === "FLAGGED").length;

  // Derive groups from the full dataset (not just current filter) for hand-off
  const allMultiAccountGroups: MultiAccountGroup[] = Array.from(multiAccountMap.entries()).map(
    ([key, rows]) => {
      const [register, ...nameParts] = key.split("|");
      return { shareholderName: nameParts.join("|"), register, rows };
    },
  );

  const handleUpdateBalances = () => {
    const flaggedSingle = singleAccountRows.filter((r) => r.status === "FLAGGED").length;
    const excludedCount = allMultiAccountGroups.length;
    toast.success(
      `Balances updated for ${singleAccountRows.length} shareholder${singleAccountRows.length !== 1 ? "s" : ""}. ` +
        `${flaggedSingle} flagged transaction${flaggedSingle !== 1 ? "s" : ""} sent to Reconciliation. ` +
        (excludedCount > 0
          ? `${excludedCount} shareholder${excludedCount !== 1 ? "s" : ""} with multiple accounts excluded — review in Apply & Hand-off.`
          : ""),
    );
    onProceed(allMultiAccountGroups);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Compute Trade Balances</h3>
        <p className="text-sm text-muted-foreground mt-1">
          One row per resolved shareholder per register. BUY transactions are processed before SELL.
          Rows that do not balance are flagged and routed to Reconciliation — never force-processed.
          Shareholders with multiple accounts in the same register are excluded until consolidated.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="mrpsl-card p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Shareholders</p>
          <p className="font-mono font-bold text-lg">{formatNumber(singleAccountRows.length)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-green-50">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Balanced</p>
          <p className="font-mono font-bold text-lg text-green-700">{formatNumber(balancedCount)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-red-50">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Flagged (Shortfall)</p>
          <p className="font-mono font-bold text-lg text-red-700">{formatNumber(flaggedCount)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-amber-50">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Multiple Accounts</p>
          <p className="font-mono font-bold text-lg text-amber-700">{formatNumber(allMultiAccountGroups.length)}</p>
        </Card>
      </div>

      {/* Multi-account banner */}
      {allMultiAccountGroups.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Users className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>{allMultiAccountGroups.length} shareholder{allMultiAccountGroups.length !== 1 ? "s" : ""} have multiple accounts in the same register.</strong>{" "}
            Their trades are excluded from this batch — accounts must be consolidated or certificates
            transferred before their transactions can be applied.
          </p>
        </div>
      )}

      {/* Anti-ghost-seller notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Anti-Ghost Seller Protocol Active</strong> — BUY transactions are processed before SELL
          within each shareholder&apos;s batch. Shortfall SELLs are flagged and sent to Reconciliation — never
          force-processed. Transaction file is tied to the CHN at the sign:{" "}
          <span className="font-mono">+C00WERDYT</span> = BUY,{" "}
          <span className="font-mono">−C0442253AK</span> = SELL.
        </p>
      </div>

      {/* PII-chain note */}
      <div className="flex items-start gap-3 bg-muted/30 border border-border rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[13px] text-muted-foreground">
          Each CHN is resolved to a shareholder via a PII chain:{" "}
          <span className="font-mono">find user WHERE CHN = … OR BVN = … OR PHONE = … OR BANK_ACCOUNT = …</span>{" "}
          — because the same person can hold different CHNs across registers. Balances are totalled
          per shareholder <em>per register</em>.
        </p>
      </div>

      {/* Register filter */}
      <div className="flex items-center gap-2">
        <Select value={registerFilter} onValueChange={(v) => setRegisterFilter(v ?? "All")}>
          <SelectTrigger className="w-44 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Registers</SelectItem>
            {REGISTERS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Main trade balances table (single-account holders) ── */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Trade Balances — Single Account Holders
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">SHAREHOLDER NAME</th>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3 text-right">ORIGINAL UNITS</th>
                <th className="px-4 py-3 text-right">TOTAL BUYS</th>
                <th className="px-4 py-3 text-right">TOTAL SELLS</th>
                <th className="px-4 py-3 text-right">BALANCE AFTER TRADE</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {singleAccountRows.map((row) => {
                const isFlagged = row.status === "FLAGGED";
                return (
                  <tr
                    key={row.id}
                    className={`mrpsl-table-row ${isFlagged ? "bg-red-50/40 dark:bg-red-950/10" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">{row.register}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{row.shareholderName}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{row.chn}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">{formatNumber(row.originalUnits)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-green-600">+{formatNumber(row.totalBuys)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-red-600">−{formatNumber(row.totalSells)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-mono font-semibold ${isFlagged ? "text-red-600" : ""}`}>
                      {formatNumber(row.balanceAfter)}
                    </td>
                    <td className="px-4 py-3">
                      {isFlagged ? (
                        <div className="flex items-center gap-1.5 text-red-600 text-[13px]">
                          <AlertTriangle className="h-3.5 w-3.5" /> Flagged
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-700 text-[13px]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Balanced
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isFlagged && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[13px] border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() =>
                            router.push(
                              `/certificates/reconciliation?tab=cscs&batch=${encodeURIComponent(row.chn)}`,
                            )
                          }
                        >
                          Reconcile Trade
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
              <tr>
                <td colSpan={3} className="px-4 py-2.5 text-right text-muted-foreground">TOTALS</td>
                <td className="px-4 py-2.5 text-right">{formatNumber(singleAccountRows.reduce((a, r) => a + r.originalUnits, 0))}</td>
                <td className="px-4 py-2.5 text-right text-green-600">+{formatNumber(singleAccountRows.reduce((a, r) => a + r.totalBuys, 0))}</td>
                <td className="px-4 py-2.5 text-right text-red-600">−{formatNumber(singleAccountRows.reduce((a, r) => a + r.totalSells, 0))}</td>
                <td className="px-4 py-2.5 text-right">{formatNumber(singleAccountRows.reduce((a, r) => a + r.balanceAfter, 0))}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* ── Multi-account exclusion table ── */}
      {multiAccountRows.length > 0 && (
        <Card className="mrpsl-card overflow-hidden border-amber-200">
          <div className="px-4 py-3 border-b border-amber-200 bg-amber-50/60 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Excluded — Multiple Accounts in Same Register
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">SHAREHOLDER NAME</th>
                  <th className="px-4 py-3">CHN</th>
                  <th className="px-4 py-3 text-right">ORIGINAL UNITS</th>
                  <th className="px-4 py-3 text-right">TOTAL BUYS</th>
                  <th className="px-4 py-3 text-right">TOTAL SELLS</th>
                  <th className="px-4 py-3">MULTIPLE ACCOUNTS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {multiAccountRows.map((row) => {
                  const activeTradesFlag = hasActiveTrades(row);
                  return (
                    <tr key={row.id} className="mrpsl-table-row bg-amber-50/40">
                      <td className="px-4 py-3">
                        <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">{row.register}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{row.shareholderName}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{row.chn}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono">{formatNumber(row.originalUnits)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-green-600">+{formatNumber(row.totalBuys)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-red-600">−{formatNumber(row.totalSells)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">Multiple</Badge>
                          {activeTradesFlag && (
                            <span
                              title="Has active trades — must consolidate first"
                              className="flex items-center gap-1 text-[11px] text-amber-700 font-medium"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Active trades
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[12px] border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() =>
                              toast.info(
                                `Consolidation workflow for ${row.shareholderName} (${row.chn}) — coming soon.`,
                              )
                            }
                          >
                            Consolidate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[12px]"
                            onClick={() =>
                              toast.info(
                                `Certificate transfer for ${row.shareholderName} (${row.chn}) — coming soon.`,
                              )
                            }
                          >
                            Transfer Certs
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={handleUpdateBalances}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Update Balances
        </Button>
      </div>
    </div>
  );
}

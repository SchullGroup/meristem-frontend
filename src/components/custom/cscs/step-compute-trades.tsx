"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
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

interface TradeBalance {
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

const SEED_TRADE_BALANCES: TradeBalance[] = [
  { id: "1",  register: "DANGCEM", chn: "C0012345AK", shareholderName: "JOHN ADEYEMI BABATUNDE",   originalUnits: 50000,  totalBuys: 2500,  totalSells: 1200,  balanceAfter: 51300,  status: "BALANCED" },
  { id: "2",  register: "DANGCEM", chn: "C0023456BK", shareholderName: "NGOZI CHIDINMA OKAFOR",    originalUnits: 12000,  totalBuys: 500,   totalSells: 13500, balanceAfter: -1000,  status: "FLAGGED"  },
  { id: "3",  register: "DANGCEM", chn: "C0033211DK", shareholderName: "TUNDE ABIODUN SALAMI",     originalUnits: 8750,   totalBuys: 1000,  totalSells: 800,   balanceAfter: 8950,   status: "BALANCED" },
  { id: "4",  register: "MTNN",    chn: "C0034567CK", shareholderName: "SAMUEL OLUWASEUN ADELEKE", originalUnits: 75000,  totalBuys: 10000, totalSells: 5000,  balanceAfter: 80000,  status: "BALANCED" },
  { id: "5",  register: "MTNN",    chn: "C0045678DK", shareholderName: "FATIMA ABUBAKAR MUSA",     originalUnits: 8000,   totalBuys: 0,     totalSells: 9500,  balanceAfter: -1500,  status: "FLAGGED"  },
  { id: "6",  register: "MTNN",    chn: "C0046789EK", shareholderName: "ADAEZE CHIBUIKE IROEGBU",  originalUnits: 31000,  totalBuys: 2000,  totalSells: 1500,  balanceAfter: 31500,  status: "BALANCED" },
  { id: "7",  register: "SEPLAT",  chn: "C0056789EK", shareholderName: "EMEKA CHUKWUEMEKA EZE",    originalUnits: 120000, totalBuys: 5000,  totalSells: 2000,  balanceAfter: 123000, status: "BALANCED" },
  { id: "8",  register: "SEPLAT",  chn: "C0067890FK", shareholderName: "AMAKA NGOZI OKONKWO",      originalUnits: 34500,  totalBuys: 1200,  totalSells: 36000, balanceAfter: -300,   status: "FLAGGED"  },
  { id: "9",  register: "UBA",     chn: "C0078901GK", shareholderName: "IBRAHIM USMAN HASSAN",     originalUnits: 67000,  totalBuys: 3000,  totalSells: 2500,  balanceAfter: 67500,  status: "BALANCED" },
  { id: "10", register: "UBA",     chn: "C0089012HK", shareholderName: "BLESSING CHISOM NWOSU",    originalUnits: 45000,  totalBuys: 0,     totalSells: 48000, balanceAfter: -3000,  status: "FLAGGED"  },
  { id: "11", register: "UBA",     chn: "C0099123IK", shareholderName: "CHUKWUEMEKA OKAFOR",       originalUnits: 23000,  totalBuys: 1500,  totalSells: 1000,  balanceAfter: 23500,  status: "BALANCED" },
  { id: "12", register: "UBA",     chn: "C0109234JK", shareholderName: "YETUNDE ADEFOPE ADEYEMI",  originalUnits: 55000,  totalBuys: 2200,  totalSells: 1800,  balanceAfter: 55400,  status: "BALANCED" },
];

const REGISTERS = Array.from(new Set(SEED_TRADE_BALANCES.map((r) => r.register)));

interface StepComputeTradesProps {
  batchRef: string;
  onProceed: () => void;
  initialRegister?: string;
}

export function StepComputeTrades({ batchRef: _batchRef, onProceed, initialRegister }: StepComputeTradesProps) {
  const router = useRouter();
  const [registerFilter, setRegisterFilter] = useState(initialRegister ?? "All");

  const filtered = registerFilter === "All"
    ? SEED_TRADE_BALANCES
    : SEED_TRADE_BALANCES.filter((r) => r.register === registerFilter);

  const balancedCount = filtered.filter((r) => r.status === "BALANCED").length;
  const flaggedCount  = filtered.filter((r) => r.status === "FLAGGED").length;

  const handleUpdateBalances = () => {
    const total = SEED_TRADE_BALANCES.filter((r) => r.status === "FLAGGED").length;
    toast.success(
      `Balances updated. ${total} transaction${total !== 1 ? "s" : ""} did not balance out. Go to the Reconciliation tab to reconcile.`,
    );
    onProceed();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Compute Trade Balances</h3>
        <p className="text-sm text-muted-foreground mt-1">
          One row per resolved shareholder per register. BUY transactions are processed before SELL.
          Rows that do not balance are flagged and routed to Reconciliation — never force-processed.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="mrpsl-card p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Shareholders</p>
          <p className="font-mono font-bold text-lg">{formatNumber(filtered.length)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-green-50">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Balanced</p>
          <p className="font-mono font-bold text-lg text-green-700">{formatNumber(balancedCount)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-red-50">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Flagged (Shortfall)</p>
          <p className="font-mono font-bold text-lg text-red-700">{formatNumber(flaggedCount)}</p>
        </Card>
      </div>

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

      {/* PII-chain tooltip */}
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

      {/* Trade balances table */}
      <Card className="mrpsl-card overflow-hidden">
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
              {filtered.map((row) => {
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
                          onClick={() => router.push(`/certificates/reconciliation?tab=cscs&batch=${encodeURIComponent(row.chn)}`)}
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
                <td className="px-4 py-2.5 text-right">{formatNumber(filtered.reduce((a, r) => a + r.originalUnits, 0))}</td>
                <td className="px-4 py-2.5 text-right text-green-600">+{formatNumber(filtered.reduce((a, r) => a + r.totalBuys, 0))}</td>
                <td className="px-4 py-2.5 text-right text-red-600">−{formatNumber(filtered.reduce((a, r) => a + r.totalSells, 0))}</td>
                <td className="px-4 py-2.5 text-right">{formatNumber(filtered.reduce((a, r) => a + r.balanceAfter, 0))}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={handleUpdateBalances}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Update Balances
        </Button>
      </div>
    </div>
  );
}

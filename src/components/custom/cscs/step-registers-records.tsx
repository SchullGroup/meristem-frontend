"use client";

import { useState } from "react";
import { ArrowRight, FileText, List } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils/format";

interface RegisterRecord {
  symbol: string;
  name: string;
  kycRecords: number;
  missingStates: number;
  transactions: number;
  buys: number;
  sells: number;
  flagged: number;
}

const SEED_REGISTERS: RegisterRecord[] = [
  { symbol: "DANGCEM", name: "Dangote Cement PLC",              kycRecords: 245, missingStates: 12, transactions: 1842, buys: 890,  sells: 952,  flagged: 0  },
  { symbol: "MTNN",    name: "MTN Nigeria Communications PLC",  kycRecords: 389, missingStates: 23, transactions: 3241, buys: 1620, sells: 1621, flagged: 3  },
  { symbol: "SEPLAT",  name: "Seplat Energy PLC",               kycRecords: 134, missingStates: 5,  transactions: 876,  buys: 440,  sells: 436,  flagged: 2  },
  { symbol: "UBA",     name: "United Bank for Africa PLC",      kycRecords: 511, missingStates: 31, transactions: 4129, buys: 2075, sells: 2054, flagged: 14 },
];

interface StepRegistersRecordsProps {
  batchRef: string;
  onProceed: () => void;
}

export function StepRegistersRecords({ batchRef, onProceed }: StepRegistersRecordsProps) {
  const [expandedRegister, setExpandedRegister] = useState<string | null>(null);

  const totalKyc     = SEED_REGISTERS.reduce((a, r) => a + r.kycRecords,     0);
  const totalMissing = SEED_REGISTERS.reduce((a, r) => a + r.missingStates,  0);
  const totalTx      = SEED_REGISTERS.reduce((a, r) => a + r.transactions,   0);
  const totalFlagged = SEED_REGISTERS.reduce((a, r) => a + r.flagged,        0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono text-muted-foreground">{batchRef}</p>
        <h3 className="font-semibold text-base mt-0.5">Registers &amp; Records</h3>
        <p className="text-sm text-muted-foreground mt-1">
          ZIP extracted successfully — {SEED_REGISTERS.length} registers found. Verify record counts
          before proceeding to state resolution.
        </p>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "KYC Records",    value: totalKyc,     color: "" },
          { label: "Missing States", value: totalMissing, color: "text-amber-600" },
          { label: "Transactions",   value: totalTx,      color: "" },
          { label: "Flagged",        value: totalFlagged, color: totalFlagged > 0 ? "text-red-600" : "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="mrpsl-card p-4 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-mono font-bold text-lg ${color}`}>{formatNumber(value)}</p>
          </Card>
        ))}
      </div>

      {/* Per-register table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">COMPANY NAME</th>
                <th className="px-4 py-3 text-right">KYC RECORDS</th>
                <th className="px-4 py-3 text-right">MISSING STATES</th>
                <th className="px-4 py-3 text-right">TRANSACTIONS</th>
                <th className="px-4 py-3 text-right">BUYS</th>
                <th className="px-4 py-3 text-right">SELLS</th>
                <th className="px-4 py-3 text-right">FLAGGED</th>
                <th className="px-4 py-3 text-right">FILES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {SEED_REGISTERS.map((reg) => (
                <>
                  <tr key={reg.symbol} className="mrpsl-table-row">
                    <td className="px-4 py-3">
                      <Badge className="border-0 bg-primary/10 text-primary font-semibold text-sm">
                        {reg.symbol}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium">{reg.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">{formatNumber(reg.kycRecords)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">
                      <span className={reg.missingStates > 0 ? "text-amber-600 font-semibold" : ""}>
                        {formatNumber(reg.missingStates)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">{formatNumber(reg.transactions)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-green-600">+{formatNumber(reg.buys)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-red-600">−{formatNumber(reg.sells)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">
                      <span className={reg.flagged > 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                        {formatNumber(reg.flagged)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 px-2 text-[12px]">
                          <FileText className="h-3 w-3 mr-1" /> KYC
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[12px]"
                          onClick={() => setExpandedRegister(expandedRegister === reg.symbol ? null : reg.symbol)}
                        >
                          <List className="h-3 w-3 mr-1" /> TX
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {expandedRegister === reg.symbol && (
                    <tr key={`${reg.symbol}-tx`}>
                      <td colSpan={9} className="px-6 py-4 bg-muted/20 text-[13px] text-muted-foreground">
                        <p className="font-semibold text-foreground text-xs uppercase tracking-widest mb-3">
                          Transaction File Preview — {reg.symbol}
                        </p>
                        <div className="font-mono grid grid-cols-[auto_auto_auto_auto_auto] gap-x-8 gap-y-1 text-[12px]">
                          <span className="font-bold text-muted-foreground">TRANS_NUMB</span>
                          <span className="font-bold text-muted-foreground">DATE</span>
                          <span className="font-bold text-muted-foreground">CHN</span>
                          <span className="font-bold text-muted-foreground">QTY</span>
                          <span className="font-bold text-muted-foreground">SIGN</span>
                          <span>TRF-{reg.symbol}-001</span><span>2026-07-07</span><span>C0012345AK</span><span>2,500</span><span className="text-green-600">+ BUY</span>
                          <span>TRF-{reg.symbol}-002</span><span>2026-07-07</span><span>C0023456BK</span><span>13,500</span><span className="text-red-600">− SELL</span>
                          <span className="col-span-5 text-muted-foreground/60">… {formatNumber(reg.transactions - 2)} more rows</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 text-muted-foreground">BATCH TOTALS</td>
                <td className="px-4 py-2.5 text-right">{formatNumber(totalKyc)}</td>
                <td className="px-4 py-2.5 text-right text-amber-600">{formatNumber(totalMissing)}</td>
                <td className="px-4 py-2.5 text-right">{formatNumber(totalTx)}</td>
                <td className="px-4 py-2.5 text-right text-green-600">+{formatNumber(SEED_REGISTERS.reduce((a, r) => a + r.buys,  0))}</td>
                <td className="px-4 py-2.5 text-right text-red-600">−{formatNumber(SEED_REGISTERS.reduce((a, r) => a + r.sells, 0))}</td>
                <td className="px-4 py-2.5 text-right text-red-600">{formatNumber(totalFlagged)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={onProceed}>
          Resolve All KYC Files
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

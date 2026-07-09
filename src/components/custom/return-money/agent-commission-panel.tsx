"use client";

import { useState } from "react";
import { CheckCircle2, FileDown, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type CommissionStatus = "PENDING" | "PAID";

interface AgentCommissionRecord {
  id: string;
  agentName: string;
  agentType: string;
  totalApplications: number;
  totalValueSubmitted: number;
  totalValueRefunded: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
}

const MOCK_COMMISSIONS: AgentCommissionRecord[] = [
  {
    id: "c1",
    agentName: "Access Bank PLC",
    agentType: "Bank",
    totalApplications: 12450,
    totalValueSubmitted: 1_017_000_000,
    totalValueRefunded: 127_125_000,
    commissionRate: 0.75,
    commissionAmount: 953_437,
    status: "PENDING",
  },
  {
    id: "c2",
    agentName: "GTBank PLC",
    agentType: "Bank",
    totalApplications: 8320,
    totalValueSubmitted: 686_250_000,
    totalValueRefunded: 85_781_250,
    commissionRate: 0.75,
    commissionAmount: 643_359,
    status: "PENDING",
  },
  {
    id: "c3",
    agentName: "Zenith Bank PLC",
    agentType: "Bank",
    totalApplications: 6740,
    totalValueSubmitted: 497_250_000,
    totalValueRefunded: 42_265_625,
    commissionRate: 0.75,
    commissionAmount: 316_992,
    status: "PAID",
  },
  {
    id: "c4",
    agentName: "Meristem Securities Ltd",
    agentType: "Stockbroker",
    totalApplications: 3200,
    totalValueSubmitted: 258_750_000,
    totalValueRefunded: 21_979_687,
    commissionRate: 1.0,
    commissionAmount: 219_796,
    status: "PENDING",
  },
  {
    id: "c5",
    agentName: "CardinalStone Partners Ltd",
    agentType: "Stockbroker",
    totalApplications: 2800,
    totalValueSubmitted: 220_500_000,
    totalValueRefunded: 18_742_500,
    commissionRate: 1.0,
    commissionAmount: 187_425,
    status: "PAID",
  },
];

export function AgentCommissionPanel() {
  const [records, setRecords] = useState<AgentCommissionRecord[]>(MOCK_COMMISSIONS);
  const [generatingFile, setGeneratingFile] = useState(false);

  const pendingRecords = records.filter((r) => r.status === "PENDING");
  const totalCommissionPending = pendingRecords.reduce((s, r) => s + r.commissionAmount, 0);
  const totalCommissionPaid = records
    .filter((r) => r.status === "PAID")
    .reduce((s, r) => s + r.commissionAmount, 0);

  const handleMarkPaid = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: "PAID" } : r)));
    toast.success(`Commission for ${record.agentName} marked as paid.`);
  };

  const handleGenerateFile = async () => {
    if (pendingRecords.length === 0) {
      toast.info("No pending commissions to generate a payment file for.");
      return;
    }
    setGeneratingFile(true);
    await new Promise((r) => setTimeout(r, 900));
    setGeneratingFile(false);
    toast.success(
      `Commission payment file generated for ${pendingRecords.length} agents (₦${totalCommissionPending.toLocaleString()} total).`,
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Agents", value: records.length.toString() },
          { label: "Pending Commission", value: `₦${totalCommissionPending.toLocaleString()}`, highlight: true },
          { label: "Paid Commission", value: `₦${totalCommissionPaid.toLocaleString()}` },
          { label: "Pending Agents", value: pendingRecords.length.toString() },
        ].map(({ label, value, highlight }) => (
          <Card key={label} className="mrpsl-card p-3">
            <p className="mrpsl-label">{label}</p>
            <p className={`font-mono font-bold text-lg mt-1 ${highlight ? "text-primary" : ""}`}>
              {value}
            </p>
          </Card>
        ))}
      </div>

      {/* Info note */}
      <Card className="mrpsl-card p-3 bg-muted/30 border-dashed">
        <p className="text-xs text-muted-foreground">
          Commission is calculated on the value of each agent's applications that resulted in a
          refund. Commission rates are configured per agent in Offer Setup → Receiving Agents &
          Stockbrokers.
        </p>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={handleGenerateFile} disabled={generatingFile || pendingRecords.length === 0}>
          {generatingFile ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
          ) : (
            <><FileDown className="h-4 w-4 mr-2" /> Generate Commission Payment File</>
          )}
        </Button>
      </div>

      {/* Commission table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Agent Commission — Access Holdings Public Offer 2024
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">Agent Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Type</th>
                <th className="text-right px-4 py-2.5 font-medium">Applications</th>
                <th className="text-right px-4 py-2.5 font-medium">Value Submitted</th>
                <th className="text-right px-4 py-2.5 font-medium">Value Refunded</th>
                <th className="text-right px-4 py-2.5 font-medium">Rate (%)</th>
                <th className="text-right px-4 py-2.5 font-medium">Commission Owed</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 font-medium">{r.agentName}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.agentType}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.totalApplications.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    ₦{(r.totalValueSubmitted / 1e6).toFixed(1)}M
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    ₦{(r.totalValueRefunded / 1e6).toFixed(1)}M
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.commissionRate.toFixed(2)}%</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">
                    ₦{r.commissionAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      className={
                        r.status === "PAID"
                          ? "bg-green-100 text-green-800 border-0 text-[11px]"
                          : "bg-amber-100 text-amber-800 border-0 text-[11px]"
                      }
                    >
                      {r.status === "PAID" ? "Paid" : "Pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => handleMarkPaid(r.id)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Mark Paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

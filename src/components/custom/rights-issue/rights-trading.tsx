"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowRightLeft, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadStagingCard, UploadResult } from "@/components/custom/offer-administration/upload-staging-card";
import { toast } from "sonner";

interface TradeRecord {
  id: string;
  originalHolder: string;
  originalAccountNo: string;
  newHolder: string;
  newAccountNo: string;
  rightsTransferred: number;
  tradeDate: Date;
  cscsReference: string;
  status: "Confirmed" | "Pending" | "Rejected";
}

const MOCK_TRADES: TradeRecord[] = [
  {
    id: "t1",
    originalHolder: "Adebayo Oluwaseun",
    originalAccountNo: "ACC-00123456",
    newHolder: "Kolade Adeyemi",
    newAccountNo: "ACC-00987654",
    rightsTransferred: 2000,
    tradeDate: new Date("2024-08-05"),
    cscsReference: "CSCS-RT-2024-000451",
    status: "Confirmed",
  },
  {
    id: "t2",
    originalHolder: "Chinwe Okafor-Nwosu",
    originalAccountNo: "ACC-00234567",
    newHolder: "Taiwo Babatunde",
    newAccountNo: "ACC-00876543",
    rightsTransferred: 5000,
    tradeDate: new Date("2024-08-06"),
    cscsReference: "CSCS-RT-2024-000452",
    status: "Confirmed",
  },
  {
    id: "t3",
    originalHolder: "Emeka Nwachukwu",
    originalAccountNo: "ACC-00345678",
    newHolder: "Blessing Okeke",
    newAccountNo: "ACC-00765432",
    rightsTransferred: 875,
    tradeDate: new Date("2024-08-07"),
    cscsReference: "CSCS-RT-2024-000453",
    status: "Pending",
  },
  {
    id: "t4",
    originalHolder: "Yemi Olatunde-Bello",
    originalAccountNo: "ACC-00567890",
    newHolder: "Chidi Obiora",
    newAccountNo: "ACC-00654321",
    rightsTransferred: 532,
    tradeDate: new Date("2024-08-08"),
    cscsReference: "CSCS-RT-2024-000454",
    status: "Confirmed",
  },
  {
    id: "t5",
    originalHolder: "Ngozi Eze",
    originalAccountNo: "ACC-00678901",
    newHolder: "Aisha Suleiman",
    newAccountNo: "ACC-00543210",
    rightsTransferred: 1200,
    tradeDate: new Date("2024-08-09"),
    cscsReference: "CSCS-RT-2024-000455",
    status: "Rejected",
  },
  {
    id: "t6",
    originalHolder: "Sunday Okonkwo",
    originalAccountNo: "ACC-00901234",
    newHolder: "Michael Eze-Obiora",
    newAccountNo: "ACC-00432109",
    rightsTransferred: 3330,
    tradeDate: new Date("2024-08-10"),
    cscsReference: "CSCS-RT-2024-000456",
    status: "Confirmed",
  },
];

const STATUS_STYLES: Record<TradeRecord["status"], string> = {
  Confirmed: "bg-green-100 text-green-800 border-0",
  Pending: "bg-amber-100 text-amber-800 border-0",
  Rejected: "bg-red-100 text-red-800 border-0",
};

export function RightsTrading() {
  const [uploaded, setUploaded] = useState(false);
  const [filter, setFilter] = useState<"All" | TradeRecord["status"]>("All");

  const handleUpload = async (_file: File): Promise<UploadResult> => {
    const result: UploadResult = { totalRows: 6 };
    setUploaded(true);
    toast.success("Rights trading file processed — 6 trade records imported.");
    return result;
  };

  const filtered = MOCK_TRADES.filter((t) => filter === "All" || t.status === filter);

  const totalTransferred = MOCK_TRADES.reduce((s, t) => s + t.rightsTransferred, 0);
  const confirmed = MOCK_TRADES.filter((t) => t.status === "Confirmed").length;
  const pending = MOCK_TRADES.filter((t) => t.status === "Pending").length;
  const rejected = MOCK_TRADES.filter((t) => t.status === "Rejected").length;

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <UploadStagingCard
        label="Upload Rights Trading / Renunciation File"
        description="Upload the CSCS-provided rights trading confirmation file (.csv or .txt). The system will reconcile each transfer against the provisional allotment schedule."
        accept=".csv,.txt"
        onUpload={handleUpload}
      />

      {/* Ledger — only shown after upload */}
      {uploaded && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Trades", value: MOCK_TRADES.length.toLocaleString() },
              { label: "Confirmed", value: confirmed, highlight: "text-green-700" },
              { label: "Pending", value: pending, highlight: "text-amber-700" },
              {
                label: "Total Rights Transferred",
                value: totalTransferred.toLocaleString(),
                highlight: "text-primary",
              },
            ].map(({ label, value, highlight }) => (
              <Card key={label} className="mrpsl-card p-3">
                <p className="mrpsl-label">{label}</p>
                <p className={`font-mono font-semibold text-lg mt-1 ${highlight ?? ""}`}>
                  {value}
                </p>
              </Card>
            ))}
          </div>

          {/* Filter + Ledger table */}
          <Card className="mrpsl-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Rights Trading Ledger
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                {(["All", "Confirmed", "Pending", "Rejected"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      filter === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s}
                    {s !== "All" && (
                      <span className="ml-1 opacity-70">
                        ({s === "Confirmed" ? confirmed : s === "Pending" ? pending : rejected})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-2.5 font-medium">Original Holder</th>
                    <th className="text-left px-4 py-2.5 font-medium">New Holder</th>
                    <th className="text-right px-4 py-2.5 font-medium">Rights Transferred</th>
                    <th className="text-left px-4 py-2.5 font-medium">Trade Date</th>
                    <th className="text-left px-4 py-2.5 font-medium">CSCS Reference</th>
                    <th className="text-center px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="mrpsl-table-row">
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{t.originalHolder}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.originalAccountNo}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{t.newHolder}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.newAccountNo}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">
                        {t.rightsTransferred.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-sm">
                        {format(t.tradeDate, "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {t.cscsReference}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge className={STATUS_STYLES[t.status]}>{t.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No records match the selected filter.
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.info("Export coming soon")}>
              Export Ledger
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("Traded rights reconciled and forwarded to Allotment Rules Engine.")}
            >
              Reconcile & Forward to Allotment
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

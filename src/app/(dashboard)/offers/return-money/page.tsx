"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReturnMoneyQueue } from "@/components/custom/return-money/return-money-queue";
import { RefundBatchProcessing } from "@/components/custom/return-money/refund-batch-processing";
import { RefundReconciliation } from "@/components/custom/return-money/refund-reconciliation";
import { AgentCommissionPanel } from "@/components/custom/return-money/agent-commission-panel";
import { Button } from "@/components/ui/button";
import { CalendarRange, FileSpreadsheet, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const TABS = [
  "queue",
  "batch",
  "commission",
  "reconciliation",
  "reports",
] as const;
type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  queue: "Return Money Queue",
  batch: "Refund Batch Processing",
  commission: "Agent Commission",
  reconciliation: "Refund Reconciliation",
  reports: "Reports",
};

const REPORT_TYPES = [
  "Return Money Summary",
  "Return Money by Offer",
  "Return Money by Register",
  "Return Money Aging",
] as const;

export default function ReturnMoneyPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("queue");

  // Reports tab state
  const [selectedReport, setSelectedReport] = useState<string>(REPORT_TYPES[0]);
  const [filterRegister, setFilterRegister] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Return Money Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and process refunds arising from over-subscription or rejected
          applications from IPO / Public Offers, including agent commission
          calculation.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab((v as TabValue) || "queue")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5 flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-lg px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all cursor-pointer"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="queue">
            <ReturnMoneyQueue />
          </TabsContent>

          <TabsContent value="batch">
            <RefundBatchProcessing />
          </TabsContent>

          <TabsContent value="commission">
            <AgentCommissionPanel />
          </TabsContent>

          <TabsContent value="reconciliation">
            <RefundReconciliation />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="mrpsl-card">
              <div className="p-4 border-b bg-muted/20">
                <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  Report Type
                </p>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {REPORT_TYPES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedReport(r)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                      selectedReport === r
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="mrpsl-card p-5">
              <div className="flex items-center gap-3 flex-wrap">
                <Select
                  value={filterRegister}
                  onValueChange={(v) => setFilterRegister(v ?? "")}
                >
                  <SelectTrigger className="mrpsl-input h-9 w-48">
                    <SelectValue placeholder="All Registers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Registers</SelectItem>
                    <SelectItem value="ACCESS">ACCESS</SelectItem>
                    <SelectItem value="TRANSCORP">TRANSCORP</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1" />

                <Button
                  size="sm"
                  onClick={() =>
                    toast.info(`${selectedReport} report coming soon`)
                  }
                >
                  <CalendarRange className="h-3.5 w-3.5 mr-1.5" />
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Export coming soon")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Print coming soon")}
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print
                </Button>
              </div>
            </Card>

            <div className="flex flex-col items-center justify-center py-20 bg-background border rounded-2xl border-dashed text-muted-foreground text-center">
              <CalendarRange className="h-10 w-10 text-muted-foreground/35 mb-3" />
              <h3 className="font-semibold text-sm text-foreground">
                Ready to generate
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-72">
                Configure your parameters above and click &quot;Generate
                Report&quot; to view results.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

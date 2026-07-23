"use client";

import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewSubscription } from "@/components/custom/fund-subscription/new-subscription";
import { SubscriptionApproval } from "@/components/custom/fund-subscription/subscription-approval";
import { ApprovedSubscriptions } from "@/components/custom/fund-subscription/approved-subscriptions";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarRange, FileSpreadsheet, Printer } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const TABS = ["subscription", "approval", "approved", "reports"] as const;
type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  subscription: "New Subscription",
  approval: "Subscription Approval",
  approved: "Approved Subscriptions",
  reports: "Reports",
};

const REPORT_TYPES = [
  "Subscription Summary",
  "Fund Register Movement",
  "Pending Subscriptions",
  "Rejection and Subscription Report",
] as const;

export default function FundSubscriptionPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("subscription");
  const [selectedReport, setSelectedReport] = useState<string>(REPORT_TYPES[0]);
  const [filterRegister, setFilterRegister] = useState("");
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [reportReady, setReportReady] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fund Subscription</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Process new fund subscription requests and manage approvals for fund
          registers.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab((v as TabValue) || "subscription")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
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
          <TabsContent value="subscription">
            <NewSubscription />
          </TabsContent>

          <TabsContent value="approval">
            <SubscriptionApproval />
          </TabsContent>

          <TabsContent value="approved">
            <ApprovedSubscriptions />
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
                  onValueChange={(v) => {
                    setFilterRegister(v ?? "");
                    setReportReady(false);
                  }}
                >
                  <SelectTrigger className="mrpsl-input h-9 w-52">
                    <SelectValue placeholder="All Fund Registers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Fund Registers</SelectItem>
                    <SelectItem value="stanbic-dollar">
                      Stanbic IBTC Dollar Fund
                    </SelectItem>
                    <SelectItem value="arm-discovery">
                      ARM Discovery Balanced Fund
                    </SelectItem>
                    <SelectItem value="coronation-mm">
                      Coronation Money Market Fund
                    </SelectItem>
                  </SelectContent>
                </Select>

                <DateRangePicker
                  date={filterDateRange}
                  setDate={(d) => {
                    setFilterDateRange(d);
                    setReportReady(false);
                  }}
                  placeholder="Select date range"
                  className="w-72"
                />

                <Button
                  size="xl"
                  onClick={() => {
                    setReportReady(true);
                    toast.info(`${selectedReport} report coming soon`);
                  }}
                >
                  <CalendarRange className="h-3.5 w-3.5 mr-1.5" />
                  Generate Report
                </Button>

                {reportReady && (
                  <>
                    <div className="flex-1" />
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
                  </>
                )}
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

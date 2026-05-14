"use client";

import { useState } from "react";
import {
  Upload,
  Download,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UploadIPOData from "@/components/custom/ipo/upload-data";
import PendingApprovalIPO from "@/components/custom/ipo/pending-approval";
import IcuApprovalIPO from "@/components/custom/ipo/icu-approval";

const REPORT_TYPES = [
  "Application Offer",
  "Application Offer Summary",
  "Full Subscription List",
  "State Summary",
  "Range Analysis",
  "Summary Batch Report",
];

export default function IPOPage() {
  const [activeTab, setActiveTab] = useState<string>("upload");

  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          IPO / Public Offer Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage subscriber lists, approvals, lodgment, and allotment for
          Initial Public Offers
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="upload"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Upload Data
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approval
          </TabsTrigger>
          <TabsTrigger
            value="icu"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            ICU Approval
          </TabsTrigger>
          <TabsTrigger
            value="lodgment"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Lodgment
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Reports
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* ── Upload Data ── */}
          <TabsContent value="upload" className="space-y-6">
            {/* Batch controls */}
            <UploadIPOData tab={activeTab} />
          </TabsContent>

          {/* ── Pending Approval ── */}
          <TabsContent value="auth" className="space-y-4">
            <PendingApprovalIPO tab={activeTab} />
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu" className="space-y-4">
            <IcuApprovalIPO tab={activeTab} />
          </TabsContent>

          {/* ── Lodgment ── */}
          <TabsContent value="lodgment">
            <Card className="mrpsl-card">
              <div className="p-5 border-b bg-muted/20">
                <Badge className="bg-emerald-100 text-emerald-800 border-0 mb-2">
                  ICU Approved
                </Badge>
                <h3 className="font-semibold text-base">
                  BATCH-IPO-20260428-005 — ZENITHBANK
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="mrpsl-label">Lodgment File Format</label>
                  <RadioGroup defaultValue="with_rin" className="flex gap-6">
                    <div className="flex items-center space-x-2.5">
                      <RadioGroupItem value="with_rin" id="r1" />
                      <label htmlFor="r1" className="text-sm">
                        RIN at CSCS
                      </label>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <RadioGroupItem value="no_rin" id="r2" />
                      <label htmlFor="r2" className="text-sm">
                        RIN NOT at CSCS
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="border border-border/60 rounded-xl overflow-hidden">
                  <div className="bg-muted/40 p-2 border-b text-xs tabular font-bold text-muted-foreground">
                    PREVIEW (5 ROWS)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs tabular">
                      <thead className="bg-muted/20">
                        <tr>
                          <th className="p-2 text-left">STOCKBROKER CODE</th>
                          <th className="p-2 text-left">CHN</th>
                          <th className="p-2 text-left">SHAREHOLDER NAME</th>
                          <th className="p-2 text-left">CERT NO</th>
                          <th className="p-2 text-left">CSCS ACCOUNT NO</th>
                          <th className="p-2 text-left">SYMBOL</th>
                          <th className="p-2 text-right">UNITS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-muted/20">
                          <td className="p-2 font-mono">C001</td>
                          <td className="p-2 font-mono">C00001001EL</td>
                          <td className="p-2">ADEBISI FUNMILAYO</td>
                          <td className="p-2 font-mono">ZB/001/2026</td>
                          <td className="p-2 font-mono">0200012345</td>
                          <td className="p-2">ZENITHBANK</td>
                          <td className="p-2 text-right font-mono">50,000</td>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <td className="p-2 font-mono">C045</td>
                          <td className="p-2 font-mono">C00004509EL</td>
                          <td className="p-2">OKAFOR CHUKWUEMEKA</td>
                          <td className="p-2 font-mono">ZB/002/2026</td>
                          <td className="p-2 font-mono">0200054321</td>
                          <td className="p-2">ZENITHBANK</td>
                          <td className="p-2 text-right font-mono">10,000</td>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <td className="p-2 font-mono">C017</td>
                          <td className="p-2 font-mono">C00009821EL</td>
                          <td className="p-2">IBRAHIM FATIMA</td>
                          <td className="p-2 font-mono">ZB/003/2026</td>
                          <td className="p-2 font-mono">0200098765</td>
                          <td className="p-2">ZENITHBANK</td>
                          <td className="p-2 text-right font-mono">25,000</td>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <td className="p-2 font-mono">C008</td>
                          <td className="p-2 font-mono">C00002200EL</td>
                          <td className="p-2">OLAWALE DAVID</td>
                          <td className="p-2 font-mono">ZB/004/2026</td>
                          <td className="p-2 font-mono">0200034560</td>
                          <td className="p-2">ZENITHBANK</td>
                          <td className="p-2 text-right font-mono">100,000</td>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <td className="p-2 font-mono">C031</td>
                          <td className="p-2 font-mono">C00007811EL</td>
                          <td className="p-2">NWOSU CHIDINMA</td>
                          <td className="p-2 font-mono">ZB/005/2026</td>
                          <td className="p-2 font-mono">0200078112</td>
                          <td className="p-2">ZENITHBANK</td>
                          <td className="p-2 text-right font-mono">5,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => toast.info("Downloading lodgment file...")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Lodgment File
                    (.txt)
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() =>
                      toast.success("Pushed to CSCS API successfully.")
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" /> Push via CSCS API
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ── Reports (vertical layout) ── */}
          <TabsContent value="reports" className="space-y-6">
            {/* Report type selector */}
            <Card className="mrpsl-card">
              <div className="p-4 border-b bg-muted/20">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Report Type
                </h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {REPORT_TYPES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedReport(r)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      selectedReport === r
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Card>

            {/* Report viewer */}
            <Card className="mrpsl-card p-8 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[320px]">
              <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="font-semibold text-foreground text-base">
                {selectedReport}
              </h3>
              <p className="text-sm mt-1 mb-6 max-w-sm">
                Select filters and click Run Report to generate the output.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Register" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dangcem">DANGCEM</SelectItem>
                    <SelectItem value="zenith">ZENITHBANK</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => toast.info(`Generating ${selectedReport}...`)}
                >
                  Run Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Downloading report...")}
                >
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

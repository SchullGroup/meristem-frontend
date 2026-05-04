"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStore } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { AlertTriangle, Info } from "lucide-react";

export default function ReconciliationPage() {
  const { registers } = useStore();
  const [activeTab, setActiveTab] = useState("cscs");
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certificate Reconciliation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Identify and resolve discrepancies between the MRPSL register and CSCS positions
        </p>
      </div>

      {/* Tabs + Content — single vertical column */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v || "")} className="w-full !flex !flex-col">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="cscs"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap
                       text-muted-foreground
                       data-active:bg-background data-active:text-foreground data-active:shadow-sm
                       hover:text-foreground transition-all"
          >
            CSCS Update Reconciliation
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap
                       text-muted-foreground
                       data-active:bg-background data-active:text-foreground data-active:shadow-sm
                       hover:text-foreground transition-all"
          >
            General Certificate Reconciliation
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">

          {/* ── CSCS Update Reconciliation ── */}
          <TabsContent value="cscs" className="space-y-4">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-sm font-medium text-amber-800">
                1 flagged transaction awaiting resolution
              </span>
            </div>

            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">CHN</th>
                      <th className="px-4 py-3">Holder Name</th>
                      <th className="px-4 py-3">Register</th>
                      <th className="px-4 py-3">Flagged Date</th>
                      <th className="px-4 py-3 text-right">Attempted Sell</th>
                      <th className="px-4 py-3 text-right">Holdings At Flag</th>
                      <th className="px-4 py-3 text-right">Shortfall</th>
                      <th className="px-4 py-3">Resolution Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr className="mrpsl-table-row">
                      <td className="px-4 py-3 tabular text-xs text-muted-foreground">C00001045EL</td>
                      <td className="px-4 py-3 font-semibold">Binta Lawal</td>
                      <td className="px-4 py-3 tabular text-xs">DANGCEM</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">29 Apr 2026</td>
                      <td className="px-4 py-3 text-right tabular text-red-600 font-semibold">15,000</td>
                      <td className="px-4 py-3 text-right tabular">10,000</td>
                      <td className="px-4 py-3 text-right tabular text-amber-600 font-semibold">5,000</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">Pending</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => setSheetOpen(true)}>Resolve</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ── General Certificate Reconciliation ── */}
          <TabsContent value="general" className="space-y-4">
            {/* Filter bar */}
            <Card className="mrpsl-card p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Select>
                  <SelectTrigger className="w-64 mrpsl-input">
                    <SelectValue placeholder="Select Register" />
                  </SelectTrigger>
                  <SelectContent>
                    {registers.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <RadioGroup defaultValue="all" className="flex gap-5 items-center">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="chk-all" />
                    <label htmlFor="chk-all" className="text-sm">All CHNs</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="spec" id="chk-spec" />
                    <label htmlFor="chk-spec" className="text-sm">Specific CHN</label>
                  </div>
                </RadioGroup>

                <Button onClick={() => toast.info("Running reconciliation...")}>
                  Run Reconciliation
                </Button>
              </div>
            </Card>

            {/* Info banner */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <strong>Automated reconciliation</strong> runs every first Saturday of the month.
                Discrepancy reports are emailed to{" "}
                <span className="font-medium">reconciliation@meristemregistrars.com</span>.
              </p>
            </div>

            {/* Position comparison — full width, two equal columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border/60">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    MRPSL Register Position
                  </h3>
                </div>
                <div className="p-4 text-sm text-muted-foreground text-center py-10">
                  Run a reconciliation to see MRPSL position data.
                </div>
              </Card>

              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border/60">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    CSCS Position
                  </h3>
                </div>
                <div className="p-4 text-sm text-muted-foreground text-center py-10">
                  Run a reconciliation to see CSCS position data.
                </div>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Discrepancy Resolution Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-6">
            <SheetTitle>Discrepancy Resolution</SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            {/* Side-by-side ledger view */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  MRPSL Records
                </div>
                <div className="p-4 space-y-2 text-sm tabular">
                  <div className="flex justify-between text-muted-foreground">
                    <span>01 Jan 2026 (Buy)</span><span>+10,000</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 font-bold">
                    <span>Balance</span><span>10,000</span>
                  </div>
                </div>
              </Card>

              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  CSCS Records
                </div>
                <div className="p-4 space-y-2 text-sm tabular">
                  <div className="flex justify-between text-muted-foreground">
                    <span>01 Jan 2026 (Buy)</span><span>+10,000</span>
                  </div>
                  <div className="flex justify-between bg-green-50 rounded px-2 py-1 text-green-700">
                    <span>25 Apr 2026 (Buy)</span><span>+5,000</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 font-bold">
                    <span>Balance</span><span>15,000</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Alert */}
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>Missing purchase identified:</strong> 5,000 units on 25 Apr 2026 not reflected in MRPSL register.
              </p>
            </div>

            {/* Insert missing transaction */}
            <Card className="mrpsl-card p-5 space-y-4">
              <h3 className="font-semibold text-sm">Insert Missing Transaction</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="mrpsl-label">Transaction Date</label>
                  <Input defaultValue="25 Apr 2026" className="mrpsl-input" />
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Transfer No</label>
                  <Input defaultValue="TRN-0099123" className="mrpsl-input" />
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Units</label>
                  <Input defaultValue="5000" className="mrpsl-input tabular" />
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Symbol</label>
                  <Input defaultValue="DANGCEM" className="mrpsl-input" />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => { toast.success("Submitted for approval."); setSheetOpen(false); }}
              >
                Submit for Approval
              </Button>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

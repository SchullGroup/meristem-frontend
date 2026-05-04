"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, Scissors } from "lucide-react";

type PendingSplit = {
  id: string;
  date: string;
  origCert: string;
  holder: string;
  account: string;
  totalUnits: number;
  parts: number;
  submittedBy: string;
};

const PENDING_SPLITS: PendingSplit[] = [
  { id: "SP1", date: "28 Apr 2026", origCert: "CERT-DANGCEM-20015", holder: "Binta Lawal",    account: "DANGCEM-10015", totalUnits: 15000, parts: 2, submittedBy: "Chidi Okafor" },
  { id: "SP2", date: "27 Apr 2026", origCert: "CERT-ACCESS-00443",  holder: "Kolade Adeyemi", account: "ACCESS-00443",  totalUnits:  8500, parts: 3, submittedBy: "Ngozi Eze"   },
];

export default function SplitPage() {
  const [certFound,   setCertFound]   = useState(false);
  const [reviewOpen,  setReviewOpen]  = useState(false);
  const [selected,    setSelected]    = useState<PendingSplit | null>(null);

  function openReview(row: PendingSplit) { setSelected(row); setReviewOpen(true); }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificate Split</h1>
          <p className="text-sm text-muted-foreground mt-1">Split a single certificate into multiple smaller denominations</p>
        </div>
      </div>

      <Tabs defaultValue="split" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="split" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">New Split</TabsTrigger>
          <TabsTrigger value="auth"  className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Pending Approvals</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="split">
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-2 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Find Certificate</h3>
                <Card className="mrpsl-card p-4 space-y-4">
                  <Input placeholder="Cert No, Account No, or CHN" className="mrpsl-input" />
                  <Button className="w-full" onClick={() => setCertFound(true)}>Search</Button>
                  {certFound && (
                    <div className="mt-4 pt-4 border-t space-y-2 animate-in fade-in">
                      <div className="font-mono text-lg font-bold">CERT-DANGCEM-20015</div>
                      <div className="text-sm">Holder: Binta Lawal</div>
                      <div className="text-sm text-muted-foreground">Account: DANGCEM-10015</div>
                      <div className="text-3xl tabular-nums font-bold mt-2">15,000</div>
                      <div className="text-xs text-muted-foreground">units</div>
                    </div>
                  )}
                </Card>
              </div>

              <div className="col-span-3 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Configure Split</h3>
                {certFound ? (
                  <Card className="mrpsl-card p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="mrpsl-label">Number of Parts</label>
                        <Select defaultValue="2">
                          <SelectTrigger className="mrpsl-input"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Parts</SelectItem>
                            <SelectItem value="3">3 Parts</SelectItem>
                            <SelectItem value="4">4 Parts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4"><span className="text-sm font-medium w-16">Part 1</span><Input type="number" defaultValue="10000" className="mrpsl-input font-mono w-32" /><span className="text-sm text-muted-foreground">units</span></div>
                      <div className="flex items-center gap-4"><span className="text-sm font-medium w-16">Part 2</span><Input type="number" defaultValue="5000"  className="mrpsl-input font-mono w-32" /><span className="text-sm text-muted-foreground">units</span></div>
                    </div>
                    <div className="bg-green-50 border border-green-200 text-green-800 p-2 rounded text-sm font-mono text-center">
                      Sum: 15,000 / 15,000 units ✓
                    </div>
                    <Textarea placeholder="Reason for split..." className="focus-visible:ring-primary" />
                    <Button className="w-full" size="lg" onClick={() => toast.success("Split request submitted for approval.")}>Submit for Approval</Button>
                  </Card>
                ) : (
                  <Card className="mrpsl-card p-12 text-center text-muted-foreground flex flex-col items-center">
                    <Scissors className="h-8 w-8 mb-4 opacity-20" />
                    Search for a certificate first to configure a split.
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ORIGINAL CERT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3 text-right">TOTAL UNITS</th>
                    <th className="p-3">PARTS</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {PENDING_SPLITS.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.origCert}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 font-mono text-muted-foreground">{row.account}</td>
                      <td className="p-3 text-right tabular-nums font-semibold">{row.totalUnits.toLocaleString()}</td>
                      <td className="p-3"><Badge className="bg-blue-100 text-blue-800 border-0 text-xs">{row.parts} parts</Badge></td>
                      <td className="p-3 text-muted-foreground">{row.submittedBy}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" onClick={() => openReview(row)}>Review &amp; Decide</Button>
                      </td>
                    </tr>
                  ))}
                  {PENDING_SPLITS.length === 0 && (
                    <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No pending split approvals.</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <Sheet open={reviewOpen} onOpenChange={setReviewOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-6">
            <SheetTitle>Review Certificate Split</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="mrpsl-section-title">Original Certificate</div>
                <div className="font-mono font-bold">{selected.origCert}</div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                  <div><div className="mrpsl-section-title">Holder</div><div className="font-semibold text-sm mt-0.5">{selected.holder}</div></div>
                  <div><div className="mrpsl-section-title">Account</div><div className="font-mono text-xs text-muted-foreground mt-0.5">{selected.account}</div></div>
                  <div><div className="mrpsl-section-title">Total Units</div><div className="text-xl tabular-nums font-bold mt-0.5">{selected.totalUnits.toLocaleString()}</div></div>
                  <div><div className="mrpsl-section-title">Number of Parts</div><div className="text-xl tabular-nums font-bold mt-0.5">{selected.parts}</div></div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">Approval Chain</h4>
                <div className="space-y-4">
                  {[
                    { label: `Submitted by ${selected.submittedBy}`, done: true, pending: false },
                    { label: "Authoriser — Pending your action",     done: false, pending: true  },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-100" : step.pending ? "bg-amber-200 animate-pulse" : "border-2 border-muted bg-background"}`}>
                        {step.done && <Check className="h-3 w-3 text-green-600" />}
                      </div>
                      <div className="text-sm">{step.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="mrpsl-label">Comment</label>
                <Textarea placeholder="Required for rejection..." className="resize-none" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/60">
                <Button variant="destructive" className="flex-1" onClick={() => { toast.error("Split rejected."); setReviewOpen(false); }}>Reject</Button>
                <Button className="flex-1" onClick={() => { toast.success("Split approved and processed."); setReviewOpen(false); }}>Approve Split</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

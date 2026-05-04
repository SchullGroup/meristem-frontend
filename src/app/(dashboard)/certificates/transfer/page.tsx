"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check } from "lucide-react";

type PendingTransfer = {
  id: string;
  date: string;
  cert: string;
  from: string;
  fromAcct: string;
  to: string;
  toAcct: string;
  units: number;
  stampDuty: number;
  submittedBy: string;
};

const PENDING_TRANSFERS: PendingTransfer[] = [
  { id: "TR1", date: "28 Apr 2026", cert: "CERT-DANGCEM-00121", from: "Binta Lawal",   fromAcct: "DANGCEM-10015", to: "Adeyemi John", toAcct: "DANGCEM-10088", units:  5000, stampDuty: 250, submittedBy: "Chidi Okafor" },
  { id: "TR2", date: "27 Apr 2026", cert: "CERT-ACCESS-00553",  from: "Ngozi Eze",     fromAcct: "ACCESS-00553",  to: "Ibrahim Musa", toAcct: "ACCESS-01122",  units: 12000, stampDuty: 600, submittedBy: "Ngozi Eze"   },
];

export default function TransferPage() {
  const [srcLoaded,   setSrcLoaded]   = useState(false);
  const [destLoaded,  setDestLoaded]  = useState(false);
  const [reviewOpen,  setReviewOpen]  = useState(false);
  const [selected,    setSelected]    = useState<PendingTransfer | null>(null);

  function openReview(row: PendingTransfer) { setSelected(row); setReviewOpen(true); }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificate Transfer</h1>
          <p className="text-sm text-muted-foreground mt-1">Transfer ownership of units between accounts</p>
        </div>
      </div>

      <Tabs defaultValue="transfer" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="transfer" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">New Transfer</TabsTrigger>
          <TabsTrigger value="auth"     className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Pending Approvals</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="transfer" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="mrpsl-card p-4 space-y-4">
                <div className="font-semibold text-sm border-b pb-2">Transferor (Source)</div>
                <div className="flex gap-2"><Input placeholder="Account Search" className="mrpsl-input" /><Button onClick={() => setSrcLoaded(true)}>Search</Button></div>
                {srcLoaded && (
                  <div className="bg-muted/20 p-3 rounded text-sm space-y-1">
                    <div className="font-bold">Binta Lawal</div>
                    <div className="text-muted-foreground font-mono">DANGCEM-10015</div>
                    <div className="font-mono text-lg font-bold mt-2">15,000 units</div>
                  </div>
                )}
              </Card>

              <Card className="mrpsl-card p-4 space-y-4">
                <div className="font-semibold text-sm border-b pb-2">Transferee (Destination)</div>
                <div className="flex gap-2"><Input placeholder="Account Search" className="mrpsl-input" /><Button onClick={() => setDestLoaded(true)}>Search</Button></div>
                {destLoaded && (
                  <div className="bg-muted/20 p-3 rounded text-sm space-y-1">
                    <div className="font-bold">Adeyemi John</div>
                    <div className="text-muted-foreground font-mono">DANGCEM-10088</div>
                    <div className="font-mono text-lg font-bold mt-2">2,500 units</div>
                  </div>
                )}
              </Card>
            </div>

            {srcLoaded && destLoaded && (
              <Card className="mrpsl-card p-6 space-y-4 animate-in fade-in">
                <h3 className="font-semibold text-sm border-b pb-2">Transfer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="mrpsl-label">Units to Transfer *</label><Input type="number" className="mrpsl-input font-mono" /></div>
                  <div className="space-y-2"><label className="mrpsl-label">Instrument of Transfer Ref *</label><Input className="mrpsl-input" /></div>
                  <div className="space-y-2"><label className="mrpsl-label">Stamp Duty (₦)</label><Input defaultValue="0.00" className="mrpsl-input font-mono" /></div>
                  <div className="space-y-2"><label className="mrpsl-label">Upload IoT Document</label><Input type="file" className="mrpsl-input" /></div>
                </div>
                <div className="space-y-2"><label className="mrpsl-label">Comment</label><Textarea /></div>
                <div className="flex justify-end pt-4"><Button size="lg" onClick={() => toast.success("Transfer submitted for approval")}>Submit Transfer</Button></div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">CERTIFICATE</th>
                    <th className="p-3">FROM</th>
                    <th className="p-3">TO</th>
                    <th className="p-3 text-right">UNITS</th>
                    <th className="p-3 text-right">STAMP DUTY</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {PENDING_TRANSFERS.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.cert}</td>
                      <td className="p-3">
                        <div className="font-medium">{row.from}</div>
                        <div className="font-mono text-muted-foreground text-[11px]">{row.fromAcct}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{row.to}</div>
                        <div className="font-mono text-muted-foreground text-[11px]">{row.toAcct}</div>
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold">{row.units.toLocaleString()}</td>
                      <td className="p-3 text-right tabular-nums">₦{row.stampDuty.toLocaleString()}</td>
                      <td className="p-3 text-muted-foreground">{row.submittedBy}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" onClick={() => openReview(row)}>Review &amp; Decide</Button>
                      </td>
                    </tr>
                  ))}
                  {PENDING_TRANSFERS.length === 0 && (
                    <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No pending transfer approvals.</td></tr>
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
            <SheetTitle>Review Certificate Transfer</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="mrpsl-section-title">Certificate</div>
                <div className="font-mono font-bold">{selected.cert}</div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                  <div>
                    <div className="mrpsl-section-title">From (Transferor)</div>
                    <div className="font-semibold text-sm mt-0.5">{selected.from}</div>
                    <div className="font-mono text-xs text-muted-foreground">{selected.fromAcct}</div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">To (Transferee)</div>
                    <div className="font-semibold text-sm mt-0.5">{selected.to}</div>
                    <div className="font-mono text-xs text-muted-foreground">{selected.toAcct}</div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Units Transferred</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">{selected.units.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Stamp Duty</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">₦{selected.stampDuty.toLocaleString()}</div>
                  </div>
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
                <Button variant="destructive" className="flex-1" onClick={() => { toast.error("Transfer rejected."); setReviewOpen(false); }}>Reject</Button>
                <Button className="flex-1" onClick={() => { toast.success("Transfer approved and processed."); setReviewOpen(false); }}>Approve Transfer</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

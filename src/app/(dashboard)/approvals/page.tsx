"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ClipboardCheck, ShieldX, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ApprovalItem } from "@/lib/types";

export default function ApprovalsPage() {
  const { pendingApprovals, currentUser, updateApprovalItem, logAudit } = useStore();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);

  const filtered = pendingApprovals.filter(a => {
    const matchesSearch = a.description.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === "All" || a.module === moduleFilter;
    const matchesTier = tierFilter === "All" || a.tier?.toString() === tierFilter;
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesModule && matchesTier && matchesStatus;
  });

  const myPendingCount = pendingApprovals.filter(a => a.status === "PENDING" && a.approvalSteps.some(s => s.role === currentUser?.role && !s.decision)).length;
  const overdueCount = pendingApprovals.filter(a => a.status === "PENDING" && (new Date().getTime() - new Date(a.submittedAt).getTime()) > 14400000).length;
  const allPendingCount = pendingApprovals.filter(a => a.status === "PENDING").length;
  const approvedTodayCount = pendingApprovals.filter(a => a.status === "APPROVED" && new Date(a.submittedAt).toDateString() === new Date().toDateString()).length;

  const handleReview = (item: ApprovalItem) => {
    setSelectedItem(item);
    setSheetOpen(true);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
  };

  const getAging = (submittedAt: string) => {
    const ms = new Date().getTime() - new Date(submittedAt).getTime();
    const hrs = ms / 3600000;
    const pct = Math.min((hrs / 4) * 100, 100);
    return { pct, text: hrs < 1 ? "Just now" : `${Math.floor(hrs)}h ago`, overdue: hrs > 4 };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approvals Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and action all pending transactions requiring authorisation</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className={`p-4 ${myPendingCount > 0 ? 'bg-amber-50 border-amber-200' : 'mrpsl-card'}`}>
          <div className="mrpsl-section-title">My Pending</div>
          <div className={`text-2xl font-mono mt-1 font-bold ${myPendingCount > 0 ? 'text-amber-600' : ''}`}>{myPendingCount}</div>
        </Card>
        <Card className={`p-4 ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'mrpsl-card'}`}>
          <div className="mrpsl-section-title">Overdue (&gt;4hrs)</div>
          <div className={`text-2xl font-mono mt-1 font-bold ${overdueCount > 0 ? 'text-red-600' : ''}`}>{overdueCount}</div>
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">All Pending</div>
          <div className="text-2xl font-mono mt-1 font-bold">{allPendingCount}</div>
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Approved Today</div>
          <div className="text-2xl font-mono mt-1 font-bold text-green-600">{approvedTodayCount}</div>
        </Card>
      </div>

      <div className="flex gap-2 items-center">
        <Input placeholder="Search ref or description..." value={search} onChange={e=>setSearch(e.target.value)} className="w-64 mrpsl-input" />
        <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v || "")}><SelectTrigger className="w-48 mrpsl-input"><SelectValue placeholder="Module" /></SelectTrigger><SelectContent><SelectItem value="All">All Modules</SelectItem><SelectItem value="DIVIDENDS">Dividends</SelectItem><SelectItem value="CERTIFICATES">Certificates</SelectItem><SelectItem value="ACCOUNT MAINTENANCE">Account Maintenance</SelectItem></SelectContent></Select>
        <Select value={tierFilter} onValueChange={(v) => setTierFilter(v || "")}><SelectTrigger className="w-32 mrpsl-input"><SelectValue placeholder="Tier" /></SelectTrigger><SelectContent><SelectItem value="All">All Tiers</SelectItem><SelectItem value="1">Tier 1</SelectItem><SelectItem value="2">Tier 2</SelectItem><SelectItem value="3">Tier 3</SelectItem><SelectItem value="4">Tier 4</SelectItem></SelectContent></Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "")}><SelectTrigger className="w-36 mrpsl-input"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="All">All Status</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem></SelectContent></Select>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header"><tr><th className="p-3">REFERENCE</th><th className="p-3">MODULE</th><th className="p-3">TYPE</th><th className="p-3">DESCRIPTION</th><th className="p-3 text-right">AMOUNT</th><th className="p-3">TIER</th><th className="p-3">SUBMITTED BY</th><th className="p-3">AGING</th><th className="p-3">STATUS</th><th className="p-3 text-right">ACTIONS</th></tr></thead>
          <tbody className="divide-y text-xs">
            {filtered.map(a => {
              const aging = getAging(a.submittedAt);
              const isMine = a.initiatorId === currentUser?.id;
              const canAction = a.status === "PENDING" && a.approvalSteps.some(s => s.role === currentUser?.role && !s.decision);
              
              return (
                <tr key={a.id} className="hover:bg-accent/5">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{a.id}</td>
                  <td className="p-3"><Badge className="bg-gray-100 text-gray-800 border-0 text-xs">{a.module.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</Badge></td>
                  <td className="p-3 font-medium text-sm">{a.transactionType}</td>
                  <td className="p-3 truncate max-w-[200px]" title={a.description}>{a.description}</td>
                  <td className="p-3 text-right font-mono font-bold">{a.amount ? `₦${a.amount.toLocaleString()}` : "—"}</td>
                  <td className="p-3">{a.tier ? <Badge className={`border-0 text-xs ${a.tier===1?'bg-green-100 text-green-800':a.tier===2?'bg-blue-100 text-blue-800':a.tier===3?'bg-amber-100 text-amber-800':'bg-red-100 text-red-800'}`}>T{a.tier}</Badge> : "—"}</td>
                  <td className="p-3"><div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-primary">{getInitials(a.initiatorName)}</span></div><span>{a.initiatorName}</span></div></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 w-24">
                      <Progress value={aging.pct} className="h-1.5" />
                      <span className={`text-xs whitespace-nowrap ${aging.overdue ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>{aging.text}</span>
                    </div>
                  </td>
                  <td className="p-3"><Badge className={`border-0 text-xs ${a.status==="PENDING"?"bg-amber-100 text-amber-800":a.status==="APPROVED"?"bg-green-100 text-green-800":"bg-red-100 text-red-700"}`}>{a.status.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</Badge></td>
                  <td className="p-3 text-right">
                    {a.status === "PENDING" ? (
                      canAction ? <Button size="sm" onClick={() => handleReview(a)}>Review</Button> :
                      isMine ? <Button size="sm" variant="ghost" className="text-red-600" onClick={()=>toast.success("Recalled successfully")}>Recall</Button> :
                      <span className="text-muted-foreground">Locked</span>
                    ) : (
                      <Button size="sm" variant="ghost"><Eye className="mr-2 h-4 w-4"/> View</Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={10} className="p-12 text-center text-muted-foreground">No approvals match your filters.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[720px] sm:max-w-[720px] overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader className="border-b pb-4 mb-4">
                <SheetTitle>{selectedItem.transactionType} Review</SheetTitle>
                <div className="font-mono text-sm text-muted-foreground">{selectedItem.id}</div>
              </SheetHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted/20 border rounded-md">
                  <div><div className="text-xs uppercase font-bold text-muted-foreground">Module</div><div className="font-medium text-sm mt-1">{selectedItem.module}</div></div>
                  <div><div className="text-xs uppercase font-bold text-muted-foreground">Type</div><div className="font-medium text-sm mt-1">{selectedItem.transactionType}</div></div>
                  <div><div className="text-xs uppercase font-bold text-muted-foreground">Amount</div><div className="font-medium text-sm mt-1 font-mono">{selectedItem.amount ? `₦${selectedItem.amount.toLocaleString()}` : "—"}</div></div>
                  <div><div className="text-xs uppercase font-bold text-muted-foreground">Tier</div><div className="font-medium text-sm mt-1">{selectedItem.tier ? `Tier ${selectedItem.tier}` : "—"}</div></div>
                  <div className="col-span-4 mt-2"><div className="text-xs uppercase font-bold text-muted-foreground mb-1">Description</div><p className="text-sm">{selectedItem.description}</p></div>
                </div>

                <div className="p-4 border rounded-md">
                  <h4 className="text-sm font-bold border-b pb-2 mb-3">Approval Chain</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-green-500"/></div>
                      <div className="text-sm"><span className="font-semibold">{selectedItem.initiatorName} (Initiator)</span> <span className="text-muted-foreground">✓ Submitted</span></div>
                    </div>
                    {selectedItem.approvalSteps.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center animate-pulse"><div className="h-2 w-2 rounded-full bg-amber-500"/></div>
                        <div className="text-sm"><span className="font-semibold">{s.role.replace(/_/g, ' ')}</span> <span className="text-amber-600">⏳ Pending</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                {currentUser?.id === selectedItem.initiatorId && (
                  <Alert variant="destructive">
                    <ShieldX className="h-4 w-4" />
                    <AlertTitle>Maker-Checker Rule Enforced</AlertTitle>
                    <AlertDescription>You cannot approve a transaction you initiated. Another authorised user must action this item.</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label className="mrpsl-label">Comment</label>
                  <Textarea placeholder="Required for rejection, optional for approval" />
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button variant="ghost" className="mr-auto">Delegate to Colleague</Button>
                  <Button variant="destructive" disabled={currentUser?.id === selectedItem.initiatorId} onClick={() => { toast.error("Transaction rejected"); setSheetOpen(false); }}>Reject</Button>
                  <Button disabled={currentUser?.id === selectedItem.initiatorId} onClick={() => { toast.success("Transaction fully authorised and committed."); setSheetOpen(false); }}>Approve</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
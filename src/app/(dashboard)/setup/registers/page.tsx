"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PlusCircle, BookOpen, AlertTriangle, MoreHorizontal, Pencil, Lock, Unlock, History, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { RegisterForm } from "@/components/custom/register-form";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Register } from "@/lib/types";

export default function RegistersPage() {
  const router = useRouter();
  const { registers, principals, updateRegister, logAudit } = useStore();
  const [search, setSearch] = useState("");
  const [principalFilter, setPrincipalFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(null);

  const [confirmLockOpen, setConfirmLockOpen] = useState(false);

  const filteredRegisters = registers.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesPrincipal = principalFilter === "All" || r.principalId === principalFilter;
    const matchesType = typeFilter === "All" || r.registerType === typeFilter;
    const matchesStatus = statusFilter === "All" || r.status === statusFilter.toUpperCase().replace(" ", "_");
    return matchesSearch && matchesPrincipal && matchesType && matchesStatus;
  });

  const activeCount = registers.filter(r => r.status === "ACTIVE").length;
  const disabledCount = registers.filter(r => r.status === "TRANSACTION_DISABLED").length;
  const inactiveCount = registers.filter(r => r.status === "INACTIVE").length;
  
  const totalStock = registers.filter(r => r.status === "ACTIVE").reduce((sum, r) => sum + r.stockToday, 0);

  const formatLargeNumber = (num: number) => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    return num.toLocaleString();
  };

  const handleEdit = (r: Register) => {
    setSelectedRegister(r);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedRegister(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const toggleLock = () => {
    if (!selectedRegister) return;
    const newStatus = selectedRegister.status === "TRANSACTION_DISABLED" ? "ACTIVE" : "TRANSACTION_DISABLED";

    updateRegister(selectedRegister.id, { status: newStatus });
    logAudit({
      action: "REGISTER_LOCK_CHANGED",
      entityType: "Register",
      entityId: selectedRegister.id,
      before: selectedRegister,
      after: { ...selectedRegister, status: newStatus },
      actor: "Current User",
      actorId: "usr",
      role: "ADMIN"
    });
    toast.success(`Register ${selectedRegister.symbol} has been ${newStatus === 'ACTIVE' ? 'unlocked' : 'locked'}.`);
    setConfirmLockOpen(false);
  };

  const openLockConfirm = (r: Register) => {
    setSelectedRegister(r);
    setConfirmLockOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registers</h1>
          <p className="text-sm text-muted-foreground mt-1">Official shareholder lists for each security managed by MRPSL</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Register
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="mrpsl-section-title">Total Registers</div>
          <div className="text-2xl font-bold font-mono mt-2">{registers.length}</div>
        </Card>
        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="mrpsl-section-title">Active</div>
          <div className="text-2xl font-bold font-mono mt-2 text-green-600">{activeCount}</div>
        </Card>
        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="mrpsl-section-title text-amber-700">Transaction Disabled</div>
          <div className="text-2xl font-bold font-mono mt-2 text-amber-600">{disabledCount}</div>
        </Card>
        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="mrpsl-section-title">Inactive</div>
          <div className="text-2xl font-bold font-mono mt-2 text-muted-foreground">{inactiveCount}</div>
        </Card>
        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="mrpsl-section-title">Total Stock in Issue</div>
          <div className="text-xl font-bold font-mono mt-2">{formatLargeNumber(totalStock)} units</div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 items-center">
        <Input 
          placeholder="Search registers..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 mrpsl-input"
        />
        <Select value={principalFilter} onValueChange={(v) => setPrincipalFilter(v || "")}>
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue placeholder="Principal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Principals</SelectItem>
            {principals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "")}>
          <SelectTrigger className="w-36 mrpsl-input">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="ORDINARY">Ordinary</SelectItem>
            <SelectItem value="PREFERENCE">Preference</SelectItem>
            <SelectItem value="BOND">Bond</SelectItem>
            <SelectItem value="FUND">Fund</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "")}>
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Transaction Disabled">Transaction Disabled</SelectItem>
          </SelectContent>
        </Select>
        {(search || principalFilter !== "All" || typeFilter !== "All" || statusFilter !== "All") && (
          <Button variant="ghost" onClick={() => { setSearch(""); setPrincipalFilter("All"); setTypeFilter("All"); setStatusFilter("All"); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Data Table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">PRINCIPAL</th>
                <th className="px-4 py-3">TYPE</th>
                <th className="px-4 py-3">SYMBOL</th>
                <th className="px-4 py-3 text-right">SHAREHOLDERS AT SETUP</th>
                <th className="px-4 py-3 text-right">SHAREHOLDERS TODAY</th>
                <th className="px-4 py-3 text-right">STOCK IN ISSUE</th>
                <th className="px-4 py-3 text-right">NOMINAL VALUE</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegisters.map((r) => {
                const principal = principals.find(p => p.id === r.principalId);
                return (
                  <tr key={r.id} className="mrpsl-table-row">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground truncate max-w-[200px]">{r.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{r.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-[150px]">{principal?.name}</td>
                    <td className="px-4 py-3">
                      <Badge className={`border-0 text-xs ${
                        r.registerType === "ORDINARY" ? "bg-blue-100 text-blue-800" :
                        r.registerType === "PREFERENCE" ? "bg-violet-100 text-violet-800" :
                        r.registerType === "BOND" ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-800"
                      }`}>
                        {r.registerType.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs uppercase bg-muted px-1.5 py-0.5 rounded">{r.symbol}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm text-right">
                      {r.shareholdersAtSetup.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm text-right">
                      {r.shareholdersToday.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm text-right">
                      {formatLargeNumber(r.stockToday)}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-right">
                      ₦{r.nominalValue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`border-0 text-xs ${
                        r.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        r.status === "INACTIVE" ? "bg-gray-100 text-gray-600" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {r.status === "TRANSACTION_DISABLED" ? "Disabled" : r.status.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/enquiry/holder?registerId=${r.id}`)}>
                            <Users className="mr-2 h-4 w-4" /> View Shareholders
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(r)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Register
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openLockConfirm(r)} className="text-amber-600">
                            {r.status === "TRANSACTION_DISABLED" ? (
                              <><Unlock className="mr-2 h-4 w-4" /> Unlock Transactions</>
                            ) : (
                              <><Lock className="mr-2 h-4 w-4" /> Lock Transactions</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.info("Audit log sheet coming soon")}>
                            <History className="mr-2 h-4 w-4" /> Audit Log
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filteredRegisters.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No registers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        Showing {filteredRegisters.length > 0 ? 1 : 0}–{filteredRegisters.length} of {filteredRegisters.length} registers
      </div>

      {formOpen && (
        <RegisterForm 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          mode={formMode} 
          initialData={selectedRegister} 
        />
      )}

      <Dialog open={confirmLockOpen} onOpenChange={setConfirmLockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {selectedRegister?.status === "TRANSACTION_DISABLED" 
                ? `Are you sure you want to unlock transactions for ${selectedRegister.symbol}?`
                : `Are you sure you want to lock transactions for ${selectedRegister?.symbol}? This will block all dividend declarations, certificate operations, and KYC updates.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmLockOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={toggleLock}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
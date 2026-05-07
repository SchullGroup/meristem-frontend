"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Building2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  BookOpen,
  Pencil,
  // History,
  Power,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PrincipalForm } from "@/components/custom/principal-form";
import { toast } from "sonner";
import { Principal } from "@/types/principal";
import {
  useGetPrincipals,
  useGetPrincipalStats,
  useUpdatePrincipalStatus,
} from "@/hooks/usePrincipal";
import { useDebounce } from "@/hooks/useDebounce";
import { Pagination } from "@/components/custom/pagination";
import ToggleStatusDialog from "@/components/custom/principal/toggle-status-dialog";

const PAGE_SIZE = 10;

const colors = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-pink-500",
];

export default function PrincipalsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [billingFilter, setBillingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(
    null,
  );

  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  const { data: principalStats, isLoading: statsLoading } =
    useGetPrincipalStats();

  const { data: principals, isLoading: principalsLoading } = useGetPrincipals({
    search: debouncedSearch !== "" ? debouncedSearch : undefined,
    billingCategory: billingFilter !== "All" ? billingFilter : undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
    page: currentPage,
    size: PAGE_SIZE,
  });

  const { mutate, isPending: toggleStatusLoading } = useUpdatePrincipalStatus();

  const handleEdit = (p: Principal) => {
    setSelectedPrincipal(p);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedPrincipal(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const toggleStatus = () => {
    if (!selectedPrincipal) return;
    const newStatus =
      selectedPrincipal.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    // if (newStatus === "INACTIVE") {
    //   const hasActiveRegisters = registers.some(
    //     (r) => r.principalId === selectedPrincipal.id && r.status === "ACTIVE",
    //   );
    //   if (hasActiveRegisters) {
    //     toast.error("Cannot deactivate a principal with active registers.");
    //     setConfirmStatusOpen(false);
    //     return;
    //   }
    // }

    // updatePrincipal(selectedPrincipal.id, { status: newStatus });
    // logAudit({
    //   action: "PRINCIPAL_STATUS_CHANGED",
    //   entityType: "Principal",
    //   entityId: selectedPrincipal.id,
    //   before: selectedPrincipal,
    //   after: { ...selectedPrincipal, status: newStatus },
    //   actor: "Current User",
    //   actorId: "usr",
    //   role: "ADMIN",
    // });

    mutate(
      {
        principalId: selectedPrincipal.principalId,
        payload: {
          status: newStatus,
        },
      },
      {
        onSuccess: () => {
          setConfirmStatusOpen(false);
          toast.success("Principal status updated successfully.");
        },
        onError: (error) => {
          setConfirmStatusOpen(false);
          toast.error(error.message);
        },
      },
    );

    // toast.success(
    //   `Principal ${selectedPrincipal.principalName} has been marked as ${newStatus}.`,
    // );
    // setConfirmStatusOpen(false);
  };

  const openStatusConfirm = (p: Principal) => {
    setSelectedPrincipal(p);
    setConfirmStatusOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Principals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage issuer client companies whose shareholder registers are
            maintained by MRPSL
          </p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Principal
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="mrpsl-card p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="mrpsl-section-title">Total Principals</div>
            {statsLoading ? (
              <div className="w-14 h-6 bg-gray-300 animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold font-mono">
                {principalStats?.totalPrincipals ?? 0}
              </div>
            )}
          </div>
        </Card>
        <Card className="mrpsl-card p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="mrpsl-section-title">Active</div>
            {statsLoading ? (
              <div className="w-14 h-6 bg-gray-300 animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold font-mono text-green-600">
                {principalStats?.activePrincipals ?? 0}
              </div>
            )}
          </div>
        </Card>
        <Card className="mrpsl-card p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="mrpsl-section-title">Inactive</div>
            {statsLoading ? (
              <div className="w-14 h-6 bg-gray-300 animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold font-mono text-muted-foreground">
                {principalStats?.inactivePrincipals ?? 0}
              </div>
            )}
          </div>
        </Card>
        <Card className="mrpsl-card p-4 flex flex-col justify-center">
          <div className="mrpsl-section-title mb-2">Billing Breakdown</div>
          {principalStats?.billingBreakdown && (
            <>
              <div className="flex w-full h-3 rounded-full overflow-hidden">
                {Object.entries(principalStats?.billingBreakdown).map(
                  ([key, value], index) => (
                    <div
                      key={key}
                      style={{
                        width: `${value}%`,
                      }}
                      className={colors[index % colors.length]}
                      title={`${key}: ${value}`}
                    />
                  ),
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                {Object.entries(principalStats?.billingBreakdown).map(
                  ([key, value]) => (
                    <span key={key}>
                      {key}: {value}
                    </span>
                  ),
                )}
              </div>
            </>
          )}
          {/* <div className="flex w-full h-3 rounded-full overflow-hidden">
            <div style={{ width: `${(countA/total)*100}%` }} className="bg-emerald-500" title={`A: ${countA}`} />
            <div style={{ width: `${(countB/total)*100}%` }} className="bg-blue-500" title={`B: ${countB}`} />
            <div style={{ width: `${(countC/total)*100}%` }} className="bg-amber-500" title={`C: ${countC}`} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
            <span>A: {countA}</span>
            <span>B: {countB}</span>
            <span>C: {countC}</span>
          </div> */}
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Search principals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 mrpsl-input"
        />
        <Select
          value={billingFilter}
          onValueChange={(v) => setBillingFilter(v || "")}
        >
          <SelectTrigger className="w-36 mrpsl-input">
            <SelectValue placeholder="Billing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Billing</SelectItem>
            <SelectItem value="A">Category A</SelectItem>
            <SelectItem value="B">Category B</SelectItem>
            <SelectItem value="C">Category C</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v || "")}
        >
          <SelectTrigger className="w-36 mrpsl-input">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {(search || billingFilter !== "All" || statusFilter !== "All") && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setBillingFilter("All");
              setStatusFilter("All");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Data Table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Principal Name</th>
                <th className="px-4 py-3">Billing Category</th>
                <th className="px-4 py-3 text-right">Registers</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Tax / Identity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {principalsLoading ? (
                <tr>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <td key={i} className="px-4 py-3">
                      <div className="h-5 bg-gray-300 animate-pulse rounded-md" />
                    </td>
                  ))}
                </tr>
              ) : principals?.content && principals?.content?.length > 0 ? (
                principals?.content?.map((p) => (
                  <tr key={p.principalId} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.principalId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {p.principalName}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {p.sector}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`border-0 text-xs ${
                          p.billingCategory === "A"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.billingCategory === "B"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        Category {p.billingCategory}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm text-right">
                      {/* {registers.filter((r) => r.principalId === p.id).length} */}{" "}
                      -----
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{p.officialEmail}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.phoneNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono">{p.tin || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.rcNumber || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`border-0 text-xs ${p.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                      >
                        {p.status
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
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
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/setup/registers?principalId=${p.principalId}`,
                              )
                            }
                          >
                            <BookOpen className="mr-2 h-4 w-4" /> View Registers
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(p)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Principal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {/* <DropdownMenuItem
                            onClick={() =>
                              toast.info("Audit log sheet coming soon")
                            }
                          >
                            <History className="mr-2 h-4 w-4" /> View Audit Log
                          </DropdownMenuItem> */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openStatusConfirm(p)}
                          >
                            <Power className="mr-2 h-4 w-4" />{" "}
                            {p.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FileSearch className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <span className="text-sm text-muted-foreground">
                        No principals match your filters
                      </span>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearch("");
                          setBillingFilter("All");
                          setStatusFilter("All");
                        }}
                        className="mt-2"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={principals?.pagination?.totalPages || 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>

      {formOpen && (
        <PrincipalForm
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          initialData={selectedPrincipal}
        />
      )}

      {confirmStatusOpen && (
        <ToggleStatusDialog
          open={confirmStatusOpen}
          setOpen={setConfirmStatusOpen}
          selectedPrincipal={selectedPrincipal}
          onConfirm={toggleStatus}
          isLoading={toggleStatusLoading}
        />
      )}
    </div>
  );
}

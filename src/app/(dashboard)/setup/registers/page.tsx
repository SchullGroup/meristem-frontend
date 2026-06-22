"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import { useStore } from "@/lib/store";
import {
  PlusCircle,
  // BookOpen,
  // AlertTriangle,
  MoreHorizontal,
  Pencil,
  Lock,
  Unlock,
  // History,
  // Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RegisterForm } from "@/components/custom/register-form";
import { Register } from "@/types/register";
import { useGetRegisters, useGetRegisterStats } from "@/hooks/useRegisters";
import { useDebounce } from "@/hooks/useDebounce";
import { formatLargeNumber } from "@/lib/utils";
import { useGetPrincipals } from "@/hooks/usePrincipal";
import ToggleTransactionDialog from "@/components/custom/registers/toggle-transactions";
import { PaginationBar } from "@/components/custom/pagination-bar";

const PAGE_SIZE = 10;

export default function RegistersPage() {
  const router = useRouter();
  // const { registers, principals, updateRegister, logAudit } = useStore();
  const params = useSearchParams();

  const principalIdParam = params.get("principalId");
  const searchParam = params.get("search")
  const [search, setSearch] = useState("");
  const [principalFilter, setPrincipalFilter] = useState<string>(
    principalIdParam || "",
  );
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Synchronize principalFilter with URL param
  useEffect(() => {
    if (principalIdParam) {
      //eslint-disable-next-line
      setPrincipalFilter(principalIdParam);
    }

    if (searchParam) {
      setSearch(searchParam)
    }
  }, [principalIdParam, searchParam]);

  const handlePrincipalFilterChange = (value: string) => {
    setPrincipalFilter(value);
    const newParams = new URLSearchParams(params.toString());
    if (value === null) {
      newParams.delete("principalId");
    } else {
      newParams.set("principalId", value);
    }
    const queryString = newParams.toString();
    router?.replace(`/setup/registers${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  };

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(
    null,
  );

  const [confirmLockOpen, setConfirmLockOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const debouncedSearch = useDebounce(search, 500);

  const { data: registerStats, isLoading: statsLoading } =
    useGetRegisterStats();

  const { data: registers, isLoading } = useGetRegisters({
    search: debouncedSearch !== "" ? debouncedSearch : undefined,
    principalId: principalFilter !== "" ? principalFilter : undefined,
    registerType: typeFilter !== "" ? typeFilter : undefined,
    status: statusFilter !== "" ? statusFilter : undefined,
    page: currentPage,
    size: pageSize,
  });

  const { data: principals, isLoading: principalsLoading } = useGetPrincipals({
    size: 100,
  });

  const pagedRows = registers?.content || [];
  const total = registers?.pagination.total || 0;
  const totalPages = registers?.pagination?.totalPages || 1;

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
          <p className="text-sm text-muted-foreground mt-1">
            Official shareholder lists for each security managed by MRPSL
          </p>
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
          {statsLoading ? (
            <div className="w-10 h-8 bg-gray-200 animate-pulse rounded-lg" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-2">
              {registerStats?.totalRegisters ?? 0}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="mrpsl-section-title">Active</div>
          {statsLoading ? (
            <div className="w-10 h-8 bg-gray-200 animate-pulse rounded-lg" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-2 text-green-600">
              {/* {registerStats?.activeRegisters ?? 0} */}
              {registerStats?.activeRegisters ?? 0}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="mrpsl-section-title text-amber-700">
            Transaction Disabled
          </div>
          {statsLoading ? (
            <div className="w-10 h-8 bg-gray-200 animate-pulse rounded-lg" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-2 text-amber-600">
              {/* {registerStats?.transactionDisabledRegisters ?? 0} */}
              {registerStats?.transactionDisabledRegisters ?? 0}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="mrpsl-section-title">Inactive</div>
          {statsLoading ? (
            <div className="w-10 h-8 bg-gray-200 animate-pulse rounded-lg" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-2 text-muted-foreground">
              {/* {registerStats?.inactiveRegisters ?? 0} */}
              {registerStats?.inactiveRegisters ?? 0}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="mrpsl-section-title">Total Stock in Issue</div>
          {statsLoading ? (
            <div className="w-10 h-8 bg-gray-200 animate-pulse rounded-lg" />
          ) : (
            <div className="text-xl font-bold font-mono mt-2">
              {registerStats?.totalStockInIssue
                ? formatLargeNumber(registerStats?.totalStockInIssue)
                : "0"}
              units
            </div>
          )}
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
        <Select
          value={principalFilter}
          onValueChange={(value) => handlePrincipalFilterChange(value || "")}
        >
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue placeholder="Principal" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="">All Principals</SelectItem>
              {principals?.content.map((p) => (
                <SelectItem key={p.principalId} value={p.principalId}>
                  {p.principalName}
                </SelectItem>
              ))}
              {principalsLoading && (
                <SelectItem disabled>Loading....</SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v || "")}
        >
          <SelectTrigger className="w-36 mrpsl-input">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="ORDINARY">Ordinary</SelectItem>
              <SelectItem value="PREFERENCE">Preference</SelectItem>
              <SelectItem value="BOND">Bond</SelectItem>
              <SelectItem value="FUND">Fund</SelectItem>
              <SelectItem value="ETF">Etf</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v || "")}
        >
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="TRANSACTION_DISABLED">
                Transaction Disabled
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {(search ||
          principalFilter !== null ||
          typeFilter !== null ||
          statusFilter !== null) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setPrincipalFilter("");
                setTypeFilter("");
                setStatusFilter("");
              }}
            >
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
              {isLoading ? (
                <tr>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <td key={i} className="px-4 py-3">
                      <div className="h-5 bg-gray-300 animate-pulse rounded-md" />
                    </td>
                  ))}
                </tr>
              ) : pagedRows?.length > 0 ? (
                pagedRows?.map((r) => (
                  <tr key={r?.registerId} className="mrpsl-table-row">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground truncate max-w-50">
                        {r?.registerName}
                      </div>
                      {/* <div className="text-xs font-mono text-muted-foreground">
                        {r?.registerId}
                      </div> */}
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-37.5">
                      {r?.principalName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`border-0 text-xs ${r?.registerType === "ORDINARY"
                          ? "bg-blue-100 text-blue-800"
                          : r?.registerType === "PREFERENCE"
                            ? "bg-violet-100 text-violet-800"
                            : r?.registerType === "BOND"
                              ? "bg-amber-100 text-amber-800"
                              : r?.registerType === "ETF"
                                ? "bg-cyan-100 text-cyan-800"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                      >
                        {r?.registerType
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs uppercase bg-muted px-1.5 py-0.5 rounded">
                        {r?.symbol}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm text-right">
                      {r?.shareholderSizeAtSetup?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm text-right">
                      {r?.currentShareholdersSize?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm text-right">
                      {formatLargeNumber(r?.currentStockInIssue)}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-right">
                      ₦{r?.nominalValue?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`border-0 text-xs capitalize ${r?.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : r?.status === "INACTIVE"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-amber-100 text-amber-800"
                          }`}
                      >
                        {r?.status === "TRANSACTION_DISABLED"
                          ? "Disabled"
                          : r?.status}
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
                          {/* <DropdownMenuItem
                            onClick={() =>
                              router?.push(
                                `/enquiry/holder?registerId=${r?.registerId}`,
                              )
                            }
                          >
                            <Users className="mr-2 h-4 w-4" /> View Shareholders
                          </DropdownMenuItem> */}
                          <DropdownMenuItem onClick={() => handleEdit(r)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Register
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openLockConfirm(r)}
                            className="text-amber-600"
                          >
                            {r?.status === "TRANSACTION_DISABLED" ? (
                              <>
                                <Unlock className="mr-2 h-4 w-4" /> Unlock
                                Transactions
                              </>
                            ) : (
                              <>
                                <Lock className="mr-2 h-4 w-4" /> Lock
                                Transactions
                              </>
                            )}
                          </DropdownMenuItem>
                          {/* <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info("Audit log sheet coming soon")
                            }
                          >
                            <History className="mr-2 h-4 w-4" /> Audit Log
                          </DropdownMenuItem> */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-muted-foreground text-sm"
                  >
                    No registers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <PaginationBar
            page={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            total={total}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      {formOpen && (
        <RegisterForm
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          initialData={selectedRegister}
        />
      )}

      {confirmLockOpen && (
        <ToggleTransactionDialog
          open={confirmLockOpen}
          setOpen={setConfirmLockOpen}
          selectedRegister={selectedRegister}
        />
      )}
    </div>
  );
}

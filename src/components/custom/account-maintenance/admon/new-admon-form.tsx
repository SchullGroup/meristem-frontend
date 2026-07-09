"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  Pencil,
} from "lucide-react";
import { NIGERIA_STATE_NAMES } from "@/lib/mocks/nigeria-geo";
import { format } from "date-fns";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";
import { MultiDocUpload } from "@/components/custom/multi-doc-upload";
import DateInput from "@/components/ui/date-input";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useCreateAdmon, useGetAccounts } from "@/hooks/useAccountMaintenance";
import { useDebounce } from "@/hooks/useDebounce";
import { ShareholderAccount } from "@/types/account-maintenance";

// ── Administrator entry types ──

interface AdministratorEntry {
  id: string;
  isExecutor: boolean;
  adminName: string;
  email: string;
  phone: string;
  altPhone: string;
  bvn: string;
  nin: string;
  idType: string;
  idNumber: string;
  relationship: string;
  adminAddress: string;
  adminCity: string;
  adminState: string;
  memo: string;
  documents: { name: string; url: string }[];
  collapsed: boolean;
}

interface ProbateDetails {
  probateCourt: string;
  probateNumber: string;
  probatePage: string;
  probateDate: Date;
  lodgementDate: Date;
  probateDocUrl: string;
  probateDocs: { name: string; url: string }[];
}

// ── Validation constants ──

const ID_TYPE_OPTIONS = [
  "National ID",
  "International Passport",
  "Driver's License",
  "Voter's Card",
];

/** Configurable — confirm with business team before changing */
const NIN_REGEX = /^\d{11}$/;
const BVN_REGEX = /^\d{11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s()\-]{10,15}$/;

// ── Defaults ──

let _adminCounter = 0;
function createAdmin(): AdministratorEntry {
  _adminCounter += 1;
  return {
    id: `admin-${Date.now()}-${_adminCounter}`,
    isExecutor: false,
    adminName: "",
    email: "",
    phone: "",
    altPhone: "",
    bvn: "",
    nin: "",
    idType: "",
    idNumber: "",
    relationship: "",
    adminAddress: "",
    adminCity: "",
    adminState: "",
    memo: "",
    documents: [],
    collapsed: false,
  };
}

const DEFAULT_PROBATE: ProbateDetails = {
  probateCourt: "",
  probateNumber: "",
  probatePage: "",
  probateDate: new Date(),
  lodgementDate: new Date(),
  probateDocUrl: "",
  probateDocs: [],
};

export default function NewAdmonForm() {
  const { data: activeRegisters, isLoading: registerLoading } = useGetRegisters(
    {
      size: 100,
      status: "ACTIVE",
    },
  );

  const { currentUser } = useStore();

  const [registerId, setRegisterId] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // ── Case-level probate ──
  const [probate, setProbate] = useState<ProbateDetails>(DEFAULT_PROBATE);

  // ── Case-level toggles ──
  const [changeNameToEstate, setChangeNameToEstate] = useState(true);

  // ── Administrators ──
  const [administrators, setAdministrators] = useState<AdministratorEntry[]>([
    createAdmin(),
  ]);
  const [showSummary, setShowSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Map<string, string[]>
  >(new Map());

  const { data: accountsRes, isLoading: isLoadingAccount } = useGetAccounts(
    { q: debouncedSearch, registerId: registerId || undefined },
    { enabled: debouncedSearch.length >= 3 },
  );

  const searchResults = accountsRes?.data?.data || [];
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Open dropdown when new search results arrive
  const prevResultsLen = useRef(0);
  useEffect(() => {
    if (
      debouncedSearch.length >= 3 &&
      !isLoadingAccount &&
      searchResults.length !== prevResultsLen.current
    ) {
      prevResultsLen.current = searchResults.length;
      setDropdownOpen(true);
    }
  }, [searchResults.length, debouncedSearch, isLoadingAccount]);

  const [selectedAccounts, setSelectedAccounts] = useState<
    Map<string, ShareholderAccount>
  >(new Map());
  const [allDiscoveredAccounts, setAllDiscoveredAccounts] = useState<
    ShareholderAccount[]
  >([]);

  const accountLoaded =
    selectedAccounts.size > 0 || allDiscoveredAccounts.length > 0;

  const createAdmonMutation = useCreateAdmon();

  // ── Admin card helpers ──

  const updateAdmin = useCallback(
    (id: string, patch: Partial<AdministratorEntry>) => {
      setAdministrators((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
      // Clear errors for this card when user edits
      setValidationErrors((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    },
    [],
  );

  const removeAdmin = useCallback((id: string) => {
    setAdministrators((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((a) => a.id !== id);
    });
    setValidationErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const addAdmin = useCallback(() => {
    setAdministrators((prev) => [...prev, createAdmin()]);
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setAdministrators((prev) =>
      prev.map((a) => (a.id === id ? { ...a, collapsed: !a.collapsed } : a)),
    );
  }, []);

  // ── BVN NIBSS validation (mocked until API endpoint is ready) ──

  const validateBvn = useCallback(async (bvn: string) => {
    if (!BVN_REGEX.test(bvn)) return;
    // TODO: Replace with real NIBSS API call (see kyc-bank-details-tab.tsx & backend_changes.md §6)
    // const { validateBankDetails } = await import("@/actions/accountMaintenanceActions");
    // const res = await validateBankDetails({ bvn, bankCode: "", accountNumber: "" });
    await new Promise((r) => setTimeout(r, 800)); // simulate network
    const valid = bvn.length === 11 && /^\d+$/.test(bvn);
    if (valid) {
      toast.success("BVN validated successfully");
    } else {
      toast.error("BVN validation failed — check the number and try again");
    }
  }, []);

  // ── Per-card validation ──

  const validateAdmin = useCallback((admin: AdministratorEntry): string[] => {
    const errors: string[] = [];
    if (!admin.adminName.trim())
      errors.push("Administrator / Executor Name is required");
    if (!admin.email.trim()) errors.push("Email Address is required");
    else if (!EMAIL_REGEX.test(admin.email))
      errors.push("Email Address is invalid");
    if (!admin.phone.trim()) errors.push("Phone Number is required");
    else if (!PHONE_REGEX.test(admin.phone))
      errors.push("Phone Number is invalid");
    if (!admin.bvn.trim()) errors.push("BVN is required");
    else if (!BVN_REGEX.test(admin.bvn)) errors.push("BVN must be 11 digits");
    if (!admin.nin.trim()) errors.push("NIN is required");
    else if (!NIN_REGEX.test(admin.nin)) errors.push("NIN must be 11 digits");
    if (!admin.idType.trim()) errors.push("ID Type is required");
    if (!admin.idNumber.trim()) errors.push("ID Number is required");
    if (!admin.adminAddress.trim()) errors.push("Admin Address is required");
    if (!admin.adminCity.trim()) errors.push("Admin City is required");
    if (!admin.adminState.trim()) errors.push("Admin State is required");
    return errors;
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedAccounts.size === 0) {
      toast.error(
        "Please select at least one deceased account from the list below.",
      );
      return;
    }

    // Validate probate
    if (
      !probate.probateCourt.trim() ||
      !probate.probateNumber.trim() ||
      !probate.probatePage.trim()
    ) {
      toast.error("Please fill in all probate details");
      return;
    }

    // Validate every administrator card
    const allErrors = new Map<string, string[]>();
    let hasErrors = false;
    administrators.forEach((admin) => {
      const errs = validateAdmin(admin);
      if (errs.length > 0) {
        allErrors.set(admin.id, errs);
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setValidationErrors(allErrors);
      // Expand all cards with errors
      setAdministrators((prev) =>
        prev.map((a) => (allErrors.has(a.id) ? { ...a, collapsed: false } : a)),
      );
      // Scroll to first error
      const firstErrorId = [...allErrors.keys()][0];
      document
        .getElementById(`admin-card-${firstErrorId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error(
        `Please fix ${allErrors.size} administrator${allErrors.size !== 1 ? "s" : ""} with invalid fields.`,
      );
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    const deceasedAccountIds = Array.from(selectedAccounts.keys());
    const registerIds = Array.from(
      new Set(
        Array.from(selectedAccounts.values())
          .map((a) => a.registerId)
          .filter(Boolean),
      ),
    );

    createAdmonMutation.mutate(
      {
        administrators: administrators.map((a) => ({
          isExecutor: a.isExecutor,
          adminName: a.adminName,
          email: a.email,
          phone: a.phone,
          altPhone: a.altPhone || undefined,
          bvn: a.bvn,
          nin: a.nin,
          idType: a.idType,
          idNumber: a.idNumber,
          relationship: a.relationship || undefined,
          adminAddress: a.adminAddress,
          adminCity: a.adminCity,
          adminState: a.adminState,
          memo: a.memo || undefined,
          documents: a.documents.length ? a.documents : undefined,
        })),
        registerId: registerIds[0] || registerId,
        registerIds,
        deceasedAccountIds,
        admonType: administrators.some((a) => a.isExecutor)
          ? "EXECUTOR"
          : "ADMINISTRATOR",
        probateCourt: probate.probateCourt,
        probateNumber: probate.probateNumber,
        probatePage: probate.probatePage,
        probateDate: format(probate.probateDate, "yyyy-MM-dd"),
        lodgementDate: format(probate.lodgementDate, "yyyy-MM-dd"),
        probateDocUrl: probate.probateDocUrl || undefined,
        probateDocs: probate.probateDocs.length
          ? probate.probateDocs
          : undefined,
        changeNameToEstate,
        initiatedBy: currentUser.email,
      },
      {
        onSuccess: () => {
          toast.success(
            "Administration request submitted. Approver has been notified.",
          );
          // Reset form
          setSearch("");
          setProbate(DEFAULT_PROBATE);
          setAdministrators([createAdmin()]);
          setChangeNameToEstate(true);
          setValidationErrors(new Map());
          setShowSummary(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to submit request");
        },
      },
    );
  }, [
    selectedAccounts,
    probate,
    administrators,
    validateAdmin,
    currentUser,
    registerId,
    createAdmonMutation,
    changeNameToEstate,
  ]);

  const allChecked =
    allDiscoveredAccounts.length > 0 &&
    allDiscoveredAccounts.every((a) => selectedAccounts.has(a.id));

  return (
    <>
      <Card className="mrpsl-card p-6 space-y-4 overflow-visible!">
        <h3 className="font-semibold text-sm border-b pb-2">
          1. Deceased Account Selection
        </h3>
        <p className="text-[12px] text-muted-foreground -mt-2">
          Select all accounts belonging to the deceased holder, across any
          register.
        </p>
        <div className="flex gap-4" style={{ overflow: "visible" }}>
          <Select
            value={registerId}
            onValueChange={(v) => setRegisterId(v || "")}
          >
            <SelectTrigger className="w-44 mrpsl-input">
              <SelectValue placeholder="All Registers" />
            </SelectTrigger>
            <SelectContent>
              {registerLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  <SelectItem value="">All Registers</SelectItem>
                  {activeRegisters?.content?.map((r) => (
                    <SelectItem key={r.registerId} value={r.symbol}>
                      <span className="font-bold">{r.registerName}</span> -{" "}
                      <span className="text-sm">{r.symbol}</span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-60" ref={searchContainerRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              type="search"
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              onFocus={() => {
                if (debouncedSearch.length >= 3) {
                  setDropdownOpen(true);
                }
              }}
              placeholder="Search by account no, name, CHN, BVN, NIN, or email"
              className="mrpsl-input pl-9"
            />
            {isLoadingAccount && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {dropdownOpen &&
              debouncedSearch.length >= 3 &&
              !isLoadingAccount && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-xl overflow-hidden">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      No matching accounts found
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map((acc) => {
                        const alreadyAdded = allDiscoveredAccounts.some(
                          (a) => a.id === acc.id,
                        );
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            disabled={alreadyAdded}
                            className={`
                              w-full text-left px-4 py-2.5 transition-colors border-b last:border-0
                              ${
                                alreadyAdded
                                  ? "bg-muted/30 text-muted-foreground cursor-default"
                                  : "hover:bg-muted/40"
                              }
                            `}
                            onClick={() => {
                              if (alreadyAdded) return;
                              setSelectedAccounts((prev) => {
                                const next = new Map(prev);
                                next.set(acc.id, acc);
                                return next;
                              });
                              setAllDiscoveredAccounts((prev) => {
                                if (prev.some((a) => a.id === acc.id))
                                  return prev;
                                return [...prev, acc];
                              });
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {acc.firstName} {acc.lastName}
                                </p>
                                <p className="text-[12px] text-muted-foreground font-mono">
                                  {acc.accountNumber} · {acc.registerSymbol}
                                </p>
                              </div>
                              {alreadyAdded && (
                                <span className="text-[11px] text-muted-foreground font-medium shrink-0 ml-2">
                                  ✓ Added
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>

        {accountLoaded && (
          <>
            {allDiscoveredAccounts.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">
                  {allDiscoveredAccounts.length} account
                  {allDiscoveredAccounts.length !== 1 ? "s" : ""} found
                  {allDiscoveredAccounts.some(
                    (a) => a.registerId !== allDiscoveredAccounts[0].registerId,
                  )
                    ? " across multiple registers"
                    : ""}
                </span>
                <button
                  type="button"
                  className="text-[12px] text-primary hover:underline font-medium"
                  onClick={() => {
                    setSelectedAccounts((prev) => {
                      const next = new Map(prev);
                      allDiscoveredAccounts.forEach((acc) =>
                        next.set(acc.id, acc),
                      );
                      return next;
                    });
                  }}
                >
                  Select all accounts for this holder
                </button>
              </div>
            )}
            <table className="w-full text-left text-sm mt-4">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="p-2 w-12">
                    <Checkbox
                      checked={allChecked}
                      onCheckedChange={(checked) => {
                        setSelectedAccounts((prev) => {
                          const next = new Map(prev);
                          if (checked) {
                            // Select all items currently visible in the accumulated table
                            allDiscoveredAccounts.forEach((acc) =>
                              next.set(acc.id, acc),
                            );
                          } else {
                            // Deselect all items currently visible in the accumulated table
                            allDiscoveredAccounts.forEach((acc) =>
                              next.delete(acc.id),
                            );
                          }
                          return next;
                        });
                      }}
                    />
                  </th>
                  <th className="p-2">ACCT NO</th>
                  <th className="p-2">HOLDER NAME</th>
                  <th className="p-2">REGISTER</th>
                  <th className="p-2">CHN</th>
                  <th className="p-2">HOLDINGS</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono text-[13px] border-b">
                {isLoadingAccount && allDiscoveredAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : allDiscoveredAccounts.length > 0 ? (
                  // 2. Loop over the combined results state here
                  allDiscoveredAccounts.map((account) => {
                    const isChecked = selectedAccounts.has(account.id);

                    return (
                      <tr key={account.id} className="hover:bg-accent/5">
                        <td className="p-2">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              setSelectedAccounts((prev) => {
                                const next = new Map(prev);
                                if (checked) {
                                  next.set(account.id, account);
                                } else {
                                  next.delete(account.id);
                                }
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td className="p-2">{account?.accountNumber}</td>
                        <td className="p-2 font-sans font-medium text-destructive">
                          {account?.firstName} {account?.lastName} (DECEASED)
                        </td>
                        <td className="p-2">
                          {account?.registerSymbol || "-"}
                        </td>
                        <td className="p-2">{account?.chn || "-"}</td>
                        <td className="p-2 text-right">
                          {account?.holdings?.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No accounts found. Search to add rows.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </Card>

      {accountLoaded && selectedAccounts.size > 0 && (
        <>
          {/* ── Probate Details (case-level) ── */}
          <Card className="mrpsl-card p-6 space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">
              2. Probate Details
            </h3>
            <p className="text-[12px] text-muted-foreground -mt-2">
              Shared by all administrators on this request.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="mrpsl-label">Probate Court *</label>
                <Input
                  value={probate.probateCourt}
                  onChange={(e) =>
                    setProbate((prev) => ({
                      ...prev,
                      probateCourt: e.target.value,
                    }))
                  }
                  className="mrpsl-input"
                />
              </div>
              <div className="space-y-2">
                <DateInput
                  date={probate.probateDate}
                  setDate={(d) =>
                    setProbate((prev) => ({ ...prev, probateDate: d }))
                  }
                  label="Probate Date *"
                />
              </div>
              <div className="space-y-2">
                <label className="mrpsl-label">Probate Number *</label>
                <Input
                  value={probate.probateNumber}
                  onChange={(e) =>
                    setProbate((prev) => ({
                      ...prev,
                      probateNumber: e.target.value,
                    }))
                  }
                  className="mrpsl-input"
                />
              </div>
              <div className="space-y-2">
                <label className="mrpsl-label">Probate Page *</label>
                <Input
                  value={probate.probatePage}
                  onChange={(e) =>
                    setProbate((prev) => ({
                      ...prev,
                      probatePage: e.target.value,
                    }))
                  }
                  className="mrpsl-input"
                />
              </div>
              <div className="space-y-2">
                <DateInput
                  date={probate.lodgementDate}
                  setDate={(d) =>
                    setProbate((prev) => ({ ...prev, lodgementDate: d }))
                  }
                  label="Lodgement Date *"
                />
              </div>
              <div className="space-y-2">
                <DocUploadZone
                  label="Probate / Letters of Administration"
                  fileTypes={["PDF"]}
                  maxSizeMB={10}
                  onUploadSuccess={(url) =>
                    setProbate((prev) => ({ ...prev, probateDocUrl: url }))
                  }
                />
              </div>
            </div>

            {/* Shared Case Documents — multi-file */}
            <div className="border-t pt-4 space-y-3">
              <div>
                <label className="mrpsl-label">Shared Case Documents</label>
                <p className="text-[11px] text-muted-foreground">
                  PDF, JPG, or PNG — up to 10 files, 10 MB each.
                </p>
              </div>
              <MultiDocUpload
                onChange={(docs) =>
                  setProbate((prev) => ({ ...prev, probateDocs: docs }))
                }
                fileTypes={["PDF", "JPG", "PNG"]}
                maxSizeMB={10}
                folderName="admor-case-docs"
              />
            </div>

            {/* Persistent notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[12px] text-amber-800">
              Documents can be added now or later, but at least one supporting
              document must be uploaded before this request can be approved.
            </div>
          </Card>

          {/* ── Administrator Cards ── */}
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-sm">
              3. Administrator{administrators.length !== 1 ? "s" : ""} (
              {administrators.length})
            </h3>

            {administrators.map((admin, idx) => {
              const cardErrors = validationErrors.get(admin.id) || [];
              const hasErrors = cardErrors.length > 0;

              return (
                <Card
                  key={admin.id}
                  id={`admin-card-${admin.id}`}
                  className={`mrpsl-card overflow-hidden ${hasErrors ? "ring-2 ring-destructive" : ""}`}
                >
                  {/* ── Card header ── */}
                  <div
                    role="button"
                    tabIndex={0}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left cursor-pointer"
                    onClick={() => toggleCollapse(admin.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleCollapse(admin.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {admin.collapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-semibold text-sm">
                        Administrator {idx + 1}
                      </span>
                      {admin.collapsed && (
                        <span className="text-[13px] text-muted-foreground truncate">
                          {admin.adminName || "(no name)"}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[11px] shrink-0">
                        {admin.isExecutor ? "Executor" : "Administrator"}
                      </Badge>
                      {hasErrors && (
                        <Badge
                          variant="destructive"
                          className="text-[11px] shrink-0"
                        >
                          {cardErrors.length} error
                          {cardErrors.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        disabled={administrators.length <= 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAdmin(admin.id);
                        }}
                        title={
                          administrators.length <= 1
                            ? "Cannot remove the last administrator"
                            : "Remove this administrator"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* ── Card body (collapsible) ── */}
                  {!admin.collapsed && (
                    <div className="p-4 pt-0 space-y-4 border-t">
                      {/* Per-card Executor checkbox */}
                      <div className="flex items-center space-x-2 pt-4">
                        <Checkbox
                          id={`exec-${admin.id}`}
                          checked={admin.isExecutor}
                          onCheckedChange={(c) =>
                            updateAdmin(admin.id, { isExecutor: !!c })
                          }
                        />
                        <label
                          htmlFor={`exec-${admin.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Is this an Executor (not Administrator)?
                        </label>
                      </div>

                      {/* Name */}
                      <div className="space-y-2">
                        <label className="mrpsl-label">
                          Administrator / Executor Name *
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          Enter the full name of the person acting as
                          administrator or executor — not the deceased holder.
                        </p>
                        <Input
                          value={admin.adminName}
                          onChange={(e) =>
                            updateAdmin(admin.id, {
                              adminName: e.target.value,
                            })
                          }
                          placeholder="e.g. John Adeyemi Okafor"
                          className={`mrpsl-input ${cardErrors.some((e) => e.includes("Name")) ? "border-destructive" : ""}`}
                        />
                      </div>

                      {/* Email + Phone */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="mrpsl-label">Email Address *</label>
                          <Input
                            type="email"
                            value={admin.email}
                            onChange={(e) =>
                              updateAdmin(admin.id, {
                                email: e.target.value,
                              })
                            }
                            placeholder="administrator@example.com"
                            className={`mrpsl-input ${cardErrors.some((e) => e.includes("Email")) ? "border-destructive" : ""}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="mrpsl-label">Phone Number *</label>
                          <Input
                            type="tel"
                            value={admin.phone}
                            onChange={(e) =>
                              updateAdmin(admin.id, {
                                phone: e.target.value,
                              })
                            }
                            placeholder="+234 800 000 0000"
                            className={`mrpsl-input ${cardErrors.some((e) => e.includes("Phone")) ? "border-destructive" : ""}`}
                          />
                        </div>
                      </div>

                      {/* Alt Phone + Relationship */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="mrpsl-label">
                            Alternate Phone Number
                          </label>
                          <Input
                            type="tel"
                            value={admin.altPhone}
                            onChange={(e) =>
                              updateAdmin(admin.id, {
                                altPhone: e.target.value,
                              })
                            }
                            placeholder="+234 800 000 0001"
                            className="mrpsl-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="mrpsl-label">
                            Relationship to Deceased
                          </label>
                          <Input
                            value={admin.relationship}
                            onChange={(e) =>
                              updateAdmin(admin.id, {
                                relationship: e.target.value,
                              })
                            }
                            placeholder="e.g. Son, Daughter, Spouse, Legal Representative"
                            className="mrpsl-input"
                          />
                        </div>
                      </div>

                      {/* BVN + NIN */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="mrpsl-label">BVN *</label>
                            <button
                              type="button"
                              className="text-[11px] text-primary hover:underline"
                              disabled={admin.bvn.length < 11}
                              onClick={() => validateBvn(admin.bvn)}
                            >
                              Validate BVN
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Bank Verification Number — 11 digits
                          </p>
                          <Input
                            value={admin.bvn}
                            onChange={(e) =>
                              updateAdmin(admin.id, {
                                bvn: e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 11),
                              })
                            }
                            placeholder="00000000000"
                            maxLength={11}
                            className={`mrpsl-input ${cardErrors.some((e) => e.includes("BVN")) ? "border-destructive" : ""}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="mrpsl-label">NIN *</label>
                          <p className="text-[11px] text-muted-foreground">
                            National Identification Number
                          </p>
                          <Input
                            value={admin.nin}
                            onChange={(e) =>
                              updateAdmin(admin.id, {
                                nin: e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 11),
                              })
                            }
                            placeholder="00000000000"
                            maxLength={11}
                            className={`mrpsl-input ${cardErrors.some((e) => e.includes("NIN")) ? "border-destructive" : ""}`}
                          />
                        </div>
                      </div>

                      {/* ID Type + ID Number */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="mrpsl-label">ID Type *</label>
                          <Select
                            value={admin.idType}
                            onValueChange={(v) =>
                              updateAdmin(admin.id, { idType: v || "" })
                            }
                          >
                            <SelectTrigger
                              className={`mrpsl-input ${cardErrors.some((e) => e.includes("ID Type")) ? "border-destructive" : ""}`}
                            >
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ID_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="mrpsl-label">ID Number *</label>
                          <Input
                            value={admin.idNumber}
                            onChange={(e) =>
                              updateAdmin(admin.id, {
                                idNumber: e.target.value,
                              })
                            }
                            placeholder="ID number"
                            className={`mrpsl-input ${cardErrors.some((e) => e.includes("ID Number")) ? "border-destructive" : ""}`}
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-3">
                          <label className="mrpsl-label">Admin Address *</label>
                          <Textarea
                            value={admin.adminAddress}
                            onChange={(e) =>
                              updateAdmin(admin.id, {
                                adminAddress: e.target.value,
                              })
                            }
                            className={`mrpsl-input ${cardErrors.some((e) => e.includes("Address")) ? "border-destructive" : ""}`}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="mrpsl-label">Admin City *</label>
                          <Input
                            value={admin.adminCity}
                            onChange={(e) =>
                              updateAdmin(admin.id, {
                                adminCity: e.target.value,
                              })
                            }
                            className={`mrpsl-input ${cardErrors.some((e) => e.includes("City")) ? "border-destructive" : ""}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="mrpsl-label">Admin State *</label>
                          <Select
                            value={admin.adminState}
                            onValueChange={(v) =>
                              updateAdmin(admin.id, {
                                adminState: v || "",
                              })
                            }
                          >
                            <SelectTrigger
                              className={`mrpsl-input ${cardErrors.some((e) => e.includes("State")) ? "border-destructive" : ""}`}
                            >
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {NIGERIA_STATE_NAMES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Memo */}
                      <div className="space-y-2">
                        <label className="mrpsl-label">Memo</label>
                        <Textarea
                          value={admin.memo}
                          onChange={(e) =>
                            updateAdmin(admin.id, {
                              memo: e.target.value,
                            })
                          }
                          className="mrpsl-input"
                          rows={3}
                        />
                      </div>

                      {/* Per-administrator supporting documents */}
                      <div className="border-t pt-4 space-y-3">
                        <div>
                          <label className="mrpsl-label">
                            Administrator {idx + 1} — Supporting Documents
                          </label>
                          <p className="text-[11px] text-muted-foreground">
                            ID documents, proof of relationship, or other
                            supporting files — PDF, JPG, or PNG, up to 10 files,
                            10 MB each.
                          </p>
                        </div>
                        <MultiDocUpload
                          title=""
                          subtitle=""
                          onChange={(docs) =>
                            updateAdmin(admin.id, { documents: docs })
                          }
                          fileTypes={["PDF", "JPG", "PNG"]}
                          maxSizeMB={10}
                          folderName={`admor-admin-${idx + 1}`}
                        />
                      </div>

                      {/* Per-card error summary */}
                      {hasErrors && (
                        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                          <p className="text-[12px] font-medium text-destructive mb-1">
                            Please fix the following:
                          </p>
                          <ul className="text-[12px] text-destructive list-disc list-inside space-y-0.5">
                            {cardErrors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}

            {/* Add Another button */}
            <Button
              type="button"
              variant="outline"
              className="w-full border border-primary-700 bg-primary/10"
              onClick={addAdmin}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Another Administrator
            </Button>
          </div>

          {/* ── Summary Panel ── */}
          <Card className="mrpsl-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                4. Summary — {administrators.length} Administrator
                {administrators.length !== 1 ? "s" : ""}
              </h3>
              <button
                type="button"
                className="text-[12px] text-primary hover:underline"
                onClick={() => setShowSummary(!showSummary)}
              >
                {showSummary ? "Hide" : "Show"} details
              </button>
            </div>
            {showSummary && (
              <div className="space-y-2">
                {administrators.map((admin, idx) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 text-[13px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium text-muted-foreground w-5">
                        {idx + 1}.
                      </span>
                      <span className="font-medium truncate">
                        {admin.adminName || "(no name)"}
                      </span>
                      <Badge variant="outline" className="text-[11px] shrink-0">
                        {admin.isExecutor ? "Executor" : "Administrator"}
                      </Badge>
                      {validationErrors.has(admin.id) && (
                        <Badge
                          variant="destructive"
                          className="text-[11px] shrink-0"
                        >
                          {validationErrors.get(admin.id)!.length} error(s)
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          updateAdmin(admin.id, { collapsed: false });
                          document
                            .getElementById(`admin-card-${admin.id}`)
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                        }}
                        title="Edit this administrator"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        disabled={administrators.length <= 1}
                        onClick={() => removeAdmin(admin.id)}
                        title={
                          administrators.length <= 1
                            ? "Cannot remove the last administrator"
                            : "Remove"
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Case-level toggles ── */}
          <Card className="mrpsl-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">
                  Change Holder Name to Estate Name
                </span>
              </div>
              <Switch
                checked={changeNameToEstate}
                onCheckedChange={setChangeNameToEstate}
              />
            </div>
            {changeNameToEstate && (
              <div className="bg-background border p-3 rounded text-sm text-center font-mono space-y-1">
                {Array.from(selectedAccounts.values()).map((acc) => (
                  <div key={acc.id}>
                    <span className="text-muted-foreground line-through mr-2">
                      {acc.firstName} {acc.lastName}
                    </span>{" "}
                    →{" "}
                    <span className="font-bold text-primary">
                      Estate of {acc.firstName} {acc.lastName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Submit ── */}
          <div className="flex justify-end pt-2">
            <Button
              size="lg"
              disabled={createAdmonMutation.isPending}
              onClick={handleSubmit}
            >
              {createAdmonMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit for Authorisation
            </Button>
          </div>
        </>
      )}
    </>
  );
}

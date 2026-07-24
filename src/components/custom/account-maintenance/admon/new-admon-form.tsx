"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  Pencil,
  X,
  History,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { NIGERIA_STATE_NAMES } from "@/lib/mocks/nigeria-geo";
import { format } from "date-fns";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { MultiDocUpload } from "@/components/custom/multi-doc-upload";
import DateInput from "@/components/ui/date-input";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  useCreateAdmon,
  useGetAccounts,
  useGetAdmons,
} from "@/hooks/useAccountMaintenance";
import { useDebounce } from "@/hooks/useDebounce";
import { Admon, ShareholderAccount } from "@/types/account-maintenance";
import { formatDate } from "@/lib/utils/format";
import {
  administratorSchema,
  probateSchema,
  ID_TYPE_OPTIONS,
  BVN_REGEX,
} from "@/lib/schemas/admon";

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
  probateDocs: { name: string; url: string }[];
}

// ── Validation constants (imported from @/lib/schemas/admon.ts) ──
// Regexes: NIN_REGEX, BVN_REGEX, EMAIL_REGEX, PHONE_REGEX — used in the zod schema

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
  probateDocs: [],
};

// ── Demo mock row for backend demonstration ──
// Remove once the backend supports GET /admon?initiatorId=&status=RETURNED.

const MOCK_RETURNED_ADMON: Admon = {
  id: -101,
  registerId: "MRL",
  deceasedAccountIds: ["ACC-101"],
  deceasedAccountNumbers: ["MR00003344"],
  deceasedAccounts: [
    {
      accountNumber: "MR00003344",
      holderName: "Tunde Bakare",
      registerSymbol: "MRL",
      chn: "CHN-4471",
      holdings: 610000,
    },
  ],
  deceasedHolderName: "Tunde Bakare",
  admonType: "ADMINISTRATOR",
  adminName: "Kemi Bakare",
  probateCourt: "High Court of Lagos State — Ikeja Division",
  probateNumber: "P/2026/0071/LS",
  probateDate: "2026-05-02",
  probatePage: "118-121",
  lodgementDate: "2026-06-10",
  adminAddress: "22 Ogunlana Drive",
  adminCity: "Surulere",
  adminState: "Lagos",
  memo: "",
  changeNameToEstate: true,
  estateNamePreview: "Estate of Tunde Bakare",
  probateDocs: [],
  administrators: [
    {
      adminName: "Kemi Bakare",
      isExecutor: false,
      email: "kemi.bakare@email.com",
      phone: "+234 805 222 3344",
      bvn: "33445566778",
      nin: "22334455661",
      idType: "National ID",
      relationship: "Daughter",
      adminAddress: "22 Ogunlana Drive",
      adminCity: "Surulere",
      adminState: "Lagos",
      documents: [],
    },
  ],
  status: "RETURNED",
  initiatorId: "",
  initiatorName: "",
  authorisedBy: "",
  authorisedAt: "",
  icuApprovedBy: "",
  icuApprovedAt: "",
  returnedReason:
    "Probate documents are illegible — please re-upload a clearer scan of the Letters of Administration.",
  returnedBy: "chioma.okafor@email.com",
  returnedAt: "2026-07-10T11:20:00",
  createdAt: "2026-07-08T09:15:00",
  decidedAt: "",
};

export default function NewAdmonForm() {
  const { data: activeRegisters, isLoading: registerLoading } = useGetRegisters(
    {
      size: 100,
      status: "ACTIVE",
    },
  );

  const { currentUser } = useStore();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const router = useRouter();
  const pathname = usePathname();

  // ── Draft / Returned lifecycle ──
  // TODO: Replace with real GET /admons/:id endpoint. For now, arriving with
  // a draftId in the URL just shows the "editing a draft" banner.
  const [isDraft, setIsDraft] = useState(!!draftId);
  const [draftBannerDismissed, setDraftBannerDismissed] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(() =>
    draftId ? new Date().toISOString() : "",
  );
  const [draftSavedBy, setDraftSavedBy] = useState(() =>
    draftId ? (currentUser?.email ?? "") : "",
  );
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionBannerDismissed, setCorrectionBannerDismissed] =
    useState(false);

  // ── Returned Requests (peculiar to the initiator) ──
  const [returnedListOpen, setReturnedListOpen] = useState(false);
  const [resumeId, setResumeId] = useState<number | null>(null);

  const { isLoading: returnedLoading } = useGetAdmons(
    { initiatorId: currentUser?.email, status: "RETURNED" },
    { enabled: !!currentUser?.email },
  );
  // const returnedAdmons = returnedRes?.data?.data?.length
  //   ? returnedRes.data.data
  //   : [MOCK_RETURNED_ADMON];
  const returnedAdmons = [MOCK_RETURNED_ADMON];

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

  // ── Reset to a blank New Administration form ──
  // Shared by a successful submit and the explicit "Discard & Start New"
  // action, so a resumed/draft record never lingers after either.
  const resetForm = useCallback(() => {
    setSearch("");
    setProbate(DEFAULT_PROBATE);
    setAdministrators([createAdmin()]);
    setChangeNameToEstate(true);
    setValidationErrors(new Map());
    setShowSummary(false);
    setSelectedAccounts(new Map());
    setAllDiscoveredAccounts([]);
    setResumeId(null);
    setCorrectionReason("");
    setCorrectionBannerDismissed(false);
    setIsDraft(false);
    setDraftBannerDismissed(false);
    if (draftId) {
      router.replace(pathname);
    }
  }, [draftId, pathname, router]);

  // ── Resume a returned request ──
  // Hydrates the form directly from the record the "Returned Requests" list
  // already fetched — no separate GET /admon/:id call needed.
  const hydrateFromAdmon = useCallback((admon: Admon) => {
    setResumeId(admon.id);
    setIsDraft(true);
    setDraftSavedAt(admon.createdAt);
    setDraftSavedBy(admon.initiatorName);
    setCorrectionReason(admon.returnedReason || "");
    setCorrectionBannerDismissed(false);

    setProbate({
      probateCourt: admon.probateCourt,
      probateNumber: admon.probateNumber,
      probatePage: admon.probatePage,
      probateDate: admon.probateDate ? new Date(admon.probateDate) : new Date(),
      lodgementDate: admon.lodgementDate
        ? new Date(admon.lodgementDate)
        : new Date(),
      probateDocs: admon.probateDocs || [],
    });

    setChangeNameToEstate(admon.changeNameToEstate);

    setAdministrators(
      (admon.administrators?.length
        ? admon.administrators
        : [
            {
              adminName: admon.adminName,
              isExecutor: admon.admonType === "EXECUTOR",
              email: "",
              phone: "",
              bvn: "",
              nin: "",
              idType: "",
              adminAddress: admon.adminAddress,
              adminCity: admon.adminCity,
              adminState: admon.adminState,
              documents: [],
            },
          ]
      ).map((a) => {
        _adminCounter += 1;
        return {
          id: `admin-${Date.now()}-${_adminCounter}`,
          isExecutor: a.isExecutor,
          adminName: a.adminName,
          email: a.email,
          phone: a.phone,
          altPhone: a.altPhone || "",
          bvn: a.bvn,
          nin: a.nin,
          idType: a.idType,
          relationship: a.relationship || "",
          adminAddress: a.adminAddress,
          adminCity: a.adminCity,
          adminState: a.adminState,
          memo: a.memo || "",
          documents: a.documents || [],
          collapsed: false,
        };
      }),
    );

    const accounts: ShareholderAccount[] = (
      admon.deceasedAccounts?.length
        ? admon.deceasedAccounts
        : admon.deceasedAccountNumbers.map((accountNumber) => ({
            accountNumber,
            holderName: admon.deceasedHolderName,
            registerSymbol: admon.registerId,
            chn: "",
            holdings: 0,
          }))
    ).map((acc, i) => {
      const [firstName, ...rest] = acc.holderName.split(" ");
      return {
        id: admon.deceasedAccountIds[i] || `${admon.id}-${i}`,
        registerId: admon.registerId,
        registerSymbol: acc.registerSymbol,
        accountNumber: acc.accountNumber,
        lastName: rest.join(" ") || acc.holderName,
        firstName: firstName || acc.holderName,
        otherNames: "",
        gender: "",
        holderType: "",
        email: "",
        phone: "",
        phone2: "",
        address: "",
        state: "",
        bvn: "",
        nin: "",
        chn: acc.chn,
        bankName: "",
        bankAccountNumber: "",
        holdings: acc.holdings,
        status: "",
        cautionReason: "",
        noTax: false,
      };
    });

    setSelectedAccounts(new Map(accounts.map((a) => [a.id, a])));
    setAllDiscoveredAccounts(accounts);

    setReturnedListOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

  // ── Per-card validation (zod-based) ──

  const validateAdmin = useCallback((admin: AdministratorEntry): string[] => {
    // Build a plain object from the AdministratorEntry, normalising empty strings
    const data = {
      isExecutor: admin.isExecutor,
      adminName: admin.adminName,
      email: admin.email,
      phone: admin.phone,
      altPhone: admin.altPhone || undefined,
      bvn: admin.bvn,
      nin: admin.nin,
      idType: admin.idType,
      relationship: admin.relationship || undefined,
      adminAddress: admin.adminAddress,
      adminCity: admin.adminCity,
      adminState: admin.adminState,
      memo: admin.memo || undefined,
      documents: admin.documents.length ? admin.documents : undefined,
    };
    const result = administratorSchema.safeParse(data);
    const errors = result.success
      ? []
      : result.error.issues.map((issue) => issue.message);
    if (admin.documents.length === 0) {
      errors.push(
        "At least one supporting document is required for this administrator/executor.",
      );
    }
    return errors;
  }, []);

  const handleSubmit = useCallback(
    (draft = false) => {
      if (selectedAccounts.size === 0) {
        toast.error(
          "Please select at least one deceased account from the list below.",
        );
        return;
      }

      if (!draft) {
        // Validate probate (zod-based)
        const probateResult = probateSchema.safeParse(probate);
        if (!probateResult.success) {
          const messages = probateResult.error.issues.map((i) => i.message);
          toast.error(messages[0] || "Please fill in all probate details");
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
            prev.map((a) =>
              allErrors.has(a.id) ? { ...a, collapsed: false } : a,
            ),
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
          // Include the existing record id for PATCH operations (edit-draft
          // via URL, or resuming a returned request picked from the list)
          ...(draftId
            ? { id: Number(draftId) }
            : resumeId
              ? { id: resumeId }
              : {}),
          administrators: administrators.map((a) => ({
            isExecutor: a.isExecutor,
            adminName: a.adminName,
            email: a.email,
            phone: a.phone,
            altPhone: a.altPhone || undefined,
            bvn: a.bvn,
            nin: a.nin,
            idType: a.idType,
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
          probateDocs: probate.probateDocs.length
            ? probate.probateDocs
            : undefined,
          changeNameToEstate,
          initiatedBy: currentUser.email,
          // For RETURNED records, force back to PENDING_AUTH on resubmit
          status: draft
            ? "DRAFT"
            : correctionReason
              ? "PENDING_AUTH"
              : "SUBMITTED",
        },
        {
          onSuccess: () => {
            toast.success(
              draft
                ? "Administration request saved as draft."
                : "Administration request submitted. Approver has been notified.",
            );
            resetForm();
          },
          onError: (err) => {
            toast.error(err.message || "Failed to submit request");
          },
        },
      );
    },
    [
      selectedAccounts,
      probate,
      administrators,
      validateAdmin,
      currentUser,
      registerId,
      createAdmonMutation,
      changeNameToEstate,
      draftId,
      resumeId,
      correctionReason,
      resetForm,
    ],
  );

  const allChecked =
    allDiscoveredAccounts.length > 0 &&
    allDiscoveredAccounts.every((a) => selectedAccounts.has(a.id));

  return (
    <>
      {/* ── Returned Requests (peculiar to the initiator) ── */}
      <div className="flex justify-between items-center mb-3">
        {isDraft || resumeId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-[12px] text-muted-foreground hover:text-destructive"
            onClick={() => resetForm()}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Discard &amp; Start New Administration
          </Button>
        ) : (
          <div />
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-[12px] text-amber-700 hover:bg-amber-50"
          onClick={() => setReturnedListOpen(true)}
        >
          <History className="h-3.5 w-3.5 mr-1.5" />
          Returned Requests
          {returnedAdmons.length > 0 && (
            <Badge className="ml-1.5 h-4 px-1.5 bg-amber-100 text-amber-700 border-0 text-[10px]">
              {returnedAdmons.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* ── Draft banner ── */}
      {isDraft && !draftBannerDismissed && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-[13px] text-blue-800 mb-4">
          <span className="flex-1">
            Editing draft saved{" "}
            {draftSavedAt ? new Date(draftSavedAt).toLocaleDateString() : ""}
            {draftSavedBy ? ` · Last edited by ${draftSavedBy}` : ""}
          </span>
          <button
            type="button"
            onClick={() => setDraftBannerDismissed(true)}
            className="text-blue-400 hover:text-blue-600 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Returned (correction) banner ── */}
      {correctionReason && !correctionBannerDismissed && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-800 mb-4">
          <span className="flex-1">
            <strong>Returned — Action Required:</strong> {correctionReason}
          </span>
          <button
            type="button"
            onClick={() => setCorrectionBannerDismissed(true)}
            className="text-red-400 hover:text-red-600 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
              style={{ paddingLeft: "2.25rem" }}
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
                <div className="flex items-center gap-3">
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
                  <button
                    type="button"
                    className="text-[12px] text-destructive hover:underline font-medium"
                    onClick={() => {
                      setSelectedAccounts(new Map());
                      setAllDiscoveredAccounts([]);
                      setSearch("");
                    }}
                  >
                    Clear all
                  </button>
                </div>
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
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono text-[13px] border-b">
                {isLoadingAccount && allDiscoveredAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
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
                        <td className="p-2">
                          <button
                            type="button"
                            className="text-muted-foreground/40 hover:text-destructive transition-colors"
                            title="Remove this account"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccounts((prev) => {
                                const next = new Map(prev);
                                next.delete(account.id);
                                return next;
                              });
                              setAllDiscoveredAccounts((prev) =>
                                prev.filter((a) => a.id !== account.id),
                              );
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2 col-span-2">
                <MultiDocUpload
                  title="Probate / Letters of Administration"
                  subtitle="PDF, JPG, or PNG — 20 MB each."
                  onChange={(docs) =>
                    setProbate((prev) => ({ ...prev, probateDocs: docs }))
                  }
                  fileTypes={["PDF", "JPG", "PNG"]}
                  maxSizeMB={20}
                  folderName="admorSharedCaseDocs"
                />
              </div>
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
                        <BvnStatusField
                          value={admin.bvn}
                          onChange={(v) => updateAdmin(admin.id, { bvn: v })}
                          error={cardErrors.some((e) => e.includes("BVN"))}
                        />
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

                      {/* ID Type */}
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
                            Administrator {idx + 1} — Supporting Documents *
                          </label>
                          <p className="text-[11px] text-muted-foreground">
                            ID documents, proof of relationship, or other
                            supporting files — PDF, JPG, or PNG, 20 MB each. At
                            least one document is required.
                          </p>
                        </div>
                        <MultiDocUpload
                          title=""
                          subtitle=""
                          onChange={(docs) =>
                            updateAdmin(admin.id, { documents: docs })
                          }
                          fileTypes={["PDF", "JPG", "PNG"]}
                          maxSizeMB={20}
                          folderName={`admorAdminSupporingDoc${idx + 1}`}
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
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              disabled={createAdmonMutation.isPending}
              onClick={() => handleSubmit(true)}
            >
              {createAdmonMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save as Draft
            </Button>
            <Button
              size="lg"
              disabled={createAdmonMutation.isPending}
              onClick={() => handleSubmit(false)}
            >
              {createAdmonMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit for Authorisation
            </Button>
          </div>
        </>
      )}

      {/* ── Returned Requests list dialog ── */}
      <Dialog open={returnedListOpen} onOpenChange={setReturnedListOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Returned Requests</DialogTitle>
          </DialogHeader>
          <div className="px-8 pb-8 space-y-3 max-h-[60vh] overflow-y-auto">
            {returnedLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : returnedAdmons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No returned requests.
              </p>
            ) : (
              returnedAdmons.map((admon) => (
                <Card key={admon.id} className="p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">
                          {admon.deceasedHolderName}
                        </p>
                        <Badge className="bg-red-100 text-red-700 border-0 text-[10px] h-5 px-1.5 font-bold uppercase">
                          Returned
                        </Badge>
                      </div>
                      <p className="text-[12px] font-mono text-muted-foreground">
                        {admon.deceasedAccountNumbers?.join(", ")}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => hydrateFromAdmon(admon)}>
                      Resume
                    </Button>
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    {admon.returnedBy
                      ? `Returned by ${admon.returnedBy}`
                      : "Returned"}
                    {admon.returnedAt
                      ? ` on ${formatDate(admon.returnedAt)}`
                      : ""}
                    {admon.returnedReason ? `: ${admon.returnedReason}` : ""}
                  </p>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * BVN field with inline auto-validation. Once the value reaches 11 digits it
 * shows a brief spinner then "BVN validated" — mocked until the NIBSS
 * endpoint is ready (see backend_changes.md §6), at which point the
 * simulated delay is replaced with a real API call keyed off the same
 * 11-digit trigger.
 */
function BvnStatusField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  // `validatedForValue` tracks the exact BVN a validation "succeeded" for, so
  // status is a plain derived value — editing the BVN again automatically
  // falls back to "validating" without needing a separate reset.
  const [validatedForValue, setValidatedForValue] = useState<string | null>(
    null,
  );
  const isComplete = BVN_REGEX.test(value);
  const status: "idle" | "validating" | "valid" = !isComplete
    ? "idle"
    : validatedForValue === value
      ? "valid"
      : "validating";

  useEffect(() => {
    if (!isComplete || validatedForValue === value) return;
    // TODO: Replace with real NIBSS API call once available (see backend_changes.md §6)
    const timer = setTimeout(() => setValidatedForValue(value), 900);
    return () => clearTimeout(timer);
  }, [isComplete, value, validatedForValue]);

  return (
    <div className="space-y-2">
      <label className="mrpsl-label">BVN *</label>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <span>Bank Verification Number — 11 digits</span>
        {status === "validating" && (
          <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
        )}
        {status === "valid" && (
          <span className="inline-flex items-center gap-1 text-green-600 font-medium shrink-0">
            <CheckCircle2 className="h-3 w-3" />
            BVN validated
          </span>
        )}
      </p>
      <Input
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 11))
        }
        placeholder="00000000000"
        maxLength={11}
        className={`mrpsl-input ${error ? "border-destructive" : ""}`}
      />
    </div>
  );
}

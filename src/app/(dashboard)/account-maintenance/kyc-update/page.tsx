"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Search, Loader2 } from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";
import { ShareholderAccount } from "@/types/account-maintenance";
import {
  useGetAccounts,
  useCreateKycChange,
  useGetAccountKycHistory,
} from "@/hooks/useAccountMaintenance";
import { Agent, GET_AGENTS } from "@/actions/agentAction";
import { useQuery } from "@tanstack/react-query";
import { KYCBulkUpload } from "@/components/custom/account-maintenance/kyc/kyc-bulk-upload";
import KYCHistory from "@/components/custom/account-maintenance/kyc/kyc-update-history";
import { KycPersonalInfoTab } from "@/components/custom/account-maintenance/kyc/kyc-personal-info-tab";
import { KycContactInfoTab } from "@/components/custom/account-maintenance/kyc/kyc-contact-info-tab";
import { KycBankDetailsTab } from "@/components/custom/account-maintenance/kyc/kyc-bank-details-tab";
import { KycDocumentsTab } from "@/components/custom/account-maintenance/kyc/kyc-documents-tab";
import { useDebounce } from "@/hooks/useDebounce";
import StatusBadge from "@/components/custom/status-badge";
import { formatDate } from "@/lib/utils/format";
import { fullName, getInitials } from "@/lib/utils/shareholder";

export default function KYCUpdatePage() {
  const currentUser = useStore((s) => s.currentUser);

  // ── Registers ──
  const { data: activeRegisters, isLoading: registersLoading } =
    useGetRegisters({
      size: 100,
      status: "ACTIVE",
    });

  // ── UI state ──
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [innerTab, setInnerTab] = useState("personal");
  const [selectedRegister, setSelectedRegister] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShareholder, setSelectedShareholder] =
    useState<ShareholderAccount | null>(null);

  // ── Account search ──
  const debouncedSearch = useDebounce(searchTerm, 500);
  const { data: accountsResponse, isFetching: isSearchingAccounts } =
    useGetAccounts(
      {
        q: debouncedSearch,
        registerId: selectedRegister !== "" ? selectedRegister : undefined,
      },
      { enabled: debouncedSearch.length > 2 },
    );
  const searchResults = accountsResponse?.data?.data ?? [];

  // ── Banks ──
  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: () => GET_AGENTS({ type: "BANK", size: 100 }),
  });

  const bankList = agents?.data?.content || [];

  // ── KYC submit mutation ──
  const createKycMutation = useCreateKycChange();

  // ── Pending changes for this account ──
  const { data: pendingChangesData, refetch: refetchPendingChanges } =
    useGetAccountKycHistory(
      selectedShareholder?.accountNumber ?? "",
      { status: "PENDING" },
      { enabled: !!selectedShareholder?.accountNumber },
    );
  const pendingChanges = pendingChangesData?.data?.data ?? [];

  const handleFieldSubmit = async (
    accountNumber: string,
    changeType: string,
    field: string,
    newValue: string,
    reason: string,
    evidence: { name: string; url: string }[],
  ) => {
    if (!currentUser) return;
    try {
      await createKycMutation.mutateAsync({
        accountNumber,
        data: {
          changeType,
          changes: [{ field, newValue }],
          supportingDocuments: evidence.length ? evidence : undefined,
          initiatedBy: currentUser.email,
          reason,
        },
      });
      toast.success("Change submitted for approval");
      refetchPendingChanges();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit change",
      );
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">KYC Update</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update shareholder identity, contact, and bank information in a
            controlled and auditable manner
          </p>
        </div>
      </div>

      {/* ── Top bar ── */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <Select
          value={selectedRegister}
          onValueChange={(v) => setSelectedRegister(v || "")}
        >
          <SelectTrigger className="w-64 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={""}>All Registers</SelectItem>
            {activeRegisters?.content.map((r) => (
              <SelectItem key={r.registerId} value={r.symbol}>
                {r.registerName} {r.symbol}
              </SelectItem>
            ))}
            {registersLoading && (
              <SelectItem value="_loading" disabled>
                Loading registers…
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        <div className="border rounded-md flex p-1 bg-muted/20">
          <Button
            variant={mode === "single" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("single")}
          >
            Single
          </Button>
          <Button
            variant={mode === "bulk" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("bulk")}
          >
            Bulk Upload
          </Button>
        </div>

        {mode === "single" && (
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              className="mrpsl-input pl-9"
              placeholder="Search by account no, name or CHN…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {debouncedSearch.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg overflow-hidden">
                {isSearchingAccounts ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No accounts found
                  </div>
                ) : (
                  <div className="max-h-62.5 overflow-y-auto">
                    {searchResults.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors border-b last:border-0"
                        onClick={() => {
                          setSelectedShareholder(acc);
                          setSearchTerm("");
                          setInnerTab("personal");
                        }}
                      >
                        <p className="text-sm font-medium">{fullName(acc)}</p>
                        <p className="text-[12px] text-muted-foreground font-mono">
                          {acc.accountNumber} · {acc.registerSymbol}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Single mode ── */}
      {mode === "single" && selectedShareholder && (
        <div className="space-y-6 animate-in fade-in">
          {/* Account card */}
          <Card className="mrpsl-card p-5 space-y-4">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-xl font-mono">
                  {getInitials(selectedShareholder)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold truncate">
                    {fullName(selectedShareholder)}
                  </h2>
                  <Badge variant="outline" className="font-mono text-[13px]">
                    {selectedShareholder.accountNumber}
                  </Badge>
                  <StatusBadge status={selectedShareholder?.status} />
                </div>
                <div className="flex gap-4 mt-2 flex-wrap text-[13px]">
                  <div>
                    <span className="text-muted-foreground">Holdings:</span>{" "}
                    <span className="font-mono font-bold text-sm">
                      {selectedShareholder.holdings?.toLocaleString()}
                    </span>
                  </div>
                  {selectedShareholder.bankName && (
                    <div>
                      <span className="text-muted-foreground">Bank:</span>{" "}
                      <span className="font-medium">
                        {selectedShareholder.bankName}
                      </span>
                    </div>
                  )}
                  {selectedShareholder.chn && (
                    <div>
                      <span className="text-muted-foreground">CHN:</span>{" "}
                      <span className="font-mono">
                        {selectedShareholder.chn}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5 flex-wrap text-[13px] border-t border-border/40 pt-3">
              {selectedShareholder.registerSymbol && (
                <div>
                  <span className="text-muted-foreground">Register:</span>{" "}
                  <span className="font-medium font-mono">
                    {selectedShareholder.registerSymbol}
                  </span>
                </div>
              )}
              {selectedShareholder.holderType && (
                <div>
                  <span className="text-muted-foreground">Holder Type:</span>{" "}
                  <span className="font-medium">
                    {selectedShareholder.holderType}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Last KYC Update:</span>{" "}
                <span className="font-medium">
                  {formatDate(selectedShareholder.lastKycUpdate)}
                </span>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs
            value={innerTab}
            onValueChange={(v) => setInnerTab(v || "personal")}
            className="w-full"
          >
            <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
              {[
                { value: "personal", label: "Personal Info" },
                { value: "contact", label: "Contact Info" },
                { value: "bank", label: "Bank Details" },
                { value: "documents", label: "Documents" },
                { value: "history", label: "Change History" },
              ].map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="personal">
                <KycPersonalInfoTab
                  selectedShareholder={selectedShareholder}
                  pendingChanges={pendingChanges}
                  isSubmitting={createKycMutation.isPending}
                  onFieldSubmit={handleFieldSubmit}
                />
              </TabsContent>

              <TabsContent value="contact">
                <KycContactInfoTab
                  selectedShareholder={selectedShareholder}
                  pendingChanges={pendingChanges}
                  isSubmitting={createKycMutation.isPending}
                  onFieldSubmit={handleFieldSubmit}
                />
              </TabsContent>

              <TabsContent value="bank">
                <KycBankDetailsTab
                  selectedShareholder={selectedShareholder}
                  pendingChanges={pendingChanges}
                  isSubmitting={createKycMutation.isPending}
                  bankList={bankList as Agent[]}
                  onFieldSubmit={handleFieldSubmit}
                />
              </TabsContent>

              <TabsContent value="documents">
                <KycDocumentsTab
                  chn={selectedShareholder.chn ?? ""}
                  registerSymbol={selectedShareholder.registerSymbol}
                  holderName={fullName(selectedShareholder)}
                  currentUserEmail={currentUser?.email ?? ""}
                  onFieldSubmit={handleFieldSubmit}
                  isSubmitting={createKycMutation.isPending}
                  accountNumber={selectedShareholder.accountNumber}
                />
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <KYCHistory
                  tab="history"
                  selectedShareholder={selectedShareholder}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}

      {/* ── Placeholder ── */}
      {mode === "single" && !selectedShareholder && (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center gap-3">
          <Search className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Search for a shareholder above to load their account details
          </p>
        </Card>
      )}

      {/* ── Bulk upload ── */}
      {mode === "bulk" && <KYCBulkUpload registerId={selectedRegister} />}
    </div>
  );
}

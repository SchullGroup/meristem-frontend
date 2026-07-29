"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { UserRound } from "lucide-react";
import { ShareholderAccount } from "@/types/account-maintenance";
import {
  useCreateKycChange,
  useGetAccountKycHistory,
} from "@/hooks/useAccountMaintenance";
import { Agent, GET_AGENTS } from "@/actions/agentAction";
import { useQuery } from "@tanstack/react-query";
import { KycPersonalInfoTab } from "@/components/custom/account-maintenance/kyc/kyc-personal-info-tab";
import { KycContactInfoTab } from "@/components/custom/account-maintenance/kyc/kyc-contact-info-tab";
import { KycBankDetailsTab } from "@/components/custom/account-maintenance/kyc/kyc-bank-details-tab";
import { KycDocumentsTab } from "@/components/custom/account-maintenance/kyc/kyc-documents-tab";
import KYCHistory from "@/components/custom/account-maintenance/kyc/kyc-update-history";
import { CautionAccountButton } from "@/components/custom/account-maintenance/kyc/caution-account-button";
import StatusBadge from "@/components/custom/status-badge";
import { formatDate } from "@/lib/utils/format";
import { fullName, getInitials } from "@/lib/utils/shareholder";
import { DetailHeader } from "./detail-header";
import { AccountSearch } from "./account-search";

/**
 * Standard KYC Update — the original single-record KYC flow (unchanged
 * behaviour), moved under the new Standard KYC landing tile. Reuses the
 * existing per-field edit tabs wired to the real KYC-change endpoints.
 */
export function StandardKyc({ onBack }: { onBack: () => void }) {
  const currentUser = useStore((s) => s.currentUser);
  const [innerTab, setInnerTab] = useState("personal");
  const [selectedShareholder, setSelectedShareholder] =
    useState<ShareholderAccount | null>(null);

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
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to KYC Home"
        onBack={onBack}
        title="Standard KYC Update"
        subtitle="Search a shareholder, edit KYC fields, attach documents and submit for approval."
      />

      <AccountSearch onSelect={setSelectedShareholder} />

      {selectedShareholder ? (
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
                  <CautionAccountButton
                    selectedShareholder={selectedShareholder}
                    onFieldSubmit={handleFieldSubmit}
                  />
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
                  {selectedShareholder.bankAccountNumber && (
                    <div>
                      <span className="text-muted-foreground">
                        Bank Account Number:
                      </span>{" "}
                      <span className="font-medium">
                        {selectedShareholder.bankAccountNumber}
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
              <div className="shrink-0">
                <button
                  className="text-[13px] text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedShareholder(null)}
                >
                  Change account
                </button>
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
      ) : (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center gap-3">
          <UserRound className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Search for a shareholder above to load their account details
          </p>
        </Card>
      )}
    </div>
  );
}

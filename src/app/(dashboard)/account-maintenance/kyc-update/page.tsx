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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  AlertTriangle,
  Search,
  Loader2,
} from "lucide-react";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  ShareholderAccount,
} from "@/types/account-maintenance";
import {
  useGetAccounts,
  useCreateKycChange,
} from "@/hooks/useAccountMaintenance";
import { Agent, GET_AGENTS } from "@/actions/agentAction";
import { useQuery } from "@tanstack/react-query";
import { KYCBulkUpload } from "@/components/custom/account-maintenance/kyc-bulk-upload";
import KYCHistory from "@/components/custom/account-maintenance/kyc-update-history";
import PendingKYC from "@/components/custom/account-maintenance/kyc-pending";
import { useDebounce } from "@/hooks/useDebounce";
import StatusBadge from "@/components/custom/status-badge";


function getInitials(account: ShareholderAccount) {
  const first = account?.firstName?.[0] ?? "";
  const last = account?.lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "--";
}

function fullName(account: ShareholderAccount) {
  return [account?.firstName, account?.otherNames, account?.lastName]
    .filter(Boolean)
    .join(" ");
}

export default function KYCUpdatePage() {
  const currentUser = useStore((s) => s.currentUser);

  // ── Registers ──
  const { data: activeRegisters, isLoading: registersLoading } = useGetRegisters({
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
  const [supportingDocUrl, setSupportingDocUrl] = useState("");



  // ── Form field state ──
  const [newName, setNewName] = useState("");
  const [nameChangeType, setNameChangeType] = useState("");
  const [newHolderType, setNewHolderType] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newBank, setNewBank] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");

  // ── Account search ──
  const debouncedSearch = useDebounce(searchTerm, 500);
  const {
    data: accountsResponse,
    isFetching: isSearchingAccounts,
  } = useGetAccounts(
    { q: debouncedSearch, registerId: selectedRegister !== "" ? selectedRegister : undefined },
    { enabled: debouncedSearch.length > 2 }
  );
  const searchResults = accountsResponse?.data?.data ?? [];

  // ── Banks ──
  const { data: agents, isLoading: isLoadingBanks } = useQuery({
    queryKey: ["agents"],
    queryFn: () => GET_AGENTS({ type: "BANK", size: 100 }),
  });

  const bankList = agents?.data?.content || [];


  // ── KYC submit mutation ──
  const createKycMutation = useCreateKycChange();

  const handleSubmitPersonal = () => {
    if (!selectedShareholder || !currentUser) return;
    const changes: { field: string; newValue: string }[] = [];
    if (newName) changes.push({ field: "holderName", newValue: newName });
    if (newHolderType) changes.push({ field: "holderType", newValue: newHolderType });
    if (!changes.length) { toast.error("No changes entered"); return; }
    createKycMutation.mutate(
      {
        accountNumber: selectedShareholder.accountNumber,
        data: {
          changeType: "PERSONAL",
          changes,
          supportingDocUrl,
          initiatedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Account changes submitted successfully!");
          // Optimistic update — reflect submitted values immediately
          setSelectedShareholder((prev) =>
            prev
              ? {
                ...prev,
                ...(newName ? { firstName: newName, lastName: "", holderName: newName } : {}),
                ...(newHolderType ? { holderType: newHolderType } : {}),
              }
              : prev,
          );
          setNewName("");
          setNewHolderType("");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update account changes")
        }
      },
    );
  };

  const handleSubmitContact = () => {
    if (!selectedShareholder || !currentUser) return;
    const changes: { field: string; newValue: string }[] = [];
    if (newEmail) changes.push({ field: "email", newValue: newEmail });
    if (newPhone) changes.push({ field: "phone", newValue: newPhone });
    if (newAddress) changes.push({ field: "address", newValue: newAddress });
    if (!changes.length) { toast.error("No changes entered"); return; }
    createKycMutation.mutate(
      {
        accountNumber: selectedShareholder.accountNumber,
        data: {
          changeType: "CONTACT",
          changes,
          supportingDocUrl,
          initiatedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Account changes submitted successfully!")
          // Optimistic update — reflect submitted values immediately
          setSelectedShareholder((prev) =>
            prev
              ? {
                ...prev,
                ...(newEmail ? { email: newEmail } : {}),
                ...(newPhone ? { phone: newPhone } : {}),
                ...(newAddress ? { address: newAddress } : {}),
              }
              : prev,
          );
          setNewEmail("");
          setNewPhone("");
          setNewAddress("");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update account changes")
        }
      },
    );
  };

  const handleSubmitBank = () => {
    if (!selectedShareholder || !currentUser) return;
    const changes: { field: string; newValue: string }[] = [];
    if (newBank) changes.push({ field: "bankName", newValue: newBank });
    if (newAccountNumber) changes.push({ field: "bankAccountNumber", newValue: newAccountNumber });
    if (!changes.length) { toast.error("No changes entered"); return; }
    createKycMutation.mutate(
      {
        accountNumber: selectedShareholder.accountNumber,
        data: {
          changeType: "BANK",
          changes,
          supportingDocUrl,
          initiatedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Account changes submitted successfully!")
          // Optimistic update — reflect submitted values immediately
          setSelectedShareholder((prev) =>
            prev
              ? {
                ...prev,
                ...(newBank ? { bankName: newBank } : {}),
                ...(newAccountNumber ? { bankAccountNumber: newAccountNumber } : {}),
              }
              : prev,
          );
          setNewBank("");
          setNewAccountNumber("");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update account changes")
        }
      },
    );
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
            <SelectItem value={""}>
              All Registers
            </SelectItem>
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
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              className="mrpsl-input pl-9"
              placeholder="Search by account no, name or CHN…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Search dropdown */}
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
                  <div className="max-h-[250px] overflow-y-auto">
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
                          {acc.accountNumber || acc.bankAccountNumber} · {acc.registerSymbol}
                        </p>
                      </button>
                    ))
                    }
                  </div>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Single mode: account card + tabs ── */}
      {mode === "single" && selectedShareholder && (
        <div className="space-y-6 animate-in fade-in">
          {/* Account card */}
          {selectedShareholder ? (
            <Card className="mrpsl-card p-4 flex items-center gap-6">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-2xl font-mono">
                  {getInitials(selectedShareholder)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold">{fullName(selectedShareholder)}</h2>
                  <Badge variant="outline" className="font-mono text-[13px]">
                    {selectedShareholder.accountNumber}
                  </Badge>
                  <StatusBadge status={selectedShareholder?.status} />
                </div>
                <div className="flex gap-4 mt-3 flex-wrap">
                  <div className="text-[13px]">
                    <span className="text-muted-foreground">Holdings:</span>{" "}
                    <span className="font-mono font-bold text-sm">
                      {selectedShareholder.holdings?.toLocaleString()}
                    </span>
                  </div>
                  {selectedShareholder.bankName && (
                    <div className="text-[13px]">
                      <span className="text-muted-foreground">Bank:</span>{" "}
                      <span className="font-medium">{selectedShareholder.bankName}</span>
                    </div>
                  )}
                  {selectedShareholder.chn && (
                    <div className="text-[13px]">
                      <span className="text-muted-foreground">CHN:</span>{" "}
                      <span className="font-mono">{selectedShareholder.chn}</span>
                    </div>
                  )}
                  {selectedShareholder.bvn && (
                    <div className="text-[13px]">
                      <span className="text-muted-foreground">BVN:</span>{" "}
                      <span className="font-mono">
                        ***{selectedShareholder.bvn.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : null}

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
                { value: "pending", label: "Pending Changes" },
                { value: "history", label: "Audit History" },
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
              {/* ── Personal ── */}
              <TabsContent value="personal">
                <Card className="mrpsl-card p-6 space-y-6">
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 font-semibold text-sm border-b pb-2">
                    <div className="text-muted-foreground uppercase text-[13px]">Field</div>
                    <div className="text-muted-foreground uppercase text-[13px]">Current Value</div>
                    <div className="text-primary uppercase text-[13px]">New Value</div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Shareholder Name</span>
                    <span className="text-sm text-muted-foreground">{fullName(selectedShareholder)}</span>
                    <div className="flex gap-2">
                      <Input
                        className="mrpsl-input"
                        placeholder="New name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      <Select value={nameChangeType} onValueChange={(value) => setNameChangeType(value || "")}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spell">Correction</SelectItem>
                          <SelectItem value="change">Change</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Holder Type</span>
                    <span className="text-sm text-muted-foreground">{selectedShareholder?.holderType}</span>
                    <Select value={newHolderType} onValueChange={(value) => setNewHolderType(value || "")}>
                      <SelectTrigger className="mrpsl-input">
                        <SelectValue placeholder={selectedShareholder?.holderType ?? "Select"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">INDIVIDUAL</SelectItem>
                        <SelectItem value="CORPORATE">CORPORATE</SelectItem>
                        <SelectItem value="JOINT">JOINT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-6">
                    <DocUploadZone
                      label="Supporting Document"
                      fileTypes={["PDF", "JPG", "PNG"]}
                      maxSizeMB={10}
                      onUploadSuccess={(url) => setSupportingDocUrl(url)}
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSubmitPersonal}
                      disabled={createKycMutation.isPending}
                    >
                      {createKycMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Submit Changes for Approval
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* ── Contact ── */}
              <TabsContent value="contact">
                <Card className="mrpsl-card p-6 space-y-6">
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 font-semibold text-sm border-b pb-2">
                    <div className="text-muted-foreground uppercase text-[13px]">Field</div>
                    <div className="text-muted-foreground uppercase text-[13px]">Current Value</div>
                    <div className="text-primary uppercase text-[13px]">New Value</div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Email Address</span>
                    <span className="text-sm text-muted-foreground">{selectedShareholder?.email}</span>
                    <Input
                      className="mrpsl-input"
                      placeholder="New email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Phone Number</span>
                    <span className="text-sm text-muted-foreground">{selectedShareholder?.phone}</span>
                    <Input
                      className="mrpsl-input"
                      placeholder="New phone"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-start">
                    <span className="text-sm font-medium mt-2">Registered Address *</span>
                    <span className="text-sm text-muted-foreground mt-2">{selectedShareholder?.address}</span>
                    <Textarea
                      className="mrpsl-input"
                      placeholder="New address"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSubmitContact}
                      disabled={createKycMutation.isPending}
                    >
                      {createKycMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Submit Changes for Approval
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* ── Bank ── */}
              <TabsContent value="bank">
                <div className="border-l-4 border-amber-400 bg-amber-50 p-4 rounded-r-md flex gap-3 mb-6">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Updating bank details will automatically queue all outstanding
                    dividend warrants for this account in New Mandate Payment
                    Processing.
                  </p>
                </div>
                <Card className="mrpsl-card p-6 space-y-6">
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 font-semibold text-sm border-b pb-2">
                    <div className="text-muted-foreground uppercase text-[13px]">Field</div>
                    <div className="text-muted-foreground uppercase text-[13px]">Current Value</div>
                    <div className="text-primary uppercase text-[13px]">New Value</div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Bank Name</span>
                    <span className="text-sm text-muted-foreground">{selectedShareholder?.bankName}</span>
                    <Select value={newBank} onValueChange={(value) => setNewBank(value || "")}>
                      <SelectTrigger className="mrpsl-input">
                        <SelectValue placeholder="Select Bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingBanks && (
                          <SelectItem value="_loading" disabled>Loading banks…</SelectItem>
                        )}
                        {bankList.map((b: Agent) => (
                          <SelectItem key={b.id} value={b.name}>
                            {b.name} · {b.code}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Account Number</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {selectedShareholder?.bankAccountNumber}
                    </span>
                    <div className="flex gap-2">
                      <Input
                        className="mrpsl-input font-mono"
                        placeholder="10 digits"
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          toast.success(
                            "Account validated"
                          )
                        }
                      >
                        Validate
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSubmitBank}
                      disabled={createKycMutation.isPending}
                    >
                      {createKycMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Submit Changes for Approval
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* ── Pending Changes ── */}
              <TabsContent value="pending" className="space-y-4">
                <PendingKYC tab="pending" setTab={setInnerTab} selectedShareholder={selectedShareholder} />
              </TabsContent>

              {/* ── Audit History ── */}
              <TabsContent value="history" className="space-y-4">
                <KYCHistory tab="history" selectedShareholder={selectedShareholder} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}

      {/* ── Placeholder when no account selected yet ── */}
      {mode === "single" && !selectedShareholder && (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center gap-3">
          <Search className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Search for a shareholder above to load their account details
          </p>
        </Card>
      )}

      {/* ── Bulk upload ── */}
      {mode === "bulk" && (
        <KYCBulkUpload registerId={selectedRegister} />
      )}

    </div>
  );
}

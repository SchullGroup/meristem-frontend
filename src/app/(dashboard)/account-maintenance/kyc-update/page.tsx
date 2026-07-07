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
  Upload,
  X,
  CheckCircle2,
  FileText,
  Plus,
  Info,
  PenLine,
  ExternalLink,
} from "lucide-react";
import { MultiDocUpload } from "@/components/custom/multi-doc-upload";
import { useGetRegisters } from "@/hooks/useRegisters";
import { ShareholderAccount } from "@/types/account-maintenance";
import {
  useGetAccounts,
  useCreateKycChange,
  useUploadHolderSignature,
  useUploadHolderKycDocuments,
  useGetHolderKycDocuments,
  useGetHolderSignature,
  useVerifyHolderKycDocument,
  useRejectHolderKycDocument,
} from "@/hooks/useAccountMaintenance";
import { HolderKycDocument } from "@/types/account-maintenance";
import { GetImageUrl } from "@/lib/utils/get-image-url";
import { GetPDFUrl } from "@/lib/utils/get-file-url";
import { cn } from "@/lib/utils";
import { Agent, GET_AGENTS } from "@/actions/agentAction";
import { useQuery } from "@tanstack/react-query";
import { KYCBulkUpload } from "@/components/custom/account-maintenance/kyc-bulk-upload";
import KYCHistory from "@/components/custom/account-maintenance/kyc-update-history";
import PendingKYC from "@/components/custom/account-maintenance/kyc-pending";
import { useDebounce } from "@/hooks/useDebounce";
import StatusBadge from "@/components/custom/status-badge";

const DOC_TYPES = [
  { value: "NIN", label: "National ID (NIN)" },
  { value: "BVN", label: "Bank Verification Number (BVN)" },
  { value: "PASSPORT", label: "International Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "BIRTH_CERTIFICATE", label: "Birth Certificate" },
  { value: "UTILITY_BILL", label: "Utility Bill" },
  { value: "BANK_STATEMENT", label: "Bank Statement" },
  { value: "EMPLOYMENT_LETTER", label: "Employment Letter" },
  { value: "OTHER", label: "Other" },
];

interface KycDocEntry {
  id: string;
  documentType: string;
  documentName: string;
  documentRef: string;
  file: File | null;
  url: string;
  status: "idle" | "uploading" | "done" | "error";
  errorMsg?: string;
}

function newKycDocEntry(): KycDocEntry {
  return {
    id: crypto.randomUUID(),
    documentType: "",
    documentName: "",
    documentRef: "",
    file: null,
    url: "",
    status: "idle",
  };
}

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
  const { data: activeRegisters, isLoading: registersLoading } =
    useGetRegisters({
      size: 100,
      status: "ACTIVE",
    });

  // ── UI state ──
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [innerTab, setInnerTab] = useState("personal");
  const [docSubTab, setDocSubTab] = useState("upload");
  const [selectedRegister, setSelectedRegister] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShareholder, setSelectedShareholder] =
    useState<ShareholderAccount | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<
    { name: string; url: string }[]
  >([]);

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
  const { data: agents, isLoading: isLoadingBanks } = useQuery({
    queryKey: ["agents"],
    queryFn: () => GET_AGENTS({ type: "BANK", size: 100 }),
  });

  const bankList = agents?.data?.content || [];

  // ── KYC submit mutation ──
  const createKycMutation = useCreateKycChange();

  // ── Document upload / review ──
  const { data: sigOnFileData, isLoading: isLoadingSigOnFile, refetch: refetchSigOnFile } =
    useGetHolderSignature(
      selectedShareholder?.chn ?? "",
      selectedShareholder?.registerSymbol ?? "",
      { enabled: !!selectedShareholder?.chn && !!selectedShareholder?.registerSymbol },
    );
  const sigOnFileUrl: string = sigOnFileData?.data?.signatureUrl ?? "";

  const uploadSignatureMutation = useUploadHolderSignature();
  const uploadKycDocsMutation = useUploadHolderKycDocuments();
  const verifyDocMutation = useVerifyHolderKycDocument();
  const rejectDocMutation = useRejectHolderKycDocument();

  const {
    data: kycDocsData,
    isLoading: isLoadingKycDocs,
    refetch: refetchKycDocs,
  } = useGetHolderKycDocuments(
    selectedShareholder?.chn ?? "",
    selectedShareholder?.registerSymbol ?? "",
    {
      enabled:
        !!selectedShareholder?.chn && !!selectedShareholder?.registerSymbol,
    },
  );
  const uploadedDocs: HolderKycDocument[] = kycDocsData?.data ?? [];

  // ── Signature state ──
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [sigUrl, setSigUrl] = useState("");
  const [sigStatus, setSigStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [sigError, setSigError] = useState("");

  // ── KYC doc entries state ──
  const [kycDocEntries, setKycDocEntries] = useState<KycDocEntry[]>([
    newKycDocEntry(),
  ]);

  const handleSubmitPersonal = () => {
    if (!selectedShareholder || !currentUser) return;
    const changes: { field: string; newValue: string }[] = [];
    if (newName) changes.push({ field: "holderName", newValue: newName });
    if (newHolderType)
      changes.push({ field: "holderType", newValue: newHolderType });
    if (!changes.length) {
      toast.error("No changes entered");
      return;
    }
    createKycMutation.mutate(
      {
        accountNumber: selectedShareholder.accountNumber,
        data: {
          changeType: "PERSONAL",
          changes,
          supportingDocuments: supportingDocs.length
            ? supportingDocs
            : undefined,
          initiatedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Account changes submitted successfully!");
          setNewName("");
          setNewHolderType("");
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to update account changes");
        },
      },
    );
  };

  const handleSubmitContact = () => {
    if (!selectedShareholder || !currentUser) return;
    const changes: { field: string; newValue: string }[] = [];
    if (newEmail) changes.push({ field: "email", newValue: newEmail });
    if (newPhone) changes.push({ field: "phone", newValue: newPhone });
    if (newAddress) changes.push({ field: "address", newValue: newAddress });
    if (!changes.length) {
      toast.error("No changes entered");
      return;
    }
    createKycMutation.mutate(
      {
        accountNumber: selectedShareholder.accountNumber,
        data: {
          changeType: "CONTACT",
          changes,
          supportingDocuments: supportingDocs.length
            ? supportingDocs
            : undefined,
          initiatedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Account changes submitted successfully!");
          setNewEmail("");
          setNewPhone("");
          setNewAddress("");
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to update account changes");
        },
      },
    );
  };

  const handleSubmitBank = () => {
    if (!selectedShareholder || !currentUser) return;
    const changes: { field: string; newValue: string }[] = [];
    if (newBank) changes.push({ field: "bankName", newValue: newBank });
    if (newAccountNumber)
      changes.push({ field: "bankAccountNumber", newValue: newAccountNumber });
    if (!changes.length) {
      toast.error("No changes entered");
      return;
    }
    createKycMutation.mutate(
      {
        accountNumber: selectedShareholder.accountNumber,
        data: {
          changeType: "BANK",
          changes,
          supportingDocuments: supportingDocs.length
            ? supportingDocs
            : undefined,
          initiatedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Account changes submitted successfully!");
          setNewBank("");
          setNewAccountNumber("");
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to update account changes");
        },
      },
    );
  };

  const handleSigFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setSigError("Only image files are accepted for signatures (JPG, PNG)");
      setSigStatus("error");
      return;
    }
    setSigFile(file);
    setSigStatus("uploading");
    setSigError("");
    try {
      const res = await GetImageUrl(file, "signatures");
      if (res?.type === "success") {
        setSigUrl(res.result as string);
        setSigStatus("done");
      } else {
        const r = res?.result;
        setSigError(
          r instanceof Error
            ? r.message
            : typeof r === "string"
              ? r
              : "Upload failed",
        );
        setSigStatus("error");
        setSigFile(null);
      }
    } catch (err: any) {
      setSigError(err.message || "Upload failed");
      setSigStatus("error");
      setSigFile(null);
    }
  };

  const handleSubmitSignature = () => {
    if (!selectedShareholder || !sigUrl) return;
    uploadSignatureMutation.mutate(
      {
        chn: selectedShareholder.chn ?? "",
        registerSymbol: selectedShareholder.registerSymbol,
        signatureUrl: sigUrl,
        holderName: fullName(selectedShareholder),
      },
      {
        onSuccess: () => {
          toast.success("Signature uploaded successfully!");
          setSigFile(null);
          setSigUrl("");
          setSigStatus("idle");
          refetchSigOnFile();
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to upload signature");
        },
      },
    );
  };

  const updateKycDocEntry = (id: string, patch: Partial<KycDocEntry>) => {
    setKycDocEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  };

  const handleKycDocFile = async (id: string, file: File) => {
    updateKycDocEntry(id, { file, status: "uploading", errorMsg: undefined });
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const mimeType = file.type.toLowerCase();
      let res;
      if (mimeType === "application/pdf" || ext === "pdf") {
        res = await GetPDFUrl(file, "kycdocs");
      } else {
        res = await GetImageUrl(file, "kycdocs");
      }
      if (res?.type === "success") {
        updateKycDocEntry(id, { url: res.result as string, status: "done" });
      } else {
        const r = res?.result;
        const errorMsg =
          r instanceof Error
            ? r.message
            : typeof r === "string"
              ? r
              : "Upload failed";
        updateKycDocEntry(id, { status: "error", errorMsg, file: null });
      }
    } catch (err: any) {
      updateKycDocEntry(id, {
        status: "error",
        errorMsg: err.message || "Upload failed",
        file: null,
      });
    }
  };

  const handleSubmitKycDocs = () => {
    if (!selectedShareholder) return;
    const readyDocs = kycDocEntries.filter((e) => e.status === "done" && e.url);
    if (!readyDocs.length) {
      toast.error("Upload at least one document before submitting");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    uploadKycDocsMutation.mutate(
      {
        chn: selectedShareholder.chn ?? "",
        registerSymbol: selectedShareholder.registerSymbol,
        documents: readyDocs.map((e) => ({
          documentType: e.documentType || "OTHER",
          documentName: e.documentName || e.file?.name || "Document",
          documentRef: e.documentRef || e.file?.name || "",
          documentUrl: e.url,
          uploadedAt: today,
        })),
      },
      {
        onSuccess: () => {
          toast.success("KYC documents submitted for review!");
          setKycDocEntries([newKycDocEntry()]);
          refetchKycDocs();
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to submit KYC documents");
        },
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
                  <h2 className="text-xl font-bold">
                    {fullName(selectedShareholder)}
                  </h2>
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
                      <span className="font-medium">
                        {selectedShareholder.bankName}
                      </span>
                    </div>
                  )}
                  {selectedShareholder.chn && (
                    <div className="text-[13px]">
                      <span className="text-muted-foreground">CHN:</span>{" "}
                      <span className="font-mono">
                        {selectedShareholder.chn}
                      </span>
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
                { value: "documents", label: "Documents" },
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
                    <div className="text-muted-foreground uppercase text-[13px]">
                      Field
                    </div>
                    <div className="text-muted-foreground uppercase text-[13px]">
                      Current Value
                    </div>
                    <div className="text-primary uppercase text-[13px]">
                      New Value
                    </div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">
                      Shareholder Name
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {fullName(selectedShareholder)}
                    </span>
                    <div className="flex gap-2">
                      <Input
                        className="mrpsl-input"
                        placeholder="New name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      <Select
                        value={nameChangeType}
                        onValueChange={(value) =>
                          setNameChangeType(value || "")
                        }
                      >
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
                    <span className="text-sm text-muted-foreground">
                      {selectedShareholder?.holderType}
                    </span>
                    <Select
                      value={newHolderType}
                      onValueChange={(value) => setNewHolderType(value || "")}
                    >
                      <SelectTrigger className="mrpsl-input">
                        <SelectValue
                          placeholder={
                            selectedShareholder?.holderType ?? "Select"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">INDIVIDUAL</SelectItem>
                        <SelectItem value="CORPORATE">CORPORATE</SelectItem>
                        <SelectItem value="JOINT">JOINT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-6">
                    <MultiDocUpload onChange={setSupportingDocs} />
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
                    <div className="text-muted-foreground uppercase text-[13px]">
                      Field
                    </div>
                    <div className="text-muted-foreground uppercase text-[13px]">
                      Current Value
                    </div>
                    <div className="text-primary uppercase text-[13px]">
                      New Value
                    </div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Email Address</span>
                    <span className="text-sm text-muted-foreground">
                      {selectedShareholder?.email}
                    </span>
                    <Input
                      className="mrpsl-input"
                      placeholder="New email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Phone Number</span>
                    <span className="text-sm text-muted-foreground">
                      {selectedShareholder?.phone}
                    </span>
                    <Input
                      className="mrpsl-input"
                      placeholder="New phone"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-start">
                    <span className="text-sm font-medium mt-2">
                      Registered Address *
                    </span>
                    <span className="text-sm text-muted-foreground mt-2">
                      {selectedShareholder?.address}
                    </span>
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
                    Updating bank details will automatically queue all
                    outstanding dividend warrants for this account in New
                    Mandate Payment Processing.
                  </p>
                </div>
                <Card className="mrpsl-card p-6 space-y-6">
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 font-semibold text-sm border-b pb-2">
                    <div className="text-muted-foreground uppercase text-[13px]">
                      Field
                    </div>
                    <div className="text-muted-foreground uppercase text-[13px]">
                      Current Value
                    </div>
                    <div className="text-primary uppercase text-[13px]">
                      New Value
                    </div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Bank Name</span>
                    <span className="text-sm text-muted-foreground">
                      {selectedShareholder?.bankName}
                    </span>
                    <Select
                      value={newBank}
                      onValueChange={(value) => setNewBank(value || "")}
                    >
                      <SelectTrigger className="mrpsl-input">
                        <SelectValue placeholder="Select Bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingBanks && (
                          <SelectItem value="_loading" disabled>
                            Loading banks…
                          </SelectItem>
                        )}
                        {bankList.map((b: Agent) => (
                          <SelectItem key={b.id} value={b.name}>
                            {b.name} · {b.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Account Number</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {selectedShareholder?.accountNumber}
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
                        onClick={() => toast.success("Account validated")}
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

              {/* ── Documents ── */}
              <TabsContent value="documents">
                <Tabs
                  value={docSubTab}
                  onValueChange={(v) => setDocSubTab(v || "upload")}
                  className="w-full"
                >
                  <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5 mb-6">
                    {[
                      { value: "upload", label: "Upload" },
                      { value: "review", label: "Review Documents" },
                    ].map((t) => (
                      <TabsTrigger
                        key={t.value}
                        value={t.value}
                        className="rounded-lg px-5 py-2 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
                      >
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="upload" className="space-y-6">
                    {/* Signature section */}
                    <Card className="mrpsl-card p-6 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <PenLine className="h-4 w-4 text-primary" />
                            Signature Upload
                          </h3>
                          <p className="text-[13px] text-muted-foreground mt-0.5">
                            Upload the holder&apos;s signature image. Applied
                            immediately — no review required.
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5 text-[12px] text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1">
                          <Info className="h-3.5 w-3.5" />
                          No approval needed
                        </div>
                      </div>

                      {/* Current signature on file */}
                      {isLoadingSigOnFile ? (
                        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading current signature…
                        </div>
                      ) : sigOnFileUrl ? (
                        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Current Signature on File
                            </p>
                            <a
                              href={sigOnFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-1.5 py-0.5 rounded hover:bg-primary/5"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open
                            </a>
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sigOnFileUrl}
                            alt="Current signature on file"
                            className="max-h-24 max-w-xs rounded border border-border/40 bg-white object-contain"
                          />
                        </div>
                      ) : null}

                      <div className="space-y-3">
                        {sigStatus === "done" && sigFile ? (
                          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/50 p-3">
                            <div className="h-12 w-12 rounded-lg overflow-hidden border border-green-200 bg-white shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={sigUrl}
                                alt="Signature preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                <p className="text-[13px] font-semibold text-green-900 truncate">
                                  {sigFile.name}
                                </p>
                              </div>
                              <p className="text-[11px] text-green-700/70 mt-0.5">
                                {(sigFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSigFile(null);
                                  setSigUrl("");
                                  setSigStatus("idle");
                                  setSigError("");
                                }}
                                className="text-green-400 hover:text-destructive transition-colors p-0.5 rounded"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                              <a
                                href={sigUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] font-semibold text-green-700 hover:text-green-900 transition-colors px-1.5 py-0.5 rounded hover:bg-green-100"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Preview
                              </a>
                            </div>
                          </div>
                        ) : (
                          <>
                            <input
                              id="sig-upload"
                              type="file"
                              accept="image/jpeg,image/png,image/jpg"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleSigFile(f);
                                e.target.value = "";
                              }}
                            />
                            <label
                              htmlFor="sig-upload"
                              className={cn(
                                "flex items-center gap-3 border-2 border-dashed rounded-xl px-5 py-4 cursor-pointer transition-colors group",
                                sigStatus === "uploading" &&
                                  "border-primary/40 bg-primary/5 cursor-default",
                                sigStatus === "error" &&
                                  "border-destructive/40 bg-destructive/5",
                                sigStatus === "idle" &&
                                  "border-border/60 hover:border-primary/50 hover:bg-primary/5",
                              )}
                            >
                              {sigStatus === "uploading" ? (
                                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                              ) : (
                                <Upload
                                  className={cn(
                                    "h-5 w-5 shrink-0",
                                    sigStatus === "error"
                                      ? "text-destructive"
                                      : "text-muted-foreground group-hover:text-primary",
                                  )}
                                />
                              )}
                              <div>
                                <p
                                  className={cn(
                                    "text-[13px] font-medium",
                                    sigStatus === "error"
                                      ? "text-destructive"
                                      : "text-muted-foreground group-hover:text-primary",
                                  )}
                                >
                                  {sigStatus === "uploading"
                                    ? "Uploading…"
                                    : sigStatus === "error"
                                      ? sigError
                                      : "Click to upload signature image"}
                                </p>
                                {sigStatus !== "error" &&
                                  sigStatus !== "uploading" && (
                                    <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                                      JPG or PNG · Max 10 MB
                                    </p>
                                  )}
                              </div>
                            </label>
                          </>
                        )}
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={handleSubmitSignature}
                          disabled={
                            !sigUrl || uploadSignatureMutation.isPending
                          }
                        >
                          {uploadSignatureMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Upload Signature
                        </Button>
                      </div>
                    </Card>

                    {/* KYC Documents section */}
                    <Card className="mrpsl-card p-6 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            KYC Documents
                          </h3>
                          <p className="text-[13px] text-muted-foreground mt-0.5">
                            Upload supporting identity documents. Each
                            submission goes through a review and approval
                            workflow.
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Requires review
                        </div>
                      </div>

                      <div className="space-y-3">
                        {kycDocEntries.map((entry, idx) => (
                          <div
                            key={entry.id}
                            className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden"
                          >
                            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                              <span className="text-[11px] font-bold text-muted-foreground/60 w-5 shrink-0">
                                {idx + 1}.
                              </span>
                              <Select
                                value={entry.documentType}
                                onValueChange={(v) =>
                                  updateKycDocEntry(entry.id, {
                                    documentType: v || "",
                                  })
                                }
                              >
                                <SelectTrigger className="w-52 mrpsl-input h-8 text-[13px]">
                                  <SelectValue placeholder="Document type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {DOC_TYPES.map((dt) => (
                                    <SelectItem key={dt.value} value={dt.value}>
                                      {dt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Document name (e.g. John NIN Slip)"
                                value={entry.documentName}
                                onChange={(e) =>
                                  updateKycDocEntry(entry.id, {
                                    documentName: e.target.value,
                                  })
                                }
                                className="h-8 text-[13px] mrpsl-input flex-1"
                              />
                              <Input
                                placeholder="Ref / ID number"
                                value={entry.documentRef}
                                onChange={(e) =>
                                  updateKycDocEntry(entry.id, {
                                    documentRef: e.target.value,
                                  })
                                }
                                className="h-8 text-[13px] mrpsl-input w-36"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setKycDocEntries((prev) =>
                                    prev.filter((e) => e.id !== entry.id),
                                  )
                                }
                                className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors p-1 rounded"
                                aria-label="Remove document"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="px-3 pb-3 pl-10">
                              {entry.status === "done" && entry.file ? (
                                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/50 p-2.5">
                                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                  <p className="text-[13px] font-medium text-green-900 truncate flex-1">
                                    {entry.file.name}
                                  </p>
                                  <p className="text-[11px] text-green-600/70 shrink-0">
                                    {(entry.file.size / 1024 / 1024).toFixed(2)}{" "}
                                    MB
                                  </p>
                                  <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] font-semibold text-green-700 hover:text-green-900 transition-colors px-1.5 py-0.5 rounded hover:bg-green-100 shrink-0"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Preview
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateKycDocEntry(entry.id, {
                                        file: null,
                                        url: "",
                                        status: "idle",
                                        errorMsg: undefined,
                                      })
                                    }
                                    className="text-green-400 hover:text-destructive transition-colors p-0.5 rounded shrink-0"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : entry.status === "uploading" ? (
                                <div className="flex items-center gap-2.5 px-3 py-2 border border-primary/20 bg-primary/5 rounded-lg">
                                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                                  <p className="text-[12px] text-primary truncate">
                                    Uploading {entry.file?.name}…
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <input
                                    id={`doc-upload-${entry.id}`}
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png,image/jpg"
                                    className="sr-only"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleKycDocFile(entry.id, f);
                                      e.target.value = "";
                                    }}
                                  />
                                  <label
                                    htmlFor={`doc-upload-${entry.id}`}
                                    className={cn(
                                      "flex items-center gap-3 border-2 border-dashed rounded-lg px-4 py-2.5 cursor-pointer transition-colors group",
                                      entry.status === "error"
                                        ? "border-destructive/40 bg-destructive/5"
                                        : "border-border/60 hover:border-primary/50 hover:bg-primary/5",
                                    )}
                                  >
                                    <Upload
                                      className={cn(
                                        "h-4 w-4 shrink-0",
                                        entry.status === "error"
                                          ? "text-destructive"
                                          : "text-muted-foreground group-hover:text-primary",
                                      )}
                                    />
                                    <div>
                                      <p
                                        className={cn(
                                          "text-[12px] font-medium",
                                          entry.status === "error"
                                            ? "text-destructive"
                                            : "text-muted-foreground group-hover:text-primary",
                                        )}
                                      >
                                        {entry.status === "error"
                                          ? entry.errorMsg
                                          : "Click or drag to upload file"}
                                      </p>
                                      {entry.status !== "error" && (
                                        <p className="text-[10px] text-muted-foreground/50">
                                          PDF, JPG, PNG · Max 10 MB
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setKycDocEntries((prev) => [
                            ...prev,
                            newKycDocEntry(),
                          ])
                        }
                        className="w-full border-dashed text-muted-foreground hover:text-foreground h-8 text-[12px]"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add another document
                      </Button>

                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={handleSubmitKycDocs}
                          disabled={
                            uploadKycDocsMutation.isPending ||
                            !kycDocEntries.some((e) => e.status === "done")
                          }
                        >
                          {uploadKycDocsMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Submit Documents for Review
                        </Button>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="review">
                    {/* Uploaded Documents Review */}
                    <Card className="mrpsl-card p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          Uploaded Documents
                        </h3>
                      </div>

                      {isLoadingKycDocs ? (
                        <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading documents…
                        </div>
                      ) : uploadedDocs.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          No documents uploaded for this holder yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {uploadedDocs.map((doc) => {
                            const isPending =
                              !doc.status ||
                              doc.status.toUpperCase() === "PENDING" ||
                              doc.status.toUpperCase() === "UPLOADED";
                            const isVerified =
                              doc.status?.toUpperCase() === "VERIFIED" ||
                              doc.status?.toUpperCase() === "APPROVED";
                            const isRejected =
                              doc.status?.toUpperCase() === "REJECTED";
                            const isApproving =
                              verifyDocMutation.isPending &&
                              verifyDocMutation.variables?.id === doc.id;
                            const isRejecting =
                              rejectDocMutation.isPending &&
                              rejectDocMutation.variables?.id === doc.id;
                            const isActing = isApproving || isRejecting;

                            return (
                              <div
                                key={doc.id}
                                className={cn(
                                  "rounded-xl border p-3.5 flex items-center gap-4",
                                  isVerified &&
                                    "border-green-200 bg-green-50/40",
                                  isRejected && "border-red-200 bg-red-50/40",
                                  isPending &&
                                    "border-amber-200 bg-amber-50/30",
                                )}
                              >
                                {/* Document info */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-[13px] font-semibold truncate">
                                      {doc.documentName || doc.documentType}
                                    </p>
                                    <span
                                      className={cn(
                                        "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                        isVerified &&
                                          "bg-green-100 text-green-700",
                                        isRejected && "bg-red-100 text-red-700",
                                        isPending &&
                                          "bg-amber-100 text-amber-700",
                                      )}
                                    >
                                      {doc.status || "Pending"}
                                    </span>
                                  </div>
                                  <div className="flex gap-3 flex-wrap text-[11px] text-muted-foreground">
                                    <span>
                                      Type:{" "}
                                      <span className="font-medium text-foreground">
                                        {doc.documentType}
                                      </span>
                                    </span>
                                    {doc.documentRef && (
                                      <span>
                                        Ref:{" "}
                                        <span className="font-mono text-foreground">
                                          {doc.documentRef}
                                        </span>
                                      </span>
                                    )}
                                    <span>
                                      Uploaded:{" "}
                                      <span className="text-foreground">
                                        {doc.uploadedAt}
                                      </span>
                                    </span>
                                    {isVerified && doc.verifiedBy && (
                                      <span>
                                        Verified by:{" "}
                                        <span className="text-foreground">
                                          {doc.verifiedBy}
                                        </span>
                                      </span>
                                    )}
                                    {isRejected && doc.verifiedBy && (
                                      <span>
                                        Rejected by:{" "}
                                        <span className="text-foreground">
                                          {doc.verifiedBy}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="shrink-0 flex items-center gap-2">
                                  <a
                                    href={doc.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-primary/5"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Preview
                                  </a>
                                  {isPending && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[12px] border-primary text-primary hover:bg-primary/3"
                                        disabled={isActing}
                                        onClick={() =>
                                          verifyDocMutation.mutate(
                                            {
                                              id: doc.id,
                                              actionBy:
                                                currentUser?.email ?? "",
                                            },
                                            {
                                              onSuccess: () => {
                                                toast.success(
                                                  "Document approved",
                                                );
                                                refetchKycDocs();
                                              },
                                              onError: (err: Error) =>
                                                toast.error(
                                                  err.message ||
                                                    "Failed to approve document",
                                                ),
                                            },
                                          )
                                        }
                                      >
                                        {isApproving ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          "Approve"
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[12px] border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        disabled={isActing}
                                        onClick={() =>
                                          rejectDocMutation.mutate(
                                            {
                                              id: doc.id,
                                              actionBy:
                                                currentUser?.email ?? "",
                                            },
                                            {
                                              onSuccess: () => {
                                                toast.success(
                                                  "Document rejected",
                                                );
                                                refetchKycDocs();
                                              },
                                              onError: (err: Error) =>
                                                toast.error(
                                                  err.message ||
                                                    "Failed to reject document",
                                                ),
                                            },
                                          )
                                        }
                                      >
                                        {isRejecting ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          "Reject"
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* ── Pending Changes ── */}
              <TabsContent value="pending" className="space-y-4">
                <PendingKYC
                  tab="pending"
                  setTab={setInnerTab}
                  selectedShareholder={selectedShareholder}
                />
              </TabsContent>

              {/* ── Audit History ── */}
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
      {mode === "bulk" && <KYCBulkUpload registerId={selectedRegister} />}
    </div>
  );
}

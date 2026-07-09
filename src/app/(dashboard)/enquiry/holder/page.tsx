"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { useReactToPrint } from "react-to-print";
import {
  FileText,
  DollarSign,
  PenLine,
  FolderOpen,
  Printer,
  Download,
  Loader2,
  X,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ShareholderSearchInput } from "@/components/custom/shareholder-search-input";
import { TablePagination } from "@/components/custom/table-pagination";
import { useServerPagination } from "@/lib/use-server-pagination";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  getHolderProfile,
  getHolderCertificate,
  getHolderDividends,
  getHolderKycChanges,
  getHolderMergers,
  getHolderTransfers,
  getHolderAdmonRecords,
  getHolderKycDocuments,
  getHolderSignature,
  getHolderStatement,
  getDividendStatement,
} from "@/actions/enquiryActions";
import type {
  Shareholder,
  Certificate,
  HolderStatement,
  DividendStatement,
} from "@/types/enquiry";

function InlineDatePicker({
  date,
  onSelect,
}: {
  date: Date | undefined;
  onSelect: (d: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        className="w-full mrpsl-input justify-start text-left font-normal"
        onClick={() => setOpen((v) => !v)}
      >
        {date ? (
          format(date, "PPP")
        ) : (
          <span className="text-muted-foreground">Pick a date</span>
        )}
        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
      </Button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 rounded-lg bg-popover shadow-md ring-1 ring-foreground/10">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              onSelect(d);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function HolderEnquiryPage() {
  const searchParams = useSearchParams();
  const [scope, setScope] = useState<"all" | "single">("all");
  const [selectedRegisterSymbol, setSelectedRegisterSymbol] = useState("");
  const [holderId, setHolderId] = useState<string | null>(null);

  const { data: registersData, isLoading: isRegisterLoading } = useGetRegisters(
    { size: 100 },
  );
  const activeRegisters =
    registersData?.content?.filter((r) => r.status === "ACTIVE") ?? [];

  // Fetch the selected holder's profile from the endpoint
  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["holderProfile", holderId],
    queryFn: () => getHolderProfile(holderId as string),
    enabled: !!holderId,
  });
  const holder = profileData?.data ?? null;

  // ── Per-tab server pagination ──
  const certPg = useServerPagination();
  const divPg = useServerPagination();
  const chgPg = useServerPagination();

  // Certificate tab
  const { data: certData, isLoading: isCertLoading } = useQuery({
    queryKey: ["holderCertificates", holderId, certPg.page, certPg.pageSize],
    queryFn: () =>
      getHolderCertificate(holderId as string, {
        page: certPg.page,
        size: certPg.pageSize,
      }),
    enabled: !!holderId,
  });
  const certificates = [...(certData?.content ?? [])].sort((a, b) => {
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
    return 0;
  });

  // Dividend tab
  const { data: divData, isLoading: isDivLoading } = useQuery({
    queryKey: ["holderDividends", holderId, divPg.page, divPg.pageSize],
    queryFn: () =>
      getHolderDividends(holderId as string, {
        page: divPg.page,
        size: divPg.pageSize,
      }),
    enabled: !!holderId,
  });
  const dividends = divData?.content ?? [];

  // Changes (KYC) tab
  const { data: chgData, isLoading: isChgLoading } = useQuery({
    queryKey: ["holderKycChanges", holderId, chgPg.page, chgPg.pageSize],
    queryFn: () =>
      getHolderKycChanges(holderId as string, {
        page: chgPg.page,
        size: chgPg.pageSize,
      }),
    enabled: !!holderId,
  });
  const kycChanges = chgData?.content ?? [];

  // Merger tab
  const mergPg = useServerPagination();
  const { data: mergData, isLoading: isMergLoading } = useQuery({
    queryKey: ["holderMergers", holderId, mergPg.page, mergPg.pageSize],
    queryFn: () =>
      getHolderMergers(holderId as string, {
        page: mergPg.page,
        size: mergPg.pageSize,
      }),
    enabled: !!holderId,
  });
  const mergers = mergData?.content ?? [];

  // Transfer tab
  const trnPg = useServerPagination();
  const { data: trnData, isLoading: isTrnLoading } = useQuery({
    queryKey: ["holderTransfers", holderId, trnPg.page, trnPg.pageSize],
    queryFn: () =>
      getHolderTransfers(holderId as string, {
        page: trnPg.page,
        size: trnPg.pageSize,
      }),
    enabled: !!holderId,
  });
  const transfers = trnData?.content ?? [];

  // ADMOR tab
  const admPg = useServerPagination();
  const { data: admData, isLoading: isAdmLoading } = useQuery({
    queryKey: ["holderAdmon", holderId, admPg.page, admPg.pageSize],
    queryFn: () =>
      getHolderAdmonRecords(holderId as string, {
        page: admPg.page,
        size: admPg.pageSize,
      }),
    enabled: !!holderId,
  });
  const admonRecords = admData?.content ?? [];

  // Statement of Account filters
  const [stmtFrom, setStmtFrom] = useState<Date | undefined>(undefined);
  const [stmtTo, setStmtTo] = useState<Date | undefined>(undefined);
  const { data: stmtData, isLoading: isLoadingStmt } = useQuery({
    queryKey: ["holderStatement", holderId, stmtFrom, stmtTo],
    queryFn: () =>
      getHolderStatement(holderId!, {
        ...(stmtFrom && { dateFrom: format(stmtFrom, "yyyy-MM-dd") }),
        ...(stmtTo && { dateTo: format(stmtTo, "yyyy-MM-dd") }),
      }),
    enabled: !!holderId,
  });
  const statement: HolderStatement | null = stmtData?.data ?? null;

  // Dividend Statement filters
  const [divFrom, setDivFrom] = useState<Date | undefined>(undefined);
  const [divTo, setDivTo] = useState<Date | undefined>(undefined);
  const { data: divStmtData, isLoading: isLoadingDivStmt } = useQuery({
    queryKey: ["dividendStatement", holderId, divFrom, divTo],
    queryFn: () =>
      getDividendStatement(holderId!, {
        ...(divFrom && { dateFrom: format(divFrom, "yyyy-MM-dd") }),
        ...(divTo && { dateTo: format(divTo, "yyyy-MM-dd") }),
      }),
    enabled: !!holderId,
  });
  const dividendStatement: DividendStatement | null = divStmtData?.data ?? null;

  // Signature & KYC documents
  const { data: sigData, isLoading: isLoadingSig } = useQuery({
    queryKey: ["holderSignature", holder?.chn, holder?.registerSymbol],
    queryFn: () => getHolderSignature(holder!.chn, holder!.registerSymbol),
    enabled: !!holder?.chn && !!holder?.registerSymbol,
  });
  const sigOnFile = sigData?.data ?? null;

  const { data: kycDocsData, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["holderKycDocs", holder?.chn, holder?.registerSymbol],
    queryFn: () => getHolderKycDocuments(holder!.chn, holder!.registerSymbol),
    enabled: !!holder?.chn && !!holder?.registerSymbol,
  });
  const kycDocs: {
    id: string;
    documentName: string;
    documentType: string;
    documentRef: string;
    documentUrl: string;
    uploadedAt: string;
    status: string;
  }[] = kycDocsData?.data ?? [];

  type HolderModal =
    | "statement"
    | "dividend"
    | "signature"
    | "documents"
    | "print"
    | null;
  const [activeModal, setActiveModal] = useState<HolderModal>(null);
  const [innerDetailTab, setInnerDetailTab] = useState("cert");
  // Certificate selected for the print/view modal
  const [printCert, setPrintCert] = useState<Certificate | null>(null);
  const [certViewOnly, setCertViewOnly] = useState(false);
  const certPrintRef = useRef<HTMLDivElement>(null);

  function openPrintModal(cert: Certificate | null, viewOnly = false) {
    setPrintCert(cert);
    setCertViewOnly(viewOnly);
    setActiveModal("print");
  }

  function downloadCertificateExcel(cert: Certificate) {
    const rows = [
      {
        "Certificate No": cert.certificateNo,
        "Account No": cert.accountNo,
        "Holder Name":
          cert.holderName ?? `${holder?.lastName}, ${holder?.firstName}`,
        "Register ID": cert.registerId,
        "Register Symbol": cert.registerSymbol,
        "Date Issued": cert.dateIssued,
        Units: cert.units,
        Status: cert.status,
        "Transfer No": cert.transferNo ?? "",
        "Stockbroker Code": cert.stockbrokerCode ?? "",
        Notes: cert.notes ?? "",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certificate");
    XLSX.writeFile(wb, `${cert.certificateNo}.xlsx`);
  }

  const handlePrintCertificate = useReactToPrint({
    contentRef: certPrintRef,
    documentTitle: printCert?.certificateNo
      ? `Certificate ${printCert.certificateNo}`
      : "Share Certificate",
    onAfterPrint: () => setActiveModal(null),
  });

  // Pre-select holder when navigated from another page with ?id=
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHolderId(id);
  }, [searchParams]);

  function handleSelect(s: Shareholder) {
    setHolderId(s.id);
  }

  function handleClear() {
    setHolderId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holder Enquiry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive view of shareholder profiles, holdings, and
            transaction history
          </p>
        </div>
      </div>

      <Card className="mrpsl-card p-5">
        {/* Scope selector */}
        <div className="flex items-center gap-6">
          <RadioGroup
            value={scope}
            onValueChange={(v) => {
              setScope(v as "all" | "single");
              setSelectedRegisterSymbol("");
            }}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="all" id="scope-all" />
              <label htmlFor="scope-all" className="text-sm cursor-pointer">
                Across All Registers
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="single" id="scope-single" />
              <label htmlFor="scope-single" className="text-sm cursor-pointer">
                Single Register
              </label>
            </div>
          </RadioGroup>

          {scope === "single" && (
            <Select
              value={selectedRegisterSymbol || "none"}
              onValueChange={(v) => {
                setSelectedRegisterSymbol(v && v !== "none" ? v : "");
              }}
            >
              <SelectTrigger className="w-72 mrpsl-input">
                <SelectValue placeholder="Select a register…" />
              </SelectTrigger>
              <SelectContent className="min-w-120">
                {isRegisterLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <>
                    <SelectItem value="none">— Select a register —</SelectItem>
                    {activeRegisters.map((r) => (
                      <SelectItem key={r.registerId} value={r.symbol}>
                        <span className="font-mono font-semibold">
                          {r.symbol}
                        </span>
                        <span className="text-muted-foreground ml-2 text-[12px]">
                          {r.registerName}
                        </span>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* Search input sits outside Card so the suggestion dropdown isn't clipped */}
      <ShareholderSearchInput
        registerSymbol={
          scope === "single" && selectedRegisterSymbol
            ? selectedRegisterSymbol
            : undefined
        }
        className="w-full"
        placeholder="Type a surname, account no or CHN to search…"
        onSelect={handleSelect}
      />

      {holderId && isProfileLoading && (
        <Card className="mrpsl-card mt-4 flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading holder profile…
          </span>
        </Card>
      )}

      {holderId && profileError && !isProfileLoading && (
        <Card className="mrpsl-card mt-4 py-12 text-center text-sm text-destructive">
          {profileError instanceof Error
            ? profileError.message
            : "Failed to load holder profile."}
        </Card>
      )}

      {holder && (
        <Card className="mrpsl-card mt-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-5 border-b flex items-start gap-4 bg-muted/5">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-xl font-mono">
                {holder.firstName?.[0]}
                {holder.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold">
                    {holder.lastName}, {holder.firstName}
                    {holder.otherNames ? ` ${holder.otherNames}` : ""}
                  </h2>
                  <span className="font-mono text-muted-foreground text-sm">
                    {holder.accountNumber}
                  </span>
                  <Badge variant="outline" className="text-[13px] font-mono">
                    {holder.registerSymbol ?? "—"}
                  </Badge>
                  <Badge
                    className={`border-0 text-[13px] ${holder.status === "ACTIVE" ? "bg-green-100 text-green-800" : holder.status === "CAUTIONED" ? "bg-amber-100 text-amber-800" : holder.status === "SUSPENDED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {holder.status
                      ? holder.status.charAt(0) +
                        holder.status.slice(1).toLowerCase()
                      : "—"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-mono">
                  CHN: {holder.chn}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-right">
                  <button
                    className="text-3xl font-bold tabular-nums tracking-tight text-primary hover:underline cursor-pointer"
                    title="View certificates"
                    onClick={() => setInnerDetailTab("cert")}
                  >
                    {holder.holdings?.toLocaleString() ?? "0"}
                  </button>
                  <div className="text-[13px] text-muted-foreground font-medium uppercase tracking-widest mt-1">
                    Units Held
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground mt-1"
                  onClick={handleClear}
                >
                  ✕
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-4 border-b bg-muted/20 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("statement")}
            >
              <FileText className="mr-2 h-4 w-4" /> View Statement of Account
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("dividend")}
            >
              <DollarSign className="mr-2 h-4 w-4" /> View Dividend Statement
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("signature")}
            >
              <PenLine className="mr-2 h-4 w-4" /> View Signature
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("documents")}
            >
              <FolderOpen className="mr-2 h-4 w-4" /> View Documents
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPrintModal(certificates[0] ?? null)}
            >
              <Printer className="mr-2 h-4 w-4" /> Print Certificate
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 p-6">
            <div className="space-y-4">
              <h3 className="mrpsl-section-title border-b pb-2">Personal</h3>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="font-mono">
                  {holder.personal?.dateOfBirth || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Gender:</span>
                <span>{holder.personal?.gender || "N/A"}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Nationality:</span>
                <span>{holder.personal?.nationality || "N/A"}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">State:</span>
                <span>{holder.personal?.state || "N/A"}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Holder Type:</span>
                <span>{holder.holderType || "N/A"}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">NIN:</span>
                <span className="font-mono">
                  {holder.personal?.nin
                    ? `***${holder.personal.nin.slice(-4)}`
                    : "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">SCUML:</span>
                <span className="font-mono text-muted-foreground">
                  {holder.personal?.scuml || "—"}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">TIN:</span>
                <span className="font-mono">
                  {holder.personal?.tin || "N/A"}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="mrpsl-section-title border-b pb-2">Contact</h3>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span>{holder.contact?.email || "N/A"}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-mono">
                  {holder.contact?.phone || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Alt Phone:</span>
                <span className="font-mono">
                  {holder.contact?.altPhone || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Address:</span>
                <span className="leading-relaxed">
                  {holder.contact?.address || "N/A"}
                  <br />
                  {holder.personal?.state}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="mrpsl-section-title border-b pb-2">Financial</h3>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Bank Name:</span>
                <span>{holder.financial?.bankName || "N/A"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Bank Account:</span>
                <span className="font-mono">
                  {holder.financial?.bankAccountNumber || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">BVN:</span>
                <span className="font-mono">
                  {holder.financial?.bvn
                    ? `${holder.financial.bvn.slice(0, 3)}***${holder.financial.bvn.slice(-4)}`
                    : "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Caution:</span>
                <span>{holder.financial?.cautionReason || "None"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">No Tax:</span>
                <span>{holder.financial?.noTax ? "Yes" : "No"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Unpaid Div:</span>
                <span className="font-mono font-bold text-red-600">
                  ₦{(holder.financial?.unpaidDividend ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <Tabs
            value={innerDetailTab}
            onValueChange={setInnerDetailTab}
            className="w-full border-t"
          >
            <TabsList className="w-full flex justify-start border-b rounded-none h-12 bg-muted/10 p-0 overflow-x-auto">
              <TabsTrigger
                value="cert"
                className="mrpsl-tabs-trigger text-[13px] px-4"
              >
                Certificate
              </TabsTrigger>
              <TabsTrigger
                value="div"
                className="mrpsl-tabs-trigger text-[13px] px-4"
              >
                Dividend
              </TabsTrigger>
              <TabsTrigger
                value="int"
                className="mrpsl-tabs-trigger text-[13px] px-4"
              >
                Interest
              </TabsTrigger>
              <TabsTrigger
                value="chg"
                className="mrpsl-tabs-trigger text-[13px] px-4"
              >
                Changes
              </TabsTrigger>
              <TabsTrigger
                value="merg"
                className="mrpsl-tabs-trigger text-[13px] px-4"
              >
                Merger
              </TabsTrigger>
              <TabsTrigger
                value="trn"
                className="mrpsl-tabs-trigger text-[13px] px-4"
              >
                Transfer
              </TabsTrigger>
              <TabsTrigger
                value="adm"
                className="mrpsl-tabs-trigger text-[13px] px-4"
              >
                ADMOR
              </TabsTrigger>
            </TabsList>

            <div className="p-0">
              <TabsContent value="cert" className="m-0">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header bg-muted/30">
                    <tr>
                      <th className="p-3">CERT NO</th>
                      <th className="p-3">DATE ISSUED</th>
                      <th className="p-3 text-right">UNITS</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono text-[13px]">
                    {isCertLoading ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <Loader2 className="h-4 w-4 animate-spin inline text-primary" />
                        </td>
                      </tr>
                    ) : certificates.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-12 text-center text-muted-foreground font-sans"
                        >
                          No certificates found.
                        </td>
                      </tr>
                    ) : (
                      certificates.map((cert) => (
                        <tr
                          key={cert.certificateNo}
                          className="hover:bg-accent/5"
                        >
                          <td className="p-3">{cert.certificateNo}</td>
                          <td className="p-3 text-muted-foreground font-sans">
                            {cert.dateIssued}
                          </td>
                          <td className="p-3 text-right font-bold">
                            {cert?.status === "TRANSFERRED" ? (
                              <>
                                <span className="flex flex-col">
                                  <span>
                                    {cert?.unitsTransferred?.toLocaleString()}
                                  </span>
                                  <small className="text-[9px] font-normal">
                                    {cert.units?.toLocaleString()}
                                  </small>
                                </span>
                              </>
                            ) : (
                              cert.units?.toLocaleString()
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`${cert?.status?.toLocaleLowerCase() === "active" ? "text-green-700 bg-green-50 border-0" : "text-gray-700 bg-gray-50 border-gray-200 border"} text-[13px]`}
                            >
                              {cert.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                title="View certificate"
                                className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                onClick={() => openPrintModal(cert, true)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Download Excel"
                                className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                onClick={() => downloadCertificateExcel(cert)}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Print certificate"
                                className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                onClick={() => openPrintModal(cert)}
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t">
                  <TablePagination {...certPg.tableProps(certData)} />
                </div>
              </TabsContent>
              <TabsContent value="div" className="m-0">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header bg-muted/30">
                    <tr>
                      <th className="p-3">DIVIDEND NO</th>
                      <th className="p-3">DECLARATION DATE</th>
                      <th className="p-3">PAYMENT DATE</th>
                      <th className="p-3">RATE (₦/UNIT)</th>
                      <th className="p-3">GROSS (₦)</th>
                      <th className="p-3">NET (₦)</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">METHOD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {isDivLoading ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center">
                          <Loader2 className="h-4 w-4 animate-spin inline text-primary" />
                        </td>
                      </tr>
                    ) : dividends.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-12 text-center text-muted-foreground"
                        >
                          No dividend records found.
                        </td>
                      </tr>
                    ) : (
                      dividends.map((r, i) => (
                        <tr
                          key={r.dividendNo || i}
                          className="hover:bg-accent/5"
                        >
                          <td className="p-3 font-mono">{r.dividendNo}</td>
                          <td className="p-3 text-muted-foreground">
                            {r.declDate}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {r.paymentDate || "—"}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {(r.rate ?? 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {(r.gross ?? 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold">
                            {(r.net ?? 0).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`border-0 text-[13px] ${r.status === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="p-3">{r.method || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t">
                  <TablePagination {...divPg.tableProps(divData)} />
                </div>
              </TabsContent>

              <TabsContent
                value="int"
                className="m-0 p-12 text-center text-muted-foreground"
              >
                No interest records (Equity register).
              </TabsContent>
              <TabsContent value="chg" className="m-0">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header bg-muted/30">
                    <tr>
                      <th className="p-3">FIELD</th>
                      <th className="p-3">OLD VALUE</th>
                      <th className="p-3">NEW VALUE</th>
                      <th className="p-3">CHANGED BY</th>
                      <th className="p-3">ROLE</th>
                      <th className="p-3">APPROVED BY</th>
                      <th className="p-3">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {isChgLoading ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <Loader2 className="h-4 w-4 animate-spin inline text-primary" />
                        </td>
                      </tr>
                    ) : kycChanges.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-12 text-center text-muted-foreground"
                        >
                          No KYC changes recorded.
                        </td>
                      </tr>
                    ) : (
                      kycChanges.map((c, i) => (
                        <tr key={i} className="hover:bg-accent/5">
                          <td className="p-3 font-medium">{c.field}</td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {c.oldValue || "—"}
                          </td>
                          <td className="p-3 font-mono">{c.newValue || "—"}</td>
                          <td className="p-3">{c.changedBy || "—"}</td>
                          <td className="p-3 text-muted-foreground">
                            {c.changedByRole || "—"}
                          </td>
                          <td className="p-3">{c.approvedBy || "—"}</td>
                          <td className="p-3 text-muted-foreground">
                            {c.changedAt
                              ? new Date(c.changedAt).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t">
                  <TablePagination {...chgPg.tableProps(chgData)} />
                </div>
              </TabsContent>

              <TabsContent value="merg" className="m-0">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header bg-muted/30">
                    <tr>
                      <th className="p-3">DATE</th>
                      <th className="p-3">TYPE</th>
                      <th className="p-3">SOURCE ACCOUNTS</th>
                      <th className="p-3">DESTINATION</th>
                      <th className="p-3 text-right">HOLDINGS MERGED</th>
                      <th className="p-3">INITIATED BY</th>
                      <th className="p-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {isMergLoading ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <Loader2 className="h-4 w-4 animate-spin inline text-primary" />
                        </td>
                      </tr>
                    ) : mergers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-12 text-center text-muted-foreground"
                        >
                          No merger records found.
                        </td>
                      </tr>
                    ) : (
                      mergers.map((r, i) => (
                        <tr key={i} className="hover:bg-accent/5">
                          <td className="p-3 text-muted-foreground">
                            {r.date}
                          </td>
                          <td className="p-3 font-medium">{r.type}</td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {r.sourceAccounts?.join(", ") || "—"}
                          </td>
                          <td className="p-3 font-mono">
                            {r.destinationAccount}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold">
                            {(r.holdingsMerged ?? 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {r.initiatedBy}
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`border-0 text-[13px] ${r.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                            >
                              {r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t">
                  <TablePagination {...mergPg.tableProps(mergData)} />
                </div>
              </TabsContent>

              <TabsContent value="trn" className="m-0">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header bg-muted/30">
                    <tr>
                      <th className="p-3">DATE</th>
                      <th className="p-3">TRANSFER NO</th>
                      <th className="p-3">FROM ACCOUNT</th>
                      <th className="p-3">TO ACCOUNT</th>
                      <th className="p-3">UNITS</th>
                      <th className="p-3">TYPE</th>
                      <th className="p-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {isTrnLoading ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <Loader2 className="h-4 w-4 animate-spin inline text-primary" />
                        </td>
                      </tr>
                    ) : transfers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-12 text-center text-muted-foreground"
                        >
                          No transfer records found.
                        </td>
                      </tr>
                    ) : (
                      transfers.map((r, i) => (
                        <tr
                          key={r.transferNo || i}
                          className="hover:bg-accent/5"
                        >
                          <td className="p-3 text-muted-foreground">
                            {r.date}
                          </td>
                          <td className="p-3 font-mono">{r.transferNo}</td>
                          <td className="p-3 font-mono">{r.fromAccount}</td>
                          <td className="p-3 font-mono">{r.toAccount}</td>
                          <td className="p-3 text-right font-mono font-semibold">
                            {(r.units ?? 0).toLocaleString()}
                          </td>
                          <td className="p-3">{r.type}</td>
                          <td className="p-3">
                            <Badge
                              className={`border-0 text-[13px] ${r.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                            >
                              {r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t">
                  <TablePagination {...trnPg.tableProps(trnData)} />
                </div>
              </TabsContent>

              <TabsContent value="adm" className="m-0">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header bg-muted/30">
                    <tr>
                      <th className="p-3">TYPE</th>
                      <th className="p-3">REFERENCE</th>
                      <th className="p-3">DECEASED NAME</th>
                      <th className="p-3">DATE OF DEATH</th>
                      <th className="p-3">ESTATE ADMINISTRATOR</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">INITIATED AT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {isAdmLoading ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <Loader2 className="h-4 w-4 animate-spin inline text-primary" />
                        </td>
                      </tr>
                    ) : admonRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-12 text-center text-muted-foreground"
                        >
                          No administration records found.
                        </td>
                      </tr>
                    ) : (
                      admonRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-accent/5">
                          <td className="p-3 font-medium">{r.type}</td>
                          <td className="p-3 font-mono">{r.reference}</td>
                          <td className="p-3">{r.deceasedName}</td>
                          <td className="p-3 text-muted-foreground">
                            {r.dateOfDeath || "—"}
                          </td>
                          <td className="p-3">
                            {r.estateAdministrator || "—"}
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`border-0 text-[13px] ${r.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {r.initiatedAt
                              ? new Date(r.initiatedAt).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t">
                  <TablePagination {...admPg.tableProps(admData)} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      )}

      {/* ── Statement of Account Modal ── */}
      <Dialog
        open={activeModal === "statement"}
        onOpenChange={(o) => !o && setActiveModal(null)}
      >
        <DialogContent className="max-w-2xl flex flex-col h-[85vh] p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>
              Statement of Account — {holder?.accountNumber}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {holder?.lastName}, {holder?.firstName} · {holder?.registerSymbol}
            </p>
          </DialogHeader>
          {/* Date filters */}
          <div className="px-6 py-4 border-b bg-muted/10 flex items-end gap-4 shrink-0">
            <div className="flex-1 space-y-2">
              <label className="mrpsl-label">From</label>
              <InlineDatePicker date={stmtFrom} onSelect={setStmtFrom} />
            </div>
            <div className="flex-1 space-y-2">
              <label className="mrpsl-label">To</label>
              <InlineDatePicker date={stmtTo} onSelect={setStmtTo} />
            </div>
            {(stmtFrom || stmtTo) && (
              <Button
                variant="ghost"
                size="xl"
                className="text-muted-foreground shrink-0"
                onClick={() => {
                  setStmtFrom(undefined);
                  setStmtTo(undefined);
                }}
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {isLoadingStmt ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading statement…
              </div>
            ) : !statement ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <FileText className="h-8 w-8 text-muted-foreground/30" />
                No transactions found for the selected period
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b bg-muted/10">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                      Current Holdings
                    </div>
                    <div className="text-2xl font-mono font-bold">
                      {statement.currentHoldings.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                      Opening Balance
                    </div>
                    <div className="text-2xl font-mono font-bold">
                      {statement.openingBalance.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                      Net Movement
                    </div>
                    <div
                      className={`text-2xl font-mono font-bold ${statement.netMovement >= 0 ? "text-green-700" : "text-red-600"}`}
                    >
                      {statement.netMovement >= 0 ? "+" : ""}
                      {statement.netMovement.toLocaleString()}
                    </div>
                  </div>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="mrpsl-table-header sticky top-0">
                    <tr>
                      <th className="px-4 py-3">DATE</th>
                      <th className="px-4 py-3">TRANSACTION</th>
                      <th className="px-4 py-3">REFERENCE</th>
                      <th className="px-4 py-3 text-right">DEBIT</th>
                      <th className="px-4 py-3 text-right">CREDIT</th>
                      <th className="px-4 py-3 text-right">BALANCE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {statement.transactions?.length !== 0 ? (
                      statement.transactions.map((r, i) => (
                        <tr key={i} className="hover:bg-accent/5">
                          <td className="px-4 py-3 text-muted-foreground">
                            {r.date}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {r.description}
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground text-[12px]">
                            {r.reference}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {r.debit > 0 ? r.debit.toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-green-700">
                            {r.credit > 0 ? r.credit.toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold">
                            {r.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>
                          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <FileText className="h-7 w-7 text-muted-foreground/30" />
                            No transactions found for this period
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
          <div className="px-6 py-4 border-t flex justify-between items-center shrink-0">
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={!statement}
              onClick={() => toast.success("Statement downloaded as PDF")}
            >
              <FileText className="h-4 w-4" /> Download PDF
            </Button>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dividend Statement Modal ── */}
      <Dialog
        open={activeModal === "dividend"}
        onOpenChange={(o) => !o && setActiveModal(null)}
      >
        <DialogContent className="max-w-3xl flex flex-col h-[85vh] p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>
              Dividend Statement — {holder?.accountNumber}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {holder?.lastName}, {holder?.firstName} · {holder?.registerSymbol}
            </p>
          </DialogHeader>
          {/* Date filters */}
          <div className="px-6 py-4 border-b bg-muted/10 flex items-end gap-4 shrink-0">
            <div className="flex-1 space-y-2">
              <label className="mrpsl-label">From</label>
              <InlineDatePicker date={divFrom} onSelect={setDivFrom} />
            </div>
            <div className="flex-1 space-y-2">
              <label className="mrpsl-label">To</label>
              <InlineDatePicker date={divTo} onSelect={setDivTo} />
            </div>
            {(divFrom || divTo) && (
              <Button
                variant="ghost"
                size="xl"
                className="text-muted-foreground shrink-0"
                onClick={() => {
                  setDivFrom(undefined);
                  setDivTo(undefined);
                }}
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="overflow-auto flex-1 min-h-0">
            {isLoadingDivStmt ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading statement…
              </div>
            ) : !dividendStatement ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <DollarSign className="h-8 w-8 text-muted-foreground/30" />
                No dividends found for the selected period
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b bg-muted/10">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                      Total Gross (₦)
                    </div>
                    <div className="text-2xl font-mono font-bold">
                      {dividendStatement.totalGross.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                      Total Net (₦)
                    </div>
                    <div className="text-2xl font-mono font-bold text-primary">
                      {dividendStatement.totalNet.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                      Unpaid Amount (₦)
                    </div>
                    <div className="text-2xl font-mono font-bold text-red-600">
                      {dividendStatement.unpaidAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
                <table className="min-w-full text-sm text-left">
                  <thead className="mrpsl-table-header sticky top-0">
                    <tr className="bg-white">
                      <th className="px-4 py-3 whitespace-nowrap">
                        DIVIDEND NO
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap">
                        DECL. DATE
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap">
                        PAYMENT DATE
                      </th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">
                        RATE (₦)
                      </th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">
                        GROSS (₦)
                      </th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">
                        TAX (₦)
                      </th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">
                        NET (₦)
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap">STATUS</th>
                      <th className="px-4 py-3 whitespace-nowrap">METHOD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {dividendStatement.dividends.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <DollarSign className="h-7 w-7 text-muted-foreground/30" />
                            No dividends found for this period
                          </div>
                        </td>
                      </tr>
                    ) : dividendStatement.dividends.map((r, i) => (
                      <tr key={i} className="hover:bg-accent/5">
                        <td className="px-4 py-3 font-mono whitespace-nowrap">
                          {r.dividendNo}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {r.declDate}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {r.paymentDate ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {r.rate.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                          {r.gross.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-red-600 whitespace-nowrap">
                          {r.wht.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold whitespace-nowrap">
                          {r.net.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`border-0 text-[12px] ${r.status === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.method ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
          <div className="px-6 py-4 border-t flex justify-between shrink-0">
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={!dividendStatement}
              onClick={() => toast.success("Dividend statement downloaded")}
            >
              <DollarSign className="h-4 w-4" /> Download Statement
            </Button>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Signature Modal ── */}
      <Dialog
        open={activeModal === "signature"}
        onOpenChange={(o) => !o && setActiveModal(null)}
      >
        <DialogContent className="max-w-sm flex flex-col p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>Signature on File</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {holder?.lastName}, {holder?.firstName}
            </p>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {isLoadingSig ? (
              <div className="flex items-center justify-center gap-2 h-40 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading signature…
              </div>
            ) : sigOnFile?.signatureUrl ? (
              <>
                <div className="rounded-xl border bg-muted/10 flex items-center justify-center p-4 min-h-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sigOnFile.signatureUrl}
                    alt="Holder signature"
                    className="max-h-36 max-w-full object-contain"
                  />
                </div>
                <div className="text-[12px] text-muted-foreground space-y-1">
                  {sigOnFile.capturedAt && (
                    <div className="flex justify-between">
                      <span>Captured:</span>
                      <span className="font-mono">{sigOnFile.capturedAt}</span>
                    </div>
                  )}
                  {sigOnFile.lastUpdatedAt && (
                    <div className="flex justify-between">
                      <span>Last updated:</span>
                      <span className="font-mono">
                        {sigOnFile.lastUpdatedAt}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 h-40 text-sm text-muted-foreground">
                <PenLine className="h-8 w-8 text-muted-foreground/30" />
                No signature on file
              </div>
            )}
          </div>
          <div className="px-6 pb-5 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Signature printed")}
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveModal(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Documents Modal ── */}
      <Dialog
        open={activeModal === "documents"}
        onOpenChange={(o) => !o && setActiveModal(null)}
      >
        <DialogContent className="max-w-lg flex flex-col max-h-[80vh] p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>KYC Documents</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {holder?.lastName}, {holder?.firstName} · {holder?.accountNumber}
            </p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 divide-y">
            {isLoadingDocs ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading documents…
              </div>
            ) : kycDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <FolderOpen className="h-8 w-8 text-muted-foreground/30" />
                No KYC documents on file
              </div>
            ) : (
              kycDocs.map((doc) => {
                const isVerified =
                  doc.status?.toUpperCase() === "VERIFIED" ||
                  doc.status?.toUpperCase() === "APPROVED";
                return (
                  <div
                    key={doc.id}
                    className="px-6 py-4 flex items-center gap-4"
                  >
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {doc.documentName || doc.documentType}
                      </div>
                      <div className="text-[12px] text-muted-foreground font-mono">
                        {doc.documentRef && `${doc.documentRef} · `}Uploaded{" "}
                        {doc.uploadedAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={`text-[11px] border-0 ${isVerified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                      >
                        {isVerified ? "Verified" : doc.status || "Pending"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[12px]"
                        onClick={() => window.open(doc.documentUrl, "_blank")}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-6 py-4 border-t flex justify-end shrink-0">
            <Button variant="ghost" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Print Certificate Modal ── */}
      <Dialog
        open={activeModal === "print"}
        onOpenChange={(o) => !o && setActiveModal(null)}
      >
        <DialogContent className="max-w-md flex flex-col p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>
              {certViewOnly ? "View Certificate" : "Print Share Certificate"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {holder?.accountNumber} — {holder?.lastName}, {holder?.firstName}
            </p>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div ref={certPrintRef} className="space-y-3 print:p-8">
              <div className="hidden print:block text-center mb-4">
                <h2 className="text-lg font-bold">Share Certificate</h2>
                <p className="text-sm text-muted-foreground">
                  {holder?.registerSymbol}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/10 p-4 space-y-3 text-sm">
                {[
                  {
                    label: "Certificate No",
                    value: printCert?.certificateNo ?? "—",
                  },
                  {
                    label: "Register",
                    value:
                      printCert?.registerSymbol ??
                      holder?.registerSymbol ??
                      "—",
                  },
                  {
                    label: "Holder",
                    value:
                      printCert?.holderName ??
                      `${holder?.lastName}, ${holder?.firstName}`,
                  },
                  {
                    label: "Units",
                    value: (
                      printCert?.units ??
                      holder?.holdings ??
                      0
                    ).toLocaleString(),
                  },
                  {
                    label: "Date Issued",
                    value: printCert?.dateIssued ?? "—",
                  },
                  { label: "Status", value: printCert?.status ?? "—" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center border-b border-border/40 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            {!certViewOnly && (
              <p className="text-[13px] text-muted-foreground print:hidden">
                This will send a print job to the registry printer. Ensure the
                certificate stock is loaded before confirming.
              </p>
            )}
          </div>
          <div className="px-6 pb-6 flex gap-3 shrink-0">
            <Button
              variant="outline"
              className={certViewOnly ? "w-full" : "flex-1"}
              onClick={() => setActiveModal(null)}
            >
              Close
            </Button>
            {!certViewOnly && (
              <Button
                className="flex-1 gap-1.5"
                disabled={!printCert}
                onClick={() => handlePrintCertificate()}
              >
                <Printer className="h-4 w-4" /> Confirm &amp; Print
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  DollarSign,
  PenLine,
  FolderOpen,
  Printer,
  Download,
} from "lucide-react";
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
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { ShareholderSearchInput } from "@/components/custom/shareholder-search-input";
import type { Shareholder } from "@/lib/types";

export default function HolderEnquiryPage() {
  const { registers, shareholders } = useStore();
  const searchParams = useSearchParams();
  const [scope, setScope] = useState<"all" | "single">("all");
  const [selectedRegisterId, setSelectedRegisterId] = useState("");
  const [selectedHolder, setSelectedHolder] = useState<Shareholder | null>(
    null,
  );

  const activeRegisters = registers.filter((r) => r.status === "ACTIVE");

  type HolderModal =
    | "statement"
    | "dividend"
    | "signature"
    | "documents"
    | "print"
    | null;
  const [activeModal, setActiveModal] = useState<HolderModal>(null);
  const [innerDetailTab, setInnerDetailTab] = useState("cert");

  // Pre-select shareholder when navigated from another page with ?id=
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    const found = shareholders.find((s) => s.id === id);
    if (found) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedHolder(found);
      // Scope the register selector to match
      setScope("single");
      setSelectedRegisterId(found.registerId);
    }
  }, [searchParams, shareholders]);

  function handleSelect(s: Shareholder) {
    setSelectedHolder(s);
  }

  function handleClear() {
    setSelectedHolder(null);
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
              setSelectedRegisterId("");
              setSelectedHolder(null);
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
              value={selectedRegisterId || "none"}
              onValueChange={(v) => {
                setSelectedRegisterId(v && v !== "none" ? v : "");
                setSelectedHolder(null);
              }}
            >
              <SelectTrigger className="w-72 mrpsl-input">
                <SelectValue placeholder="Select a register…" />
              </SelectTrigger>
              <SelectContent className="min-w-[480px]">
                <SelectItem value="none">— Select a register —</SelectItem>
                {activeRegisters.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="font-mono font-semibold">{r.symbol}</span>
                    <span className="text-muted-foreground ml-2 text-[12px]">
                      {r.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* Search input sits outside Card so the suggestion dropdown isn't clipped */}
      <ShareholderSearchInput
        registerId={
          scope === "single" && selectedRegisterId
            ? selectedRegisterId
            : undefined
        }
        className="w-full"
        placeholder="Type a surname, account no or CHN to search…"
        onSelect={handleSelect}
      />

      {selectedHolder && (
        <Card className="mrpsl-card mt-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-5 border-b flex items-start gap-4 bg-muted/5">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-xl font-mono">
                {selectedHolder.firstName[0]}
                {selectedHolder.lastName[0]}
              </span>
            </div>
            <div className="flex-1 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold">
                    {selectedHolder.lastName}, {selectedHolder.firstName}
                    {selectedHolder.otherNames
                      ? ` ${selectedHolder.otherNames}`
                      : ""}
                  </h2>
                  <span className="font-mono text-muted-foreground text-sm">
                    {selectedHolder.accountNumber}
                  </span>
                  <Badge variant="outline" className="text-[13px] font-mono">
                    {registers.find((r) => r.id === selectedHolder.registerId)
                      ?.symbol ?? "—"}
                  </Badge>
                  <Badge
                    className={`border-0 text-[13px] ${selectedHolder.status === "ACTIVE" ? "bg-green-100 text-green-800" : selectedHolder.status === "CAUTIONED" ? "bg-amber-100 text-amber-800" : selectedHolder.status === "SUSPENDED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {selectedHolder.status.charAt(0) +
                      selectedHolder.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-mono">
                  CHN: {selectedHolder.chn}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-right">
                  <button
                    className="text-3xl font-bold tabular-nums tracking-tight text-primary hover:underline cursor-pointer"
                    title="View certificates"
                    onClick={() => setInnerDetailTab("cert")}
                  >
                    {selectedHolder.holdings.toLocaleString()}
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
              onClick={() => setActiveModal("print")}
            >
              <Printer className="mr-2 h-4 w-4" /> Print Certificate
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 p-6">
            <div className="space-y-4">
              <h3 className="mrpsl-section-title border-b pb-2">Personal</h3>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="font-mono">14 Feb 1980</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Gender:</span>
                <span>{selectedHolder.gender}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Nationality:</span>
                <span>Nigerian</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">State:</span>
                <span>{selectedHolder.state}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Holder Type:</span>
                <span>{selectedHolder.holderType}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">NIN:</span>
                <span className="font-mono">
                  {selectedHolder.nin
                    ? `***${selectedHolder.nin.slice(-4)}`
                    : "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">SCUML:</span>
                <span className="font-mono text-muted-foreground">—</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">TIN:</span>
                <span className="font-mono">N/A</span>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="mrpsl-section-title border-b pb-2">Contact</h3>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span>{selectedHolder.email}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-mono">{selectedHolder.phone}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Alt Phone:</span>
                <span className="font-mono">
                  {selectedHolder.phone2 ?? "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Address:</span>
                <span className="leading-relaxed">
                  {selectedHolder.address}
                  <br />
                  {selectedHolder.state}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="mrpsl-section-title border-b pb-2">Financial</h3>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Bank Name:</span>
                <span>{selectedHolder.bankName}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Bank Account:</span>
                <span className="font-mono">
                  {selectedHolder.bankAccountNumber}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">BVN:</span>
                <span className="font-mono">
                  {selectedHolder.bvn.slice(0, 3)}***
                  {selectedHolder.bvn.slice(-4)}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Caution:</span>
                <span>{selectedHolder.cautionReason ?? "None"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">No Tax:</span>
                <span>{selectedHolder.noTax ? "Yes" : "No"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Unpaid Div:</span>
                <span className="font-mono font-bold text-red-600">
                  ₦45,000.00
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
                Admon
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
                    {[
                      {
                        no: "CERT-DANGCEM-20015",
                        issued: "01 Jan 2020",
                        units: 15000,
                        status: "Active",
                      },
                    ].map((cert) => (
                      <tr key={cert.no} className="hover:bg-accent/5">
                        <td className="p-3">{cert.no}</td>
                        <td className="p-3 text-muted-foreground font-sans">
                          {cert.issued}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {cert.units.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className="text-[13px] text-green-700 bg-green-50 border-0"
                          >
                            {cert.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="View certificate"
                              className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                toast.success(`Viewing ${cert.no}`)
                              }
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="Download PDF"
                              className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                toast.success("Certificate downloaded")
                              }
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="Print certificate"
                              className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              onClick={() => setActiveModal("print")}
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    {[
                      {
                        no: "DIV-2025-003",
                        decl: "15 Mar 2026",
                        pay: "15 Apr 2026",
                        rate: 1.5,
                        gross: 22500,
                        net: 19125,
                        status: "PAID",
                        method: "EFT",
                      },
                      {
                        no: "DIV-2025-002",
                        decl: "10 Sep 2025",
                        pay: "10 Oct 2025",
                        rate: 1.2,
                        gross: 18000,
                        net: 15300,
                        status: "PAID",
                        method: "EFT",
                      },
                      {
                        no: "DIV-2025-001",
                        decl: "20 Mar 2025",
                        pay: "20 Apr 2025",
                        rate: 0.9,
                        gross: 13500,
                        net: 11475,
                        status: "PAID",
                        method: "Warrant",
                      },
                      {
                        no: "DIV-2024-002",
                        decl: "12 Sep 2024",
                        pay: "12 Oct 2024",
                        rate: 1.0,
                        gross: 15000,
                        net: 12750,
                        status: "PAID",
                        method: "EFT",
                      },
                      {
                        no: "DIV-2024-001",
                        decl: "18 Mar 2024",
                        pay: "—",
                        rate: 0.75,
                        gross: 11250,
                        net: 9563,
                        status: "UNPAID",
                        method: "—",
                      },
                    ].map((r, i) => (
                      <tr key={i} className="hover:bg-accent/5">
                        <td className="p-3 font-mono">{r.no}</td>
                        <td className="p-3 text-muted-foreground">{r.decl}</td>
                        <td className="p-3 text-muted-foreground">{r.pay}</td>
                        <td className="p-3 text-right font-mono">
                          {r.rate.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {r.gross.toLocaleString()}.00
                        </td>
                        <td className="p-3 text-right font-mono font-semibold">
                          {r.net.toLocaleString()}.00
                        </td>
                        <td className="p-3">
                          <Badge
                            className={`border-0 text-[13px] ${r.status === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-3">{r.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TabsContent>

              <TabsContent
                value="int"
                className="m-0 p-12 text-center text-muted-foreground"
              >
                No interest records (Equity register).
              </TabsContent>
              <TabsContent
                value="chg"
                className="m-0 p-12 text-center text-muted-foreground"
              >
                Audit log of KYC changes.
              </TabsContent>

              <TabsContent value="merg" className="m-0">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header bg-muted/30">
                    <tr>
                      <th className="p-3">DATE</th>
                      <th className="p-3">TYPE</th>
                      <th className="p-3">SOURCE ACCOUNTS</th>
                      <th className="p-3">DESTINATION</th>
                      <th className="p-3">HOLDINGS MERGED</th>
                      <th className="p-3">INITIATED BY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {[
                      {
                        date: "22 Apr 2026",
                        type: "Account Consolidation",
                        sources: "DANGCEM-001, DANGCEM-089",
                        dest: "DANGCEM-001",
                        holdings: 15000,
                        by: "Chidi Okafor",
                      },
                      {
                        date: "10 Jan 2025",
                        type: "Account Consolidation",
                        sources: "DANGCEM-001, DANGCEM-012",
                        dest: "DANGCEM-001",
                        holdings: 5000,
                        by: "Ngozi Eze",
                      },
                    ].map((r, i) => (
                      <tr key={i} className="hover:bg-accent/5">
                        <td className="p-3 text-muted-foreground">{r.date}</td>
                        <td className="p-3 font-medium">{r.type}</td>
                        <td className="p-3 font-mono text-muted-foreground">
                          {r.sources}
                        </td>
                        <td className="p-3 font-mono">{r.dest}</td>
                        <td className="p-3 text-right font-mono font-semibold">
                          {r.holdings.toLocaleString()}
                        </td>
                        <td className="p-3 text-muted-foreground">{r.by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    {[
                      {
                        date: "01 Mar 2026",
                        no: "TRF-20260301-01",
                        from: "DANGCEM-001",
                        to: "DANGCEM-10300",
                        units: 2000,
                        type: "Off-Market",
                        status: "COMPLETED",
                      },
                      {
                        date: "14 Nov 2025",
                        no: "TRF-20251114-07",
                        from: "DANGCEM-10300",
                        to: "DANGCEM-001",
                        units: 500,
                        type: "Gift",
                        status: "COMPLETED",
                      },
                      {
                        date: "05 Jun 2025",
                        no: "TRF-20250605-03",
                        from: "DANGCEM-001",
                        to: "DANGCEM-00980",
                        units: 1000,
                        type: "Off-Market",
                        status: "COMPLETED",
                      },
                    ].map((r, i) => (
                      <tr key={i} className="hover:bg-accent/5">
                        <td className="p-3 text-muted-foreground">{r.date}</td>
                        <td className="p-3 font-mono">{r.no}</td>
                        <td className="p-3 font-mono">{r.from}</td>
                        <td className="p-3 font-mono">{r.to}</td>
                        <td className="p-3 text-right font-mono font-semibold">
                          {r.units.toLocaleString()}
                        </td>
                        <td className="p-3">{r.type}</td>
                        <td className="p-3">
                          <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TabsContent>

              <TabsContent
                value="adm"
                className="m-0 p-12 text-center text-muted-foreground"
              >
                Administration records.
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
        <DialogContent className="max-w-2xl flex flex-col max-h-[85vh] p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>
              Statement of Account — {selectedHolder?.accountNumber}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedHolder?.lastName}, {selectedHolder?.firstName} ·{" "}
              {
                registers.find((r) => r.id === selectedHolder?.registerId)
                  ?.symbol
              }
            </p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b bg-muted/10">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  Current Holdings
                </div>
                <div className="text-2xl font-mono font-bold">
                  {selectedHolder?.holdings.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  Opening Balance
                </div>
                <div className="text-2xl font-mono font-bold">8,000</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  Net Movement
                </div>
                <div className="text-2xl font-mono font-bold text-green-700">
                  +{((selectedHolder?.holdings ?? 0) - 8000).toLocaleString()}
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
                {[
                  {
                    date: "01 Jan 2020",
                    tx: "Initial Allotment",
                    ref: "ALLOT-2020-001",
                    dr: 0,
                    cr: 8000,
                    bal: 8000,
                  },
                  {
                    date: "22 Apr 2021",
                    tx: "Rights Issue",
                    ref: "RIGHTS-2021-001",
                    dr: 0,
                    cr: 5000,
                    bal: 13000,
                  },
                  {
                    date: "10 Jan 2025",
                    tx: "Account Consolidation",
                    ref: "MERGE-2025-012",
                    dr: 0,
                    cr: 2000,
                    bal: 15000,
                  },
                  {
                    date: "01 Mar 2026",
                    tx: "Off-Market Transfer Out",
                    ref: "TRF-20260301-01",
                    dr: 2000,
                    cr: 0,
                    bal: 13000,
                  },
                  {
                    date: "22 Apr 2026",
                    tx: "Account Consolidation",
                    ref: "MERGE-2026-022",
                    dr: 0,
                    cr: 2000,
                    bal: 15000,
                  },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-accent/5">
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.date}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.tx}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground text-[12px]">
                      {r.ref}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {r.dr > 0 ? r.dr.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-green-700">
                      {r.cr > 0 ? r.cr.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {r.bal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t flex justify-between items-center shrink-0">
            <Button
              variant="outline"
              className="gap-1.5"
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
        <DialogContent className="max-w-3xl flex flex-col max-h-[85vh] p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>
              Dividend Statement — {selectedHolder?.accountNumber}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedHolder?.lastName}, {selectedHolder?.firstName} ·{" "}
              {
                registers.find((r) => r.id === selectedHolder?.registerId)
                  ?.symbol
              }
            </p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b bg-muted/10">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  Total Gross (₦)
                </div>
                <div className="text-2xl font-mono font-bold">80,250.00</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  Total Net (₦)
                </div>
                <div className="text-2xl font-mono font-bold text-primary">
                  68,213.00
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  Unpaid Amount (₦)
                </div>
                <div className="text-2xl font-mono font-bold text-red-600">
                  9,563.00
                </div>
              </div>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="mrpsl-table-header sticky top-0">
                <tr>
                  <th className="px-4 py-3">DIVIDEND NO</th>
                  <th className="px-4 py-3">DECL. DATE</th>
                  <th className="px-4 py-3">PAYMENT DATE</th>
                  <th className="px-4 py-3 text-right">RATE (₦)</th>
                  <th className="px-4 py-3 text-right">GROSS (₦)</th>
                  <th className="px-4 py-3 text-right">TAX (₦)</th>
                  <th className="px-4 py-3 text-right">NET (₦)</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">METHOD</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {[
                  {
                    no: "DIV-2025-003",
                    decl: "15 Mar 2026",
                    pay: "15 Apr 2026",
                    rate: 1.5,
                    gross: 22500,
                    tax: 3375,
                    net: 19125,
                    status: "PAID",
                    method: "EFT",
                  },
                  {
                    no: "DIV-2025-002",
                    decl: "10 Sep 2025",
                    pay: "10 Oct 2025",
                    rate: 1.2,
                    gross: 18000,
                    tax: 2700,
                    net: 15300,
                    status: "PAID",
                    method: "EFT",
                  },
                  {
                    no: "DIV-2025-001",
                    decl: "20 Mar 2025",
                    pay: "20 Apr 2025",
                    rate: 0.9,
                    gross: 13500,
                    tax: 2025,
                    net: 11475,
                    status: "PAID",
                    method: "Warrant",
                  },
                  {
                    no: "DIV-2024-002",
                    decl: "12 Sep 2024",
                    pay: "12 Oct 2024",
                    rate: 1.0,
                    gross: 15000,
                    tax: 2250,
                    net: 12750,
                    status: "PAID",
                    method: "EFT",
                  },
                  {
                    no: "DIV-2024-001",
                    decl: "18 Mar 2024",
                    pay: "—",
                    rate: 0.75,
                    gross: 11250,
                    tax: 1688,
                    net: 9563,
                    status: "UNPAID",
                    method: "—",
                  },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-accent/5">
                    <td className="px-4 py-3 font-mono">{r.no}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.decl}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.pay}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {r.rate.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {r.gross.toLocaleString()}.00
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">
                      {r.tax.toLocaleString()}.00
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {r.net.toLocaleString()}.00
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`border-0 text-[12px] ${r.status === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{r.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t flex justify-between shrink-0">
            <Button
              variant="outline"
              className="gap-1.5"
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
              {selectedHolder?.lastName}, {selectedHolder?.firstName}
            </p>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="rounded-xl border bg-muted/10 flex items-center justify-center h-40">
              <div className="text-center space-y-2">
                <div className="font-serif italic text-4xl text-muted-foreground/60 select-none">
                  {selectedHolder?.firstName?.[0]}
                  {selectedHolder?.lastName}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Specimen signature — not for transfer
                </p>
              </div>
            </div>
            <div className="text-[12px] text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Captured:</span>
                <span className="font-mono">01 Jan 2020</span>
              </div>
              <div className="flex justify-between">
                <span>Last updated:</span>
                <span className="font-mono">14 Feb 2023</span>
              </div>
            </div>
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
              {selectedHolder?.lastName}, {selectedHolder?.firstName} ·{" "}
              {selectedHolder?.accountNumber}
            </p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 divide-y">
            {[
              {
                name: "National ID Card",
                ref: "NIN-2022-00345",
                uploaded: "12 Jan 2022",
                verified: true,
              },
              {
                name: "Utility Bill",
                ref: "UB-2023-00112",
                uploaded: "03 Mar 2023",
                verified: true,
              },
              {
                name: "Bank Statement",
                ref: "BS-2023-00890",
                uploaded: "03 Mar 2023",
                verified: true,
              },
              {
                name: "Passport Photograph",
                ref: "PP-2020-00011",
                uploaded: "01 Jan 2020",
                verified: true,
              },
              {
                name: "Signature Mandate Card",
                ref: "SGN-2020-00011",
                uploaded: "01 Jan 2020",
                verified: false,
              },
            ].map((doc) => (
              <div key={doc.ref} className="px-6 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{doc.name}</div>
                  <div className="text-[12px] text-muted-foreground font-mono">
                    {doc.ref} · Uploaded {doc.uploaded}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={`text-[11px] border-0 ${doc.verified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                  >
                    {doc.verified ? "Verified" : "Pending"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[12px]"
                    onClick={() => toast.success(`${doc.name} downloaded`)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
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
            <DialogTitle>Print Share Certificate</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedHolder?.accountNumber} — {selectedHolder?.lastName},{" "}
              {selectedHolder?.firstName}
            </p>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl border bg-muted/10 p-4 space-y-3 text-sm">
              {[
                { label: "Certificate No", value: "CERT-DANGCEM-20015" },
                {
                  label: "Register",
                  value:
                    registers.find((r) => r.id === selectedHolder?.registerId)
                      ?.symbol ?? "—",
                },
                {
                  label: "Holder",
                  value: `${selectedHolder?.lastName}, ${selectedHolder?.firstName}`,
                },
                {
                  label: "Units",
                  value: selectedHolder?.holdings.toLocaleString() ?? "0",
                },
                { label: "Date Issued", value: "01 Jan 2020" },
                { label: "Status", value: "Active" },
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
            <p className="text-[13px] text-muted-foreground">
              This will send a print job to the registry printer. Ensure the
              certificate stock is loaded before confirming.
            </p>
          </div>
          <div className="px-6 pb-6 flex gap-3 shrink-0">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setActiveModal(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={() => {
                toast.success("Certificate print job sent to registry printer");
                setActiveModal(null);
              }}
            >
              <Printer className="h-4 w-4" /> Confirm &amp; Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Search,
  FileText,
  DollarSign,
  PenLine,
  FolderOpen,
  Printer,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

const SEARCH_TYPES = [
  "Surname",
  "Account No",
  "CSCS No",
  "CHN",
  "Email",
  "Phone",
  "BVN",
  "RIN",
  "Bank Account",
  "Certificate No",
  "Transfer No",
  "Identity No",
];

export default function HolderEnquiryPage() {
  const { shareholders, registers } = useStore();
  const [activeType, setActiveType] = useState("Surname");
  const [query, setQuery] = useState("");
  const [showResult, setShowResult] = useState(false);

  const mockHolder = shareholders[0];

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
        <div className="flex gap-6 mb-4 border-b pb-4">
          <RadioGroup defaultValue="all" className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="r1" />
              <label htmlFor="r1" className="text-sm">
                Across All Registers
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="active" id="r2" />
              <label htmlFor="r2" className="text-sm">
                Active Register
              </label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search by surname, account number, CHN, CSCS number, email, phone, BVN, RIN, bank account number..."
            className="flex-1 text-base h-12"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            size="lg"
            className="h-12 px-8"
            onClick={() => setShowResult(true)}
          >
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-12"
            onClick={() => setShowResult(false)}
          >
            Clear
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {SEARCH_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-3 py-1 rounded-full text-[13px] transition-colors ${
                activeType === t
                  ? "bg-primary/10 text-primary border border-primary/30 font-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {showResult && mockHolder && (
        <Card className="mrpsl-card mt-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-5 border-b flex items-start gap-4 bg-muted/5">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-xl font-mono">
                {mockHolder.firstName[0]}
                {mockHolder.lastName[0]}
              </span>
            </div>
            <div className="flex-1 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    {mockHolder.firstName} {mockHolder.lastName}
                  </h2>
                  <span className="font-mono text-muted-foreground">
                    {mockHolder.accountNumber}
                  </span>
                  <Badge variant="outline" className="text-[13px]">
                    DANGCEM
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                    Active
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  CHN: {mockHolder.chn}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums tracking-tight">
                  {mockHolder.holdings.toLocaleString()}
                </div>
                <div className="text-[13px] text-muted-foreground font-medium uppercase tracking-widest mt-1">
                  Units Held
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-4 border-b bg-muted/20 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Statement dialog")}
            >
              <FileText className="mr-2 h-4 w-4" /> View Statement of Account
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Dividend statement dialog")}
            >
              <DollarSign className="mr-2 h-4 w-4" /> View Dividend Statement
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Signature dialog")}
            >
              <PenLine className="mr-2 h-4 w-4" /> View Signature
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Documents sheet")}
            >
              <FolderOpen className="mr-2 h-4 w-4" /> View Documents
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Print job sent")}
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
                <span>{mockHolder.gender}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Nationality:</span>
                <span>Nigerian</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">State:</span>
                <span>{mockHolder.state}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Holder Type:</span>
                <span>{mockHolder.holderType}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">NIN:</span>
                <span className="font-mono">N/A</span>
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
                <span>{mockHolder.email}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-mono">{mockHolder.phone}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Alt Phone:</span>
                <span className="font-mono">N/A</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Address:</span>
                <span className="leading-relaxed">
                  {mockHolder.address}
                  <br />
                  {mockHolder.state}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="mrpsl-section-title border-b pb-2">Financial</h3>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Bank Name:</span>
                <span>{mockHolder.bankName}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Bank Account:</span>
                <span className="font-mono">
                  {mockHolder.bankAccountNumber}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">BVN:</span>
                <span className="font-mono">
                  {mockHolder.bvn.slice(0, 3)}***{mockHolder.bvn.slice(-4)}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Caution:</span>
                <span>None</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">No Tax:</span>
                <span>{mockHolder.noTax ? "Yes" : "No"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Unpaid Div:</span>
                <span className="font-mono font-bold text-red-600">
                  ₦45,000.00
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="cert" className="w-full border-t">
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
                      <th className="p-3">UNITS</th>
                      <th className="p-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono text-[13px]">
                    <tr className="hover:bg-accent/5">
                      <td className="p-3">CERT-DANGCEM-20015</td>
                      <td className="p-3 text-muted-foreground font-sans">
                        01 Jan 2020
                      </td>
                      <td className="p-3 text-right font-bold">15,000</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="text-[13px] text-green-700 bg-green-50 border-0"
                        >
                          Active
                        </Badge>
                      </td>
                    </tr>
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
    </div>
  );
}

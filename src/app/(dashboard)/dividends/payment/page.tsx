"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Download, Play, Eye, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";

export default function PaymentPage() {
  const { registers, dividendDeclarations } = useStore();
  const authDivs = dividendDeclarations.filter(d => d.status === "AUTHORIZED");
  const [selectedDiv, setSelectedDiv] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dividend Payment</h1>
          <p className="text-sm text-muted-foreground mt-1">Initiate and track dividend disbursement via NIBSS and Remita</p>
        </div>
      </div>

      <Tabs defaultValue="decl" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="decl" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Declaration Payments</TabsTrigger>
          <TabsTrigger value="new" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">New Mandate Payments</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Payment History</TabsTrigger>
          <TabsTrigger value="repush" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Re-Push Queue</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="decl" className="space-y-6">
            <div className="flex gap-4">
              <Select><SelectTrigger className="w-48 mrpsl-input"><SelectValue placeholder="Register" /></SelectTrigger><SelectContent>{registers.map(r=><SelectItem key={r.id} value={r.id}>{r.symbol}</SelectItem>)}</SelectContent></Select>
              <Select value={selectedDiv} onValueChange={(v) => setSelectedDiv(v || "")}><SelectTrigger className="w-64 mrpsl-input"><SelectValue placeholder="Dividend" /></SelectTrigger><SelectContent>{authDivs.map(d=><SelectItem key={d.id} value={d.id}>{d.paymentNumber}</SelectItem>)}</SelectContent></Select>
              <Select defaultValue="Unpaid"><SelectTrigger className="w-48 mrpsl-input"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent></Select>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <Card className="p-4"><div className="mrpsl-section-title">Total Eligible</div><div className="text-2xl font-mono mt-1 font-bold">180,248</div></Card>
              <Card className="p-4"><div className="mrpsl-section-title">Total Amount (₦)</div><div className="text-xl font-mono mt-1 font-bold">69.01B</div></Card>
              <Card className="p-4"><div className="mrpsl-section-title">Paid</div><div className="text-2xl font-mono mt-1 font-bold text-green-600">0</div></Card>
              <Card className="p-4"><div className="mrpsl-section-title">Unpaid</div><div className="text-2xl font-mono mt-1 font-bold text-amber-600">180,248</div></Card>
              <Card className="p-4"><div className="mrpsl-section-title">Failed</div><div className="text-2xl font-mono mt-1 font-bold text-red-600">0</div></Card>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 space-y-4">
                <Card className="p-4 border-l-4 border-primary bg-muted/10">
                  <h3 className="font-semibold text-sm mb-3">Select Payment Gateway</h3>
                  <RadioGroup defaultValue="nibss" className="space-y-3">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="nibss" id="g1"/><label htmlFor="g1" className="text-sm font-medium">NIBSS<br/><span className="text-xs text-muted-foreground font-normal">Nigeria Inter-Bank Settlement System</span></label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="remita" id="g2"/><label htmlFor="g2" className="text-sm font-medium">Remita<br/><span className="text-xs text-muted-foreground font-normal">Remita by SystemSpecs</span></label></div>
                  </RadioGroup>
                </Card>

                <Button className="w-full" size="lg" onClick={()=>toast.success("Payment run submitted for ICU approval.")}><Play className="mr-2 h-4 w-4"/> Initiate Payment Run</Button>
                <Button variant="outline" className="w-full" onClick={()=>toast.success("NIBSS file PAY-DIV-9283.txt downloaded")}><Download className="mr-2 h-4 w-4"/> Download NIBSS File (.txt)</Button>
              </div>

              <div className="col-span-2">
                <Card className="mrpsl-card overflow-hidden">
                  <div className="p-3 bg-muted/20 border-b text-xs font-mono font-bold text-muted-foreground">PREVIEW (5 ROWS)</div>
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header"><tr><th className="p-3">SERIAL</th><th className="p-3">ACCOUNT NO</th><th className="p-3">BANK</th><th className="p-3 text-right">AMOUNT (₦)</th><th className="p-3">STATUS</th><th className="p-3 text-right">ACTIONS</th></tr></thead>
                    <tbody className="divide-y font-mono text-xs">
                      {["001","002","003","004","005"].map(n => (
                        <tr key={n} className="hover:bg-accent/5">
                          <td className="p-3 text-muted-foreground">{n}</td><td className="p-3">DANGCEM-100{n}</td><td className="p-3">058</td>
                          <td className="p-3 text-right">5,400.00</td><td className="p-3"><Badge className="bg-amber-100 text-amber-800 border-0 text-xs">Unpaid</Badge></td>
                          <td className="p-3 text-right"><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info("Payment detail")}><Eye className="mr-1 h-3 w-3"/>View</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="new"><Card className="p-12 text-center text-muted-foreground">New Mandate Payments queue is empty.</Card></TabsContent>
          <TabsContent value="history">
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">PAY RUN REF</th>
                      <th className="px-4 py-3">PAYMENT NO</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">GATEWAY</th>
                      <th className="px-4 py-3 text-right">TOTAL RECORDS</th>
                      <th className="px-4 py-3 text-right">AMOUNT (₦)</th>
                      <th className="px-4 py-3">DATE RUN</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {[
                      { ref: "PAYRUN-2025-001", payNo: "PAY-2025-DANGCEM-001", reg: "DANGCEM", gw: "NIBSS", records: 180248, amount: "69.01B", date: "15 Jan 2025", status: "PAID" },
                      { ref: "PAYRUN-2024-003", payNo: "PAY-2024-ACCESSCORP-003", reg: "ACCESS", gw: "Remita", records: 92410, amount: "12.5B", date: "03 Nov 2024", status: "PAID" },
                      { ref: "PAYRUN-2024-002", payNo: "PAY-2024-GTCO-002", reg: "GTCO", gw: "NIBSS", records: 134000, amount: "8.3B", date: "28 Jul 2024", status: "FAILED" },
                    ].map(row => (
                      <tr key={row.ref} className="mrpsl-table-row">
                        <td className="px-4 py-3 font-mono text-muted-foreground">{row.ref}</td>
                        <td className="px-4 py-3 font-mono">{row.payNo}</td>
                        <td className="px-4 py-3 font-semibold">{row.reg}</td>
                        <td className="px-4 py-3">{row.gw}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.records.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">₦{row.amount}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
                        <td className="px-4 py-3">
                          <Badge className={`border-0 text-xs ${row.status === "PAID" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>{row.status === "PAID" ? "Paid" : "Failed"}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info("Payment run details")}><Eye className="mr-1 h-3 w-3"/>View</Button>
                            {row.status === "FAILED" && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-600" onClick={() => toast.success("Added to re-push queue")}><RotateCcw className="mr-1 h-3 w-3"/>Re-push</Button>
                            )}
                            {row.status === "PAID" && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.success("Receipt downloaded")}><Download className="mr-1 h-3 w-3"/>Receipt</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="repush">
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">ACCOUNT NO</th>
                      <th className="px-4 py-3">HOLDER NAME</th>
                      <th className="px-4 py-3">BANK</th>
                      <th className="px-4 py-3">PAYMENT NO</th>
                      <th className="px-4 py-3 text-right">AMOUNT (₦)</th>
                      <th className="px-4 py-3">FAIL REASON</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {[
                      { acct: "GTCO-10044", name: "Emeka Eze", bank: "GTBank", payNo: "PAY-2024-GTCO-002", amount: "3,200.00", reason: "Invalid account number" },
                      { acct: "GTCO-10091", name: "Adaeze Okafor", bank: "First Bank", payNo: "PAY-2024-GTCO-002", amount: "18,750.00", reason: "Account frozen" },
                    ].map(row => (
                      <tr key={row.acct} className="mrpsl-table-row">
                        <td className="px-4 py-3 font-mono">{row.acct}</td>
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3">{row.bank}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{row.payNo}</td>
                        <td className="px-4 py-3 text-right tabular-nums">₦{row.amount}</td>
                        <td className="px-4 py-3 text-red-600">{row.reason}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info("Holder details")}><Eye className="mr-1 h-3 w-3"/>View Holder</Button>
                            <Button size="sm" className="h-7 text-xs" onClick={() => toast.success(`${row.acct} queued for re-push`)}><RotateCcw className="mr-1 h-3 w-3"/>Re-push</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { CheckCircle2, AlertTriangle, FileText, Info } from "lucide-react";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";

export default function KYCUpdatePage() {
  const { registers, shareholders } = useStore();
  const [mode, setMode] = useState("single");
  const [accountLoaded, setAccountLoaded] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">KYC Update</h1>
          <p className="text-sm text-muted-foreground mt-1">Update shareholder identity, contact, and bank information in a controlled and auditable manner</p>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <Select><SelectTrigger className="w-64 mrpsl-input"><SelectValue placeholder="All Registers" /></SelectTrigger><SelectContent>{registers.map(r=><SelectItem key={r.id} value={r.id}>{r.symbol}</SelectItem>)}</SelectContent></Select>
        <div className="border rounded-md flex p-1 bg-muted/20">
          <Button variant={mode==="single"?"secondary":"ghost"} size="sm" onClick={()=>setMode("single")}>Single</Button>
          <Button variant={mode==="bulk"?"secondary":"ghost"} size="sm" onClick={()=>setMode("bulk")}>Bulk Upload</Button>
        </div>
        {mode === "single" && (
          <div className="flex gap-2 flex-1"><Input placeholder="Account No or CHN" className="mrpsl-input" /><Button onClick={()=>setAccountLoaded(true)}>Find Account</Button></div>
        )}
      </div>

      {mode === "single" && accountLoaded && (
        <div className="space-y-6 animate-in fade-in">
          <Card className="mrpsl-card p-4 flex items-center gap-6">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-2xl font-mono">AO</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Adaeze Okonkwo</h2>
                <Badge variant="outline" className="font-mono text-xs">DANGCEM-10029</Badge>
                <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
              </div>
              <div className="flex gap-4 mt-3">
                <div className="text-xs"><span className="text-muted-foreground">Holdings:</span> <span className="font-mono font-bold text-sm">450,000</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Bank:</span> <span className="font-medium">Zenith Bank</span></div>
                <div className="text-xs"><span className="text-muted-foreground">CHN:</span> <span className="font-mono">C00001029EL</span></div>
                <div className="text-xs"><span className="text-muted-foreground">BVN:</span> <span className="font-mono">***1234</span></div>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
              <TabsTrigger value="personal" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Personal Info</TabsTrigger>
              <TabsTrigger value="contact" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Contact Info</TabsTrigger>
              <TabsTrigger value="bank" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Bank Details</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Pending Changes</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Audit History</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="personal">
                <Card className="mrpsl-card p-6 space-y-6">
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 font-semibold text-sm border-b pb-2"><div className="text-muted-foreground uppercase text-xs">Field</div><div className="text-muted-foreground uppercase text-xs">Current Value</div><div className="text-primary uppercase text-xs">New Value</div></div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Shareholder Name</span>
                    <span className="text-sm text-muted-foreground">Adaeze Okonkwo</span>
                    <div className="flex gap-2"><Input className="mrpsl-input" placeholder="New name" /><Select><SelectTrigger className="w-32"><SelectValue placeholder="Type"/></SelectTrigger><SelectContent><SelectItem value="spell">Correction</SelectItem><SelectItem value="change">Change</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Holder Type</span>
                    <span className="text-sm text-muted-foreground">INDIVIDUAL</span>
                    <Select><SelectTrigger className="mrpsl-input"><SelectValue placeholder="INDIVIDUAL"/></SelectTrigger><SelectContent><SelectItem value="INDIVIDUAL">INDIVIDUAL</SelectItem></SelectContent></Select>
                  </div>
                  <div className="mt-6">
                    <DocUploadZone
                      label="Supporting Document"
                      fileTypes={["PDF", "JPG", "PNG"]}
                      maxSizeMB={10}
                    />
                  </div>
                  <div className="flex justify-end pt-4"><Button onClick={()=>toast.success("Submitted for approval")}>Submit Changes for Approval</Button></div>
                </Card>
              </TabsContent>

              <TabsContent value="contact">
                <Card className="mrpsl-card p-6 space-y-6">
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 font-semibold text-sm border-b pb-2"><div className="text-muted-foreground uppercase text-xs">Field</div><div className="text-muted-foreground uppercase text-xs">Current Value</div><div className="text-primary uppercase text-xs">New Value</div></div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Email Address</span>
                    <span className="text-sm text-muted-foreground">adaeze@example.com</span>
                    <Input className="mrpsl-input" placeholder="adaeze@example.com" />
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Phone Number</span>
                    <span className="text-sm text-muted-foreground">08012345678</span>
                    <Input className="mrpsl-input" placeholder="08012345678" />
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-start">
                    <span className="text-sm font-medium mt-2">Registered Address *</span>
                    <span className="text-sm text-muted-foreground mt-2">10 Broad Street, Lagos</span>
                    <Textarea className="mrpsl-input" placeholder="10 Broad Street, Lagos" />
                  </div>
                  <div className="flex justify-end pt-4"><Button onClick={()=>toast.success("Submitted for approval")}>Submit Changes for Approval</Button></div>
                </Card>
              </TabsContent>

              <TabsContent value="bank">
                <div className="border-l-4 border-amber-400 bg-amber-50 p-4 rounded-r-md flex gap-3 mb-6">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">Updating bank details will automatically queue all outstanding dividend warrants for this account in New Mandate Payment Processing.</p>
                </div>
                <Card className="mrpsl-card p-6 space-y-6">
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 font-semibold text-sm border-b pb-2"><div className="text-muted-foreground uppercase text-xs">Field</div><div className="text-muted-foreground uppercase text-xs">Current Value</div><div className="text-primary uppercase text-xs">New Value</div></div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Bank Name</span>
                    <span className="text-sm text-muted-foreground">Zenith Bank</span>
                    <Select><SelectTrigger className="mrpsl-input"><SelectValue placeholder="Select Bank"/></SelectTrigger><SelectContent><SelectItem value="GTB">GTBank</SelectItem></SelectContent></Select>
                  </div>
                  <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-center">
                    <span className="text-sm font-medium">Account Number</span>
                    <span className="text-sm text-muted-foreground font-mono">0123456789</span>
                    <div className="flex gap-2"><Input className="mrpsl-input font-mono" placeholder="10 digits" /><Button variant="secondary" onClick={()=>toast.success("Account validated: Adaeze Okonkwo at GTBank")}>Validate</Button></div>
                  </div>
                  <div className="flex justify-end pt-4"><Button onClick={()=>toast.success("Submitted for approval")}>Submit Changes for Approval</Button></div>
                </Card>
              </TabsContent>

              <TabsContent value="pending"><Card className="p-12 text-center text-muted-foreground">No pending changes for this account.</Card></TabsContent>
              <TabsContent value="history"><Card className="p-12 text-center text-muted-foreground">Audit history for this account.</Card></TabsContent>
            </div>
          </Tabs>
        </div>
      )}

      {mode === "bulk" && (
        <Card className="mrpsl-card p-12 text-center">
          <Button variant="outline" className="mb-6"><FileText className="mr-2 h-4 w-4" /> Download Template</Button>
          <div className="max-w-xl mx-auto">
            <DocUploadZone label="Bulk KYC Changes" fileTypes={["CSV"]} maxSizeMB={20} />
          </div>
        </Card>
      )}
    </div>
  );
}
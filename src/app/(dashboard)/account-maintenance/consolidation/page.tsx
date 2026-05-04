"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export default function ConsolidationPage() {
  const { registers } = useStore();
  const [mode, setMode] = useState("single");
  const [sourcesLoaded, setSourcesLoaded] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Consolidation</h1>
          <p className="text-sm text-muted-foreground mt-1">Merge duplicate shareholder accounts into a single surviving account</p>
        </div>
      </div>

      <Tabs defaultValue="consol" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="consol" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Consolidate</TabsTrigger>
          <TabsTrigger value="auth" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Pending Authorisation</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">History</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="consol" className="space-y-6">
            <div className="flex gap-4">
              <Select><SelectTrigger className="w-64 mrpsl-input"><SelectValue placeholder="Register *" /></SelectTrigger><SelectContent>{registers.map(r=><SelectItem key={r.id} value={r.id}>{r.symbol}</SelectItem>)}</SelectContent></Select>
              <div className="border rounded-md flex p-1 bg-muted/20">
                <Button variant={mode==="single"?"secondary":"ghost"} size="sm" onClick={()=>setMode("single")}>Single</Button>
                <Button variant={mode==="bulk"?"secondary":"ghost"} size="sm" onClick={()=>setMode("bulk")}>Bulk Upload</Button>
              </div>
            </div>

            {mode === "single" && (
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-3 space-y-4">
                  <h3 className="font-semibold text-sm">1. Source Accounts (To be deactivated)</h3>
                  <Card className="mrpsl-card p-4 space-y-4">
                    <div className="flex gap-2"><Input placeholder="Account No or Surname" className="mrpsl-input" /><Button onClick={()=>setSourcesLoaded(true)}>Add</Button></div>
                    {sourcesLoaded && (
                      <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header"><tr><th className="p-2"><Checkbox defaultChecked/></th><th className="p-2">ACCT NO</th><th className="p-2">NAME</th><th className="p-2 text-right">HOLDINGS</th></tr></thead>
                        <tbody className="divide-y font-mono text-xs">
                          <tr><td className="p-2"><Checkbox defaultChecked/></td><td className="p-2 text-muted-foreground">DANGCEM-001</td><td className="p-2 font-sans font-medium">BINTA LAWAL</td><td className="p-2 text-right">5,000</td></tr>
                          <tr><td className="p-2"><Checkbox defaultChecked/></td><td className="p-2 text-muted-foreground">DANGCEM-089</td><td className="p-2 font-sans font-medium">B. LAWAL</td><td className="p-2 text-right">10,000</td></tr>
                        </tbody>
                      </table>
                    )}
                  </Card>
                </div>
                
                <div className="col-span-2 space-y-4">
                  <h3 className="font-semibold text-sm">2. Destination Account (Surviving)</h3>
                  <Card className="mrpsl-card p-4 space-y-4">
                    <Select disabled={!sourcesLoaded}><SelectTrigger className="mrpsl-input"><SelectValue placeholder="Select surviving account" /></SelectTrigger><SelectContent><SelectItem value="1">DANGCEM-001 - BINTA LAWAL</SelectItem><SelectItem value="2">DANGCEM-089 - B. LAWAL</SelectItem></SelectContent></Select>
                    {sourcesLoaded && (
                      <div className="bg-muted/20 p-4 rounded-md space-y-3">
                        <div className="text-xs text-muted-foreground">Merging 2 accounts into Destination.</div>
                        <div className="text-sm font-bold">Total Holdings after merge: <span className="font-mono text-primary">15,000</span></div>
                        <div className="text-xs text-muted-foreground">Certificates and Dividend History will be unified.</div>
                        <Textarea placeholder="Comment / Reason *" className="mt-2 focus-visible:ring-primary" />
                        <Button className="w-full mt-2" onClick={()=>toast.success("Consolidation submitted for authorizer review.")}>Submit for Authorisation</Button>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {mode === "bulk" && (
              <Card className="mrpsl-card p-12 text-center text-muted-foreground">Bulk upload CSV interface.</Card>
            )}
          </TabsContent>

          <TabsContent value="auth"><Card className="p-12 text-center text-muted-foreground">No pending authorisations.</Card></TabsContent>
          <TabsContent value="history"><Card className="p-12 text-center text-muted-foreground">Consolidation history.</Card></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export default function NewMandatePage() {
  const { registers } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Mandate Payment Processing</h1>
          <p className="text-sm text-muted-foreground mt-1">Process dividend payments for accounts with recently updated bank details</p>
        </div>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="queue" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Review Queue</TabsTrigger>
          <TabsTrigger value="auth" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Pending Approval</TabsTrigger>
          <TabsTrigger value="icu" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">ICU Approval</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="queue" className="space-y-4">
            <div className="flex gap-4">
              <Select><SelectTrigger className="w-48 mrpsl-input"><SelectValue placeholder="Register" /></SelectTrigger><SelectContent>{registers.map(r=><SelectItem key={r.id} value={r.id}>{r.symbol}</SelectItem>)}</SelectContent></Select>
              <Select><SelectTrigger className="w-48 mrpsl-input"><SelectValue placeholder="Dividend No" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
            </div>

            <Card className="mrpsl-card">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header"><tr><th className="p-3 w-10"><Checkbox /></th><th className="p-3">ACCOUNT NO</th><th className="p-3">HOLDER NAME</th><th className="p-3">NEW BANK</th><th className="p-3">NEW ACCOUNT NO</th><th className="p-3">DIVIDEND NO</th><th className="p-3 text-right">AMOUNT (₦)</th><th className="p-3">SOURCE</th></tr></thead>
                <tbody className="divide-y">
                  {["DANGCEM-10045", "ZENITHBANK-9921"].map((a,i) => (
                    <tr key={a} className="hover:bg-accent/5">
                      <td className="p-3"><Checkbox /></td>
                      <td className="p-3 font-mono text-xs">{a}</td>
                      <td className="p-3 font-medium">LUKMAN BELLO</td>
                      <td className="p-3 text-xs">UBA</td>
                      <td className="p-3 font-mono text-xs">0029384812</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">DIV-2025-001</td>
                      <td className="p-3 font-mono text-right">45,000.00</td>
                      <td className="p-3"><Badge className="bg-blue-100 text-blue-800 text-xs">KYC Update</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t bg-muted/10 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">2 records selected</span>
                <Button onClick={()=>toast.success("Submitted for approval.")}>Submit Selected for Approval</Button>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="auth"><Card className="p-12 text-center text-muted-foreground">No pending approvals.</Card></TabsContent>
          <TabsContent value="icu"><Card className="p-12 text-center text-muted-foreground">No ICU approvals.</Card></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
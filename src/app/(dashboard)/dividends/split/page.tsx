"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function DivSplitPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dividend Split</h1>
          <p className="text-sm text-muted-foreground mt-1">Split a single dividend warrant to multiple destination accounts</p>
        </div>
      </div>

      <Tabs defaultValue="split" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="split" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">New Split</TabsTrigger>
          <TabsTrigger value="auth" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Pending Approvals</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="split" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="mrpsl-card p-6 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">Step 1: Locate Eligible Dividend</h3>
                <div className="space-y-4">
                  <Select><SelectTrigger className="mrpsl-input"><SelectValue placeholder="Register" /></SelectTrigger><SelectContent><SelectItem value="x">DANGCEM</SelectItem></SelectContent></Select>
                  <div className="flex gap-2"><Input placeholder="Account Search" className="mrpsl-input" /><Button variant="secondary">Lookup</Button></div>
                  <Select><SelectTrigger className="mrpsl-input"><SelectValue placeholder="Select Dividend" /></SelectTrigger><SelectContent><SelectItem value="x">DIV-2025-001</SelectItem></SelectContent></Select>
                </div>
                <div className="bg-muted/20 p-4 rounded-md space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Warrant No</span><span className="font-mono font-medium">WRT-89412</span></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Net Amount</span><span className="font-mono font-bold text-green-600">₦45,000.00</span></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Status</span><span className="text-xs bg-amber-100 text-amber-800 px-2 rounded">UNPAID</span></div>
                </div>
              </Card>

              <Card className="mrpsl-card p-6 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">Step 2: Configure Split</h3>
                <div className="space-y-4">
                  <div className="space-y-2"><label className="mrpsl-label">Number of Parts</label><Select defaultValue="2"><SelectTrigger className="mrpsl-input w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent></Select></div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2"><Input placeholder="Destination Account" className="mrpsl-input flex-1" /><Input type="number" defaultValue="25000" className="mrpsl-input w-32 font-mono" /></div>
                    <div className="flex items-center gap-2"><Input placeholder="Destination Account" className="mrpsl-input flex-1" /><Input type="number" defaultValue="20000" className="mrpsl-input w-32 font-mono" /></div>
                  </div>
                  <div className="bg-green-50 border border-green-200 text-green-800 p-2 rounded text-sm font-mono text-center">
                    Total: ₦45,000.00 / ₦45,000.00 ✓
                  </div>
                  <Textarea placeholder="Reason..." className="focus-visible:ring-primary" />
                  <Button className="w-full" onClick={()=>toast.success("Split submitted")}>Submit for Approval</Button>
                </div>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="auth"><Card className="p-12 text-center text-muted-foreground">No pending approvals.</Card></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
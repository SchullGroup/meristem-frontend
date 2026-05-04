"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MarkOffPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warrant Mark-Off</h1>
          <p className="text-sm text-muted-foreground mt-1">Flag dividend warrants as paid (manual or bulk)</p>
        </div>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="manual" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Manual Mark-Off</TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">En Bloc Mark-Off</TabsTrigger>
          <TabsTrigger value="auth" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">History</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="manual" className="space-y-6">
            <Card className="mrpsl-card p-6 max-w-xl mx-auto space-y-4 mt-12">
              <h3 className="font-semibold text-lg text-center mb-2">Find Warrant</h3>
              <div className="flex gap-2">
                <Input placeholder="Warrant No / Account No / CHN" className="mrpsl-input" />
                <Button>Search</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card className="mrpsl-card p-4 flex gap-4">
              <Select><SelectTrigger className="w-64 mrpsl-input"><SelectValue placeholder="Register" /></SelectTrigger><SelectContent><SelectItem value="x">DANGCEM</SelectItem></SelectContent></Select>
              <Button variant="outline">Date Range</Button>
              <Button>Load Unpaid Warrants</Button>
            </Card>
          </TabsContent>

          <TabsContent value="auth"><Card className="p-12 text-center text-muted-foreground">3-level approval chain viewer.</Card></TabsContent>
          <TabsContent value="history"><Card className="p-12 text-center text-muted-foreground">Mark-off history log.</Card></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
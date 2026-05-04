"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";

export default function WarrantEnquiryPage() {
  const [showResults, setShowResults] = useState(false);
  const [type, setType] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warrant Enquiry</h1>
          <p className="text-sm text-muted-foreground mt-1">Cross-register search for dividend, interest, and return money warrants</p>
        </div>
      </div>

      <Card className="mrpsl-card p-5 space-y-4">
        <div className="space-y-2">
          <label className="mrpsl-label">Payment Type *</label>
          <Select value={type} onValueChange={(v) => setType(v || "")}>
            <SelectTrigger className="mrpsl-input max-w-xl"><SelectValue placeholder="Select payment type to search..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="div">Dividend Warrant</SelectItem>
              <SelectItem value="int">Interest Warrant</SelectItem>
              <SelectItem value="ret_app">Application Return Money</SelectItem>
              <SelectItem value="ret_rgt">Rights Return Money</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type && (
          <div className="flex gap-4 items-end animate-in fade-in">
            <div className="space-y-2"><label className="mrpsl-label">Warrant No</label><Input className="mrpsl-input w-48" /></div>
            <div className="text-sm font-bold text-muted-foreground mb-3">OR</div>
            <div className="space-y-2"><label className="mrpsl-label">Account No</label><Input className="mrpsl-input w-48" /></div>
            <Button size="lg" className="h-10 px-8" onClick={() => setShowResults(true)}><Search className="mr-2 h-4 w-4"/> Search</Button>
          </div>
        )}
      </Card>

      {showResults && (
        <Card className="mrpsl-card animate-in fade-in overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header"><tr><th className="p-3">REGISTER</th><th className="p-3">ACCOUNT NAME</th><th className="p-3">WARRANT NO</th><th className="p-3">PAY NUMBER</th><th className="p-3 text-right">HOLDINGS</th><th className="p-3 text-right">RATE PAID</th><th className="p-3 text-right">GROSS AMOUNT</th><th className="p-3 text-right">TAX AMOUNT</th><th className="p-3 text-right">NET AMOUNT</th></tr></thead>
            <tbody className="divide-y font-mono text-xs">
              <tr className="hover:bg-accent/5">
                <td className="p-3 font-sans font-medium text-primary">DANGCEM</td>
                <td className="p-3 font-sans font-medium">BINTA LAWAL</td>
                <td className="p-3 font-bold">WRT-00123</td>
                <td className="p-3 text-muted-foreground text-xs">DIV-2025-001</td>
                <td className="p-3 text-right">10,000</td>
                <td className="p-3 text-right">₦4.5000</td>
                <td className="p-3 text-right">₦45,000.00</td>
                <td className="p-3 text-right text-amber-600">₦4,500.00</td>
                <td className="p-3 text-right font-bold text-green-600 text-sm">₦40,500.00</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
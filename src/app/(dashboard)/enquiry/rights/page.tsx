"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RightsEnquiryPage() {
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rights Enquiry</h1>
          <p className="text-sm text-muted-foreground mt-1">Check shareholder rights entitlements, trades, and renunciation status</p>
        </div>
      </div>

      <Card className="mrpsl-card p-5">
        <div className="flex gap-4 items-end">
          <div className="space-y-2"><label className="mrpsl-label">Register *</label><Select><SelectTrigger className="w-48 mrpsl-input"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="x">DANGCEM</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><label className="mrpsl-label">Rights Issue</label><Select><SelectTrigger className="w-64 mrpsl-input"><SelectValue placeholder="Select Issue" /></SelectTrigger><SelectContent><SelectItem value="x">2026 Rights Issue 1-for-2</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><label className="mrpsl-label">Account No or Surname</label><Input className="mrpsl-input w-48" /></div>
          <Button size="lg" className="h-10 px-8" onClick={() => setShowResults(true)}><Search className="mr-2 h-4 w-4"/> Search</Button>
        </div>
      </Card>

      {showResults && (
        <div className="space-y-6 animate-in fade-in">
          <Card className="mrpsl-card p-5 bg-muted/10 border-l-4 border-l-primary">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">2026 Rights Issue 1-for-2</h3>
              <div className="font-mono text-sm bg-background px-2 py-1 rounded border">Qual Date: 15 Mar 2026</div>
            </div>
            <div className="text-sm text-muted-foreground">Rights Size: 12,500,000 units</div>
          </Card>

          <Card className="mrpsl-card">
            <div className="p-4 border-b bg-muted/5 flex justify-between items-center">
              <div>
                <div className="font-bold text-lg">Adaeze Okonkwo</div>
                <div className="font-mono text-sm text-muted-foreground">DANGCEM-10029</div>
              </div>
              <div className="text-right">
                <div className="text-xs mrpsl-section-title">Holdings at Qual Date</div>
                <div className="font-mono text-xl font-bold">15,000</div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-5 gap-6">
              <div className="space-y-1"><div className="text-xs uppercase font-bold text-muted-foreground">Total Rights Due</div><div className="text-2xl font-mono text-primary font-bold">7,500</div></div>
              <div className="space-y-1"><div className="text-xs uppercase font-bold text-muted-foreground">Fraction</div><div className="text-2xl font-mono text-amber-600">0.0</div></div>
              <div className="space-y-1"><div className="text-xs uppercase font-bold text-muted-foreground">Rights Taken</div><div className="text-2xl font-mono font-bold text-green-600">5,000</div></div>
              <div className="space-y-1"><div className="text-xs uppercase font-bold text-muted-foreground">Rights Traded</div><div className="text-2xl font-mono">2,500</div></div>
              <div className="space-y-1"><div className="text-xs uppercase font-bold text-muted-foreground">Rights Renounced</div><div className="text-2xl font-mono">0</div></div>
            </div>
            <div className="p-4 border-t text-xs text-muted-foreground flex justify-between">
              <span>Allotment Date: Pending</span>
              <span>Status: <span className="font-bold text-green-600">FULLY ACTIONED</span></span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
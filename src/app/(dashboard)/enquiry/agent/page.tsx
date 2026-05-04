"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AgentEnquiryPage() {
  const [query, setQuery] = useState("");
  const [showResult, setShowResult] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Enquiry</h1>
          <p className="text-sm text-muted-foreground mt-1">Search and view details for banks, stockbrokers, and collecting agents</p>
        </div>
      </div>

      <Card className="mrpsl-card p-5 max-w-2xl">
        <div className="space-y-2">
          <label className="mrpsl-label">Search Agent Name or Code</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="e.g. Zenith Bank" 
              className="mrpsl-input pl-9 text-base h-12" 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length > 2) setShowResult(true);
                else setShowResult(false);
              }}
            />
          </div>
        </div>
      </Card>

      {showResult && (
        <Card className="mrpsl-card max-w-2xl animate-in fade-in p-6 space-y-6">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold">Zenith Bank PLC</h2>
              <div className="text-sm text-muted-foreground mt-1">Agent Code: <span className="font-mono text-foreground font-bold">ZEN</span></div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">Bank</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="mrpsl-section-title border-b pb-2">Profile</h3>
              <div className="text-sm"><span className="text-muted-foreground block text-xs">Address</span>12 Victoria Island, Lagos</div>
              <div className="text-sm"><span className="text-muted-foreground block text-xs">Status</span><Badge className="bg-green-100 text-green-800 border-0 text-xs mt-1">Active</Badge></div>
            </div>
            <div className="space-y-4">
              <h3 className="mrpsl-section-title border-b pb-2">Sub-Records</h3>
              <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded border border-dashed">Signatures: None uploaded</div>
              <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded border border-dashed">Mandates: View table</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
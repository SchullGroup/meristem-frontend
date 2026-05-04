"use client";

import { useState } from "react";
import { Search, CheckCircle, Merge, Scissors, RefreshCw, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function CertificateEnquiryPage() {
  const router = useRouter();
  const { registers } = useStore();
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificate Enquiry</h1>
          <p className="text-sm text-muted-foreground mt-1">Search, verify, and action physical certificates</p>
        </div>
      </div>

      <Card className="mrpsl-card p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2"><label className="mrpsl-label">Register</label><Select><SelectTrigger className="w-48 mrpsl-input"><SelectValue placeholder="All" /></SelectTrigger><SelectContent>{registers.map(r=><SelectItem key={r.id} value={r.id}>{r.symbol}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><label className="mrpsl-label">Transfer No</label><Input className="mrpsl-input w-36" /></div>
          <div className="space-y-2"><label className="mrpsl-label">Account No</label><Input className="mrpsl-input w-36" /></div>
          <div className="space-y-2"><label className="mrpsl-label">Certificate No</label><Input className="mrpsl-input w-40" /></div>
          <div className="space-y-2"><label className="mrpsl-label">Units</label><Input placeholder="Exactly X units" className="mrpsl-input w-40" /></div>
          <div className="space-y-2"><label className="mrpsl-label">Holder Units</label><Input placeholder="≥ X units" className="mrpsl-input w-40" /></div>
          <Button size="lg" className="h-10 px-8" onClick={() => setShowResults(true)}><Search className="mr-2 h-4 w-4"/> Search</Button>
        </div>
      </Card>

      {showResults && (
        <Card className="mrpsl-card animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header"><tr><th className="p-3">CERTIFICATE NO</th><th className="p-3">ACCOUNT NO</th><th className="p-3">HOLDER NAME</th><th className="p-3">DATE ISSUED</th><th className="p-3 text-right">UNITS</th><th className="p-3 text-center">ACTIVE</th><th className="p-3 text-center" colSpan={5}>ACTIONS</th></tr></thead>
              <tbody className="divide-y font-mono text-xs">
                <tr className="hover:bg-accent/5">
                  <td className="p-3 text-primary font-bold">CERT-DANGCEM-20015</td>
                  <td className="p-3">DANGCEM-10029</td>
                  <td className="p-3 font-sans font-medium">Adaeze Okonkwo</td>
                  <td className="p-3 font-sans text-muted-foreground text-xs">14 Feb 2022</td>
                  <td className="p-3 text-right font-bold text-sm">15,000</td>
                  <td className="p-3 text-center"><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Yes</Badge></td>
                  <td className="p-3 text-center"><Button variant="ghost" size="icon" title="Verify for Replace"><CheckCircle className="h-4 w-4 text-muted-foreground"/></Button></td>
                  <td className="p-3 text-center"><Button variant="ghost" size="icon" title="Amalgamate" onClick={()=>router.push('/certificates/consolidation')}><Merge className="h-4 w-4 text-blue-600"/></Button></td>
                  <td className="p-3 text-center"><Button variant="ghost" size="icon" title="Split" onClick={()=>router.push('/certificates/split')}><Scissors className="h-4 w-4 text-amber-600"/></Button></td>
                  <td className="p-3 text-center"><Button variant="ghost" size="icon" title="Replace"><RefreshCw className="h-4 w-4 text-primary"/></Button></td>
                  <td className="p-3 text-center"><Button variant="ghost" size="icon" title="Transfer" onClick={()=>router.push('/certificates/transfer')}><ArrowRight className="h-4 w-4 text-purple-600"/></Button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
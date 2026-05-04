"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";
import { getDocType } from "@/lib/mocks/doc-types";

export default function AdmonPage() {
  const { registers } = useStore();
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [date, setDate] = useState<Date>();
  const [date2, setDate2] = useState<Date>();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estate Administration (ADMON)</h1>
          <p className="text-sm text-muted-foreground mt-1">Transfer account administration from deceased holders to their estates</p>
        </div>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="new" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">New Administration</TabsTrigger>
          <TabsTrigger value="auth" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Pending Authorisation</TabsTrigger>
          <TabsTrigger value="rev" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">Reverse Administration</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">History</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="new" className="space-y-6">
            <Card className="mrpsl-card p-6 space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">1. Deceased Account Selection</h3>
              <div className="flex gap-4">
                <Select><SelectTrigger className="w-64 mrpsl-input"><SelectValue placeholder="Register" /></SelectTrigger><SelectContent>{registers.map(r=><SelectItem key={r.id} value={r.id}>{r.symbol}</SelectItem>)}</SelectContent></Select>
                <div className="flex gap-2 flex-1"><Input placeholder="Account No or Name" className="mrpsl-input" /><Button onClick={()=>setAccountLoaded(true)}>Search</Button></div>
              </div>
              {accountLoaded && (
                <table className="w-full text-left text-sm mt-4">
                  <thead className="mrpsl-table-header"><tr><th className="p-2"><Checkbox defaultChecked/></th><th className="p-2">ACCT NO</th><th className="p-2">HOLDER NAME</th><th className="p-2">CHN</th><th className="p-2 text-right">HOLDINGS</th></tr></thead>
                  <tbody className="divide-y font-mono text-xs border-b">
                    <tr className="hover:bg-accent/5"><td className="p-2"><Checkbox defaultChecked/></td><td className="p-2">DANGCEM-1902</td><td className="p-2 font-sans font-medium text-destructive">ADE JOHN (DECEASED)</td><td className="p-2">C0000889EL</td><td className="p-2 text-right">150,000</td></tr>
                  </tbody>
                </table>
              )}
            </Card>

            {accountLoaded && (
              <Card className="mrpsl-card p-6 space-y-6 animate-in fade-in">
                <h3 className="font-semibold text-sm border-b pb-2">2. Administrator Details</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="exec" />
                  <label htmlFor="exec" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Is this an Executor (not Administrator)?
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="mrpsl-label">Probate Court *</label><Input className="mrpsl-input" /></div>
                  <div className="space-y-2"><label className="mrpsl-label">Probate Date *</label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full mrpsl-input justify-start text-left font-normal">{date ? format(date, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate}/></PopoverContent></Popover></div>
                  <div className="space-y-2"><label className="mrpsl-label">Probate Page *</label><Input className="mrpsl-input" /></div>
                  <div className="space-y-2"><label className="mrpsl-label">Lodgement Date *</label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full mrpsl-input justify-start text-left font-normal">{date2 ? format(date2, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date2} onSelect={setDate2}/></PopoverContent></Popover></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><label className="mrpsl-label">Admin Address *</label><Textarea className="mrpsl-input" rows={1} /></div>
                  <div className="space-y-2"><label className="mrpsl-label">Admin City *</label><Input className="mrpsl-input" /></div>
                  <div className="space-y-2"><label className="mrpsl-label">Admin State *</label><Select><SelectTrigger className="mrpsl-input"><SelectValue placeholder="State" /></SelectTrigger><SelectContent><SelectItem value="lagos">Lagos</SelectItem></SelectContent></Select></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="mrpsl-label">Memo</label><Textarea className="mrpsl-input" rows={1} /></div>
                  <div className="space-y-2">
                    {(() => {
                      const probate = getDocType("Probate / Letters of Administration");
                      return (
                        <DocUploadZone
                          label="Probate / Letters of Administration"
                          required
                          fileTypes={probate?.fileTypes ?? ["PDF"]}
                          maxSizeMB={probate?.maxSizeMB ?? 10}
                        />
                      );
                    })()}
                  </div>
                </div>

                <div className="p-4 bg-muted/20 border rounded-md space-y-4">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Change Holder Address to Admin Address</span><Switch defaultChecked /></div>
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Change Holder Name to Estate Name</span><Switch defaultChecked /></div>
                  <div className="bg-background border p-3 rounded text-sm text-center font-mono">
                    <span className="text-muted-foreground line-through mr-2">ADE JOHN</span> → <span className="font-bold text-primary">Estate of ADE JOHN</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="lg" onClick={()=>toast.success("Administration request submitted. Approver has been notified.")}>Submit for Authorisation</Button>
                </div>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="auth"><Card className="p-12 text-center text-muted-foreground">No pending authorisations.</Card></TabsContent>
          <TabsContent value="rev"><Card className="p-12 text-center text-muted-foreground">Reverse administration module.</Card></TabsContent>
          <TabsContent value="history"><Card className="p-12 text-center text-muted-foreground">ADMON history.</Card></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
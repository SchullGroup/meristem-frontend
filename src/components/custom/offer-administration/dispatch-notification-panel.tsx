"use client";

import { useState } from "react";
import { Mail, FileDown, Users, CheckCircle2, Loader2, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DispatchRecord {
  label: string;
  timestamp: string;
  count: number;
}

export function DispatchNotificationPanel() {
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "done">("idle");
  const [emailProgress, setEmailProgress] = useState(0);
  const [refundGenerated, setRefundGenerated] = useState(false);
  const [prelistGenerated, setPrelistGenerated] = useState(false);
  const [dispatchHistory] = useState<DispatchRecord[]>([]);

  const triggerEmails = async () => {
    setEmailStatus("sending");
    setEmailProgress(0);
    const steps = [10, 30, 55, 72, 88, 100];
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 350));
      setEmailProgress(step);
    }
    setEmailStatus("done");
    toast.success("Allotment e-notices dispatched to 78,956 shareholders.");
  };

  const generateRefundFile = () => {
    setRefundGenerated(true);
    toast.success("E-Dividend Refund File generated. Ready for dispatch to Receiving Banks.");
  };

  const generatePrelist = () => {
    setPrelistGenerated(true);
    toast.success("Issuer Pre-list report generated and ready for download.");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Execute the final outgoing dispatch tasks: notify shareholders of their allotment, send
        refund files to Receiving Banks, and generate the Issuer Pre-list for the client company.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {/* Card 1: Shareholder E-Notices */}
        <Card className="mrpsl-card p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Shareholder E-Notices</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Email each allotted shareholder their personalised allotment advice showing units
                applied, units allotted, and refund amount.
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/40 rounded-lg p-2.5">
                <p className="text-muted-foreground">Recipients</p>
                <p className="font-mono font-semibold mt-0.5">78,956</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2.5">
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium mt-0.5">
                  {emailStatus === "done" ? (
                    <span className="text-green-700">Sent</span>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                </p>
              </div>
            </div>

            {emailStatus === "sending" && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Dispatching emails…</span>
                  <span>{emailProgress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${emailProgress}%` }}
                  />
                </div>
              </div>
            )}

            {emailStatus === "done" && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>All notices sent successfully.</span>
              </div>
            )}
          </div>

          <Button
            className="w-full"
            disabled={emailStatus !== "idle"}
            onClick={triggerEmails}
          >
            {emailStatus === "sending" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Dispatching…
              </>
            ) : emailStatus === "done" ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Emails Sent
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Trigger Allotment Emails
              </>
            )}
          </Button>
        </Card>

        {/* Card 2: Refund Dispatch */}
        <Card className="mrpsl-card p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <FileDown className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Refund Dispatch</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Generate the e-dividend refund CSV file (Names, NUBANs, refund amounts) for
                dispatch to Receiving Banks to process electronic refunds.
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/40 rounded-lg p-2.5">
                <p className="text-muted-foreground">Refund Accounts</p>
                <p className="font-mono font-semibold mt-0.5">4,461</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2.5">
                <p className="text-muted-foreground">Total Refund</p>
                <p className="font-mono font-semibold mt-0.5">₦3.2B</p>
              </div>
            </div>

            {refundGenerated && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-mono">refund_dispatch_access_ipo_2024.csv</span>
                  <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Ready</Badge>
                </div>
                <div className="flex gap-2">
                  {["Access Bank", "GTBank", "Zenith Bank", "Fidelity Bank"].map((bank) => (
                    <Badge key={bank} className="bg-muted text-muted-foreground border-0 text-[10px]">
                      {bank}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant={refundGenerated ? "outline" : "default"}
              className="flex-1"
              onClick={generateRefundFile}
              disabled={refundGenerated}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {refundGenerated ? "File Generated" : "Generate Refund File"}
            </Button>
            {refundGenerated && (
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => toast.info("Download coming soon")}
              >
                Download
              </Button>
            )}
          </div>
        </Card>

        {/* Card 3: Issuer Pre-list */}
        <Card className="mrpsl-card p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-blue-700" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Issuer Pre-list</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Generate the final offer summary report showing the new capitalization and
                full shareholder structure for dispatch to the client company (issuer).
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/40 rounded-lg p-2.5">
                <p className="text-muted-foreground">Total Allottees</p>
                <p className="font-mono font-semibold mt-0.5">78,956</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2.5">
                <p className="text-muted-foreground">Units Allotted</p>
                <p className="font-mono font-semibold mt-0.5">17.77B</p>
              </div>
            </div>

            {prelistGenerated && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Pre-list ready for dispatch to Access Holdings PLC.</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant={prelistGenerated ? "outline" : "default"}
              className="flex-1"
              onClick={generatePrelist}
              disabled={prelistGenerated}
            >
              <Users className="h-4 w-4 mr-2" />
              {prelistGenerated ? "Pre-list Ready" : "Generate Issuer Pre-list"}
            </Button>
            {prelistGenerated && (
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => toast.info("Download coming soon")}
              >
                Download
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Dispatch summary footer */}
      {(emailStatus === "done" || refundGenerated || prelistGenerated) && (
        <Card className="mrpsl-card p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Dispatch Summary
          </p>
          <div className="flex flex-wrap gap-3">
            {emailStatus === "done" && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Shareholder e-notices sent (78,956)
              </div>
            )}
            {refundGenerated && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Refund file generated (4,461 accounts · ₦3.2B)
              </div>
            )}
            {prelistGenerated && (
              <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 dark:bg-blue-950/20 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Issuer pre-list ready for Access Holdings PLC
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

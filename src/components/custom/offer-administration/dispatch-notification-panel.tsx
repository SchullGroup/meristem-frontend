"use client";

import { useState } from "react";
import { Mail, FileDown, Users, CheckCircle2, Loader2, Building2, FileText, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmailPreviewModal } from "@/components/custom/shareholder-outreach-modals";

const PRELIST_DATA = {
  companyName: "Access Holdings PLC",
  offerName: "Access Holdings PLC Public Offer 2024",
  totalUnitsOffered: 17_772_612_811,
  totalUnitsApplied: 22_450_318_000,
  offerPrice: 22.5,
  totalApplicants: 78_956,
  approvedApplicants: 41_832,
  bands: [
    { label: "Band 1", minUnits: 500, maxUnits: 10_000, proRataPercent: 100 },
    { label: "Band 2", minUnits: 10_001, maxUnits: 50_000, proRataPercent: 85 },
    { label: "Band 3", minUnits: 50_001, maxUnits: 500_000, proRataPercent: 70 },
    { label: "Band 4", minUnits: 500_001, maxUnits: 5_000_000, proRataPercent: 55 },
    { label: "Band 5", minUnits: 5_000_001, maxUnits: 999_999_999, proRataPercent: 40 },
  ],
};

const avgProRata =
  PRELIST_DATA.bands.reduce((s, b) => s + b.proRataPercent, 0) /
  (PRELIST_DATA.bands.length * 100);
const allottedPct = Math.min(
  (PRELIST_DATA.totalUnitsOffered / PRELIST_DATA.totalUnitsApplied) * 100 * avgProRata,
  100,
);
const PRELIST_COMPUTED = {
  estimatedAllottedUnits: Math.floor((allottedPct / 100) * PRELIST_DATA.totalUnitsApplied),
  refundUnits: PRELIST_DATA.totalUnitsApplied - Math.floor((allottedPct / 100) * PRELIST_DATA.totalUnitsApplied),
  refundApplicants: PRELIST_DATA.totalApplicants - PRELIST_DATA.approvedApplicants,
  get estRefundValue() {
    return this.refundUnits * PRELIST_DATA.offerPrice;
  },
};

interface DispatchRecord {
  label: string;
  timestamp: string;
  count: number;
}

export function DispatchNotificationPanel() {
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "done">("idle");
  const [emailProgress, setEmailProgress] = useState(0);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [refundEmailOpen, setRefundEmailOpen] = useState(false);
  const [refundNoticesSent, setRefundNoticesSent] = useState(false);
  const [refundCsvReady, setRefundCsvReady] = useState(false);
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
  };

  const generateRefundCsv = () => {
    const MOCK_ROWS = [
      ["JOHN ADEYEMI BABATUNDE", "1234567890", "0123456789", "ACCESS BANK", "2500.00"],
      ["NGOZI CHIDINMA OKAFOR", "2345678901", "0234567890", "GTBANK", "5000.00"],
      ["SAMUEL OLUWASEUN ADELEKE", "3456789012", "0345678901", "ZENITH BANK", "1250.00"],
      ["FATIMA ABUBAKAR MUSA", "4567890123", "0456789012", "FIDELITY BANK", "7500.00"],
      ["EMEKA CHUKWUEMEKA EZE", "5678901234", "0567890123", "ACCESS BANK", "3750.00"],
    ];
    const header = "Name,Account Number,NUBAN,Bank,Refund Amount (NGN)";
    const rows = MOCK_ROWS.map((r) => r.join(",")).join("\n");
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "refund_dispatch_access_ipo_2024.csv";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setRefundCsvReady(true);
    toast.success("E-Dividend Refund CSV downloaded. Ready for dispatch to Receiving Banks.");
  };

  const generatePrelist = () => {
    setPrelistGenerated(true);
    toast.success("Issuer Pre-list report generated and ready for download.");
  };

  const downloadExcel = () => {
    const { estimatedAllottedUnits, refundUnits, estRefundValue, refundApplicants } = PRELIST_COMPUTED;
    const dateStr = new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });

    const wsData: (string | number)[][] = [
      ["ISSUER PRE-LIST REPORT"],
      ["Company", PRELIST_DATA.companyName],
      ["Offer", PRELIST_DATA.offerName],
      ["Date Generated", dateStr],
      [],
      ["OFFER SUMMARY", ""],
      ["Metric", "Value"],
      ["Total Units of Offer", PRELIST_DATA.totalUnitsOffered],
      ["Total Units Applied", PRELIST_DATA.totalUnitsApplied],
      ["Offer Price (₦)", PRELIST_DATA.offerPrice],
      ["Est. Units to Allot", estimatedAllottedUnits],
      ["Est. Units for Refund", refundUnits],
      ["Est. Refund Value (₦)", estRefundValue],
      [],
      ["APPLICANT BREAKDOWN", ""],
      ["Metric", "Count"],
      ["Total Applicants", PRELIST_DATA.totalApplicants],
      ["Approved Applicants", PRELIST_DATA.approvedApplicants],
      ["Applicants for Refund", refundApplicants],
      [],
      ["ALLOTMENT BANDS", "", "", ""],
      ["Band", "Min Applied Units", "Max Applied Units", "Pro-rata %"],
      ...PRELIST_DATA.bands.map((b) => [
        b.label,
        b.minUnits,
        b.maxUnits === 999_999_999 ? "No limit" : b.maxUnits,
        `${b.proRataPercent}%`,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 32 }, { wch: 24 }, { wch: 24 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pre-list Summary");
    XLSX.writeFile(wb, "issuer_prelist_access_holdings_2024.xlsx");
    toast.success("Excel report downloaded.");
  };

  const downloadPDF = () => {
    const { estimatedAllottedUnits, refundUnits, estRefundValue, refundApplicants } = PRELIST_COMPUTED;
    const fmt = (n: number) => n.toLocaleString();
    const dateStr = new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });

    const bandRows = PRELIST_DATA.bands
      .map(
        (b, i) => `<tr>
          <td>Band ${i + 1}</td>
          <td class="num">${fmt(b.minUnits)}</td>
          <td class="num">${b.maxUnits === 999_999_999 ? "No limit" : fmt(b.maxUnits)}</td>
          <td class="num">${b.proRataPercent}%</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Issuer Pre-list — ${PRELIST_DATA.companyName}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; padding: 48px; }
        .header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 24px; }
        .header h1 { font-size: 18px; font-weight: 700; }
        .header p { font-size: 12px; color: #555; margin-top: 2px; }
        .meta { display: flex; gap: 32px; margin-bottom: 28px; font-size: 11px; color: #666; }
        .meta strong { color: #111; font-size: 12px; display: block; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 6px 10px; background: #f5f5f5; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #ddd; }
        td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        .highlight { color: #1a56db; font-weight: 700; }
        .footer { margin-top: 40px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <h1>Issuer Pre-list Report</h1>
        <p>${PRELIST_DATA.offerName}</p>
      </div>
      <div class="meta">
        <div><strong>${PRELIST_DATA.companyName}</strong>Issuer / Client</div>
        <div><strong>${dateStr}</strong>Date Generated</div>
        <div><strong>Meristem Registrars Limited</strong>Prepared By</div>
      </div>
      <div class="section">
        <div class="section-title">Offer Summary</div>
        <table><thead><tr><th>Metric</th><th class="num">Value</th></tr></thead><tbody>
          <tr><td>Total Units of Offer</td><td class="num">${fmt(PRELIST_DATA.totalUnitsOffered)}</td></tr>
          <tr><td>Total Units Applied</td><td class="num">${fmt(PRELIST_DATA.totalUnitsApplied)}</td></tr>
          <tr><td>Offer Price</td><td class="num">₦${PRELIST_DATA.offerPrice.toFixed(2)}</td></tr>
          <tr><td>Est. Units to Allot</td><td class="num highlight">${fmt(estimatedAllottedUnits)}</td></tr>
          <tr><td>Est. Units for Refund</td><td class="num">${fmt(refundUnits)}</td></tr>
          <tr><td>Est. Refund Value</td><td class="num">₦${(estRefundValue / 1e9).toFixed(2)}B</td></tr>
        </tbody></table>
      </div>
      <div class="section">
        <div class="section-title">Applicant Breakdown</div>
        <table><thead><tr><th>Metric</th><th class="num">Count</th></tr></thead><tbody>
          <tr><td>Total Applicants</td><td class="num">${fmt(PRELIST_DATA.totalApplicants)}</td></tr>
          <tr><td>Approved Applicants</td><td class="num highlight">${fmt(PRELIST_DATA.approvedApplicants)}</td></tr>
          <tr><td>Applicants for Refund</td><td class="num">${fmt(refundApplicants)}</td></tr>
        </tbody></table>
      </div>
      <div class="section">
        <div class="section-title">Allotment Bands</div>
        <table><thead><tr><th>Band</th><th class="num">Min Applied</th><th class="num">Max Applied</th><th class="num">Pro-rata %</th></tr></thead>
        <tbody>${bandRows}</tbody></table>
      </div>
      <div class="footer">This document is confidential and prepared exclusively for ${PRELIST_DATA.companyName}. Generated by Meristem Registrars Limited.</div>
    </body></html>`;

    const w = window.open("", "_blank", "width=860,height=700");
    if (!w) { toast.error("Pop-up blocked. Please allow pop-ups and try again."); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
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
            onClick={() => setEmailPreviewOpen(true)}
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

            {refundNoticesSent && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Refund notices emailed to 4,461 holders.</span>
              </div>
            )}

            {refundCsvReady && (
              <div className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-2.5 py-2">
                <span className="text-muted-foreground font-mono truncate">refund_dispatch_access_ipo_2024.csv</span>
                <Badge className="bg-green-100 text-green-700 border-0 text-[10px] ml-2 shrink-0">Downloaded</Badge>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant={refundNoticesSent ? "outline" : "default"}
              className="flex-1"
              onClick={() => setRefundEmailOpen(true)}
              disabled={refundNoticesSent}
            >
              <Mail className="h-4 w-4 mr-2" />
              {refundNoticesSent ? "Notices Sent" : "Send Refund Notices"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={generateRefundCsv}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {refundCsvReady ? "Re-download CSV" : "Download CSV"}
            </Button>
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
              <>
                <Button variant="outline" className="shrink-0" onClick={downloadExcel} title="Download as Excel">
                  <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                  Excel
                </Button>
                <Button variant="outline" className="shrink-0" onClick={downloadPDF} title="Download as PDF">
                  <FileText className="h-4 w-4 mr-1.5" />
                  PDF
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      <EmailPreviewModal
        mode="ipo"
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        offerType="ipo"
        companyName="Access Holdings PLC"
        offerName="Access Holdings PLC Public Offer 2024"
        ratio="1:1"
        allotDate="21 October 2024"
        contactEmail="info@meristemregistrars.com"
        shareholders={[]}
        totalCount={78956}
        onSent={triggerEmails}
      />

      <EmailPreviewModal
        mode="ipo-refund"
        open={refundEmailOpen}
        onOpenChange={setRefundEmailOpen}
        offerType="ipo-refund"
        companyName="Access Holdings PLC"
        offerName="Access Holdings PLC Public Offer 2024"
        ratio="1:1"
        allotDate="21 October 2024"
        contactEmail="info@meristemregistrars.com"
        shareholders={[]}
        totalCount={4461}
        onSent={() => setRefundNoticesSent(true)}
      />

      {/* Dispatch summary footer */}
      {(emailStatus === "done" || refundNoticesSent || refundCsvReady || prelistGenerated) && (
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
            {refundNoticesSent && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Refund notices sent (4,461 holders · ₦3.2B)
              </div>
            )}
            {refundCsvReady && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Refund CSV downloaded (4,461 accounts · ₦3.2B)
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

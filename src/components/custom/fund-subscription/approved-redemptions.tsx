"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/custom/pagination-bar";

interface ApprovedRedemption {
  id: string;
  ref: string;
  fundName: string;
  holderName: string;
  accountNo: string;
  fundManagerEmail: string;
  unitsRequested: number;
  redemptionDate: Date;
  datePayable: Date;
  submittedBy: string;
  submittedAt: Date;
  approvedBy: string;
  approvedAt: Date;
  narration?: string;
  documents?: string[];
}

const MOCK_APPROVED: ApprovedRedemption[] = [
  {
    id: "ar1",
    ref: "REDM-2024-000007",
    fundName: "Stanbic IBTC Dollar Fund",
    holderName: "Oluwakemi Oladipo",
    accountNo: "FND-00789012",
    fundManagerEmail: "fm@stanbicastset.com",
    unitsRequested: 9_000,
    redemptionDate: new Date("2024-08-20"),
    datePayable: new Date("2024-08-23"),
    submittedBy: "Ngozi Eze",
    submittedAt: new Date("2024-08-19T09:00:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-19T11:30:00"),
    narration: "Partial redemption — holder requested half portfolio.",
    documents: ["Redemption_Form_Kemi.pdf", "ID_Kemi.jpg"],
  },
  {
    id: "ar2",
    ref: "REDM-2024-000008",
    fundName: "ARM Discovery Balanced Fund",
    holderName: "Chukwuemeka Obi",
    accountNo: "FND-00890123",
    fundManagerEmail: "fm@armgroup.net",
    unitsRequested: 15_000,
    redemptionDate: new Date("2024-08-22"),
    datePayable: new Date("2024-08-25"),
    submittedBy: "Tunde Bakare",
    submittedAt: new Date("2024-08-21T10:00:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-21T13:00:00"),
  },
  {
    id: "ar3",
    ref: "REDM-2024-000009",
    fundName: "Coronation Money Market Fund",
    holderName: "Aisha Bello Kabiru",
    accountNo: "FND-00901234",
    fundManagerEmail: "fm@coronationam.com",
    unitsRequested: 50_000,
    redemptionDate: new Date("2024-08-25"),
    datePayable: new Date("2024-08-28"),
    submittedBy: "Halima Mohammed",
    submittedAt: new Date("2024-08-24T08:30:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-24T10:45:00"),
    documents: ["Redemption_Form_Aisha.pdf"],
  },
  {
    id: "ar4",
    ref: "REDM-2024-000010",
    fundName: "Vetiva Griffin Fund",
    holderName: "Sunday Adeleke Omotayo",
    accountNo: "FND-00012345",
    fundManagerEmail: "fm@vetiva.com",
    unitsRequested: 7_500,
    redemptionDate: new Date("2024-08-28"),
    datePayable: new Date("2024-08-31"),
    submittedBy: "Ngozi Eze",
    submittedAt: new Date("2024-08-27T11:00:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-27T14:00:00"),
    narration: "Full exit from Vetiva Griffin position.",
  },
  {
    id: "ar5",
    ref: "REDM-2024-000011",
    fundName: "Stanbic IBTC Dollar Fund",
    holderName: "Ngozi Chidinma Okafor",
    accountNo: "FND-00123789",
    fundManagerEmail: "fm@stanbicastset.com",
    unitsRequested: 22_000,
    redemptionDate: new Date("2024-09-02"),
    datePayable: new Date("2024-09-05"),
    submittedBy: "Tunde Bakare",
    submittedAt: new Date("2024-09-01T09:45:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-09-01T12:30:00"),
  },
];

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ApprovedRedemptions() {
  const [approved] = useState<ApprovedRedemption[]>(MOCK_APPROVED);
  const [viewing, setViewing] = useState<ApprovedRedemption | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(approved.length / pageSize));
  const paginated = approved.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  /* ── Detail panel ─────────────────────────────────────────────── */
  if (viewing) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewing(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to approved list
        </button>

        <Card className="mrpsl-card p-4 border-l-4 border-l-green-500 bg-green-50/40 dark:bg-green-950/10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-300">
                Redemption Approved
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                Approved by {viewing.approvedBy} on{" "}
                {formatDate(viewing.approvedAt)}. Units deducted and Fund
                Manager notified.
              </p>
            </div>
          </div>
        </Card>

        <Card className="mrpsl-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Redemption Details — {viewing.ref}
            </p>
            <Badge className="bg-green-100 text-green-800 border-0">
              Approved
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="mrpsl-label">Fund Register</p>
              <p className="font-medium mt-0.5">{viewing.fundName}</p>
            </div>
            <div>
              <p className="mrpsl-label">Unit Holder</p>
              <p className="font-medium mt-0.5">{viewing.holderName}</p>
            </div>
            <div>
              <p className="mrpsl-label">Account No.</p>
              <p className="font-medium mt-0.5 font-mono">{viewing.accountNo}</p>
            </div>
            <div>
              <p className="mrpsl-label">Fund Manager Email</p>
              <p className="font-medium mt-0.5 break-all">{viewing.fundManagerEmail}</p>
            </div>
            <div>
              <p className="mrpsl-label">Submitted By</p>
              <p className="font-medium mt-0.5">{viewing.submittedBy}</p>
            </div>
            <div>
              <p className="mrpsl-label">Submitted At</p>
              <p className="font-medium mt-0.5">{formatDate(viewing.submittedAt)}</p>
            </div>
            <div>
              <p className="mrpsl-label">Redemption Date</p>
              <p className="font-medium mt-0.5">{formatDate(viewing.redemptionDate)}</p>
            </div>
            <div>
              <p className="mrpsl-label">Date Payable</p>
              <p className="font-medium mt-0.5">{formatDate(viewing.datePayable)}</p>
            </div>
            <div>
              <p className="mrpsl-label">Approved By</p>
              <p className="font-medium mt-0.5">{viewing.approvedBy}</p>
            </div>
            <div>
              <p className="mrpsl-label">Date Approved</p>
              <p className="font-medium mt-0.5">{formatDate(viewing.approvedAt)}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="mrpsl-label">Units Redeemed</p>
            <p className="font-mono font-bold text-2xl mt-0.5 text-destructive">
              {viewing.unitsRequested.toLocaleString()}
            </p>
          </div>

          {viewing.narration && (
            <div className="pt-2 border-t border-border text-sm">
              <p className="mrpsl-label mb-0.5">Narration</p>
              <p className="text-muted-foreground">{viewing.narration}</p>
            </div>
          )}

          {viewing.documents && viewing.documents.length > 0 && (
            <div className="pt-2 border-t border-border space-y-2">
              <p className="mrpsl-label">
                Supporting Documents ({viewing.documents.length})
              </p>
              <div className="space-y-1.5">
                {viewing.documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 text-[13px]"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono truncate">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  /* ── Approved table ───────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      <Card className="mrpsl-card p-4 border-l-4 border-l-green-500 bg-green-50/40 dark:bg-green-950/10">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-900 dark:text-green-300">
              Approved Redemptions
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
              {approved.length} redemption{approved.length !== 1 ? "s" : ""}{" "}
              approved. Click View to inspect any record.
            </p>
          </div>
        </div>
      </Card>

      {approved.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-sm text-foreground">
            No approved redemptions
          </p>
          <p className="text-xs mt-1">Approved items will appear here.</p>
        </div>
      ) : (
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">REDEMPTION NO.</th>
                  <th className="px-4 py-3 whitespace-nowrap">SHAREHOLDER</th>
                  <th className="px-4 py-3 whitespace-nowrap">FUND REGISTER</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">UNITS</th>
                  <th className="px-4 py-3 whitespace-nowrap">DATE</th>
                  <th className="px-4 py-3 whitespace-nowrap">SUBMITTED BY</th>
                  <th className="px-4 py-3 whitespace-nowrap">STATUS</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.map((red) => (
                  <tr
                    key={red.id}
                    className="mrpsl-table-row hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground whitespace-nowrap">
                      {red.ref}
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {red.holderName}
                    </td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                      {red.fundName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                      {red.unitsRequested.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatDate(red.redemptionDate)}
                    </td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                      {red.submittedBy}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-green-100 text-green-800 border-0 whitespace-nowrap">
                        Approved
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewing(red)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            total={approved.length}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(0);
            }}
          />
        </Card>
      )}
    </div>
  );
}

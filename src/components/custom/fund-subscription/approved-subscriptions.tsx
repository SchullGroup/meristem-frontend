"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/custom/pagination-bar";

interface ApprovedSubscription {
  id: string;
  ref: string;
  fundName: string;
  subscriberType: "New" | "Existing";
  holderName: string;
  accountNo: string;
  email: string;
  fundManagerEmail: string;
  unitsSubscribed: number;
  amountPaid: number | null;
  submittedBy: string;
  submittedAt: Date;
  approvedBy: string;
  approvedAt: Date;
  nextOfKin?: string;
  documents?: string[];
}

const MOCK_APPROVED: ApprovedSubscription[] = [
  {
    id: "a1",
    ref: "SUB-2024-000001",
    fundName: "Stanbic IBTC Dollar Fund",
    subscriberType: "New",
    holderName: "Adebayo Oluwaseun Peters",
    accountNo: "FND-00112233",
    email: "adebayo@email.com",
    fundManagerEmail: "fm@stanbicastset.com",
    unitsSubscribed: 25_000,
    amountPaid: 1_250_000,
    submittedBy: "Ngozi Eze",
    submittedAt: new Date("2024-08-05T09:00:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-05T11:30:00"),
    nextOfKin: "Adebimpe Peters (Spouse)",
    documents: ["Application_Form_Peters.pdf", "Utility_Bill_Peters.jpg"],
  },
  {
    id: "a2",
    ref: "SUB-2024-000002",
    fundName: "ARM Discovery Balanced Fund",
    subscriberType: "Existing",
    holderName: "Chinwe Okafor-Nwosu",
    accountNo: "FND-00234567",
    email: "chinwe@email.com",
    fundManagerEmail: "fm@armgroup.net",
    unitsSubscribed: 10_000,
    amountPaid: 250_000,
    submittedBy: "Tunde Bakare",
    submittedAt: new Date("2024-08-06T10:15:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-06T13:00:00"),
  },
  {
    id: "a3",
    ref: "SUB-2024-000003",
    fundName: "Coronation Money Market Fund",
    subscriberType: "New",
    holderName: "Emeka Nwachukwu",
    accountNo: "FND-00345678",
    email: "emeka@email.com",
    fundManagerEmail: "fm@coronationam.com",
    unitsSubscribed: 60_000,
    amountPaid: null,
    submittedBy: "Halima Mohammed",
    submittedAt: new Date("2024-08-07T08:30:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-07T10:45:00"),
    nextOfKin: "Chidera Nwachukwu (Brother)",
    documents: [
      "Application_Form_Emeka.pdf",
      "National_ID_Emeka.jpg",
      "Bank_Statement_Emeka.pdf",
    ],
  },
  {
    id: "a4",
    ref: "SUB-2024-000004",
    fundName: "Vetiva Griffin Fund",
    subscriberType: "New",
    holderName: "Fatima Garba Abubakar",
    accountNo: "FND-00456789",
    email: "fatima@email.com",
    fundManagerEmail: "fm@vetiva.com",
    unitsSubscribed: 80_000,
    amountPaid: 4_000_000,
    submittedBy: "Ngozi Eze",
    submittedAt: new Date("2024-08-08T09:45:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-08T14:00:00"),
  },
  {
    id: "a5",
    ref: "SUB-2024-000005",
    fundName: "Stanbic IBTC Dollar Fund",
    subscriberType: "Existing",
    holderName: "Ibrahim Usman Hassan",
    accountNo: "FND-00567890",
    email: "ibrahim@email.com",
    fundManagerEmail: "fm@stanbicastset.com",
    unitsSubscribed: 15_000,
    amountPaid: 750_000,
    submittedBy: "Tunde Bakare",
    submittedAt: new Date("2024-08-09T11:00:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-09T13:30:00"),
  },
  {
    id: "a6",
    ref: "SUB-2024-000006",
    fundName: "ARM Discovery Balanced Fund",
    subscriberType: "New",
    holderName: "Blessing Chisom Amaechi",
    accountNo: "FND-00678901",
    email: "blessing@email.com",
    fundManagerEmail: "fm@armgroup.net",
    unitsSubscribed: 30_000,
    amountPaid: 750_000,
    submittedBy: "Halima Mohammed",
    submittedAt: new Date("2024-08-12T09:20:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-12T12:00:00"),
    documents: ["Application_Form_Blessing.pdf"],
  },
  {
    id: "a7",
    ref: "SUB-2024-000007",
    fundName: "Coronation Money Market Fund",
    subscriberType: "Existing",
    holderName: "Oluwakemi Oladipo",
    accountNo: "FND-00789012",
    email: "kemi@email.com",
    fundManagerEmail: "fm@coronationam.com",
    unitsSubscribed: 45_000,
    amountPaid: 2_250_000,
    submittedBy: "Ngozi Eze",
    submittedAt: new Date("2024-08-13T14:00:00"),
    approvedBy: "Tunde Adeyemi (Team Lead)",
    approvedAt: new Date("2024-08-13T16:15:00"),
  },
];

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ApprovedSubscriptions() {
  const [approved] = useState<ApprovedSubscription[]>(MOCK_APPROVED);
  const [viewing, setViewing] = useState<ApprovedSubscription | null>(null);
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
                Subscription Approved
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                This subscription was approved by {viewing.approvedBy} on{" "}
                {formatDate(viewing.approvedAt)}. Fund Manager has been notified.
              </p>
            </div>
          </div>
        </Card>

        <Card className="mrpsl-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Subscription Details — {viewing.ref}
            </p>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  viewing.subscriberType === "New"
                    ? "bg-blue-100 text-blue-800 border-0"
                    : "bg-violet-100 text-violet-800 border-0"
                }
              >
                {viewing.subscriberType}{" "}
                {viewing.subscriberType === "New" ? "Subscriber" : "Unit Holder"}
              </Badge>
              <Badge className="bg-green-100 text-green-800 border-0">
                Approved
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="mrpsl-label">Fund Register</p>
              <p className="font-medium mt-0.5">{viewing.fundName}</p>
            </div>
            <div>
              <p className="mrpsl-label">Holder Name</p>
              <p className="font-medium mt-0.5">{viewing.holderName}</p>
            </div>
            <div>
              <p className="mrpsl-label">Account No.</p>
              <p className="font-medium mt-0.5 font-mono">{viewing.accountNo}</p>
            </div>
            <div>
              <p className="mrpsl-label">Email</p>
              <p className="font-medium mt-0.5 break-all">{viewing.email}</p>
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
              <p className="mrpsl-label">Date Submitted</p>
              <p className="font-medium mt-0.5">{formatDate(viewing.submittedAt)}</p>
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

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <p className="mrpsl-label">Units Subscribed</p>
              <p className="font-mono font-bold text-xl mt-0.5">
                {viewing.unitsSubscribed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="mrpsl-label">Amount Paid</p>
              <p className="font-mono font-bold text-xl mt-0.5">
                {viewing.amountPaid != null ? (
                  `₦${viewing.amountPaid.toLocaleString()}`
                ) : (
                  <span className="text-muted-foreground text-base font-normal">
                    Not provided
                  </span>
                )}
              </p>
            </div>
          </div>

          {viewing.nextOfKin && (
            <div className="pt-2 border-t border-border text-sm">
              <p className="mrpsl-label mb-0.5">Next of Kin</p>
              <p className="font-medium">{viewing.nextOfKin}</p>
            </div>
          )}

          {viewing.documents && viewing.documents.length > 0 && (
            <div className="pt-2 border-t border-border space-y-2">
              <p className="mrpsl-label">Supporting Documents ({viewing.documents.length})</p>
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
              Approved Subscriptions
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
              {approved.length} subscription{approved.length !== 1 ? "s" : ""}{" "}
              approved. Click View to inspect any record.
            </p>
          </div>
        </div>
      </Card>

      {approved.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-sm text-foreground">No approved subscriptions</p>
          <p className="text-xs mt-1">Approved items will appear here.</p>
        </div>
      ) : (
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">SUB NO.</th>
                  <th className="px-4 py-3 whitespace-nowrap">SHAREHOLDER</th>
                  <th className="px-4 py-3 whitespace-nowrap">TYPE</th>
                  <th className="px-4 py-3 whitespace-nowrap">FUND REGISTER</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">UNITS</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">AMOUNT PAID</th>
                  <th className="px-4 py-3 whitespace-nowrap">DATE SUBMITTED</th>
                  <th className="px-4 py-3 whitespace-nowrap">SUBMITTED BY</th>
                  <th className="px-4 py-3 whitespace-nowrap">STATUS</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.map((sub) => (
                  <tr
                    key={sub.id}
                    className="mrpsl-table-row hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground whitespace-nowrap">
                      {sub.ref}
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {sub.holderName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          sub.subscriberType === "New"
                            ? "bg-blue-100 text-blue-800 border-0 whitespace-nowrap"
                            : "bg-violet-100 text-violet-800 border-0 whitespace-nowrap"
                        }
                      >
                        {sub.subscriberType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                      {sub.fundName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                      {sub.unitsSubscribed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                      {sub.amountPaid != null ? (
                        `₦${sub.amountPaid.toLocaleString()}`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatDate(sub.submittedAt)}
                    </td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                      {sub.submittedBy}
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
                        onClick={() => setViewing(sub)}
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

"use client";

import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MultiDocUpload } from "@/components/custom/multi-doc-upload";
import { useGetAccount } from "@/hooks/useAccountMaintenance";
import {
  NibssReviewRow,
  ShareholderAccount,
} from "@/types/account-maintenance";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Mail,
  Phone,
  CreditCard,
  Hash,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────

function fullName(acct: ShareholderAccount) {
  return [acct.firstName, acct.lastName, acct.otherNames]
    .filter(Boolean)
    .join(" ");
}

function isDifferent(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const norm = (s: string | null | undefined) =>
    (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  return norm(a) !== norm(b);
}

interface ComparisonField {
  label: string;
  csvValue: string;
  dbValue: string;
  differs: boolean;
}

// Only fields that exist on both the NIBSS mandate row and the shareholder
// registry record get a diff — mandate-only fields (broker, symbol, units,
// amount…) have no registry counterpart and are shown separately below.
function buildComparison(
  row: NibssReviewRow,
  account: ShareholderAccount,
): ComparisonField[] {
  return [
    {
      label: "Subscriber Name",
      csvValue: row.subscriberName,
      dbValue: fullName(account),
      differs: isDifferent(row.subscriberName, fullName(account)),
    },
    {
      label: "CHN",
      csvValue: row.chn,
      dbValue: account.chn,
      differs: isDifferent(row.chn, account.chn),
    },
    {
      label: "Email",
      csvValue: row.email,
      dbValue: account.email,
      differs: isDifferent(row.email, account.email),
    },
    {
      label: "Phone",
      csvValue: row.phone,
      dbValue: account.phone,
      differs: isDifferent(row.phone, account.phone),
    },
    {
      label: "Bank Account No",
      csvValue: row.bankAccountNumber,
      dbValue: account.bankAccountNumber,
      differs: isDifferent(row.bankAccountNumber, account.bankAccountNumber),
    },
    {
      label: "NIN",
      csvValue: row.nin,
      dbValue: account.nin,
      differs: isDifferent(row.nin, account.nin),
    },
    {
      label: "TIN",
      csvValue: row.tin,
      dbValue: account.tin ?? "",
      differs: isDifferent(row.tin, account.tin),
    },
    {
      label: "Gender",
      csvValue: row.gender,
      dbValue: account.gender,
      differs: isDifferent(row.gender, account.gender),
    },
  ];
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  "Subscriber Name": <User className="h-3.5 w-3.5" />,
  CHN: <Hash className="h-3.5 w-3.5" />,
  Email: <Mail className="h-3.5 w-3.5" />,
  Phone: <Phone className="h-3.5 w-3.5" />,
  "Bank Account No": <CreditCard className="h-3.5 w-3.5" />,
  NIN: <ShieldCheck className="h-3.5 w-3.5" />,
  TIN: <Hash className="h-3.5 w-3.5" />,
  Gender: <User className="h-3.5 w-3.5" />,
};

// ── Component ──────────────────────────────────────────────────────────────

interface NibssReviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: NibssReviewRow | null;
  onApprove: (documents: { name: string; url: string }[]) => void;
  onReject: () => void;
}

export function NibssReviewDrawer({
  open,
  onOpenChange,
  row,
  onApprove,
  onReject,
}: NibssReviewDrawerProps) {
  // LIVE (once a BVN-search endpoint exists):
  // const { data: accountsRes, isLoading, isError, refetch } = useGetAccounts(
  //   { q: row?.bvn ?? "" },
  //   { enabled: !!row?.bvn },
  // );
  // const account = accountsRes?.data?.data?.[0] ?? null;

  // MOCK: every mock row's `bvn` is seeded as 9033387545, a real seeded
  // account number — reused here so the existing account-number lookup
  // resolves to a real registry record for this demo.
  const {
    data: accountRes,
    isLoading,
    isError,
    refetch,
  } = useGetAccount(row?.bvn ?? "");

  const account = accountRes?.data ?? null;

  const comparison = useMemo(() => {
    if (!row || !account) return null;
    return buildComparison(row, account);
  }, [row, account]);

  const [docs, setDocs] = useState<{ name: string; url: string }[]>([]);
  const hasDocs = docs.length > 0;

  if (!row) return null;

  const isDecided = row.decision === "accepted" || row.decision === "rejected";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0 gap-0">
        <SheetHeader className="border-b p-4 shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <SheetTitle>
                {row.subscriberName || "Unknown Shareholder"}
              </SheetTitle>
              <SheetDescription className="font-mono">
                Account {row.accountNumber || "—"} · BVN {row.bvn || "—"}
              </SheetDescription>
            </div>
            {isDecided && (
              <Badge
                className={cn(
                  "text-[10px]",
                  row.decision === "accepted"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700",
                )}
              >
                {row.decision === "accepted" ? (
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                ) : (
                  <XCircle className="h-3 w-3 mr-0.5" />
                )}
                {row.decision === "accepted" ? "Approved" : "Rejected"}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Existing DB Record */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Existing Registry Record
            </h4>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : isError || !account ? (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3 text-[13px]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  {isError
                    ? "Failed to load registry record."
                    : "No registry record found for this BVN."}
                </span>
                <Button variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                <Field label="Name" value={fullName(account)} />
                <Field label="Account No" value={account.accountNumber} mono />
                <Field label="CHN" value={account.chn} mono />
                <Field label="Bank" value={account.bankName} />
                <Field
                  label="Bank Acct"
                  value={account.bankAccountNumber}
                  mono
                />
                <Field label="BVN" value={account.bvn} mono />
                <Field label="NIN" value={account.nin} mono />
                <Field label="TIN" value={account.tin ?? ""} mono />
                <Field label="Email" value={account.email} />
                <Field label="Phone" value={account.phone} mono />
                <Field label="Holder Type" value={account.holderType} />
                <Field label="Gender" value={account.gender} />
              </div>
            )}
          </section>

          {/* KYC Changes (CSV data vs existing) */}
          {comparison && (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                KYC Changes
              </h4>
              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] text-[12px] bg-muted/50 px-3 py-1.5 text-muted-foreground font-medium">
                  <span>Field</span>
                  <span className="text-right">New Value</span>
                </div>
                {comparison.map((f) => (
                  <div
                    key={f.label}
                    className={cn(
                      "grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 border-t text-[13px]",
                      f.differs && "bg-amber-50/50",
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {FIELD_ICONS[f.label]}
                      <span className="truncate">{f.label}</span>
                      {f.differs && (
                        <span className="text-[10px] text-amber-600 font-medium shrink-0">
                          changed
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "font-mono text-[12px]",
                          f.differs
                            ? "text-amber-800 font-semibold"
                            : "text-muted-foreground",
                        )}
                      >
                        {f.csvValue || "—"}
                      </span>
                      {f.differs && (
                        <div className="text-[10px] text-muted-foreground line-through">
                          {f.dbValue || "—"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mandate Details — no registry counterpart to diff against */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Mandate Details
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
              <Field label="Broker" value={row.broker} />
              <Field
                label="Stockbroker Code"
                value={row.stockbrokerCode}
                mono
              />
              <Field label="Sort Code" value={row.bankSortCode} mono />
              <Field label="Symbol" value={row.symbol} mono />
              <Field label="Units" value={row.units} mono />
              <Field label="Amount" value={row.amount} mono />
              <Field label="Next of Kin" value={row.nextKin} />
              <Field label="Remark" value={row.remark} />
            </div>
          </section>

          {/* Supporting Documents */}
          <section>
            <MultiDocUpload
              onChange={setDocs}
              title="Supporting Documents"
              subtitle="Upload at least one document before approving"
              folderName="nibssBulk"
            />
          </section>
        </div>

        <div className="flex items-center gap-3 p-4 border-t shrink-0 bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onReject}
            disabled={isLoading}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onApprove(docs)}
            disabled={isLoading || !hasDocs}
            title={
              !hasDocs
                ? "Upload at least one supporting document before approving"
                : undefined
            }
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Approve
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Tiny field display ─────────────────────────────────────────────────────

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn("text-[13px] truncate", mono && "font-mono text-[12px]")}
        title={value}
      >
        {value || "—"}
      </div>
    </div>
  );
}

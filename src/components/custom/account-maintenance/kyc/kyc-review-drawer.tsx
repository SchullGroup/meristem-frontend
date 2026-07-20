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
import { KycReviewRow, ShareholderAccount } from "@/types/account-maintenance";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
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

/**
 * Compare two values loosely — case-insensitive, trimmed, collapsed
 * whitespace, null-safe.  Returns `true` when they differ enough to flag.
 */
function isDifferent(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const norm = (s: string | null | undefined) =>
    (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  return norm(a) !== norm(b);
}

// ── Field definition for the comparison grid ───────────────────────────────

interface ComparisonField {
  label: string;
  csvValue: string;
  dbValue: string;
  differs: boolean;
}

function buildComparison(
  row: KycReviewRow,
  account: ShareholderAccount,
): ComparisonField[] {
  return [
    {
      label: "Shareholder Name",
      csvValue: row.shareholderName,
      dbValue: fullName(account),
      differs: isDifferent(row.shareholderName, fullName(account)),
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
      label: "Address",
      csvValue: row.address,
      dbValue: account.address,
      differs: isDifferent(row.address, account.address),
    },
    {
      label: "Bank Name",
      csvValue: row.bankName,
      dbValue: account.bankName,
      differs: isDifferent(row.bankName, account.bankName),
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
      label: "BVN",
      csvValue: row.bvn,
      dbValue: account.bvn,
      differs: isDifferent(row.bvn, account.bvn),
    },
  ];
}

// ── Icons per field label ──────────────────────────────────────────────────

const FIELD_ICONS: Record<string, React.ReactNode> = {
  "Shareholder Name": <User className="h-3.5 w-3.5" />,
  Email: <Mail className="h-3.5 w-3.5" />,
  Phone: <Phone className="h-3.5 w-3.5" />,
  Address: <MapPin className="h-3.5 w-3.5" />,
  "Bank Name": <Building2 className="h-3.5 w-3.5" />,
  "Bank Account No": <CreditCard className="h-3.5 w-3.5" />,
  NIN: <Hash className="h-3.5 w-3.5" />,
  BVN: <ShieldCheck className="h-3.5 w-3.5" />,
};

// ── Component ──────────────────────────────────────────────────────────────

interface KycReviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: KycReviewRow | null;
  /** Call after user clicks Approve (docs already uploaded to storage). */
  onApprove: (documents: { name: string; url: string }[]) => void;
  onReject: () => void;
}

export function KycReviewDrawer({
  open,
  onOpenChange,
  row,
  onApprove,
  onReject,
}: KycReviewDrawerProps) {
  const {
    data: accountRes,
    isLoading,
    isError,
    refetch,
  } = useGetAccount(row?.accountNumber ?? "");

  const account = accountRes?.data ?? null;

  // Build comparison only when account is loaded.
  const comparison = useMemo(() => {
    if (!row || !account) return null;
    return buildComparison(row, account);
  }, [row, account]);

  // MultiDocUpload reports its current set of successfully uploaded docs.
  const [docs, setDocs] = useState<{ name: string; url: string }[]>([]);
  const hasDocs = docs.length > 0;

  if (!row) return null;

  const isDecided = row.decision === "accepted" || row.decision === "rejected";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0 gap-0">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <SheetHeader className="border-b p-4 shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <SheetTitle>
                {row.shareholderName || "Unknown Shareholder"}
              </SheetTitle>
              <SheetDescription className="font-mono">
                Account {row.accountNumber}
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

        {/* ── Body (scrollable) ─────────────────────────────────────────── */}
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
                    : "No registry record found for this account."}
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
                <Field label="Email" value={account.email} />
                <Field label="Phone" value={account.phone} mono />
                <Field label="Address" value={account.address} />
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

          {/* Supporting Documents */}
          <section>
            <MultiDocUpload
              onChange={setDocs}
              title="Supporting Documents"
              subtitle="Upload at least one document before approving"
              folderName="kycBulk"
            />
          </section>
        </div>

        {/* ── Footer actions ────────────────────────────────────────────── */}
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

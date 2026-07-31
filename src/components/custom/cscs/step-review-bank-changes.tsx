"use client";

import { useMemo } from "react";
import { ArrowRight, ExternalLink, Info, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useCscsBankChanges } from "@/hooks/useCscsPipeline";
import type { CscsBankChangeItem } from "@/actions/cscsPipelineActions";

const FIELD_LABEL: Record<string, string> = {
  BANK_NAME: "Bank Name",
  ACCOUNT_NUMBER: "Account Number",
  BVN: "BVN",
};

const FIELD_COLOR: Record<string, string> = {
  BANK_NAME: "bg-blue-100 text-blue-800",
  ACCOUNT_NUMBER: "bg-purple-100 text-purple-800",
  BVN: "bg-red-100 text-red-800",
};

const KYC_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  KYC_PENDING: { label: "KYC Pending", cls: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Approved", cls: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700" },
  FAILED: { label: "Failed", cls: "bg-red-100 text-red-700" },
};

interface StepReviewBankChangesProps {
  batchRef: string;
  onProceed: () => void;
}

export function StepReviewBankChanges({ batchRef, onProceed }: StepReviewBankChangesProps) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useCscsBankChanges(batchRef);

  const changes = useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;
  const holderCount = data?.holderCount ?? 0;

  // Group by CHN so per-holder rows stay together.
  const groupedEntries = useMemo(() => {
    const grouped = changes.reduce<Record<string, CscsBankChangeItem[]>>((acc, c) => {
      acc[c.chn] = [...(acc[c.chn] ?? []), c];
      return acc;
    }, {});
    return Object.entries(grouped);
  }, [changes]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Review Bank Changes</h3>
        <p className="text-sm text-muted-foreground mt-1">
          The following records have updates to their bank details (BVN, Bank Name, Account Number).
          To view more details, go to the KYC mandate page.
        </p>
      </div>

      {/* Info banner — read-only notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong>This screen is read-only.</strong> Bank mandate changes (BVN, Bank Name, Account
          Number) are <em>never</em> auto-applied from a CSCS batch — they have been raised as KYC
          update requests for the normal maker-checker approval workflow.{" "}
          <strong>The only field this pipeline writes directly is the STATE column (Step 2).</strong>
        </p>
      </div>

      {/* Summary */}
      {!isLoading && !isError && (
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> bank mandate change{total !== 1 ? "s" : ""} detected across{" "}
          <span className="font-semibold text-foreground">{holderCount}</span> shareholder{holderCount !== 1 ? "s" : ""}.
        </p>
      )}

      {/* Changes table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">SHAREHOLDER NAME</th>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">FIELD CHANGED</th>
                <th className="px-4 py-3">OLD VALUE</th>
                <th className="px-4 py-3">NEW VALUE (FROM CSCS)</th>
                <th className="px-4 py-3">KYC STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Detecting bank changes…
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-red-600 text-sm">
                    {(error as Error)?.message ?? "Failed to load bank changes."}
                  </td>
                </tr>
              )}
              {!isLoading && !isError && groupedEntries.map(([chn, rows]) =>
                rows.map((c, idx) => {
                  const badge = KYC_STATUS_BADGE[c.kycStatus] ?? KYC_STATUS_BADGE.KYC_PENDING;
                  return (
                    <tr key={c.id} className="mrpsl-table-row">
                      {idx === 0 && (
                        <td className="px-4 py-3 font-medium" rowSpan={rows.length}>{c.holderName}</td>
                      )}
                      {idx === 0 && (
                        <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground" rowSpan={rows.length}>{chn}</td>
                      )}
                      {idx === 0 && (
                        <td className="px-4 py-3" rowSpan={rows.length}>
                          <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">{c.register}</Badge>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-[12px] ${FIELD_COLOR[c.field] ?? "bg-gray-100 text-gray-800"}`}>
                          {FIELD_LABEL[c.field] ?? c.field}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground line-through">{c.oldValue ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[13px] font-semibold text-amber-700">{c.newValue ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-[12px] ${badge.cls}`}>{badge.label}</Badge>
                      </td>
                    </tr>
                  );
                }),
              )}
              {!isLoading && !isError && groupedEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    No bank mandate changes detected in this batch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => router.push("/certificates/kyc")}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View KYC Mandate
        </Button>
        <Button onClick={onProceed}>
          Proceed to Batch Transactions
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

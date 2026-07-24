"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKycRequests } from "@/hooks/useKycModule";
import { KYC_REGISTERS } from "./seed-data";
import { requestStatusClass, requestStatusLabel, ageingClass, formatDate } from "./helpers";
import { DetailHeader } from "./detail-header";
import { InboxReview } from "./inbox-review";

const FIELD_OPTIONS: [string, string][] = [
  ["bankName", "Bank Name"],
  ["nuban", "Account No."],
  ["address", "Address"],
  ["bvn", "BVN"],
];

export function CscsInbox({ onBack }: { onBack: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [register, setRegister] = useState("");
  const [field, setField] = useState("");
  const [status, setStatus] = useState("");

  const { data: rows = [], isLoading } = useKycRequests({
    channel: "CSCS",
    registerSymbol: register || undefined,
    field: field || undefined,
    status: (status || undefined) as never,
  });

  if (openId) {
    return <InboxReview id={openId} onBack={() => setOpenId(null)} backLabel="Back to CSCS Inbox" />;
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to KYC Home"
        onBack={onBack}
        title="CSCS Mandate Requests"
        subtitle="Auto-ingested from the CSCS update feed — review changed fields and submit for approval."
      />

      <div className="flex flex-wrap gap-3 items-end">
        <Filter label="Register" value={register} onChange={setRegister} placeholder="All Registers"
          options={KYC_REGISTERS.map((r) => [r.symbol, r.symbol])} />
        <Filter label="Field Changed" value={field} onChange={setField} placeholder="All Fields" options={FIELD_OPTIONS} />
        <Filter label="Status" value={status} onChange={setStatus} placeholder="All Statuses"
          options={[["DRAFT", "New"], ["SUBMITTED", "Submitted"], ["REJECTED", "Rejected"]]} />
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REQUEST ID</th>
                <th className="px-4 py-3">SHAREHOLDER</th>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">FIELDS CHANGED</th>
                <th className="px-4 py-3">DATE RECEIVED</th>
                <th className="px-4 py-3">CSCS REF</th>
                <th className="px-4 py-3 text-center">AGEING</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    No CSCS mandate requests.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-muted-foreground">{r.requestId}</td>
                    <td className="px-4 py-3 font-medium">{r.holderName}</td>
                    <td className="px-4 py-3 font-mono">{r.chn}</td>
                    <td className="px-4 py-3 font-semibold">{r.registerSymbol}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.changes.filter((c) => c.oldValue !== c.newValue).map((c) => c.label).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(r.receivedDate)}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{r.externalRef}</td>
                    <td className={`px-4 py-3 text-center ${ageingClass(r.ageingDays)}`}>{r.ageingDays}d</td>
                    <td className="px-4 py-3">
                      <Badge className={`border-0 text-[12px] ${requestStatusClass(r.status)}`}>
                        {requestStatusLabel(r.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" onClick={() => setOpenId(r.id)}>
                        {r.status === "DRAFT" ? "Review" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: [string, string][];
}) {
  return (
    <div className="flex flex-col">
      <label className="mrpsl-label">{label}</label>
      <Select value={value} onValueChange={(v) => onChange(v || "")}>
        <SelectTrigger className="w-44 mrpsl-input">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{placeholder}</SelectItem>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

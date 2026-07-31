"use client";

import type { ComponentType } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Landmark,
  CreditCard,
  Hash,
  Fingerprint,
  IdCard,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ShareholderSearchResult } from "@/types/enquiry";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DORMANT: "bg-gray-100 text-gray-600",
  CAUTIONED: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  DORMANT: "Inactive",
  CAUTIONED: "Cautioned",
  SUSPENDED: "Suspended",
};

function displayName(s: ShareholderSearchResult) {
  const parts = [s.lastName, s.firstName].filter(Boolean).join(", ");
  const full = [parts, s.otherNames].filter(Boolean).join(" ");
  return full || s.name || "—";
}

function Field({
  icon: Icon,
  label,
  value,
  mono = true,
  full = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  mono?: boolean;
  full?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={`text-[13px] mt-0.5 break-words ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

export function ShareholderResultCard({
  shareholder: s,
  onClick,
}: {
  shareholder: ShareholderSearchResult;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className="mrpsl-card p-4 cursor-pointer transition-colors hover:bg-muted/30 hover:border-primary/40 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-[15px] leading-tight truncate">{displayName(s)}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            {s.registerSymbol}
            {s.holderType ? ` · ${s.holderType}` : ""}
          </div>
        </div>
        <Badge
          className={`${STATUS_BADGE[s.status] || "bg-gray-100 text-gray-800"} border-0 text-[11px] font-semibold shrink-0`}
        >
          {STATUS_LABEL[s.status] || s.status || "—"}
        </Badge>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-3">
        <Field icon={Hash} label="Account No" value={s.accountNumber} />
        <Field icon={Hash} label="CHN" value={s.chn} />
        <Field icon={CreditCard} label="CSCS Account" value={s.cscsAccountNo} />
        <Field icon={Fingerprint} label="BVN" value={s.bvn} />
        <Field icon={IdCard} label="NIN" value={s.nin} />
        <Field icon={Phone} label="Phone" value={s.phone} />
        <Field icon={Mail} label="Email" value={s.email} mono={false} />
        <Field icon={Landmark} label="Bank" value={s.bank} mono={false} />
        <Field
          icon={MapPin}
          label="Address"
          value={[s.address, s.state].filter(Boolean).join(", ")}
          mono={false}
          full
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="text-[13px]">
          <span className="font-mono font-semibold tabular-nums">
            {(s.holdings ?? 0).toLocaleString()}
          </span>{" "}
          <span className="text-muted-foreground text-[12px]">units held</span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View profile <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Card>
  );
}

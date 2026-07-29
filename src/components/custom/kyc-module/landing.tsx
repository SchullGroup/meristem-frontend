"use client";

import { useState } from "react";
import {
  UserRound,
  Landmark,
  Database,
  Globe,
  ClipboardCheck,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";
import { useKycRequests, useKycRequest } from "@/hooks/useKycModule";
import {
  CHANNEL_SHORT,
  channelBadgeClass,
  requestStatusClass,
  requestStatusLabel,
  formatDate,
} from "./helpers";
import { DetailHeader } from "./detail-header";
import { DiffView } from "./diff-view";
import { DocList } from "./doc-list";

export type KycView = "standard" | "nibss" | "cscs" | "mericonnect" | "hod";

const TILES: {
  key: KycView;
  title: string;
  desc: string;
  icon: typeof UserRound;
  enabled: boolean;
}[] = [
  { key: "standard", title: "Standard KYC Update", desc: "Officer-initiated search · full KYC profile", icon: UserRound, enabled: true },
  { key: "nibss", title: "NIBSS Live Mandate", desc: "Single or bulk · bank details only", icon: Landmark, enabled: true },
  { key: "cscs", title: "CSCS Mandate", desc: "Auto-ingested from CSCS feed · review/verify", icon: Database, enabled: true },
  { key: "mericonnect", title: "KYC Portal (Mericonnect)", desc: "Auto-pulled from Mericonnect · review/verify", icon: Globe, enabled: true },
];

export function KycLanding({ onNavigate }: { onNavigate: (v: KycView) => void }) {
  const { currentUser } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: myRequests = [], isLoading } = useKycRequests({
    status: ["DRAFT", "SUBMITTED", "RETURNED"],
  });
  const mine = currentUser?.email
    ? myRequests.filter((r) => r.submittedBy === currentUser.email)
    : myRequests;

  if (openId) {
    return <RequestReadOnly id={openId} onBack={() => setOpenId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Choose a channel to raise a KYC change. All channels converge into one approval pipeline
          (Draft → Submitted → HOD Review → Approved → Pushed to Dividend Mandate). Maker-checker is
          enforced — you cannot approve your own submission.
        </p>
        <Button className="gap-1.5" onClick={() => onNavigate("hod")}>
          <ClipboardCheck className="h-4 w-4" /> HOD Approval Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TILES.map((t) => (
          <button
            key={t.key}
            disabled={!t.enabled}
            onClick={() => t.enabled && onNavigate(t.key)}
            className="text-left rounded-xl border p-5 transition-colors hover:border-primary/50 hover:bg-muted/20"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <t.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mt-3">{t.title}</h3>
            <p className="text-[13px] text-muted-foreground mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-bold mb-3">My Work Queue</h3>
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">REQUEST ID</th>
                  <th className="px-4 py-3">CHANNEL</th>
                  <th className="px-4 py-3">SHAREHOLDER</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">DATE</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : mine.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      You have no draft, submitted or returned requests.
                    </td>
                  </tr>
                ) : (
                  mine.map((r) => (
                    <tr key={r.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-mono text-muted-foreground">{r.requestId}</td>
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-[12px] ${channelBadgeClass(r.channel)}`}>
                          {CHANNEL_SHORT[r.channel]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{r.holderName}</td>
                      <td className="px-4 py-3 font-semibold">{r.registerSymbol}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.submittedDate)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-[12px] ${requestStatusClass(r.status)}`}>
                          {requestStatusLabel(r.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="outline" onClick={() => setOpenId(r.id)}>
                          View
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
    </div>
  );
}

function RequestReadOnly({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: record, isLoading } = useKycRequest(id);

  if (isLoading || !record) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to KYC Home" onBack={onBack} title="Loading…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to KYC Home"
        onBack={onBack}
        title={`Request — ${record.requestId}`}
        subtitle={`${CHANNEL_SHORT[record.channel]} · ${record.holderName} (${record.registerSymbol})`}
        actions={
          <Badge className={`border-0 ${requestStatusClass(record.status)}`}>
            {requestStatusLabel(record.status)}
          </Badge>
        }
      />

      {record.status === "RETURNED" && record.rejectionReason && (
        <div className="p-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-800 text-[13px] flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong>Returned for correction:</strong> {record.rejectionReason}
          </div>
        </div>
      )}

      <DiffView changes={record.changes} />
      <DocList documents={record.documents} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { FileText, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { KycDoc } from "@/types/kyc-module";

/**
 * Attached-document list with an inline preview panel (image/PDF) — reviewers
 * see documents without downloading. Mock urls render a placeholder frame.
 */
export function DocList({ documents }: { documents: KycDoc[] }) {
  const [active, setActive] = useState<KycDoc | null>(documents[0] ?? null);

  return (
    <Card className="mrpsl-card p-4">
      <div className="mrpsl-section-title mb-3">
        Supporting Documents ({documents.length})
      </div>
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents attached.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          <div className="space-y-1.5">
            {documents.map((d, i) => (
              <button
                key={`${d.name}-${i}`}
                onClick={() => setActive(d)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[13px] transition-colors ${
                  active === d ? "bg-primary/10 text-primary" : "hover:bg-muted/40"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{d.name}</span>
              </button>
            ))}
          </div>
          <div className="border border-border/60 rounded-xl bg-muted/20 min-h-64 flex items-center justify-center overflow-hidden">
            {active ? (
              active.url && active.url !== "#" ? (
                <iframe title={active.name} src={active.url} className="w-full h-72" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm py-10">
                  <Eye className="h-6 w-6" />
                  <span>Inline preview — {active.name}</span>
                  <span className="text-[12px]">(mock document)</span>
                </div>
              )
            ) : (
              <span className="text-sm text-muted-foreground">Select a document to preview</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

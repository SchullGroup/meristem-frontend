"use client";

import { Card } from "@/components/ui/card";
import type { KycFieldChange } from "@/types/kyc-module";

/**
 * Old-vs-new comparison table used by the HOD individual review (and reusable
 * by CSCS/Mericonnect in Phase 2). Changed rows are highlighted.
 */
export function DiffView({ changes }: { changes: KycFieldChange[] }) {
  if (changes.length === 0) {
    return (
      <Card className="mrpsl-card p-6 text-center text-sm text-muted-foreground">
        No field-level changes on this request.
      </Card>
    );
  }
  return (
    <Card className="mrpsl-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-4 py-3">FIELD</th>
              <th className="px-4 py-3">EXISTING RECORD</th>
              <th className="px-4 py-3">NEW VALUE</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {changes.map((c) => {
              const changed = c.oldValue !== c.newValue;
              return (
                <tr key={c.field} className={changed ? "bg-amber-50/50" : ""}>
                  <td className="px-4 py-3 font-medium">{c.label}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{c.oldValue || "—"}</td>
                  <td className="px-4 py-3 font-mono">
                    <span className={changed ? "font-semibold text-amber-800" : ""}>
                      {c.newValue || "—"}
                    </span>
                    {changed && <span className="ml-2 text-[11px] text-amber-600">← changed</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

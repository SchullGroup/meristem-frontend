"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { MandateShareholder } from "@/types/mandate-payment-flow";
import { SOURCE_SHORT, sourceBadgeClass } from "./helpers";

interface ShareholderTableProps {
  shareholders: MandateShareholder[];
  // Selection (used by the 2nd ICU editable view — §6.6)
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: () => void;
  // Show a per-row Source column (used by the Create Batch preview).
  showSource?: boolean;
  emptyLabel?: string;
  maxHeight?: string;
}

// Shareholder detail table used inside every batch sub-screen (spec §8).
export function ShareholderTable({
  shareholders,
  selectable = false,
  selectedIds,
  onToggle,
  onToggleAll,
  showSource = false,
  emptyLabel = "No shareholders in this batch.",
  maxHeight = "max-h-96",
}: ShareholderTableProps) {
  const allSelected =
    shareholders.length > 0 &&
    shareholders.every((s) => selectedIds?.has(s.id));

  const colCount = 8 + (selectable ? 1 : 0) + (showSource ? 1 : 0);

  return (
    <div
      className={`border border-border/60 rounded-xl overflow-hidden ${maxHeight} overflow-y-auto`}
    >
      <table className="w-full text-left text-sm">
        <thead className="mrpsl-table-header sticky top-0 z-10 bg-muted">
          <tr>
            {selectable && (
              <th className="px-3 py-2 w-10">
                <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
              </th>
            )}
            <th className="px-3 py-2">NAME</th>
            <th className="px-3 py-2">REGISTER</th>
            <th className="px-3 py-2">SHARE ACCT NO</th>
            <th className="px-3 py-2">NEW ACCOUNT NO</th>
            <th className="px-3 py-2">BANK</th>
            <th className="px-3 py-2">BVN</th>
            <th className="px-3 py-2">PAYMENT NO</th>
            <th className="px-3 py-2 text-right">AMOUNT (₦)</th>
            {showSource && <th className="px-3 py-2 text-center">SOURCE</th>}
          </tr>
        </thead>
        <tbody className="divide-y text-[13px]">
          {shareholders.length === 0 ? (
            <tr>
              <td
                colSpan={colCount}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                {emptyLabel}
              </td>
            </tr>
          ) : (
            shareholders.map((s, i) => {
              const checked = selectedIds?.has(s.id) ?? false;
              return (
                <tr
                  key={s.id}
                  className={checked ? "bg-primary/5" : undefined}
                >
                  {selectable && (
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => onToggle?.(s.id)}
                      />
                    </td>
                  )}
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2 font-semibold">{s.registerSymbol}</td>
                  <td className="px-3 py-2 font-mono">{s.oldAccountNumber}</td>
                  <td className="px-3 py-2 font-mono">{s.newAccountNumber}</td>
                  <td className="px-3 py-2">{s.bank}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {s.bvn}
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {s.amount.toLocaleString()}.00
                  </td>
                  {showSource && (
                    <td className="px-3 py-2 text-center">
                      <Badge
                        className={`border-0 text-[11px] ${sourceBadgeClass(s.source)}`}
                      >
                        {SOURCE_SHORT[s.source]}
                      </Badge>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

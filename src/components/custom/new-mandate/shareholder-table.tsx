"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { MandateShareholder } from "@/types/mandate-payment-flow";

interface ShareholderTableProps {
  shareholders: MandateShareholder[];
  // Selection (used by the 2nd ICU editable view — §6.6)
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: () => void;
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
  emptyLabel = "No shareholders in this batch.",
  maxHeight = "max-h-96",
}: ShareholderTableProps) {
  const allSelected =
    shareholders.length > 0 &&
    shareholders.every((s) => selectedIds?.has(s.id));

  const colCount = selectable ? 9 : 8;

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
            <th className="px-3 py-2">NEW ACCOUNT NO</th>
            <th className="px-3 py-2">BANK</th>
            <th className="px-3 py-2">BVN</th>
            <th className="px-3 py-2">ADDRESS</th>
            <th className="px-3 py-2">DIVIDEND NO</th>
            <th className="px-3 py-2 text-right">AMOUNT (₦)</th>
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
            shareholders.map((s) => {
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
                  <td className="px-3 py-2 font-mono">{s.newAccountNumber}</td>
                  <td className="px-3 py-2">{s.bank}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {s.bvn}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[220px] truncate" title={s.address}>
                    {s.address}
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {s.dividendNumber}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {s.amount.toLocaleString()}.00
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

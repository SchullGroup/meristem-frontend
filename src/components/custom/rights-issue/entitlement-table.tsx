"use client";

import { Shareholder } from "@/types/rights";

export function ShholderTableHead() {
  return (
    <thead className="mrpsl-table-header">
      <tr>
        <th className="px-3 py-2.5 text-left">#</th>
        <th className="px-3 py-2.5 text-left">SHAREHOLDER NAME</th>
        <th className="px-3 py-2.5 text-left">CHN</th>
        <th className="px-3 py-2.5 text-left">STOCKBROKER CODE</th>
        <th className="px-3 py-2.5 text-left">ADDRESS</th>
        <th className="px-3 py-2.5 text-left">BANK NAME</th>
        <th className="px-3 py-2.5 text-left">BANK ACCOUNT NO</th>
        <th className="px-3 py-2.5 text-right">UNITS HELD</th>
        <th className="px-3 py-2.5 text-center">RIGHTS RATIO</th>
        <th className="px-3 py-2.5 text-right">RIGHTS DUE</th>
        <th className="px-3 py-2.5 text-right">AMOUNT DUE (₦)</th>
      </tr>
    </thead>
  );
}

export function ShholderRows({
  rows,
  pageStart,
}: {
  rows: Shareholder[];
  pageStart: number;
}) {
  return (
    <>
      {rows.map((s, i) => {
        const gi = pageStart + i;
        return (
          <tr key={s.shareholderId} className="mrpsl-table-row">
            <td className="px-3 py-2.5 text-muted-foreground">{gi + 1}</td>
            <td className="px-3 py-2.5 font-medium">{s.name}</td>
            <td className="px-3 py-2.5 font-mono text-xs">{s.chn}</td>
            <td className="px-3 py-2.5 font-mono">{s.brokerCode}</td>
            <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[160px]">
              {s.address}
            </td>
            <td className="px-3 py-2.5">{s.bankName}</td>
            <td className="px-3 py-2.5 font-mono">{s.bankAccount}</td>
            <td className="px-3 py-2.5 text-right font-mono">{s.unitsHeld}</td>
            <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
              {s.rightsRatio}
            </td>
            <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-600">
              {s.rightsDue}
            </td>
            <td className="px-3 py-2.5 text-right font-mono font-bold">
              ₦{s.amountPayable}
            </td>
          </tr>
        );
      })}
    </>
  );
}

export function ShholderTfoot({
  rows,
  total,
}: {
  rows: Shareholder[];
  total: number;
}) {
  return (
    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-xs">
      <tr>
        <td
          colSpan={9}
          className="px-3 py-2.5 text-right text-muted-foreground"
        >
          PAGE TOTALS ({total.toLocaleString()} total shareholders)
        </td>
        <td className="px-3 py-2.5 text-right text-blue-600">
          {rows.reduce((a, r) => a + r.rightsDue, 0).toLocaleString()}
        </td>
        <td className="px-3 py-2.5 text-right">
          ₦{rows.reduce((a, r) => a + r.amountPayable, 0).toLocaleString()}
        </td>
      </tr>
    </tfoot>
  );
}

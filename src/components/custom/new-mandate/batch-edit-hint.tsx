"use client";

import { Info } from "lucide-react";

// Info banner shown above the editable shareholder table so the initiator knows
// they can exclude (and add) shareholders before the batch moves on.
export function BatchEditHint() {
  return (
    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-[13px] text-blue-800">
      <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
      <span>
        Tick shareholders and click <strong>Exclude Selected</strong> to leave
        them out of this batch, or use <strong>Add Shareholder</strong> to
        include more. Excluded shareholders&apos; dividends remain outstanding
        and can be added to a later batch.
      </span>
    </div>
  );
}

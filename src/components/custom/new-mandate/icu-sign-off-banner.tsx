"use client";

import { ShieldCheck } from "lucide-react";

// Threshold/sign-off banner retained from the current ICU screen, adapted to the
// batch context (spec §9). Reused at both ICU checkpoints.
export function IcuSignOffBanner({ ordinal }: { ordinal: "1st" | "2nd" }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <ShieldCheck className="h-4 w-4 text-blue-700" />
      </div>
      <div>
        <div className="text-sm font-bold text-blue-900">
          ICU Sign-Off Required ({ordinal})
        </div>
        <div className="text-[13px] text-blue-700">
          Batches below exceed the Tier 3 threshold and require ICU officer
          sign-off before payment release.
        </div>
      </div>
    </div>
  );
}

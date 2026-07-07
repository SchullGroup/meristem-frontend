"use client";

import { IPOBatchSubscribersTab } from "./ipo-batch-subscribers-tab";

export function DisapprovedAccountsTab() {
  return (
    <IPOBatchSubscribersTab
      type="DISAPPROVED"
      label="Disapproved Accounts"
      colorScheme={{
        amount: "text-amber-600",
        badge: "bg-amber-100",
        badgeText: "text-amber-800",
        border: "border-amber-500",
      }}
    />
  );
}

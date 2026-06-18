"use client";

import { IPOBatchSubscribersTab } from "./ipo-batch-subscribers-tab";

export function InvalidAccountsTab() {
  return (
    <IPOBatchSubscribersTab
      type="INVALID"
      label="Invalid Accounts"
      colorScheme={{
        amount: "text-red-600",
        badge: "bg-red-100",
        badgeText: "text-red-800",
        border: "border-red-500",
      }}
    />
  );
}

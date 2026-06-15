"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, pendingApprovals, emailJobs } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  if (!currentUser) return null;

  const generateBreadcrumbs = () => {
    if (pathname === "/") return "Dashboard Home";
    const parts = pathname.split("/").filter(Boolean);
    return parts
      .map((part) => {
        if (part === "cscs-updates") return "CSCS Updates";
        if (part === "ipo") return "IPO / Public Offer";
        if (part === "kyc-update") return "KYC Update";
        if (part === "admon") return "Administration (ADMON)";
        if (part === "notifications") return "Notifications";
        return part
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      })
      .join(" / ");
  };

  const pendingCount = pendingApprovals.filter(
    (a) => a.status === "PENDING",
  ).length;
  const activeEmailJobs = emailJobs.filter(
    (j) => j.status === "sending",
  ).length;
  const myRejections = pendingApprovals.filter(
    (a) => a.status === "REJECTED" && a.initiatorId === currentUser.id,
  );
  const badgeCount = myRejections.length + pendingCount + activeEmailJobs;

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur flex items-center gap-4 px-6 z-30 sticky top-0">
      {/* Breadcrumb */}
      <div className="text-sm font-medium text-muted-foreground shrink-0">
        {generateBreadcrumbs()}
      </div>

      {/* Search — fills remaining space */}
      <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border/60 rounded-lg px-3 h-9 max-w-xl hover:border-border transition-colors focus-within:border-primary/50 focus-within:bg-primary/[0.02] focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setSearchQuery("");
              return;
            }
            if (e.key === "Enter" && searchQuery.trim()) {
              router.push(
                `/enquiry/shareholders?q=${encodeURIComponent(searchQuery.trim())}`,
              );
              setSearchQuery("");
            }
          }}
          placeholder="Search holders, registers, certificates..."
          className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/50 text-foreground"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-muted-foreground/60 hover:text-muted-foreground transition-colors text-[13px] shrink-0"
          >
            esc
          </button>
        )}
      </div>

      {/* Notifications bell — navigates to /notifications */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground shrink-0 ml-auto"
        onClick={() => router.push("/notifications")}
      >
        <Bell className="h-4 w-4" />
        {badgeCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[11px] rounded-full flex items-center justify-center"
          >
            {badgeCount}
          </Badge>
        )}
      </Button>
    </header>
  );
}

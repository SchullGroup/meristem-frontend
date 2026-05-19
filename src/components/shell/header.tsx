"use client";

import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import type { EmailJob } from "@/lib/types";

function EmailJobRow({ job }: { job: EmailJob }) {
  const pct =
    job.totalRecipients > 0
      ? Math.round((job.sent / job.totalRecipients) * 100)
      : 0;

  const elapsed = job.completedAt
    ? formatElapsed(job.startedAt, job.completedAt)
    : formatElapsed(job.startedAt);

  return (
    <div className="px-4 py-3 border-b last:border-0">
      <div className="flex items-start gap-2">
        {job.status === "sending" ? (
          <Loader2 className="h-4 w-4 text-[#1a6b3c] mt-0.5 shrink-0 animate-spin" />
        ) : job.status === "complete" ? (
          <CheckCircle2 className="h-4 w-4 text-[#1a6b3c] mt-0.5 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold truncate">
              {job.companyName}
            </span>
            <span className="text-[12px] text-muted-foreground shrink-0">
              {elapsed}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {job.offerName} &middot; {job.totalRecipients.toLocaleString()}{" "}
            recipients
          </p>

          {job.status === "sending" && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1a6b3c] transition-all duration-300 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[12px] text-muted-foreground">
                {job.sent.toLocaleString()} /{" "}
                {job.totalRecipients.toLocaleString()} sent ({pct}%)
              </p>
            </div>
          )}

          {job.status === "complete" && (
            <div className="mt-1.5 flex items-center gap-3 text-[12px]">
              <span className="text-[#1a6b3c] font-medium">
                {job.sent.toLocaleString()} delivered
              </span>
              {job.bounced > 0 && (
                <span className="text-amber-600 font-medium">
                  {job.bounced.toLocaleString()} bounced
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatElapsed(from: string, to?: string): string {
  const ms = new Date(to ?? Date.now()).getTime() - new Date(from).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function Header() {
  const pathname = usePathname();
  const { currentUser, pendingApprovals, emailJobs } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

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
  const badgeCount = pendingCount + activeEmailJobs;

  const sortedJobs = [...emailJobs].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

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
          onKeyDown={(e) => e.key === "Escape" && setSearchQuery("")}
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

      {/* Notifications — right-aligned */}
      <Popover open={notifOpen} onOpenChange={setNotifOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground shrink-0 ml-auto"
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
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-80 p-0 shadow-lg"
        >
          {/* Panel header */}
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-[13px] font-semibold">
              Email Notifications
            </span>
            {activeEmailJobs > 0 && (
              <Badge className="ml-auto bg-[#1a6b3c]/10 text-[#1a6b3c] border-0 text-[11px]">
                {activeEmailJobs} sending
              </Badge>
            )}
          </div>

          {/* Job list */}
          <div className="max-h-80 overflow-y-auto">
            {sortedJobs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-[13px] text-muted-foreground">
                  No email jobs yet
                </p>
                <p className="text-[12px] text-muted-foreground/70 mt-1">
                  Email dispatch progress will appear here
                </p>
              </div>
            ) : (
              sortedJobs.map((job) => <EmailJobRow key={job.id} job={job} />)
            )}
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
}

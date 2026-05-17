"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, Clock, Mail, FileText, AlertTriangle,
  RefreshCw, Bell, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NotifType =
  | "approval_pending"
  | "approval_approved"
  | "approval_rejected"
  | "cscs_batch"
  | "email_dispatch"
  | "transfer_complete"
  | "system_alert";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  module: string;
  timestamp: string;
  read: boolean;
  actionHref?: string;
  comment?: string;
}

const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "approval_rejected",
    title: "Dematerialisation Request Rejected",
    body: "Your dematerialisation request for WAPCO-00443 has been rejected by the Compliance Officer.",
    module: "Certificate Management",
    timestamp: "2026-05-15T08:14:00Z",
    read: false,
    actionHref: "/approvals",
    comment: "Certificate number could not be verified against CSCS records. Please re-submit with a valid CSCS reference.",
  },
  {
    id: "n2",
    type: "approval_pending",
    title: "Transfer Request Awaiting Your Approval",
    body: "A share transfer for Adaeze Okafor (ZENITH-00812) is pending Tier-1 approval.",
    module: "Certificate Management",
    timestamp: "2026-05-15T07:52:00Z",
    read: false,
    actionHref: "/approvals",
  },
  {
    id: "n3",
    type: "approval_approved",
    title: "Dividend Declaration Approved",
    body: "Your Q1 2026 dividend declaration for ACCESS BANK PLC has been fully approved and is ready for payment processing.",
    module: "Dividend Management",
    timestamp: "2026-05-14T16:30:00Z",
    read: false,
    actionHref: "/dividends/declaration",
  },
  {
    id: "n4",
    type: "email_dispatch",
    title: "Email Dispatch Complete — ACCESS BANK PLC",
    body: "Annual General Meeting notice sent to 48,204 shareholders. 47,891 delivered, 313 bounced.",
    module: "Offer Administration",
    timestamp: "2026-05-14T14:05:00Z",
    read: true,
  },
  {
    id: "n5",
    type: "approval_pending",
    title: "Bonus Issue Awaiting Your Approval",
    body: "A bonus issue allocation for DANGOTE CEMENT PLC is pending Tier-2 approval.",
    module: "Offer Administration",
    timestamp: "2026-05-14T11:20:00Z",
    read: false,
    actionHref: "/approvals",
  },
  {
    id: "n6",
    type: "cscs_batch",
    title: "CSCS Batch Upload Processed",
    body: "325 CSCS update records from the GTB Principal register have been validated and applied successfully.",
    module: "Certificate Management",
    timestamp: "2026-05-14T09:00:00Z",
    read: true,
    actionHref: "/certificates/cscs-updates",
  },
  {
    id: "n7",
    type: "approval_rejected",
    title: "KYC Update Request Rejected",
    body: "Your KYC update request for Chukwuemeka Adeyemi has been rejected by the Data Manager.",
    module: "Account Maintenance",
    timestamp: "2026-05-13T15:44:00Z",
    read: true,
    actionHref: "/approvals",
    comment: "Uploaded NIN slip is illegible. Please provide a clear scan of the document.",
  },
  {
    id: "n8",
    type: "transfer_complete",
    title: "Share Transfer Completed",
    body: "Transfer of 5,000 units from Ngozi Eze to Emeka Obi (FIRSTBANK-00291) has been completed and certificate issued.",
    module: "Certificate Management",
    timestamp: "2026-05-13T13:10:00Z",
    read: true,
    actionHref: "/certificates/transfer",
  },
  {
    id: "n9",
    type: "approval_approved",
    title: "Account Consolidation Approved",
    body: "Consolidation of 3 accounts for Mrs. Funke Adeleke (GTBANK-00154) has been approved and processed.",
    module: "Account Maintenance",
    timestamp: "2026-05-13T10:30:00Z",
    read: true,
  },
  {
    id: "n10",
    type: "system_alert",
    title: "System Maintenance Scheduled",
    body: "The CPA system will undergo scheduled maintenance on Saturday 17 May 2026 from 00:00 – 04:00 WAT. All pending operations should be completed before this window.",
    module: "System",
    timestamp: "2026-05-12T17:00:00Z",
    read: true,
  },
  {
    id: "n11",
    type: "email_dispatch",
    title: "Email Dispatch Complete — ZENITH BANK PLC",
    body: "Rights issue application notice sent to 91,330 shareholders. 90,112 delivered, 1,218 bounced.",
    module: "Offer Administration",
    timestamp: "2026-05-12T12:20:00Z",
    read: true,
  },
  {
    id: "n12",
    type: "cscs_batch",
    title: "CSCS Batch Upload — Validation Errors",
    body: "14 records in the latest WAPCO batch failed CSCS validation and have been flagged for review.",
    module: "Certificate Management",
    timestamp: "2026-05-11T09:45:00Z",
    read: true,
    actionHref: "/certificates/cscs-updates",
  },
];

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; iconClass: string; dotClass: string }> = {
  approval_pending:  { icon: Clock,         iconClass: "text-amber-500",  dotClass: "bg-amber-500"  },
  approval_approved: { icon: CheckCircle2,  iconClass: "text-green-600",  dotClass: "bg-green-500"  },
  approval_rejected: { icon: XCircle,       iconClass: "text-red-500",    dotClass: "bg-red-500"    },
  cscs_batch:        { icon: RefreshCw,     iconClass: "text-blue-500",   dotClass: "bg-blue-500"   },
  email_dispatch:    { icon: Mail,          iconClass: "text-primary",    dotClass: "bg-primary"    },
  transfer_complete: { icon: FileText,      iconClass: "text-primary",    dotClass: "bg-primary"    },
  system_alert:      { icon: AlertTriangle, iconClass: "text-orange-500", dotClass: "bg-orange-500" },
};

function formatTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type FilterTab = "all" | "unread" | "approvals" | "email" | "system";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const filtered = notifications.filter(n => {
    if (activeTab === "unread")    return !n.read;
    if (activeTab === "approvals") return n.type.startsWith("approval");
    if (activeTab === "email")     return n.type === "email_dispatch";
    if (activeTab === "system")    return n.type === "system_alert" || n.type === "cscs_batch";
    return true;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "unread",    label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { key: "approvals", label: "Approvals" },
    { key: "email",     label: "Email" },
    { key: "system",    label: "System" },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2 text-sm" onClick={markAllRead}>
            <Check className="h-3.5 w-3.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No notifications</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1">Nothing here yet for this filter</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(notif => {
            const cfg = TYPE_CONFIG[notif.type];
            const Icon = cfg.icon;

            return (
              <div
                key={notif.id}
                onClick={() => {
                  markRead(notif.id);
                  if (notif.actionHref) router.push(notif.actionHref);
                }}
                className={cn(
                  "flex gap-4 px-4 py-4 rounded-xl border transition-colors cursor-pointer group",
                  notif.read
                    ? "bg-background border-border/50 hover:bg-muted/30"
                    : "bg-primary/[0.02] border-primary/15 hover:bg-primary/[0.04]"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  notif.read ? "bg-muted" : "bg-muted/60"
                )}>
                  <Icon className={cn("h-4 w-4", cfg.iconClass)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {!notif.read && (
                        <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dotClass)} />
                      )}
                      <p className={cn(
                        "text-[13px] leading-snug truncate",
                        notif.read ? "font-medium text-foreground" : "font-semibold text-foreground"
                      )}>
                        {notif.title}
                      </p>
                    </div>
                    <span className="text-[12px] text-muted-foreground shrink-0 mt-px">
                      {formatTime(notif.timestamp)}
                    </span>
                  </div>

                  <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2">
                    {notif.body}
                  </p>

                  {notif.comment && (
                    <p className="text-[12px] text-red-600 italic mt-1.5 line-clamp-2">
                      &ldquo;{notif.comment}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[11px] h-5 px-2 rounded-md font-normal">
                      {notif.module}
                    </Badge>
                    {notif.actionHref && (
                      <span className="text-[12px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        View details →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

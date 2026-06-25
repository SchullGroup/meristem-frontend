"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  FileText,
  AlertTriangle,
  RefreshCw,
  Bell,
  Check,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGetNotifications, useGetNotificationSummary, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/hooks/useNotifications";
import { useStore } from "@/lib/store";
import { NotificationsParams } from "@/actions/notificationActions";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaginationBar } from "@/components/custom/pagination-bar";

type NotifType =
  | "approval_pending"
  | "approval_approved"
  | "approval_rejected"
  | "cscs_batch"
  | "email_dispatch"
  | "transfer_complete"
  | "system_alert";

const TYPE_CONFIG: Record<
  NotifType,
  { icon: React.ElementType; iconClass: string; dotClass: string }
> = {
  approval_pending: {
    icon: Clock,
    iconClass: "text-amber-500",
    dotClass: "bg-amber-500",
  },
  approval_approved: {
    icon: CheckCircle2,
    iconClass: "text-green-600",
    dotClass: "bg-green-500",
  },
  approval_rejected: {
    icon: XCircle,
    iconClass: "text-red-500",
    dotClass: "bg-red-500",
  },
  cscs_batch: {
    icon: RefreshCw,
    iconClass: "text-blue-500",
    dotClass: "bg-blue-500",
  },
  email_dispatch: {
    icon: Mail,
    iconClass: "text-primary",
    dotClass: "bg-primary",
  },
  transfer_complete: {
    icon: FileText,
    iconClass: "text-primary",
    dotClass: "bg-primary",
  },
  system_alert: {
    icon: AlertTriangle,
    iconClass: "text-orange-500",
    dotClass: "bg-orange-500",
  },
};

const normalizeType = (type: string): NotifType => {
  const mapping: Record<string, NotifType> = {
    APPROVAL_PENDING: "approval_pending",
    APPROVAL_APPROVED: "approval_approved",
    APPROVAL_REJECTED: "approval_rejected",
    CSCS_BATCH: "cscs_batch",
    EMAIL_DISPATCH: "email_dispatch",
    TRANSFER_COMPLETE: "transfer_complete",
    SYSTEM_ALERT: "system_alert",
  };
  return mapping[type] || "system_alert"; // fallback
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
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

type FilterTab = "all" | "unread" | "approvals" | "email" | "system";

export default function NotificationsPage() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser)
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)

  const queryParams = useMemo<NotificationsParams>(() => {
    const base = { performedBy: currentUser?.email };
    switch (activeTab) {
      case "unread":
        return { ...base, read: false };
      case "approvals":
        return { ...base, type: "APPROVAL_PENDING" };
      case "email":
        return { ...base, type: "EMAIL_DISPATCH" };
      case "system":
        return { ...base, type: "SYSTEM_ALERT" };
      default: // "all"
        return base;
    }
  }, [activeTab, currentUser?.email]);


  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    error: notificationsError,
  } = useGetNotifications(
    {
      ...queryParams,
      page,
      size,
    },
  );

  const { data: summaryData } = useGetNotificationSummary(currentUser?.email);

  // Mutations
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const unreadCount = summaryData?.data?.unreadCount ?? 0;

  // Transform API notifications to our UI format
  const notifications = (notificationsData?.data?.content || []).map((n) => ({
    ...n,
    type: normalizeType(n.type),
    actionHref: n.actionUrl || undefined,
    timestamp: n.createdAt,
  }));


  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    {
      key: "unread",
      label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
    },
    { key: "approvals", label: "Approvals" },
    { key: "email", label: "Email" },
    { key: "system", label: "System" },
  ];

  // Handlers
  const handleMarkRead = (id: string, actionUrl?: string) => {
    const notif = notifications.find((n) => n.id === id);
    // If already read, just navigate
    if (notif?.read) {
      if (actionUrl) router.push(actionUrl);
      return;
    }

    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    markReadMutation.mutate(
      { id, performedBy: currentUser?.email },
      {
        onSuccess: () => {
          toast.success("Notification marked as read")
          if (actionUrl) router.push(actionUrl);
        },
        onError: () => {
          toast.error("Failed to mark notification as read")
        }
      }
    );
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate({ performedBy: currentUser?.email }, {
      onSuccess: () => {
        toast.success("Notifications marked as read")
      },
      onError: () => {
        toast.error("Failed to mark notifications as read")
      }
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-sm"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}        >
            <Check className="h-3.5 w-3.5" />
            {markAllReadMutation.isPending ? "Processing..." : "Mark all as read"}
          </Button>
        )}
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {
        notificationsLoading ? (
          <div className="flex items-center justify-center p-8 bg-background rounded-lg border mrpsl-card max-w-3xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground font-medium">Fetching notifications...</span>
          </div>
        ) : notificationsError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Notifications Fetch Failed</AlertTitle>
            <AlertDescription>
              {notificationsError instanceof Error ? notificationsError.message : "Could not retrieve notifications."}
            </AlertDescription>
          </Alert>
        ) :
          notificationsData?.data?.content && notificationsData?.data?.content.length > 0 ?
            (
              <div className="space-y-1">
                {notifications.map((notif) => {
                  const cfg = TYPE_CONFIG[notif.type as NotifType] || TYPE_CONFIG.system_alert;
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex gap-4 px-4 py-4 rounded-xl border transition-colors group",
                        notif.read
                          ? "bg-background border-border/50 hover:bg-muted/30"
                          : "bg-primary/2 border-primary/15 hover:bg-primary/4"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          notif.read ? "bg-muted" : "bg-muted/60"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", cfg.iconClass)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {!notif.read && (
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full shrink-0",
                                  cfg.dotClass
                                )}
                              />
                            )}
                            <p
                              className={cn(
                                "text-[13px] leading-snug truncate",
                                notif.read
                                  ? "font-medium text-foreground"
                                  : "font-semibold text-foreground"
                              )}
                            >
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

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-[11px] h-5 px-2 rounded-md font-normal"
                          >
                            {notif.module}
                          </Badge>

                          {notif.actionable && notif.actionHref && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-primary text-[12px] font-medium gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRead(notif.id, notif.actionHref);
                              }}
                            >
                              View details {markReadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>) :
            (
              <div className="py-16 text-center">
                <Bell className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No notifications
                </p>
                <p className="text-[13px] text-muted-foreground/60 mt-1">
                  Nothing here yet for this filter
                </p>
              </div>)}

      {notificationsData && notificationsData?.data?.totalPages > 1 && <PaginationBar
        page={page}
        pageSize={size}
        totalPages={notificationsData?.data?.totalPages || 1}
        onPageChange={setPage}
        onPageSizeChange={setSize}
        total={notificationsData?.data?.totalElements || 0}
      />}
    </div>
  );
}

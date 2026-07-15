"use client";

import { Lock, LockKeyhole } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type LockStatus = "editable" | "evidenceRequired" | "lockedPendingApproval";

interface FieldLockBadgeProps {
  status: LockStatus;
  className?: string;
}

export function FieldLockBadge({ status, className }: FieldLockBadgeProps) {
  if (status === "editable") return null;

  const config: Record<
    LockStatus,
    { icon: typeof Lock; color: string; tooltip: string }
  > = {
    evidenceRequired: {
      icon: Lock,
      color: "text-amber-600",
      tooltip: "Requires cover letter before submission.",
    },
    lockedPendingApproval: {
      icon: LockKeyhole,
      color: "text-muted-foreground",
      tooltip:
        "This field has a pending KYC change awaiting approval and cannot be edited again until resolved.",
    },
    editable: { icon: Lock, color: "", tooltip: "" }, // unreachable, satisfies type
  };

  const { icon: Icon, color, tooltip } = config[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              "inline-flex items-center shrink-0 cursor-help",
              color,
              className,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-56 text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

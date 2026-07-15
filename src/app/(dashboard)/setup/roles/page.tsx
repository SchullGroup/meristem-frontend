"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Lock,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Check,
  Minus,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useRoles } from "@/hooks/useRoles";
import { Role } from "@/lib/types";
import {
  CREATE_ROLE,
  UPDATE_PERMISSIONS,
  DELETE_ROLE,
  EDIT_ROLE,
  PATCH_ROLE,
} from "@/actions/rolesAction";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SubmoduleDef {
  id: string;
  label: string;
  adminOnly?: boolean;
  actions: {
    read: string;
    write?: string;
    approve?: string[];
  };
}

interface ModuleDef {
  id: string;
  label: string;
  colorClass: string;
  adminOnly?: boolean;
  submodules: SubmoduleDef[];
}

const PERMISSION_MATRIX: ModuleDef[] = [
  {
    id: "setup",
    label: "Setup",
    colorClass: "border-l-rose-500",
    submodules: [
      {
        id: "principals",
        label: "Principals",
        actions: {
          read: "setup.principals.read",
          write: "setup.principals.write",
        },
      },
      {
        id: "registers",
        label: "Registers",
        actions: {
          read: "setup.registers.read",
          write: "setup.registers.write",
        },
      },
      {
        id: "roles",
        label: "Roles",
        adminOnly: true,
        actions: { read: "setup.roles.read", write: "setup.roles.write" },
      },
      {
        id: "users",
        label: "Users",
        adminOnly: true,
        actions: { read: "setup.users.read", write: "setup.users.write" },
      },
      {
        id: "agents",
        label: "Agents",
        actions: { read: "setup.agents.read", write: "setup.agents.write" },
      },
      {
        id: "other_parameters",
        label: "Other Parameters",
        actions: {
          read: "setup.other_parameters.read",
          write: "setup.other_parameters.write",
        },
      },
    ],
  },
  {
    id: "offer_administration",
    label: "Offer Administration",
    colorClass: "border-l-violet-500",
    submodules: [
      {
        id: "ipo_upload",
        label: "IPO — Upload",
        actions: {
          read: "offer_administration.ipo_upload.read",
          write: "offer_administration.ipo_upload.write",
        },
      },
      {
        id: "ipo_approval",
        label: "IPO — Approval",
        actions: {
          read: "offer_administration.ipo_approval.read",
          approve: ["offer_administration.ipo_approval.approve"],
        },
      },
      {
        id: "ipo_icu_approval",
        label: "IPO — ICU Approval",
        actions: {
          read: "offer_administration.ipo_icu_approval.read",
          approve: ["offer_administration.ipo_icu_approval.approve"],
        },
      },
      {
        id: "ipo_lodgement",
        label: "IPO — Lodgement",
        actions: {
          read: "offer_administration.ipo_lodgement.read",
          write: "offer_administration.ipo_lodgement.write",
        },
      },
      {
        id: "rights_declaration",
        label: "Rights — Declaration",
        actions: {
          read: "offer_administration.rights_declaration.read",
          write: "offer_administration.rights_declaration.write",
        },
      },
      {
        id: "rights_approval",
        label: "Rights — Approval",
        actions: {
          read: "offer_administration.rights_approval.read",
          approve: ["offer_administration.rights_approval.approve"],
        },
      },
      {
        id: "rights_icu_approval",
        label: "Rights — ICU Approval",
        actions: {
          read: "offer_administration.rights_icu_approval.read",
          approve: ["offer_administration.rights_icu_approval.approve"],
        },
      },
      {
        id: "rights_allotment",
        label: "Rights — Allotment",
        actions: {
          read: "offer_administration.rights_allotment.read",
          write: "offer_administration.rights_allotment.write",
          approve: ["offer_administration.rights_allotment.approve"],
        },
      },
      {
        id: "bonus_declaration",
        label: "Bonus — Declaration",
        actions: {
          read: "offer_administration.bonus_declaration.read",
          write: "offer_administration.bonus_declaration.write",
        },
      },
      {
        id: "bonus_approval",
        label: "Bonus — Approval",
        actions: {
          read: "offer_administration.bonus_approval.read",
          approve: ["offer_administration.bonus_approval.approve"],
        },
      },
      {
        id: "bonus_icu_approval",
        label: "Bonus — ICU Approval",
        actions: {
          read: "offer_administration.bonus_icu_approval.read",
          approve: ["offer_administration.bonus_icu_approval.approve"],
        },
      },
      {
        id: "bonus_allotment",
        label: "Bonus — Allotment",
        actions: {
          read: "offer_administration.bonus_allotment.read",
          write: "offer_administration.bonus_allotment.write",
          approve: ["offer_administration.bonus_allotment.approve"],
        },
      },
      {
        id: "return_money",
        label: "Return Money",
        actions: {
          read: "offer_administration.return_money.read",
          write: "offer_administration.return_money.write",
          approve: ["offer_administration.return_money.approve"],
        },
      },
    ],
  },
  {
    id: "certificate_management",
    label: "Certificate Management",
    colorClass: "border-l-green-500",
    submodules: [
      {
        id: "cscs_updates_upload",
        label: "CSCS Updates — Upload",
        actions: {
          read: "certificate_management.cscs_updates_upload.read",
          write: "certificate_management.cscs_updates_upload.write",
        },
      },
      {
        id: "cscs_updates_approve",
        label: "CSCS Updates — Approve",
        actions: {
          read: "certificate_management.cscs_updates_approve.read",
          approve: ["certificate_management.cscs_updates_approve.approve"],
        },
      },
      {
        id: "reconciliation_view",
        label: "Reconciliation — View",
        actions: { read: "certificate_management.reconciliation_view.read" },
      },
      {
        id: "reconciliation_update",
        label: "Reconciliation — Update",
        actions: {
          read: "certificate_management.reconciliation_update.read",
          write: "certificate_management.reconciliation_update.write",
          approve: ["certificate_management.reconciliation_update.approve"],
        },
      },
      {
        id: "dematerialisation_capture",
        label: "Dematerialisation — Capture",
        actions: {
          read: "certificate_management.dematerialisation_capture.read",
          write: "certificate_management.dematerialisation_capture.write",
        },
      },
      {
        id: "dematerialisation_approve",
        label: "Dematerialisation — Approve",
        actions: {
          read: "certificate_management.dematerialisation_approve.read",
          approve: ["certificate_management.dematerialisation_approve.approve"],
        },
      },
      {
        id: "dematerialisation_icu",
        label: "Dematerialisation — ICU",
        actions: {
          read: "certificate_management.dematerialisation_icu.read",
          approve: ["certificate_management.dematerialisation_icu.approve"],
        },
      },
      {
        id: "dematerialisation_lodge",
        label: "Dematerialisation — Lodge",
        actions: {
          read: "certificate_management.dematerialisation_lodge.read",
          write: "certificate_management.dematerialisation_lodge.write",
        },
      },
      {
        id: "certificate_split",
        label: "Certificate Split",
        actions: {
          read: "certificate_management.certificate_split.read",
          write: "certificate_management.certificate_split.write",
          approve: ["certificate_management.certificate_split.approve"],
        },
      },
      {
        id: "certificate_consolidation",
        label: "Certificate Consolidation",
        actions: {
          read: "certificate_management.certificate_consolidation.read",
          write: "certificate_management.certificate_consolidation.write",
          approve: ["certificate_management.certificate_consolidation.approve"],
        },
      },
      {
        id: "certificate_transfer",
        label: "Certificate Transfer",
        actions: {
          read: "certificate_management.certificate_transfer.read",
          write: "certificate_management.certificate_transfer.write",
          approve: ["certificate_management.certificate_transfer.approve"],
        },
      },
    ],
  },
  {
    id: "dividend_management",
    label: "Dividend Management",
    colorClass: "border-l-amber-500",
    submodules: [
      {
        id: "declaration_initiate",
        label: "Declaration — Initiate",
        actions: {
          read: "dividend_management.declaration_initiate.read",
          write: "dividend_management.declaration_initiate.write",
        },
      },
      {
        id: "declaration_approve_1st",
        label: "Declaration — Approve (1st)",
        actions: {
          read: "dividend_management.declaration_approve_1st.read",
          approve: ["dividend_management.declaration_approve_1st.approve"],
        },
      },
      {
        id: "declaration_icu_approve",
        label: "Declaration — ICU Approve",
        actions: {
          read: "dividend_management.declaration_icu_approve.read",
          approve: ["dividend_management.declaration_icu_approve.approve"],
        },
      },
      {
        id: "new_mandate_initiate",
        label: "New Mandate — Initiate",
        actions: {
          read: "dividend_management.new_mandate_initiate.read",
          write: "dividend_management.new_mandate_initiate.write",
        },
      },
      {
        id: "new_mandate_approve_1st",
        label: "New Mandate — Approve (1st)",
        actions: {
          read: "dividend_management.new_mandate_approve_1st.read",
          approve: ["dividend_management.new_mandate_approve_1st.approve"],
        },
      },
      {
        id: "new_mandate_icu_approve",
        label: "New Mandate — ICU Approve",
        actions: {
          read: "dividend_management.new_mandate_icu_approve.read",
          approve: ["dividend_management.new_mandate_icu_approve.approve"],
        },
      },
      {
        id: "payment_initiate",
        label: "Payment — Initiate",
        actions: {
          read: "dividend_management.payment_initiate.read",
          write: "dividend_management.payment_initiate.write",
        },
      },
      {
        id: "payment_approve",
        label: "Payment — Approve",
        actions: {
          read: "dividend_management.payment_approve.read",
          approve: ["dividend_management.payment_approve.approve"],
        },
      },
      {
        id: "dividend_split",
        label: "Dividend Split",
        actions: {
          read: "dividend_management.dividend_split.read",
          write: "dividend_management.dividend_split.write",
          approve: ["dividend_management.dividend_split.approve"],
        },
      },
      {
        id: "warrant_mark_off",
        label: "Warrant Mark-Off",
        actions: {
          read: "dividend_management.warrant_mark_off.read",
          write: "dividend_management.warrant_mark_off.write",
          approve: ["dividend_management.warrant_mark_off.approve"],
        },
      },
      {
        id: "reports_view",
        label: "Reports — View",
        actions: { read: "dividend_management.reports_view.read" },
      },
    ],
  },
  {
    id: "fund_subscription_redemption",
    label: "Fund Subscription / Redemption",
    colorClass: "border-l-pink-500",
    submodules: [
      {
        id: "create_subscriber",
        label: "Create Subscriber",
        actions: {
          read: "fund_subscription_redemption.create_subscriber.read",
          write: "fund_subscription_redemption.create_subscriber.write",
        },
      },
      {
        id: "subscription_initiate",
        label: "Subscription — Initiate",
        actions: {
          read: "fund_subscription_redemption.subscription_initiate.read",
          write: "fund_subscription_redemption.subscription_initiate.write",
        },
      },
      {
        id: "subscription_approve",
        label: "Subscription — Approve",
        actions: {
          read: "fund_subscription_redemption.subscription_approve.read",
          approve: [
            "fund_subscription_redemption.subscription_approve.approve",
          ],
        },
      },
      {
        id: "redemption_initiate",
        label: "Redemption — Initiate",
        actions: {
          read: "fund_subscription_redemption.redemption_initiate.read",
          write: "fund_subscription_redemption.redemption_initiate.write",
        },
      },
      {
        id: "redemption_approve",
        label: "Redemption — Approve",
        actions: {
          read: "fund_subscription_redemption.redemption_approve.read",
          approve: ["fund_subscription_redemption.redemption_approve.approve"],
        },
      },
    ],
  },
  {
    id: "account_maintenance",
    label: "Account Maintenance",
    colorClass: "border-l-sky-500",
    submodules: [
      {
        id: "account_consolidation_submit",
        label: "Account Consolidation — Submit",
        actions: {
          read: "account_maintenance.account_consolidation_submit.read",
          write: "account_maintenance.account_consolidation_submit.write",
        },
      },
      {
        id: "account_consolidation_approve",
        label: "Account Consolidation — Approve",
        actions: {
          read: "account_maintenance.account_consolidation_approve.read",
          approve: [
            "account_maintenance.account_consolidation_approve.approve",
          ],
        },
      },
      {
        id: "account_consolidation_reverse",
        label: "Account Consolidation — Reverse",
        actions: {
          read: "account_maintenance.account_consolidation_reverse.read",
          approve: [
            "account_maintenance.account_consolidation_reverse.approve",
          ],
        },
      },
      {
        id: "kyc_update_submit",
        label: "KYC Update — Submit",
        actions: {
          read: "account_maintenance.kyc_update_submit.read",
          write: "account_maintenance.kyc_update_submit.write",
        },
      },
      {
        id: "kyc_update_approve_1st",
        label: "KYC Update — Approve (1st)",
        actions: {
          read: "account_maintenance.kyc_update_approve_1st.read",
          approve: ["account_maintenance.kyc_update_approve_1st.approve"],
        },
      },
      {
        id: "kyc_update_icu_approve",
        label: "KYC Update — ICU Approve",
        actions: {
          read: "account_maintenance.kyc_update_icu_approve.read",
          approve: ["account_maintenance.kyc_update_icu_approve.approve"],
        },
      },
      {
        id: "admon_submit",
        label: "ADMON — Submit",
        actions: {
          read: "account_maintenance.admon_submit.read",
          write: "account_maintenance.admon_submit.write",
        },
      },
      {
        id: "admon_approve",
        label: "ADMON — Approve",
        actions: {
          read: "account_maintenance.admon_approve.read",
          approve: ["account_maintenance.admon_approve.approve"],
        },
      },
      {
        id: "admon_reverse",
        label: "ADMON — Reverse",
        actions: {
          read: "account_maintenance.admon_reverse.read",
          approve: ["account_maintenance.admon_reverse.approve"],
        },
      },
    ],
  },
  {
    id: "enquiry",
    label: "Enquiry",
    colorClass: "border-l-cyan-500",
    submodules: [
      {
        id: "holder_enquiry",
        label: "Holder Enquiry",
        actions: { read: "enquiry.holder_enquiry.read" },
      },
      {
        id: "certificate_enquiry",
        label: "Certificate Enquiry",
        actions: { read: "enquiry.certificate_enquiry.read" },
      },
      {
        id: "warrant_enquiry",
        label: "Warrant Enquiry",
        actions: { read: "enquiry.warrant_enquiry.read" },
      },
      {
        id: "rights_enquiry",
        label: "Rights Enquiry",
        actions: { read: "enquiry.rights_enquiry.read" },
      },
      {
        id: "agent_enquiry",
        label: "Agent Enquiry",
        actions: { read: "enquiry.agent_enquiry.read" },
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    colorClass: "border-l-teal-500",
    submodules: [
      {
        id: "holder_reports",
        label: "Holder Reports",
        actions: {
          read: "reports.holder_reports_view.read",
          write: "reports.holder_reports_export.write",
        },
      },
      {
        id: "dividend_reports",
        label: "Dividend Reports",
        actions: {
          read: "reports.dividend_reports_view.read",
          write: "reports.dividend_reports_export.write",
        },
      },
      {
        id: "certificate_reports",
        label: "Certificate Reports",
        actions: {
          read: "reports.certificate_reports_view.read",
          write: "reports.certificate_reports_export.write",
        },
      },
      {
        id: "issue_reports",
        label: "Issue Reports",
        actions: {
          read: "reports.issue_reports_view.read",
          write: "reports.issue_reports_export.write",
        },
      },
      {
        id: "sec_reports",
        label: "SEC Reports",
        actions: {
          read: "reports.sec_reports_view.read",
          write: "reports.sec_reports_export.write",
        },
      },
      {
        id: "audit_trail",
        label: "Audit Trail",
        actions: {
          read: "reports.audit_trail_view.read",
          write: "reports.audit_trail_export.write",
        },
      },
    ],
  },
  {
    id: "admin_system",
    label: "Admin (System)",
    colorClass: "border-l-red-600",
    adminOnly: true,
    submodules: [
      {
        id: "manage_caution_flags",
        label: "Manage Caution Flags",
        adminOnly: true,
        actions: {
          read: "admin_system.manage_caution_flags.read",
          write: "admin_system.manage_caution_flags.write",
          approve: ["admin_system.manage_caution_flags.approve"],
        },
      },
      {
        id: "manage_extraction",
        label: "Manage Extraction",
        adminOnly: true,
        actions: {
          read: "admin_system.manage_extraction.read",
          write: "admin_system.manage_extraction.write",
        },
      },
      {
        id: "administration_auth",
        label: "Administration Auth",
        adminOnly: true,
        actions: {
          read: "admin_system.administration_auth.read",
          write: "admin_system.administration_auth.write",
          approve: ["admin_system.administration_auth.approve"],
        },
      },
      {
        id: "authorise_administration",
        label: "Authorise Administration",
        adminOnly: true,
        actions: {
          read: "admin_system.authorise_administration.read",
          approve: ["admin_system.authorise_administration.approve"],
        },
      },
      {
        id: "authorise_advisors",
        label: "Authorise Advisors",
        adminOnly: true,
        actions: {
          read: "admin_system.authorise_advisors.read",
          approve: ["admin_system.authorise_advisors.approve"],
        },
      },
      {
        id: "correct_holder_info",
        label: "Correct Holder Info",
        adminOnly: true,
        actions: {
          read: "admin_system.correct_holder_info.read",
          write: "admin_system.correct_holder_info.write",
          approve: ["admin_system.correct_holder_info.approve"],
        },
      },
      {
        id: "session_management",
        label: "Session Management",
        adminOnly: true,
        actions: {
          read: "admin_system.session_management.read",
          write: "admin_system.session_management.write",
        },
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAllModulePerms(module: ModuleDef): string[] {
  return module.submodules.flatMap((sub) => [
    sub.actions.read,
    ...(sub.actions.write ? [sub.actions.write] : []),
    ...(sub.actions.approve ?? []),
  ]);
}

type FullAccessState = "full" | "partial" | "none";

function getFullAccessState(
  module: ModuleDef,
  permissions: string[],
): FullAccessState {
  const all = getAllModulePerms(module);
  const granted = all.filter((p) => permissions.includes(p)).length;
  if (granted === 0) return "none";
  if (granted === all.length) return "full";
  return "partial";
}

function applyPermToggle(
  prev: string[],
  sub: SubmoduleDef,
  key: "read" | "write" | "approve",
): string[] {
  const next = [...prev];
  const read = sub.actions.read;
  const write = sub.actions.write;
  const approve = sub.actions.approve ?? [];

  if (key === "read") {
    if (next.includes(read)) {
      const remove = new Set([read, ...(write ? [write] : []), ...approve]);
      return next.filter((p) => !remove.has(p));
    }
    return [...new Set([...next, read])];
  }
  if (key === "write" && write) {
    if (next.includes(write)) return next.filter((p) => p !== write);
    return [
      ...new Set([...next, write, ...(!next.includes(read) ? [read] : [])]),
    ];
  }
  if (key === "approve" && approve.length > 0) {
    const allGranted = approve.every((p) => next.includes(p));
    if (allGranted) return next.filter((p) => !approve.includes(p));
    return [
      ...new Set([
        ...next,
        ...approve,
        ...(!next.includes(read) ? [read] : []),
      ]),
    ];
  }
  return next;
}

function applyFullAccessToggle(prev: string[], module: ModuleDef): string[] {
  const allPerms = getAllModulePerms(module);
  const allGranted = allPerms.every((p) => prev.includes(p));
  if (allGranted) return prev.filter((p) => !allPerms.includes(p));
  return [...new Set([...prev, ...allPerms])];
}

// ─── Module Permission Card ───────────────────────────────────────────────────

interface ModuleCardProps {
  module: ModuleDef;
  permissions: string[];
  isEditing: boolean;
  isSuperAdmin: boolean;
  onTogglePerm: (sub: SubmoduleDef, key: "read" | "write" | "approve") => void;
  onToggleFullAccess: (module: ModuleDef) => void;
}

function ModulePermCard({
  module,
  permissions,
  isEditing,
  isSuperAdmin,
  onTogglePerm,
  onToggleFullAccess,
}: ModuleCardProps) {
  const storageKey = `roles-perm-collapsed-${module.id}`;
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? stored === "true" : true;
  });
  const faState = getFullAccessState(module, permissions);
  const moduleDisabled = !isEditing || (!!module.adminOnly && !isSuperAdmin);

  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
      {/* Card header — clicking anywhere on it toggles collapse */}
      <button
        type="button"
        onClick={() =>
          setCollapsed((c) => {
            const next = !c;
            localStorage.setItem(storageKey, String(next));
            return next;
          })
        }
        className="w-full px-4 py-3 bg-muted/20 border-b flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
              collapsed && "-rotate-90",
            )}
          />
          {module.adminOnly && (
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <h3 className="font-bold text-xs tracking-widest uppercase text-foreground/70">
            {module.label}
          </h3>
        </div>

        {/* Full Access toggle — stop propagation so it doesn't collapse the card */}
        <button
          type="button"
          disabled={moduleDisabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!moduleDisabled) onToggleFullAccess(module);
          }}
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border transition-all",
            moduleDisabled ? "cursor-default opacity-50" : "cursor-pointer",
            faState === "full"
              ? "bg-primary text-primary-foreground border-primary"
              : faState === "partial"
                ? "bg-muted/80 text-foreground border-muted-foreground/20"
                : "bg-transparent text-muted-foreground border-input hover:bg-muted/50",
          )}
        >
          {faState === "full" && <Check className="h-3 w-3" />}
          {faState === "partial" && <Minus className="h-3 w-3" />}
          Full Access
        </button>
      </button>

      {/* Submodule table — hidden when collapsed */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-120">
            <thead>
              <tr className="border-b bg-muted/10">
                <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Submodule
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground w-24">
                  Read
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground w-36">
                  Write / Initiate
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground w-24">
                  Approve
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {module.submodules.map((sub) => {
                const rowLocked = !!sub.adminOnly && !isSuperAdmin;
                const rowDisabled = !isEditing || rowLocked;

                const readChecked = permissions.includes(sub.actions.read);
                const writeChecked =
                  sub.actions.write != null
                    ? permissions.includes(sub.actions.write)
                    : null;
                const approveChecked = sub.actions.approve?.length
                  ? sub.actions.approve.every((p) => permissions.includes(p))
                  : null;

                return (
                  <tr key={sub.id} className={cn(rowLocked && "opacity-60")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {rowLocked && (
                          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-medium text-[13px]">
                          {sub.label}
                        </span>
                      </div>
                    </td>

                    {/* Read */}
                    <td className="px-4 py-3 text-center">
                      <Checkbox
                        checked={readChecked}
                        disabled={rowDisabled}
                        onCheckedChange={() => onTogglePerm(sub, "read")}
                        className="mx-auto cursor-pointer"
                      />
                    </td>

                    {/* Write / Initiate */}
                    <td className="px-4 py-3 text-center">
                      {writeChecked !== null ? (
                        <Checkbox
                          checked={writeChecked}
                          disabled={rowDisabled}
                          onCheckedChange={() => onTogglePerm(sub, "write")}
                          className="mx-auto cursor-pointer"
                        />
                      ) : (
                        <span className="text-muted-foreground/30 text-base">
                          —
                        </span>
                      )}
                    </td>

                    {/* Approve */}
                    <td className="px-4 py-3 text-center">
                      {approveChecked !== null ? (
                        <Checkbox
                          checked={approveChecked}
                          disabled={rowDisabled}
                          onCheckedChange={() => onTogglePerm(sub, "approve")}
                          className="mx-auto cursor-pointer"
                        />
                      ) : (
                        <span className="text-muted-foreground/30 text-base">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const router = useRouter();
  const { currentUser } = useStore();
  const isSuperAdmin = currentUser?.roles?.includes("SUPER_ADMIN") ?? false;

  useEffect(() => {
    if (currentUser && !isSuperAdmin) {
      toast.error("You do not have permission to access this page.");
      router.replace("/");
    }
  }, [currentUser, isSuperAdmin, router]);

  const queryClient = useQueryClient();
  const { data: roles, isLoading } = useRoles();
  const [selectedRole, setSelectedRole] = useState(
    !isLoading ? roles?.[0]?.name : "ADMIN",
  );
  const [roleSearch, setRoleSearch] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<string | null>(
    null,
  );
  const [pendingNavUrl, setPendingNavUrl] = useState<string | null>(null);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const allowNextNav = useRef(false);

  // Edit role panel
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editNameError, setEditNameError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Create side panel
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [createPermissions, setCreatePermissions] = useState<string[]>([]);
  const [copyFromRole, setCopyFromRole] = useState("");
  const [createNameError, setCreateNameError] = useState("");

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [localPermissions, setLocalPermissions] = useState<string[]>([]);

  // Sorted + filtered roles
  const sortedFilteredRoles = useMemo(() => {
    if (!roles) return [];
    const q = roleSearch.toLowerCase();
    return [...roles]
      .filter(
        (r: Role) =>
          r.name.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q),
      )
      .sort((a: Role, b: Role) => {
        if (a.reserved && !b.reserved) return -1;
        if (!a.reserved && b.reserved) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [roles, roleSearch]);

  const activeRole = roles?.find((r: Role) => r.name === selectedRole);

  useEffect(() => {
    if (activeRole) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalPermissions(activeRole.permissions || []);
    }
  }, [activeRole]);

  const hasChanges = useMemo(() => {
    if (!activeRole) return false;
    const orig = [...(activeRole.permissions || [])].sort().join(",");
    const curr = [...localPermissions].sort().join(",");
    return orig !== curr;
  }, [localPermissions, activeRole]);

  // ── Intercept all client-side navigation when there are unsaved changes ──
  useEffect(() => {
    if (!isEditMode || !hasChanges) return;

    const orig = window.history.pushState.bind(window.history);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.history as any).pushState = (
      ...args: Parameters<typeof window.history.pushState>
    ) => {
      if (allowNextNav.current) {
        allowNextNav.current = false;
        orig(...args);
        return;
      }
      const url = args[2];
      if (url) {
        setPendingNavUrl(String(url));
        setUnsavedOpen(true);
      } else {
        orig(...args);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.history as any).pushState = orig;
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isEditMode, hasChanges]);

  // ── Role selection with unsaved-changes guard ────────────────────────────
  const handleRoleSelect = (roleName: string) => {
    if (isEditMode && hasChanges) {
      setPendingRoleSwitch(roleName);
      setUnsavedOpen(true);
    } else {
      setSelectedRole(roleName);
      setIsEditMode(false);
    }
  };

  const confirmDiscard = () => {
    if (activeRole) setLocalPermissions(activeRole.permissions || []);
    setIsEditMode(false);

    if (pendingRoleSwitch) {
      setSelectedRole(pendingRoleSwitch);
      setPendingRoleSwitch(null);
    } else if (pendingNavUrl) {
      allowNextNav.current = true;
      router.push(pendingNavUrl);
      setPendingNavUrl(null);
    }

    setUnsavedOpen(false);
  };

  const dismissUnsaved = () => {
    setPendingRoleSwitch(null);
    setPendingNavUrl(null);
    setUnsavedOpen(false);
  };

  // ── Permission toggle logic ──────────────────────────────────────────────
  const handleTogglePerm = useCallback(
    (sub: SubmoduleDef, key: "read" | "write" | "approve") => {
      setLocalPermissions((prev) => applyPermToggle(prev, sub, key));
    },
    [],
  );

  const handleToggleFullAccess = useCallback((module: ModuleDef) => {
    setLocalPermissions((prev) => applyFullAccessToggle(prev, module));
  }, []);

  const handleTogglePermCreate = useCallback(
    (sub: SubmoduleDef, key: "read" | "write" | "approve") => {
      setCreatePermissions((prev) => applyPermToggle(prev, sub, key));
    },
    [],
  );

  const handleToggleFullAccessCreate = useCallback((module: ModuleDef) => {
    setCreatePermissions((prev) => applyFullAccessToggle(prev, module));
  }, []);

  const handleTogglePermEdit = useCallback(
    (sub: SubmoduleDef, key: "read" | "write" | "approve") => {
      setEditPermissions((prev) => applyPermToggle(prev, sub, key));
    },
    [],
  );

  const handleToggleFullAccessEdit = useCallback((module: ModuleDef) => {
    setEditPermissions((prev) => applyFullAccessToggle(prev, module));
  }, []);

  const cancelEdit = useCallback(() => {
    if (activeRole) setLocalPermissions(activeRole.permissions || []);
    setIsEditMode(false);
  }, [activeRole]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const updatePermissionMutation = useMutation({
    mutationFn: ({
      payload,
      roleId,
    }: {
      payload: { permissionNames: string[] };
      roleId: string;
    }) => UPDATE_PERMISSIONS(payload, roleId),
    onSuccess: () => {
      toast.success("Permissions updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsEditMode(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update permissions.");
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: CREATE_ROLE,
    onSuccess: () => {
      toast.success("Role created successfully.");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setCreateOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
      setCreatePermissions([]);
      setCopyFromRole("");
      setCreateNameError("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create role.");
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: () => DELETE_ROLE(activeRole?.id),
    onSuccess: () => {
      toast.success("Role deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleteOpen(false);
      if (roles && roles.length > 0) setSelectedRole(roles[0].name);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete role.");
    },
  });

  const handleSavePermissions = () => {
    if (!activeRole?.id) return;
    updatePermissionMutation.mutate({
      payload: { permissionNames: localPermissions },
      roleId: activeRole.id,
    });
  };

  const openEditPanel = () => {
    setEditName(activeRole?.name || "");
    setEditDesc(activeRole?.description || "");
    setEditPermissions(activeRole?.permissions || []);
    setEditNameError("");
    setEditOpen(true);
  };

  const handleEditRole = async () => {
    const trimmed = editName.trim();
    if (!trimmed || !activeRole?.id) return;

    if (trimmed.toLowerCase() !== (activeRole.name || "").toLowerCase()) {
      const nameExists = roles?.some(
        (r: Role) => r.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (nameExists) {
        setEditNameError("A role with this name already exists.");
        return;
      }
    }

    if (!activeRole.reserved && editPermissions.length === 0) {
      toast.error("Please select at least one permission.");
      return;
    }

    setEditSaving(true);
    try {
      if (activeRole.reserved) {
        // Built-in: name is read-only; only update description via dedicated endpoint
        await EDIT_ROLE({
          roleId: activeRole.id,
          name: activeRole.name,
          description: editDesc,
        });
      } else {
        // Custom: update name + description + permissions in one PATCH
        await PATCH_ROLE({
          roleId: activeRole.id,
          name: trimmed,
          description: editDesc,
          permissionNames: editPermissions,
        });
      }
      toast.success("Role updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setEditOpen(false);
      setEditName("");
      setEditDesc("");
      setEditPermissions([]);
      setEditNameError("");
      setIsEditMode(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role.";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateRole = () => {
    const trimmed = newRoleName.trim();
    if (!trimmed) return;

    const nameExists = roles?.some(
      (r: Role) => r.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (nameExists) {
      setCreateNameError("A role with this name already exists.");
      return;
    }

    if (createPermissions.length === 0) {
      toast.error("Please select at least one permission.");
      return;
    }

    createRoleMutation.mutate({
      name: trimmed,
      description: newRoleDesc,
      permissionNames: createPermissions,
    });
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-3.5rem-1px)] -m-4 lg:-m-6">
        {/* ── LEFT PANEL ── */}
        <div className="w-full lg:w-72 max-h-64 lg:max-h-none border-b lg:border-b-0 lg:border-r bg-background overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
            <span className="font-semibold text-sm">Roles</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => setCreateOpen(true)}
              title="Add Role"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-3 py-2 border-b sticky top-13.25 bg-background/95 backdrop-blur z-10">
            <div className="relative">
              <Input
                placeholder="Filter roles…"
                className="pl-8 h-8 text-sm mrpsl-input"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 py-1.5">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-4 py-2.5">
                  <Skeleton className="h-12 w-full rounded" />
                </div>
              ))
            ) : sortedFilteredRoles.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 px-4">
                No roles match &ldquo;{roleSearch}&rdquo;
              </p>
            ) : (
              sortedFilteredRoles.map((role: Role) => {
                const isActive = role.name === selectedRole;
                return (
                  <button
                    key={role.name}
                    onClick={() => handleRoleSelect(role.name)}
                    className={`w-full text-left px-4 py-3 flex items-start justify-between hover:bg-muted/50 transition-colors border-l-2 gap-2 cursor-pointer ${
                      isActive
                        ? "bg-primary/8 text-primary border-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate">
                          {role.name}
                        </span>
                        {role.reserved && (
                          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      {role.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5 leading-snug">
                          {role.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[11px] font-semibold bg-muted text-foreground rounded-full px-1.5 py-0.5 leading-none">
                        {role.userCount ?? 0}
                      </span>
                      <Badge
                        className={`border-0 text-[10px] px-1.5 py-0.5 leading-none font-semibold ${
                          role.reserved
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {role.reserved ? "Built-in" : "Custom"}
                      </Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 bg-muted/10 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8 space-y-6">
            {/* Role header */}
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                {isLoading ? (
                  <>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-4 w-64 mb-3" />
                    <Skeleton className="h-5 w-32 rounded-md" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold">{activeRole?.name}</h2>
                      {activeRole?.reserved ? (
                        <Badge className="border-0 bg-amber-100 text-amber-700 text-[11px]">
                          Built-in
                        </Badge>
                      ) : (
                        <Badge className="border-0 bg-blue-100 text-blue-700 text-[11px]">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activeRole?.description}
                    </p>
                    <div className="text-xs font-medium text-muted-foreground mt-2 bg-muted px-2 py-1 rounded-md inline-block">
                      {activeRole?.userCount} user
                      {activeRole?.userCount !== 1 ? "s" : ""} assigned to this
                      role
                    </div>
                  </>
                )}
              </div>

              {!isLoading && !isEditMode && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={openEditPanel}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit Role
                  </Button>
                  {!activeRole?.reserved && activeRole?.userCount === 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Role
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Permissions section header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Permissions</h3>
                {activeRole?.reserved && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Lock className="h-3 w-3" /> Built-in role — permissions
                    cannot be modified
                  </p>
                )}
                {isEditMode && hasChanges && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    Unsaved changes
                  </p>
                )}
              </div>

              {!isLoading && !activeRole?.reserved && (
                <div className="flex gap-2 shrink-0">
                  {isEditMode ? (
                    <>
                      <Button variant="outline" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="cursor-pointer"
                        onClick={handleSavePermissions}
                        disabled={updatePermissionMutation.isPending}
                      >
                        {updatePermissionMutation.isPending && (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit Permissions
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Module permission cards */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {PERMISSION_MATRIX.map((module) => (
                  <ModulePermCard
                    key={module.id}
                    module={module}
                    permissions={localPermissions}
                    isEditing={isEditMode}
                    isSuperAdmin={isSuperAdmin}
                    onTogglePerm={handleTogglePerm}
                    onToggleFullAccess={handleToggleFullAccess}
                  />
                ))}
              </div>
            )}

            {/* Sticky bottom action bar when in edit mode */}
            {!isLoading && isEditMode && !activeRole?.reserved && (
              <div className="flex justify-end gap-3 pt-4 pb-2 border-t sticky bottom-0 bg-muted/10 backdrop-blur">
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button
                  className="cursor-pointer"
                  onClick={handleSavePermissions}
                  disabled={updatePermissionMutation.isPending || !hasChanges}
                >
                  {updatePermissionMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Role Side Panel ── */}
      <Sheet
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) setEditOpen(false);
        }}
      >
        <SheetContent
          side="right"
          className="w-[min(90vw,900px)] flex flex-col gap-0 p-0"
        >
          <SheetHeader className="px-6 py-5 border-b shrink-0">
            <SheetTitle className="text-base font-semibold">
              Edit Role
              {activeRole?.reserved && (
                <span className="ml-2 text-[11px] font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 align-middle">
                  Built-in
                </span>
              )}
            </SheetTitle>
            <SheetDescription>
              Update role details and permissions.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Name + description */}
            <div className="px-6 py-6 border-b space-y-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Role Name *</label>
                <Input
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editNameError) setEditNameError("");
                  }}
                  placeholder="e.g. Operations Manager"
                  className="mrpsl-input"
                  readOnly={activeRole?.reserved}
                  disabled={activeRole?.reserved}
                />
                {editNameError && (
                  <p className="text-xs text-destructive">{editNameError}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">Description</label>
                <Textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Brief description of this role's responsibilities"
                  className="resize-none"
                  rows={3}
                />
              </div>
              {activeRole?.reserved && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Built-in role — name is read-only and permissions cannot be
                  modified.
                </p>
              )}
            </div>

            {/* Permissions */}
            <div className="px-6 py-6 space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Permissions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeRole?.reserved
                    ? "Permissions are locked for built-in roles."
                    : "Select at least one permission."}
                </p>
              </div>
              <div className="space-y-4">
                {PERMISSION_MATRIX.map((module) => (
                  <ModulePermCard
                    key={module.id}
                    module={module}
                    permissions={editPermissions}
                    isEditing={!activeRole?.reserved}
                    isSuperAdmin={isSuperAdmin}
                    onTogglePerm={handleTogglePermEdit}
                    onToggleFullAccess={handleToggleFullAccessEdit}
                  />
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditOpen(false)}
              disabled={editSaving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 cursor-pointer"
              onClick={handleEditRole}
              disabled={!editName.trim() || editSaving}
            >
              {editSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Create Role Side Panel ── */}
      <Sheet
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setNewRoleName("");
            setNewRoleDesc("");
            setCreatePermissions([]);
            setCopyFromRole("");
            setCreateNameError("");
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-[min(90vw,900px)] flex flex-col gap-0 p-0"
        >
          <SheetHeader className="px-6 py-5 border-b shrink-0">
            <SheetTitle className="text-base font-semibold">
              Create New Role
            </SheetTitle>
            <SheetDescription>
              Define a new role with a name, description, and permissions.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Name + description + copy-from */}
            <div className="px-6 py-6 border-b space-y-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Role Name *</label>
                <Input
                  value={newRoleName}
                  onChange={(e) => {
                    setNewRoleName(e.target.value);
                    if (createNameError) setCreateNameError("");
                  }}
                  placeholder="e.g. Operations Manager"
                  className="mrpsl-input"
                  autoFocus
                />
                {createNameError && (
                  <p className="text-xs text-destructive">{createNameError}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">Description</label>
                <Textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Brief description of this role's responsibilities"
                  className="resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  Copy permissions from existing role{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Select
                  value={copyFromRole}
                  onValueChange={(val) => {
                    setCopyFromRole(val ?? "");
                    const source = roles?.find((r: Role) => r.name === val);
                    if (source) setCreatePermissions(source.permissions || []);
                  }}
                >
                  <SelectTrigger className="mrpsl-input">
                    <SelectValue placeholder="Select a role to copy from…" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((r: Role) => (
                      <SelectItem key={r.name} value={r.name}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions */}
            <div className="px-6 py-6 space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Permissions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select at least one permission.
                </p>
              </div>
              <div className="space-y-4">
                {PERMISSION_MATRIX.map((module) => (
                  <ModulePermCard
                    key={module.id}
                    module={module}
                    permissions={createPermissions}
                    isEditing={true}
                    isSuperAdmin={isSuperAdmin}
                    onTogglePerm={handleTogglePermCreate}
                    onToggleFullAccess={handleToggleFullAccessCreate}
                  />
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCreateOpen(false);
                setNewRoleName("");
                setNewRoleDesc("");
                setCreatePermissions([]);
                setCopyFromRole("");
                setCreateNameError("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 cursor-pointer"
              onClick={handleCreateRole}
              disabled={!newRoleName.trim() || createRoleMutation.isPending}
            >
              {createRoleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…
                </>
              ) : (
                "Create Role"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Delete Role
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                This will permanently remove the{" "}
                <span className="font-semibold text-foreground">
                  &quot;{activeRole?.name}&quot;
                </span>{" "}
                role. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 px-6 py-4 bg-muted/20 border-t border-border/50">
            <Button
              variant="ghost"
              className="flex-1 cursor-pointer h-12 rounded-xl"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteRoleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 cursor-pointer h-12 rounded-xl"
              onClick={() => deleteRoleMutation.mutate()}
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Confirm Deletion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Unsaved Changes Dialog ── */}
      <Dialog
        open={unsavedOpen}
        onOpenChange={(open) => {
          if (!open) dismissUnsaved();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved permission changes for{" "}
              <strong>{activeRole?.name}</strong>. Navigating away will discard
              them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={dismissUnsaved}>
              Stay
            </Button>
            <Button variant="destructive" onClick={confirmDiscard}>
              Discard &amp; Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

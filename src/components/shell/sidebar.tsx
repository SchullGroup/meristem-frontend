"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard,
  Settings,
  TrendingUp,
  FileText,
  Coins,
  UserCog,
  Search,
  BarChart3,
  ClipboardCheck,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    items: [],
  },
  {
    title: "Setup",
    icon: Settings,
    items: [
      { label: "Principals", href: "/setup/principals" },
      { label: "Registers", href: "/setup/registers" },
      { label: "Roles", href: "/setup/roles" },
      { label: "Users", href: "/setup/users" },
      { label: "Agents", href: "/setup/agents" },
      { label: "Other Parameters", href: "/setup/parameters" },
    ],
  },
];

const OPERATIONS_GROUPS = [
  {
    title: "Offer Administration",
    icon: TrendingUp,
    items: [
      { label: "IPO / Public Offer", href: "/offers/ipo" },
      { label: "Rights Issue", href: "/offers/rights-issue" },
      { label: "Bonus Issue", href: "/offers/bonus-issue" },
      { label: "Return Money", href: "/offers/return-money" },
    ],
  },
  {
    title: "Certificate Management",
    icon: FileText,
    items: [
      { label: "CSCS Updates", href: "/certificates/cscs-updates" },
      { label: "Reconciliation", href: "/certificates/reconciliation" },
      { label: "Dematerialisation", href: "/certificates/dematerialisation" },
      { label: "Certificate Split", href: "/certificates/split" },
      { label: "Consolidation", href: "/certificates/consolidation" },
      { label: "Transfer", href: "/certificates/transfer" },
    ],
  },
  {
    title: "Dividend Management",
    icon: Coins,
    items: [
      { label: "Declaration", href: "/dividends/declaration" },
      { label: "New Mandate Payment", href: "/dividends/new-mandate" },
      { label: "Dividend Payment", href: "/dividends/payment" },
      { label: "Dividend Split", href: "/dividends/split" },
      { label: "Warrant Mark-Off", href: "/dividends/warrant-markoff" },
      { label: "Dividend Reports", href: "/dividends/reports" },
      { label: "Return Dividend", href: "/dividends/return-money" },
    ],
  },
  {
    title: "Account Maintenance",
    icon: UserCog,
    items: [
      {
        label: "Account Consolidation",
        href: "/account-maintenance/consolidation",
      },
      { label: "KYC Update", href: "/account-maintenance/kyc-update" },
      { label: "Administration (ADMON)", href: "/account-maintenance/admon" },
    ],
  },
  {
    title: "Enquiry",
    icon: Search,
    items: [
      { label: "Shareholders", href: "/enquiry/shareholders" },
      { label: "Holder", href: "/enquiry/holder" },
      { label: "Certificate", href: "/enquiry/certificate" },
      { label: "Warrant", href: "/enquiry/warrant" },
      { label: "Rights", href: "/enquiry/rights" },
      { label: "Bonus", href: "/enquiry/bonus" },
      { label: "Agent", href: "/enquiry/agent" },
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, pendingApprovals } = useStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Setup: true,
    "Certificate Management": true,
  });
  const [logoutOpen, setLogoutOpen] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    [...NAV_GROUPS, ...OPERATIONS_GROUPS].forEach((group) => {
      if (group.items?.some((item) => pathname.startsWith(item.href))) {
        setOpenGroups((prev) => ({ ...prev, [group.title]: true }));
      }
    });
  }, [pathname]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onClose?.();
  }, [pathname]);

  if (!currentUser) return null;

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/login");
  };

  const pendingCount = pendingApprovals.filter(
    (a) => a.status === "PENDING",
  ).length;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      <div className={cn(
        "w-72 h-screen border-r bg-background flex flex-col z-50 fixed left-0 top-0 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}>
        {/* Branding */}
        <div className="h-14.25 px-6 flex items-center border-b border-border/60 shrink-0">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Meristem Logo"
              width={160}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 no-scrollbar">
          <div className="space-y-0.5 px-3">
            {[...NAV_GROUPS, ...OPERATIONS_GROUPS].map((group: any) => {
              const isOpen = openGroups[group.title];
              const hasItems = group.items && group.items.length > 0;
              const isGroupActive =
                hasItems &&
                group.items.some((item: { href: string }) =>
                  pathname.startsWith(item.href),
                );
              const isSingleActive =
                !hasItems &&
                group.href &&
                (pathname === group.href ||
                  (group.href !== "/" && pathname.startsWith(group.href)));

              return (
                <div key={group.title}>
                  {hasItems ? (
                    <>
                      <button
                        onClick={() => toggleGroup(group.title)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group text-sm font-semibold text-foreground",
                          isGroupActive ? "bg-muted/50" : "hover:bg-muted/40",
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <group.icon
                            className={cn(
                              "h-3.75 w-3.75 shrink-0",
                              isGroupActive
                                ? "text-primary"
                                : "text-foreground/70",
                            )}
                          />
                          <span className="whitespace-nowrap">
                            {group.title}
                          </span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-transform text-foreground/40",
                            isOpen ? "rotate-90" : "",
                          )}
                        />
                      </button>

                      {isOpen && (
                        <div className="mt-0.5 mb-1 space-y-0.5">
                          {group.items.map(
                            (item: { href: string; label: string }) => {
                              const isActive = pathname === item.href;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  className={cn(
                                    "flex items-center pl-10 pr-3 py-1.5 rounded-lg text-[13px] transition-colors relative whitespace-nowrap",
                                    isActive
                                      ? "bg-primary/8 text-primary font-semibold"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                  )}
                                >
                                  {isActive && (
                                    <div className="absolute left-7.5 w-0.5 h-3.5 bg-primary rounded-full" />
                                  )}
                                  {item.label}
                                </Link>
                              );
                            },
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={group.href || "#"}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group text-sm font-semibold text-foreground",
                        isSingleActive ? "bg-muted/50" : "hover:bg-muted/40",
                      )}
                    >
                      <group.icon
                        className={cn(
                          "h-3.75 w-3.75 shrink-0",
                          isSingleActive
                            ? "text-primary"
                            : "text-foreground/70",
                        )}
                      />
                      <span className="whitespace-nowrap">{group.title}</span>
                    </Link>
                  )}
                </div>
              );
            })}

            <div className="pt-1 space-y-0.5">
              <Link
                href="/reports"
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group text-sm font-semibold text-foreground",
                  pathname.startsWith("/reports")
                    ? "bg-muted/50"
                    : "hover:bg-muted/40",
                )}
              >
                <BarChart3
                  className={cn(
                    "h-3.75 w-3.75 shrink-0",
                    pathname.startsWith("/reports")
                      ? "text-primary"
                      : "text-foreground/70",
                  )}
                />
                <span className="whitespace-nowrap">Reports</span>
              </Link>

              <Link
                href="/approvals"
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-colors group text-sm font-semibold text-foreground",
                  pathname.startsWith("/approvals")
                    ? "bg-muted/50"
                    : "hover:bg-muted/40",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ClipboardCheck
                    className={cn(
                      "h-3.75 w-3.75 shrink-0",
                      pathname.startsWith("/approvals")
                        ? "text-primary"
                        : "text-foreground/70",
                    )}
                  />
                  <span className="whitespace-nowrap">Approvals</span>
                </div>
                {pendingCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-5 px-1.5 text-[13px] rounded-full shrink-0"
                  >
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/60 p-4 shrink-0">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-[13px]">
                {currentUser?.username?.split(" ")[0]?.[0]?.toUpperCase()}
                {currentUser?.username?.split(" ")[1]?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">
                {currentUser?.username}
              </p>
              <p className="text-[13px] text-muted-foreground truncate uppercase tracking-wide">
                {currentUser?.roles?.[0]?.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <div className="space-y-0.5">
            {/* <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors font-medium"
              onClick={() => setSwitchRoleOpen(true)}
            >
              <Users className="h-3.5 w-3.5" />
              Switch Role
            </button> */}
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors font-medium"
              onClick={() => setLogoutOpen(true)}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? Any unsaved changes will be
              lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Switch Role Dialog */}
      {/* <Dialog open={switchRoleOpen} onOpenChange={setSwitchRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Switch Role</DialogTitle>
            <DialogDescription>
              Select a different user to simulate role-based access.
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 py-6">
            <Select
              value={switchUserId}
              onValueChange={(v) => setSwitchUserId(v || "")}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                    <span className="ml-2 text-muted-foreground text-[13px]">
                      ({u.roles[0]?.replace(/_/g, " ")})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setSwitchRoleOpen(false);
                setSwitchUserId("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSwitchRole} disabled={!switchUserId}>
              Switch User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </>
  );
}

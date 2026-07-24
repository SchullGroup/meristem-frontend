"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Drill-in detail header for the KYC module: a `← Back` button that replaces
 * the parent list, plus title/subtitle and an optional actions slot. Mirrors
 * the dividend module's DetailHeader (no breadcrumb trail).
 */
export function DetailHeader({
  backLabel,
  onBack,
  title,
  subtitle,
  actions,
}: {
  backLabel: string;
  onBack: () => void;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Button>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

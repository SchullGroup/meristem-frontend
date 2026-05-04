import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendLabel?: string;
  variant?: "default" | "warning" | "destructive";
}

export function StatCard({ label, value, icon: Icon, trend, trendLabel, variant = "default" }: StatCardProps) {
  const valueColor = variant === "destructive" ? "text-destructive" : variant === "warning" ? "text-amber-600" : "";
  const iconColor = variant === "destructive" ? "text-destructive" : variant === "warning" ? "text-amber-600" : "text-muted-foreground";

  return (
    <Card className="mrpsl-card p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className={`mrpsl-section-title ${variant === 'warning' ? 'text-amber-700' : ''}`}>{label}</span>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="mt-2">
        <span className={`text-3xl font-bold font-mono tabular-nums ${valueColor}`}>{value}</span>
        {(trend || trendLabel) && (
          <div className={`text-xs mt-1 ${trend?.startsWith('+') ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
            {trend} {trendLabel}
          </div>
        )}
      </div>
    </Card>
  );
}
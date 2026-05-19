import { useStore } from "@/lib/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface AuditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
}

export function AuditSheet({
  open,
  onOpenChange,
  entityType,
  entityId,
}: AuditSheetProps) {
  const { auditLog } = useStore();

  const entries = auditLog
    .filter((log) => log.entityId === entityId && log.entityType === entityType)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="border-b pb-4 mb-6">
          <SheetTitle>Audit Trail</SheetTitle>
          <SheetDescription className="font-mono">
            {entityType}: {entityId}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {entries.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No audit records found for this entity.
            </div>
          ) : (
            <div className="relative border-l ml-3 pl-6 space-y-8">
              {entries.map((entry) => {
                const isCreate = entry.action.includes("CREATE");
                const isDelete =
                  entry.action.includes("DELETE") ||
                  entry.action.includes("DEACTIVATE");
                const colorClass = isCreate
                  ? "bg-green-500"
                  : isDelete
                    ? "bg-red-500"
                    : "bg-amber-500";

                return (
                  <div key={entry.id} className="relative">
                    <div
                      className={`absolute left-[-29px] top-1 h-3 w-3 rounded-full ${colorClass} ring-4 ring-background`}
                    />
                    <div className="text-xs text-muted-foreground mb-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div className="font-bold font-mono text-sm">
                      {entry.action}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium">{entry.actor}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {entry.role}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useGetCautionReasons,
  useCreateCautionReason,
  useUpdateCautionReason,
  useDeleteCautionReason,
} from "@/hooks/useCautionReasons";
import {
  CautionReason,
  CautionReasonSeverity,
  CautionReasonStatus,
} from "@/types/parameters";
import { SearchableSelect } from "@/components/custom/searchable-select";

const SEVERITY_OPTIONS = ["High", "Medium", "Low"];
const severityColor: Record<string, string> = {
  High: "border-red-200   bg-red-50   text-red-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-blue-200  bg-blue-50  text-blue-700",
};

const labelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block";

interface CautionParametersProps {
  tab: string;
  confirmDelete: (label: string, onConfirm: () => void) => void;
}

const PAGE_SIZE = 10;

export default function CautionParameters({
  tab,
  confirmDelete,
}: CautionParametersProps) {
  // ── Caution dialog ───────────────────────────────────────────
  const [cautOpen, setCautOpen] = useState(false);
  const [cautMode, setCautMode] = useState<"add" | "edit">("add");
  const [editCaut, setEditCaut] = useState<CautionReason | null>(null);
  const [cautR, setCautR] = useState("");
  const [cautS, setCautS] = useState("Medium");
  const [cautNote, setCautNote] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // ── Caution Reasons ─────────────────────────────────────────
  const { data: cautionsData, isLoading: cautionsLoading } =
    useGetCautionReasons(
      {
        page: currentPage,
        size: PAGE_SIZE,
        sortBy,
        sortDirection,
      },
      { enabled: tab === "caution" },
    );
  const cautions = cautionsData?.content || [];

  const createCautionMutation = useCreateCautionReason();
  const updateCautionMutation = useUpdateCautionReason();
  const deleteCautionMutation = useDeleteCautionReason();

  const openAddCaution = () => {
    setCautMode("add");
    setEditCaut(null);
    setCautR("");
    setCautS("Medium");
    setCautNote("");
    setCautOpen(true);
  };

  const openEditCaution = (x: CautionReason) => {
    setCautMode("edit");
    setEditCaut(x);
    setCautR(x.reason);
    setCautS(x.severity || "Medium");
    setCautNote("");
    setCautOpen(true);
  };

  const saveCaution = () => {
    if (!cautR.trim()) return;
    if (cautMode === "add") {
      createCautionMutation.mutate(
        {
          reason: cautR.trim(),
          severity: cautS as CautionReasonSeverity,
          status: "Active" as CautionReasonStatus,
          reasonForChange: cautNote || "Added new caution reason",
        },
        {
          onSuccess: () => {
            toast.success("Caution reason added.");
            setCautOpen(false);
          },
          onError: (err) =>
            toast.error(err.message || "Failed to add caution reason"),
        },
      );
    } else if (editCaut) {
      updateCautionMutation.mutate(
        {
          code: editCaut.code,
          payload: {
            reason: cautR.trim(),
            severity: cautS as CautionReasonSeverity,
            status: editCaut.status as CautionReasonStatus,
            reasonForChange: cautNote || "Updated caution reason",
          },
        },
        {
          onSuccess: () => {
            toast.success("Caution reason updated.");
            setCautOpen(false);
          },
          onError: (err) =>
            toast.error(err.message || "Failed to update caution reason"),
        },
      );
    }
  };

  const deleteCaution = (code: string) => {
    deleteCautionMutation.mutate(code, {
      onSuccess: () => toast.success("Caution reason removed."),
      onError: (err) =>
        toast.error(err.message || "Failed to remove caution reason"),
    });
  };

  return (
    <>
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Caution Reasons</h3>
          <Button size="sm" variant="outline" onClick={openAddCaution}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Reason
          </Button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Reason</th>
              <th className="px-5 py-3">Severity</th>
              <th className="px-5 py-3 text-center">Active</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {cautionsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="mrpsl-table-row">
                  <td className="px-5 py-3">
                    <div className="h-4 w-12 rounded-lg bg-gray-200" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-4 w-40 rounded-lg bg-gray-200" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-6 w-16 rounded-lg bg-gray-200" />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="h-5 w-8 rounded-lg mx-auto bg-gray-200" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="h-8 w-16 rounded-lg ml-auto bg-gray-200" />
                  </td>
                </tr>
              ))
            ) : cautions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-muted-foreground"
                >
                  No caution reasons found.
                </td>
              </tr>
            ) : (
              cautions.map((x) => (
                <tr key={x.code} className="mrpsl-table-row">
                  <td className="px-5 py-3 tabular-nums text-xs text-muted-foreground">
                    {x.code}
                  </td>
                  <td className="px-5 py-3 font-semibold">{x.reason}</td>
                  <td className="px-5 py-3">
                    {/* <Badge
                      variant="outline"
                      className={cn(
                        "font-semibold uppercase tracking-wide text-xs px-2.5 py-0.5",
                        severityColor[x.status],
                      )}
                    >
                      {x.severity}
                    </Badge> */}
                    -----
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Switch
                      checked={x.status === "Active"}
                      onCheckedChange={(v) => {
                        updateCautionMutation.mutate(
                          {
                            code: x.code,
                            payload: {
                              reason: x.reason,
                              severity: x.severity,
                              status: (v
                                ? "Active"
                                : "Inactive") as CautionReasonStatus,
                              reasonForChange: v ? "Activated" : "Deactivated",
                            },
                          },
                          {
                            onSuccess: () =>
                              toast.success(
                                `Caution reason ${v ? "activated" : "deactivated"}.`,
                              ),
                            onError: (err) => toast.error(err.message),
                          },
                        );
                      }}
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => openEditCaution(x)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          confirmDelete(x.reason, () => deleteCaution(x.code))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={cautOpen} onOpenChange={setCautOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {cautMode === "add"
                ? "Add Caution Reason"
                : "Edit Caution Reason"}
            </DialogTitle>
            <DialogDescription>
              {cautMode === "add"
                ? "Define a new reason for placing an account on caution."
                : `Editing "${editCaut?.reason}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Caution Description *</label>
              <Input
                value={cautR}
                onChange={(e) => setCautR(e.target.value)}
                placeholder="e.g. Estate Dispute"
                className="mrpsl-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Severity *</label>
              <SearchableSelect
                options={SEVERITY_OPTIONS}
                value={cautS}
                onChange={setCautS}
                placeholder="Select severity…"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Notes</label>
              <Textarea
                value={cautNote}
                onChange={(e) => setCautNote(e.target.value)}
                placeholder="Optional notes about this caution reason…"
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCautOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveCaution}
              disabled={
                !cautR.trim() ||
                createCautionMutation.isPending ||
                updateCautionMutation.isPending
              }
            >
              {(createCautionMutation.isPending ||
                updateCautionMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {cautMode === "add" ? "Add Reason" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { Plus, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import DateInput from "@/components/ui/date-input";
import { toast } from "sonner";

type BonusStatus = "DRAFT" | "PENDING_AUTH" | "PENDING_ICU" | "ICU_APPROVED" | "ALLOTTED";

interface BonusIssue {
  id: string;
  name: string;
  register: string;
  ratio: string;
  qualificationDate: Date | null;
  closureDate: Date | null;
  allotmentDate: Date | null;
  roundingRule: string;
  narrative: string;
  eventId: string;
  registerAccountNumber: string;
  status: BonusStatus;
}

const MOCK_BONUSES: BonusIssue[] = [
  {
    id: "1",
    name: "Zenith Bank Bonus Issue 2024",
    register: "Zenith Bank Ord. Shares",
    ratio: "1 for 5",
    qualificationDate: new Date("2024-06-30"),
    closureDate: new Date("2024-07-15"),
    allotmentDate: new Date("2024-08-01"),
    roundingRule: "Round Down",
    narrative: "One bonus share for every five held at qualification date.",
    eventId: "BNS-2024-001",
    registerAccountNumber: "REG-ZB-001",
    status: "ICU_APPROVED",
  },
];

const STATUS_MAP: Record<BonusStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_AUTH: "bg-amber-100 text-amber-800",
  PENDING_ICU: "bg-amber-100 text-amber-800",
  ICU_APPROVED: "bg-green-100 text-green-800",
  ALLOTTED: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<BonusStatus, string> = {
  DRAFT: "Draft",
  PENDING_AUTH: "Pending Approval",
  PENDING_ICU: "Pending ICU",
  ICU_APPROVED: "ICU Approved",
  ALLOTTED: "Allotted",
};

const MOCK_REGISTERS = [
  "Zenith Bank Ord. Shares",
  "GTBank Ord. Shares",
  "Access Holdings Ord. Shares",
  "UBA Ord. Shares",
];

const ROUNDING_RULES = ["Round Down", "Round Up", "Round to Nearest"];

type FormState = Omit<BonusIssue, "id" | "status">;

const EMPTY_FORM: FormState = {
  name: "",
  register: "",
  ratio: "",
  qualificationDate: null,
  closureDate: null,
  allotmentDate: null,
  roundingRule: "Round Down",
  narrative: "",
  eventId: "",
  registerAccountNumber: "",
};

export function BonusSetupForm() {
  const [bonuses, setBonuses] = useState<BonusIssue[]>(MOCK_BONUSES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BonusIssue | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEdit = (bonus: BonusIssue) => {
    setEditing(bonus);
    const { id, status, ...rest } = bonus;
    setForm(rest);
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.register || !form.ratio) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (editing) {
      setBonuses((prev) =>
        prev.map((b) => (b.id === editing.id ? { ...b, ...form } : b))
      );
      toast.success("Bonus issue profile updated.");
    } else {
      setBonuses((prev) => [
        ...prev,
        { ...form, id: Date.now().toString(), status: "DRAFT" },
      ]);
      toast.success("Bonus issue profile created as Draft.");
    }
    setSheetOpen(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {bonuses.length} bonus issue{bonuses.length !== 1 ? "s" : ""} configured
          </p>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Bonus Issue
          </Button>
        </div>

        {bonuses.length === 0 ? (
          <Card className="mrpsl-card p-12 flex flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-sm">No bonus issues configured</p>
            <p className="text-xs text-muted-foreground">
              Click "New Bonus Issue" to configure a bonus issue before processing.
            </p>
          </Card>
        ) : (
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-3 font-medium">Bonus Issue Name</th>
                    <th className="text-left px-4 py-3 font-medium">Register</th>
                    <th className="text-left px-4 py-3 font-medium">Ratio</th>
                    <th className="text-left px-4 py-3 font-medium">Qual. Date</th>
                    <th className="text-left px-4 py-3 font-medium">Closure Date</th>
                    <th className="text-left px-4 py-3 font-medium">Allotment Date</th>
                    <th className="text-left px-4 py-3 font-medium">Rounding</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses.map((bonus) => (
                    <tr key={bonus.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-medium">{bonus.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{bonus.register}</td>
                      <td className="px-4 py-3 font-mono text-sm">{bonus.ratio}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {bonus.qualificationDate
                          ? format(bonus.qualificationDate, "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {bonus.closureDate
                          ? format(bonus.closureDate, "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {bonus.allotmentDate
                          ? format(bonus.allotmentDate, "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {bonus.roundingRule}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-[12px] ${STATUS_MAP[bonus.status]}`}>
                          {STATUS_LABELS[bonus.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(bonus)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-120 sm:max-w-120 overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle>{editing ? "Edit Bonus Issue Profile" : "New Bonus Issue"}</SheetTitle>
            <SheetDescription>
              Configure the bonus issue parameters. Fields marked * are required.
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1">
              <label className="mrpsl-label">Bonus Issue Name *</label>
              <input
                className="mrpsl-input h-9 w-full"
                placeholder="e.g. Zenith Bank Bonus Issue 2024"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="mrpsl-label">Register *</label>
                <select
                  className="mrpsl-input h-9 w-full"
                  value={form.register}
                  onChange={(e) => set("register", e.target.value)}
                >
                  <option value="">Select register…</option>
                  {MOCK_REGISTERS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="mrpsl-label">Bonus Ratio *</label>
                <input
                  className="mrpsl-input h-9 w-full"
                  placeholder="e.g. 1 for 5"
                  value={form.ratio}
                  onChange={(e) => set("ratio", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <DateInput
                label="Qualification Date *"
                date={form.qualificationDate}
                setDate={(d) => set("qualificationDate", d)}
              />
              <DateInput
                label="Closure Date *"
                date={form.closureDate}
                setDate={(d) => set("closureDate", d)}
              />
              <DateInput
                label="Allotment Date"
                date={form.allotmentDate}
                setDate={(d) => set("allotmentDate", d)}
              />
            </div>

            <div className="space-y-1">
              <label className="mrpsl-label">Rounding Rule *</label>
              <select
                className="mrpsl-input h-9 w-full"
                value={form.roundingRule}
                onChange={(e) => set("roundingRule", e.target.value)}
              >
                {ROUNDING_RULES.map((rule) => (
                  <option key={rule} value={rule}>{rule}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="mrpsl-label">Event ID</label>
                <input
                  className="mrpsl-input h-9 w-full font-mono"
                  placeholder="e.g. BNS-2024-001"
                  value={form.eventId}
                  onChange={(e) => set("eventId", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="mrpsl-label">Register Account Number</label>
                <input
                  className="mrpsl-input h-9 w-full font-mono"
                  placeholder="e.g. REG-ZB-001"
                  value={form.registerAccountNumber}
                  onChange={(e) => set("registerAccountNumber", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="mrpsl-label">Narrative / Notes</label>
              <textarea
                className="mrpsl-input w-full resize-none h-20 text-sm"
                placeholder="Optional notes about this bonus issue…"
                value={form.narrative}
                onChange={(e) => set("narrative", e.target.value)}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Save Changes" : "Create Bonus Issue Profile"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

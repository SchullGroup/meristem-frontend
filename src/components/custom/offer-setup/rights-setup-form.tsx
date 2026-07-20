"use client";

import { useState } from "react";
import { Plus, Eye, ArrowRight, FileText, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import { toast } from "sonner";

type OfferStatus = "DRAFT" | "OPEN" | "CLOSED" | "ALLOTTED" | "CONCLUDED";

interface RightsIssue {
  id: string;
  name: string;
  register: string;
  ratioNumerator: number;
  ratioDenominator: number;
  pricePerShare: number;
  qualificationDate: Date | null;
  openingDate: Date | null;
  closingDate: Date | null;
  secApprovalDate: Date | null;
  eventId: string;
  tradedRightsSymbol: string;
  receivingBanks: { bankName: string; accountNumber: string }[];
  narration: string;
  status: OfferStatus;
}

const MOCK_RIGHTS: RightsIssue[] = [
  {
    id: "1",
    name: "Fidelity Bank PLC Rights Issue 2024",
    register: "Fidelity Bank Ord. Shares",
    ratioNumerator: 1,
    ratioDenominator: 10,
    pricePerShare: 9.25,
    qualificationDate: new Date("2024-07-31"),
    openingDate: new Date("2024-08-12"),
    closingDate: new Date("2024-08-30"),
    secApprovalDate: new Date("2024-07-15"),
    eventId: "RTS-2024-001",
    tradedRightsSymbol: "FIDBNK-RT",
    receivingBanks: [
      { bankName: "Fidelity Bank PLC", accountNumber: "5012345678" },
      { bankName: "Access Bank PLC", accountNumber: "0234567890" },
    ],
    narration: "Rights Issue at ₦9.25 per share.",
    status: "CLOSED",
  },
];

const STATUS_MAP: Record<OfferStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-amber-100 text-amber-800",
  ALLOTTED: "bg-blue-100 text-blue-800",
  CONCLUDED: "bg-purple-100 text-purple-800",
};

const MOCK_REGISTERS = [
  "Access Holdings Ord. Shares",
  "Fidelity Bank Ord. Shares",
  "GTBank Ord. Shares",
  "Zenith Bank Ord. Shares",
];

const NIGERIAN_BANKS = [
  "Access Bank PLC",
  "Fidelity Bank PLC",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)",
  "Keystone Bank",
  "Polaris Bank",
  "Stanbic IBTC Bank",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Wema Bank",
  "Zenith Bank PLC",
];

type FormState = Omit<RightsIssue, "id" | "status">;

const EMPTY_FORM: FormState = {
  name: "",
  register: "",
  ratioNumerator: 1,
  ratioDenominator: 1,
  pricePerShare: 0,
  qualificationDate: null,
  openingDate: null,
  closingDate: null,
  secApprovalDate: null,
  eventId: "",
  tradedRightsSymbol: "",
  receivingBanks: [],
  narration: "",
};

export function RightsSetupForm() {
  const [issues, setIssues] = useState<RightsIssue[]>(MOCK_RIGHTS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RightsIssue | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const addBank = () => {
    if (form.receivingBanks.length < 3) {
      set("receivingBanks", [...form.receivingBanks, { bankName: "", accountNumber: "" }]);
    }
  };

  const updateBank = (index: number, field: "bankName" | "accountNumber", value: string) => {
    const updated = form.receivingBanks.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    );
    set("receivingBanks", updated);
  };

  const removeBank = (index: number) => {
    set("receivingBanks", form.receivingBanks.filter((_, i) => i !== index));
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEdit = (issue: RightsIssue) => {
    setEditing(issue);
    const { id, status, ...rest } = issue;
    setForm(rest);
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.register || !form.ratioDenominator) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (editing) {
      setIssues((prev) =>
        prev.map((i) => (i.id === editing.id ? { ...i, ...form } : i))
      );
      toast.success("Rights issue profile updated.");
    } else {
      setIssues((prev) => [
        ...prev,
        { ...form, id: Date.now().toString(), status: "DRAFT" },
      ]);
      toast.success("New rights issue profile created as Draft.");
    }
    setSheetOpen(false);
  };

  const handleMoveToRegister = (id: string) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "OPEN" as OfferStatus } : i))
    );
    toast.success("Rights issue moved to register and set to Open.");
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {issues.length} rights issue{issues.length !== 1 ? "s" : ""} configured
          </p>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Rights Issue
          </Button>
        </div>

        {issues.length === 0 ? (
          <Card className="mrpsl-card p-12 flex flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-sm">No rights issues configured</p>
            <p className="text-xs text-muted-foreground">
              Click "New Rights Issue" to configure a rights issue before processing.
            </p>
          </Card>
        ) : (
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-3 font-medium">Rights Issue Name</th>
                    <th className="text-left px-4 py-3 font-medium">Register</th>
                    <th className="text-center px-4 py-3 font-medium">Ratio</th>
                    <th className="text-right px-4 py-3 font-medium">Price / Share</th>
                    <th className="text-left px-4 py-3 font-medium">Qual. Date</th>
                    <th className="text-left px-4 py-3 font-medium">Opens</th>
                    <th className="text-left px-4 py-3 font-medium">Closes</th>
                    <th className="text-left px-4 py-3 font-medium">Event ID</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-medium">{issue.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{issue.register}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs">
                        {issue.ratioNumerator}:{issue.ratioDenominator}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        ₦{issue.pricePerShare.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {issue.qualificationDate
                          ? format(issue.qualificationDate, "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {issue.openingDate ? format(issue.openingDate, "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {issue.closingDate ? format(issue.closingDate, "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {issue.eventId || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-[12px] ${STATUS_MAP[issue.status]}`}>
                          {issue.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {issue.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleMoveToRegister(issue.id)}
                            >
                              <ArrowRight className="h-3.5 w-3.5 mr-1" />
                              Move to Register
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => openEdit(issue)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
        <SheetContent className="w-130 sm:max-w-130 overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle>
              {editing ? "Edit Rights Issue Profile" : "New Rights Issue"}
            </SheetTitle>
            <SheetDescription>
              Configure the rights issue parameters. Fields marked * are required.
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Rights Issue Name *</label>
              <input
                className="mrpsl-input h-9 w-full"
                placeholder="e.g. Fidelity Bank PLC Rights Issue 2024"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="mrpsl-label">Register *</label>
              <Select value={form.register} onValueChange={(v) => set("register", v ?? "")}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select register…" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_REGISTERS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ratio — two numeric inputs */}
            <div className="space-y-1.5">
              <label className="mrpsl-label">Rights Ratio *</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  className="mrpsl-input h-9 w-10! text-center font-mono px-1"
                  placeholder="1"
                  value={form.ratioNumerator || ""}
                  onChange={(e) => set("ratioNumerator", Number(e.target.value))}
                />
                <span className="text-lg font-semibold text-muted-foreground select-none">:</span>
                <input
                  type="number"
                  min={1}
                  className="mrpsl-input h-9 w-10! text-center font-mono px-1"
                  placeholder="10"
                  value={form.ratioDenominator || ""}
                  onChange={(e) => set("ratioDenominator", Number(e.target.value))}
                />
                <span className="text-xs text-muted-foreground ml-1">
                  new share{form.ratioNumerator !== 1 ? "s" : ""} for every {form.ratioDenominator} held
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Price per Share (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="mrpsl-input h-9 w-full"
                  placeholder="0.00"
                  value={form.pricePerShare || ""}
                  onChange={(e) => set("pricePerShare", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">Event ID</label>
                <input
                  className="mrpsl-input h-9 w-full font-mono"
                  placeholder="e.g. RTS-2024-001"
                  value={form.eventId}
                  onChange={(e) => set("eventId", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Qualification Date *"
                date={form.qualificationDate}
                setDate={(d) => set("qualificationDate", d)}
              />
              <DateInput
                label="Opening Date *"
                date={form.openingDate}
                setDate={(d) => set("openingDate", d)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Closing Date *"
                date={form.closingDate}
                setDate={(d) => set("closingDate", d)}
              />
              <DateInput
                label="SEC Approval Date"
                date={form.secApprovalDate}
                setDate={(d) => set("secApprovalDate", d)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="mrpsl-label">Traded Rights Symbol</label>
              <input
                className="mrpsl-input h-9 w-full font-mono"
                placeholder="e.g. FIDBNK-RT"
                value={form.tradedRightsSymbol}
                onChange={(e) => set("tradedRightsSymbol", e.target.value)}
              />
            </div>

            {/* Receiving Banks — up to 3 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="mrpsl-label">Receiving Bank Accounts</label>
                <span className="text-xs text-muted-foreground">{form.receivingBanks.length}/3</span>
              </div>

              {form.receivingBanks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">No banks added yet.</p>
              ) : (
                <div className="space-y-3">
                  {form.receivingBanks.map((bank, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-muted-foreground mt-2.5 shrink-0 w-4">{i + 1}.</span>
                      <div className="flex-1 space-y-1.5">
                        <Select
                          value={bank.bankName}
                          onValueChange={(v) => updateBank(i, "bankName", v ?? "")}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Select bank…" />
                          </SelectTrigger>
                          <SelectContent>
                            {NIGERIAN_BANKS.filter(
                              (b) => b === bank.bankName || !form.receivingBanks.some((rb) => rb.bankName === b)
                            ).map((b) => (
                              <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input
                          className="mrpsl-input h-9 w-full"
                          placeholder="Account number"
                          value={bank.accountNumber}
                          onChange={(e) => updateBank(i, "accountNumber", e.target.value)}
                          maxLength={10}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBank(i)}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 mt-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.receivingBanks.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 text-xs h-8"
                  onClick={addBank}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Receiving Bank
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="mrpsl-label">Rights Circular (PDF)</label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => toast.info("File upload coming soon")}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload the rights circular (PDF)
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="mrpsl-label">Narration</label>
                <span className="text-xs text-muted-foreground">{form.narration.length}/300</span>
              </div>
              <textarea
                className="mrpsl-input h-auto min-h-22 resize-none py-2.5 leading-relaxed"
                placeholder="Optional notes about this rights issue…"
                maxLength={300}
                rows={4}
                value={form.narration}
                onChange={(e) => set("narration", e.target.value)}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Save Changes" : "Create Rights Issue Profile"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

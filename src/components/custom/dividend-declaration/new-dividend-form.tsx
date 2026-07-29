"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import DateInput from "@/components/ui/date-input";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { MOCK_CURRENCIES, MOCK_REGISTERS } from "./seed-data";
import { formatNaira } from "./helpers";
import {
  useCreateDividendFlow,
  useEditAndResendDividendFlow,
  type DividendFlowFormValues,
} from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";

const WAREHOUSE_BANKS = [
  { value: "gtb", label: "GTBank" },
  { value: "zenith", label: "Zenith Bank" },
  { value: "access", label: "Access Bank" },
  { value: "first", label: "First Bank" },
  { value: "uba", label: "UBA" },
  { value: "stanbic", label: "Stanbic IBTC" },
];

function computeTier(amount: number) {
  if (amount <= 500_000) return 1;
  if (amount <= 5_000_000) return 2;
  if (amount <= 50_000_000) return 3;
  return 4;
}

function tierInfo(tier: number) {
  switch (tier) {
    case 1:
      return {
        color: "bg-green-50 border-green-200 text-green-800",
        label: "Auto-Approval",
        req: "None",
      };
    case 2:
      return {
        color: "bg-blue-50 border-blue-200 text-blue-800",
        label: "Manager Approval Required",
        req: "Ops Manager",
      };
    case 3:
      return {
        color: "bg-amber-50 border-amber-200 text-amber-800",
        label: "Compliance Approval Required",
        req: "Internal Control (ICU)",
      };
    default:
      return {
        color: "bg-red-50 border-red-200 text-red-800",
        label: "Board Approval Required",
        req: "MD + CEO dual sign-off",
      };
  }
}

const EMPTY_FORM = {
  registerSymbol: "",
  dividendType: "FINAL" as "FINAL" | "INTERIM" | "SPECIAL",
  currency: "NGN",
  rate: "" as number | "",
  fractional: false,
  date1: undefined as Date | undefined,
  date2: undefined as Date | undefined,
  date3: undefined as Date | undefined,
  narrative: "",
  whtRateOption: "10",
  customWhtRate: "" as number | "",
  isTaxExempt: false,
  exemptionRateOption: "0",
  customExemptionRate: "" as number | "",
  warehouseBank: "",
  warehouseAccountNo: "",
};

function formFromRecord(editRecord: DividendFlowRecord) {
  return {
    registerSymbol: editRecord.registerSymbol,
    dividendType: editRecord.dividendType,
    currency: editRecord.currency,
    rate: editRecord.rate,
    fractional: editRecord.fractionalRegister,
    date1: new Date(editRecord.qualificationDate),
    date2: new Date(editRecord.closureDate),
    date3: new Date(editRecord.paymentDate),
    narrative: editRecord.narrative ?? "",
    whtRateOption: String(editRecord.whtRate),
    customWhtRate: "" as number | "",
    isTaxExempt: editRecord.isTaxExempt,
    exemptionRateOption: String(editRecord.exemptionRate ?? "0"),
    customExemptionRate: "" as number | "",
    warehouseBank: editRecord.warehouseBank ?? "",
    warehouseAccountNo: editRecord.warehouseAccountNo ?? "",
  };
}

export function NewDividendForm({
  editRecord,
  onCancel,
  onSuccess,
}: {
  editRecord?: DividendFlowRecord | null;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { currentUser } = useStore();
  const [form, setForm] = useState(() =>
    editRecord ? formFromRecord(editRecord) : EMPTY_FORM,
  );

  const createMutation = useCreateDividendFlow();
  const editMutation = useEditAndResendDividendFlow();
  const isPending = createMutation.isPending || editMutation.isPending;

  const register = MOCK_REGISTERS.find((r) => r.symbol === form.registerSymbol);
  const stockToday = register?.currentStockInIssue || 0;
  const rateNum = typeof form.rate === "number" ? form.rate : 0;
  const grossLiability = rateNum * stockToday;

  const whtRateNum =
    form.whtRateOption === "custom"
      ? typeof form.customWhtRate === "number"
        ? form.customWhtRate
        : 0
      : Number(form.whtRateOption);
  const exemptionRateNum =
    form.exemptionRateOption === "custom"
      ? typeof form.customExemptionRate === "number"
        ? form.customExemptionRate
        : 0
      : Number(form.exemptionRateOption);
  const effectiveWhtRate = form.isTaxExempt ? exemptionRateNum : whtRateNum;

  const wht = grossLiability * (effectiveWhtRate / 100);
  const netLiability = grossLiability - wht;
  const tier = computeTier(grossLiability);
  const info = tierInfo(tier);

  const registerBlocked =
    register?.status === "INACTIVE" ||
    register?.status === "TRANSACTION_DISABLED";

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    if (registerBlocked) {
      toast.error(
        "Cannot declare dividend — register is Inactive or Transaction Disabled.",
      );
      return;
    }
    if (!form.registerSymbol || !form.rate) {
      toast.error("Register and dividend rate are required.");
      return;
    }
    if (!form.date1) {
      toast.error("Qualification date is required.");
      return;
    }
    if (!form.date2) {
      toast.error("Closure date is required.");
      return;
    }
    if (!form.date3) {
      toast.error("Payment date is required.");
      return;
    }
    if (form.date2 < form.date1) {
      toast.error("Closure date must be greater than qualification date.");
      return;
    }
    if (form.date3 < form.date2) {
      toast.error("Payment date must be greater than closure date.");
      return;
    }

    const values: DividendFlowFormValues = {
      registerSymbol: form.registerSymbol,
      dividendType: form.dividendType,
      currency: form.currency,
      rate: rateNum,
      fractionalRegister: form.fractional,
      qualificationDate: format(form.date1, "yyyy-MM-dd"),
      closureDate: format(form.date2, "yyyy-MM-dd"),
      paymentDate: format(form.date3, "yyyy-MM-dd"),
      narrative: form.narrative,
      whtRate: whtRateNum,
      isTaxExempt: form.isTaxExempt,
      exemptionRate: form.isTaxExempt ? exemptionRateNum : undefined,
      warehouseBank: form.warehouseBank || undefined,
      warehouseAccountNo: form.warehouseAccountNo || undefined,
      initiatedBy: currentUser.email,
    };

    if (editRecord) {
      editMutation.mutate(
        { id: editRecord.id, values },
        {
          onSuccess: () => {
            toast.success("Declaration updated and resent for approval.");
            onSuccess();
          },
          onError: (err) =>
            toast.error(err?.message || "Failed to resend declaration."),
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success(
            "Dividend declaration created. Generate a prelist next.",
          );
          onSuccess();
        },
        onError: (err) =>
          toast.error(err?.message || "Failed to create declaration."),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Dividends
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-bold tracking-tight">
          {editRecord
            ? "Edit & Resend Declaration"
            : "New Dividend Declaration"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {editRecord
            ? `Rejected — ${editRecord.rejectionComment ?? "no comment provided."}`
            : "Declare a dividend for a register and route it through the approval workflow."}
        </p>
      </div>

      <Card className="mrpsl-card p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="mrpsl-label">Register *</label>
            <Select
              value={form.registerSymbol}
              onValueChange={(v) => set("registerSymbol", v || "")}
            >
              <SelectTrigger className="mrpsl-input">
                <SelectValue placeholder="Select Register" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_REGISTERS.map((r) => (
                  <SelectItem key={r.registerId} value={r.symbol}>
                    <span className="font-bold">{r.registerName}</span> —{" "}
                    <span className="text-xs">{r.symbol}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {register && (
              <p className="text-[13px] bg-muted/60 p-1.5 rounded text-muted-foreground">
                Type: {register.registerType} · Shareholders:{" "}
                {register.currentShareholdersSize.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="mrpsl-label">Dividend Type *</label>
            <Select
              value={form.dividendType}
              onValueChange={(v) =>
                set("dividendType", (v || "FINAL") as typeof form.dividendType)
              }
            >
              <SelectTrigger className="mrpsl-input">
                <SelectValue placeholder="Select Dividend Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FINAL">Final</SelectItem>
                <SelectItem value="INTERIM">Interim</SelectItem>
                <SelectItem value="SPECIAL">Special</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="mrpsl-label">Currency</label>
            <Select
              value={form.currency}
              onValueChange={(v) => set("currency", v || "NGN")}
            >
              <SelectTrigger className="mrpsl-input">
                <SelectValue placeholder="Select Currency" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_CURRENCIES.map((c) => (
                  <SelectItem key={c.id} value={c.code}>
                    {c.name} ({c.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="mrpsl-label">
                Dividend Rate (₦ per share) *
              </label>
              <Input
                type="number"
                step="0.0001"
                placeholder="0.0000"
                className="mrpsl-input text-lg tabular"
                value={form.rate}
                onChange={(e) =>
                  set("rate", e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>

            <div className="space-y-2">
              <label className="mrpsl-label">WHT Rate *</label>
              <Select
                value={form.whtRateOption}
                onValueChange={(v) => set("whtRateOption", v || "10")}
                disabled={form.isTaxExempt}
              >
                <SelectTrigger className="mrpsl-input">
                  <SelectValue placeholder="Select WHT Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="7.5">7.5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.whtRateOption === "custom" && (
              <div className="space-y-2">
                <label className="mrpsl-label">Custom WHT Rate (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  min={0}
                  className="mrpsl-input"
                  value={form.customWhtRate}
                  disabled={form.isTaxExempt}
                  onChange={(e) =>
                    set(
                      "customWhtRate",
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                />
              </div>
            )}

            <div className="flex items-end gap-8 pb-2.5">
              <div className="flex items-center gap-2.5">
                <Switch
                  checked={form.fractional}
                  onCheckedChange={(v) => set("fractional", v)}
                />
                <label className="text-sm font-medium text-muted-foreground">
                  Fractional Register
                </label>
              </div>
              <div className="flex items-center gap-2.5">
                <Switch
                  checked={form.isTaxExempt}
                  onCheckedChange={(v) => set("isTaxExempt", v)}
                />
                <label className="text-sm font-medium text-muted-foreground">
                  Tax Exempt
                </label>
              </div>
            </div>
          </div>

          {form.isTaxExempt && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-lg border border-dashed border-border/70 bg-muted/20 p-4">
              <div className="space-y-2">
                <label className="mrpsl-label">Exemption Rate *</label>
                <Select
                  value={form.exemptionRateOption}
                  onValueChange={(v) => set("exemptionRateOption", v || "0")}
                >
                  <SelectTrigger className="mrpsl-input">
                    <SelectValue placeholder="Select Exemption Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Fully Exempt)</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="7.5">7.5%</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.exemptionRateOption === "custom" && (
                <div className="space-y-2">
                  <label className="mrpsl-label">
                    Custom Exemption Rate (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="mrpsl-input"
                    value={form.customExemptionRate}
                    onChange={(e) =>
                      set(
                        "customExemptionRate",
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                  />
                </div>
              )}
            </div>
          )}

          <div className="bg-muted/30 rounded-xl p-4 border border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="mrpsl-section-title">Gross Liability</div>
              <div className="text-xl font-bold tabular mt-1">
                {formatNaira(grossLiability)}
              </div>
            </div>
            <div>
              <div className="mrpsl-section-title">
                WHT ({effectiveWhtRate}%)
              </div>
              <div className="text-xl font-bold tabular mt-1 text-amber-600">
                {formatNaira(wht)}
              </div>
            </div>
            <div>
              <div className="mrpsl-section-title">Net Payout</div>
              <div className="text-xl font-bold tabular mt-1 text-green-700">
                {formatNaira(netLiability)}
              </div>
            </div>
          </div>
        </div>

        {grossLiability > 0 && (
          <div className={`p-3 rounded-lg border ${info.color} text-center`}>
            <span className="font-bold tracking-widest text-sm uppercase">
              TIER {tier} — {info.label}
            </span>
            <p className="text-[13px] mt-0.5 opacity-80">
              Requires: {info.req}
            </p>
          </div>
        )}

        {registerBlocked && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm font-semibold text-center">
            Register is Inactive or Transaction Disabled — declaration is
            blocked.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DateInput
            label="Qualification Date *"
            date={form.date1 || null}
            setDate={(d) => set("date1", d)}
          />
          <DateInput
            label="Closure Date *"
            date={form.date2 || null}
            setDate={(d) => set("date2", d)}
          />
          <DateInput
            label="Payment Date *"
            date={form.date3 || null}
            setDate={(d) => set("date3", d)}
          />
        </div>

        <div className="space-y-2">
          <label className="mrpsl-label">Narrative</label>
          <Textarea
            placeholder="Add notes or context for approvers..."
            className="resize-none"
            value={form.narrative}
            onChange={(e) => set("narrative", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="mrpsl-label">Warehouse Bank</label>
            <Select
              value={form.warehouseBank}
              onValueChange={(v) => set("warehouseBank", v || "")}
            >
              <SelectTrigger className="mrpsl-input w-full">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {WAREHOUSE_BANKS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="mrpsl-label">Warehouse Account No</label>
            <Input
              className="mrpsl-input font-mono"
              placeholder="Enter account number"
              value={form.warehouseAccountNo}
              onChange={(e) => set("warehouseAccountNo", e.target.value)}
            />
          </div>
        </div>

        <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-lg">
          <ul className="space-y-2 text-sm text-primary/80">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              Dividend computed on units held as at Qualification Date
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              Initiator cannot authorise their own declaration
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              Once authorised, computation results are immutable
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-border/60">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={
              !form.rate || !form.registerSymbol || registerBlocked || isPending
            }
          >
            {editRecord ? "Resend Declaration" : "Submit Declaration"}
            {isPending && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}

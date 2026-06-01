"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  useGetAccountLookup,
  useGetEligibleDividends,
  useSubmitDividendSplitRequest,
} from "@/hooks/useDividendSplit";
import { useGetRegisters } from "@/hooks/useRegisters";

interface PartRow {
  account: string;
  amount: string;
}

export function SplitFormPanel() {
  const { currentUser } = useStore();
  const [splitRegister, setSplitRegister] = useState("");
  const [splitAccount, setSplitAccount] = useState("");
  const [lookupParams, setLookupParams] = useState<{
    accountNumber: string;
    registerId?: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [splitDividend, setSplitDividend] = useState("");
  const [splitParts, setSplitParts] = useState(2);

  const [partRows, setPartRows] = useState<PartRow[]>(
    Array.from({ length: 2 }, () => ({ account: "", amount: "" })),
  );

  const [splitReason, setSplitReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  const {
    data: lookUpData,
    isFetching: isLookUpLoading,
    isError: isLookupError,
    error: lookupError,
  } = useGetAccountLookup(
    {
      accountNumber: lookupParams?.accountNumber || "",
      registerId: lookupParams?.registerId,
    },
    {
      enabled: !!lookupParams?.accountNumber,
    },
  );

  const { data: eligibleDividends, isFetching: isEligibleLoading } =
    useGetEligibleDividends(
      {
        accountNumber: lookupParams?.accountNumber || "",
      },
      {
        enabled: !!lookupParams?.accountNumber && !isLookupError,
      },
    );

  const { mutate: submitSplit, isPending } = useSubmitDividendSplitRequest();

  const selectedDividendMeta = eligibleDividends?.data?.find(
    (d) => String(d.dividendId) === splitDividend,
  );

  const warrantAmount = selectedDividendMeta?.netAmount ?? 0;
  const allocatedTotal = partRows.reduce(
    (s, r) => s + (parseFloat(r.amount) || 0),
    0,
  );

  const remaining = warrantAmount - allocatedTotal;
  const isBalanced = warrantAmount > 0 && remaining === 0;
  const rowsComplete = partRows
    .slice(0, splitParts)
    .every((row) => row.account.trim() !== "" && row.amount.trim() !== "");
  const amountValid = partRows
    .slice(0, splitParts)
    .every(
      (row) => Number(row.amount) > 0 && !Number.isNaN(Number(row.amount)),
    );
  const isDividendEligible = selectedDividendMeta?.eligible ?? false;

  function handlePartsChange(n: number) {
    setSplitParts(n);

    setPartRows((prev) => {
      if (n > prev.length)
        return [
          ...prev,
          ...Array.from({ length: n - prev.length }, () => ({
            account: "",
            amount: "",
          })),
        ];

      return prev.slice(0, n);
    });
  }

  function updateRow(i: number, field: keyof PartRow, value: string) {
    setPartRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    );
  }

  function resetSplitForm() {
    setSplitDividend("");
    setSplitParts(2);
    setPartRows(Array.from({ length: 2 }, () => ({ account: "", amount: "" })));
    setSplitReason("");
    setReasonError(false);
  }

  function handleAccountLookup() {
    if (!searchTerm.trim()) {
      toast.error("Please input an account number to search");
      return;
    }

    setSplitAccount(searchTerm.trim());
    setLookupParams({
      accountNumber: searchTerm.trim(),
      registerId: splitRegister || undefined,
    });
    resetSplitForm();
  }

  function handleSubmit() {
    if (!lookupParams?.accountNumber || !selectedDividendMeta) {
      toast.error(
        "Please lookup an account and select a dividend before submitting.",
      );
      return;
    }

    if (!isDividendEligible) {
      toast.error("Only eligible dividends may be split.");
      return;
    }

    if (!splitReason.trim()) {
      setReasonError(true);
      toast.error("Please provide a reason for the split.");
      return;
    }

    if (!rowsComplete) {
      toast.error("All destination accounts and amount fields must be filled.");
      return;
    }

    if (!amountValid) {
      toast.error("Each split amount must be a positive number.");
      return;
    }

    if (!isBalanced) {
      toast.error(
        "Allocated amounts must match the selected dividend net amount.",
      );
      return;
    }

    submitSplit(
      {
        registerId: lookUpData?.data?.registerId || splitRegister,
        sourceAccountNumber: splitAccount,
        dividendId: splitDividend,
        reason: splitReason,
        submittedBy:
          `${currentUser?.firstName} ${currentUser?.lastName}` || "ADMIN",
        parts: partRows.slice(0, splitParts).map((p) => ({
          destinationAccountNumber: p.account,
          amount: Number(p.amount),
        })),
      },
      {
        onSuccess: () => {
          toast.success("Dividend split submitted for approval.");
          setSearchTerm("");
          setSplitAccount("");
          setLookupParams(null);
          resetSplitForm();
        },
        onError: (error: Error) => {
          toast.error(error.message || "Unable to submit split request.");
        },
      },
    );
  }

  const lookupErrorMessage = isLookupError
    ? lookupError instanceof Error
      ? lookupError.message
      : "No account found for the provided details."
    : null;

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="mrpsl-card p-6 space-y-4">
        <h3 className="font-semibold text-sm border-b pb-2">
          Step 1: Locate Eligible Dividend
        </h3>
        <div className="space-y-4">
          <Select
            value={splitRegister}
            onValueChange={(v) => setSplitRegister(v || "")}
          >
            <SelectTrigger className="mrpsl-input">
              <SelectValue placeholder="Register" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select Register</SelectItem>
              {activeRegisters?.content?.map((r) => (
                <SelectItem key={r.registerId} value={r.registerId}>
                  {r.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Account No / CHN"
                className="mrpsl-input"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
              />
              <Button variant="outline" onClick={handleAccountLookup}>
                Lookup
              </Button>
            </div>
            {isLookUpLoading ? (
              <div className="mt-4 pt-4 border-t text-center py-6">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : lookupErrorMessage ? (
              <div className="mt-4 pt-4 border-t text-center py-6 text-sm text-red-600">
                {lookupErrorMessage}
              </div>
            ) : lookUpData?.data ? (
              <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-[13px] text-blue-800 font-mono">
                {lookUpData.data.accountNumber} — {lookUpData.data.holderName} —{" "}
                {lookUpData.data.registerSymbol}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Select
              value={splitDividend}
              onValueChange={(value) => setSplitDividend(value || "")}
              disabled={!lookUpData?.data || isEligibleLoading}
            >
              <SelectTrigger className="mrpsl-input">
                <SelectValue placeholder="Select Dividend" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                {Array.isArray(eligibleDividends?.data) &&
                  eligibleDividends.data.map((d) => (
                    <SelectItem key={d.dividendId} value={String(d.dividendId)}>
                      {d.dividendNumber}{" "}
                      {d.eligible ? "(Eligible)" : "(Ineligible)"} — ₦
                      {d.netAmount.toLocaleString()}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {splitDividend && selectedDividendMeta ? (
              selectedDividendMeta.eligible ? (
                <Badge className="bg-green-100 text-green-800 border-0 text-[12px]">
                  ELIGIBLE — Unpaid
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 border-0 text-[12px]">
                  INELIGIBLE — Already Paid
                </Badge>
              )
            ) : null}
          </div>
        </div>

        <div className="bg-muted/20 p-4 rounded-md space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Warrant No</span>
            <span className="font-mono font-medium">
              {selectedDividendMeta?.warrantNumber ?? "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Net Amount</span>
            <span className="font-mono font-bold text-green-600">
              {selectedDividendMeta
                ? `₦${selectedDividendMeta.netAmount.toLocaleString()}.00`
                : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span
              className={`text-[13px] px-2 rounded ${
                selectedDividendMeta?.eligible
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {selectedDividendMeta?.status ?? "Select dividend"}
            </span>
          </div>
        </div>
      </Card>

      <Card className="mrpsl-card p-6 space-y-4">
        <h3 className="font-semibold text-sm border-b pb-2">
          Step 2: Configure Split
        </h3>
        <fieldset
          disabled={!isDividendEligible}
          className="space-y-4 disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="space-y-2">
            <label className="mrpsl-label">Number of Parts</label>
            <Select
              value={String(splitParts)}
              onValueChange={(v) => handlePartsChange(Number(v))}
            >
              <SelectTrigger className="mrpsl-input w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {partRows.slice(0, splitParts).map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={`Destination Account ${i + 1}`}
                  className="mrpsl-input flex-1"
                  value={row.account}
                  onChange={(e) => updateRow(i, "account", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  className="mrpsl-input w-32 font-mono"
                  value={row.amount}
                  onChange={(e) => updateRow(i, "amount", e.target.value)}
                />
              </div>
            ))}
          </div>

          {selectedDividendMeta ? (
            isBalanced ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-2 rounded text-sm font-mono text-center">
                Total: ₦{selectedDividendMeta.netAmount.toLocaleString()}.00 / ₦
                {selectedDividendMeta.netAmount.toLocaleString()}.00 ✓ Balanced
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded text-sm font-mono text-center">
                {remaining > 0
                  ? `₦${remaining.toLocaleString()}.00 remaining`
                  : `₦${Math.abs(remaining).toLocaleString()}.00 over-allocated`}
              </div>
            )
          ) : (
            <div className="bg-muted/10 border border-muted/20 text-muted-foreground p-2 rounded text-sm text-center">
              Lookup an account and select a dividend to configure the split.
            </div>
          )}

          <div className="space-y-1.5">
            <Textarea
              placeholder="Reason (required)..."
              className={`focus-visible:ring-primary resize-none ${reasonError ? "border-red-500" : ""}`}
              value={splitReason}
              onChange={(e) => {
                setSplitReason(e.target.value);
                if (e.target.value.trim()) setReasonError(false);
              }}
            />
            {reasonError && (
              <p className="text-[12px] text-red-600">Reason is required.</p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Submitting..." : "Submit for Approval"}
          </Button>
        </fieldset>
        {!isDividendEligible && splitDividend && (
          <p className="text-[13px] text-red-600 text-center">
            Select an eligible dividend to configure the split.
          </p>
        )}
      </Card>
    </div>
  );
}

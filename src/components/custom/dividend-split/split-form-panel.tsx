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
import { toast } from "sonner";
import {
  Loader2,
  Search,
  X,
  Split,
  Wand2,
  Check,
  ArrowRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  useGetEligibleDividends,
  useSubmitDividendSplitRequest,
} from "@/hooks/useDividendSplit";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useGetAccounts } from "@/hooks/useAccountMaintenance";
import { useDebounce } from "@/hooks/useDebounce";
import { ShareholderAccount } from "@/types/account-maintenance";
import { fullName, getInitials } from "@/lib/utils/shareholder";
import { cn } from "@/lib/utils";

interface PartRow {
  account: string;
  accountName: string;
  amount: string;
}

const emptyRow = (): PartRow => ({ account: "", accountName: "", amount: "" });

const naira = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function SplitFormPanel() {
  const { currentUser } = useStore();
  const [splitRegister, setSplitRegister] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShareholder, setSelectedShareholder] =
    useState<ShareholderAccount | null>(null);
  const [splitDividend, setSplitDividend] = useState("");
  const [splitParts, setSplitParts] = useState(2);

  const [partRows, setPartRows] = useState<PartRow[]>(
    Array.from({ length: 2 }, emptyRow),
  );

  const [splitReason, setSplitReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  const { data: activeRegisters, isLoading: isRegisterLoading } =
    useGetRegisters({
      size: 100,
      status: "ACTIVE",
    });

  const debouncedSearch = useDebounce(searchTerm, 500);
  const { data: accountsResponse, isFetching: isSearchingAccounts } =
    useGetAccounts(
      {
        q: debouncedSearch,
        registerId: splitRegister !== "" ? splitRegister : undefined,
      },
      { enabled: debouncedSearch.length > 2 },
    );
  const searchResults = accountsResponse?.data?.data ?? [];

  const { data: eligibleDividends, isFetching: isEligibleLoading } =
    useGetEligibleDividends(
      {
        accountNumber: selectedShareholder?.accountNumber || "",
      },
      {
        enabled: !!selectedShareholder?.accountNumber,
      },
    );

  const dividendOptions = Array.isArray(eligibleDividends?.data)
    ? eligibleDividends.data
    : [];

  const { mutate: submitSplit, isPending } = useSubmitDividendSplitRequest();

  const selectedDividendMeta = dividendOptions.find(
    (d) => String(d.dividendId) === splitDividend,
  );

  const warrantAmount = selectedDividendMeta?.netAmount ?? 0;
  const allocatedTotal = partRows
    .slice(0, splitParts)
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const remaining = Math.round((warrantAmount - allocatedTotal) * 100) / 100;
  const isBalanced = warrantAmount > 0 && remaining === 0;
  const isOver = remaining < 0;
  const allocationPct =
    warrantAmount > 0
      ? Math.min((allocatedTotal / warrantAmount) * 100, 100)
      : 0;

  const rowsComplete = partRows
    .slice(0, splitParts)
    .every((row) => row.account.trim() !== "" && row.amount.trim() !== "");
  const amountValid = partRows
    .slice(0, splitParts)
    .every(
      (row) => Number(row.amount) > 0 && !Number.isNaN(Number(row.amount)),
    );
  const isDividendEligible = selectedDividendMeta?.eligible ?? false;
  const canSubmit =
    isDividendEligible &&
    rowsComplete &&
    amountValid &&
    isBalanced &&
    splitReason.trim() !== "";

  function handlePartsChange(n: number) {
    setSplitParts(n);
    setPartRows((prev) => {
      if (n > prev.length)
        return [...prev, ...Array.from({ length: n - prev.length }, emptyRow)];
      return prev.slice(0, n);
    });
  }

  function updateRowAmount(i: number, value: string) {
    setPartRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, amount: value } : r)),
    );
  }

  function setRowAccount(i: number, acc: ShareholderAccount | null) {
    setPartRows((prev) =>
      prev.map((r, idx) =>
        idx === i
          ? {
              ...r,
              account: acc?.accountNumber ?? "",
              accountName: acc ? fullName(acc) : "",
            }
          : r,
      ),
    );
  }

  // Even split using integer kobo so the parts always sum exactly to the net.
  function splitEvenly() {
    if (!warrantAmount) return;
    const totalKobo = Math.round(warrantAmount * 100);
    const baseKobo = Math.floor(totalKobo / splitParts);
    const amounts = Array.from({ length: splitParts }, (_, idx) =>
      idx === splitParts - 1
        ? (totalKobo - baseKobo * (splitParts - 1)) / 100
        : baseKobo / 100,
    );
    setPartRows((prev) =>
      prev.map((r, idx) =>
        idx < splitParts ? { ...r, amount: String(amounts[idx]) } : r,
      ),
    );
  }

  // Destinations must be in the source account's register and cannot be the
  // source itself or another destination already chosen in this split.
  const excludeFor = (i: number) =>
    [
      selectedShareholder?.accountNumber ?? "",
      ...partRows.filter((_, idx) => idx !== i).map((r) => r.account),
    ].filter(Boolean);

  function resetSplitForm() {
    setSplitDividend("");
    setSplitParts(2);
    setPartRows(Array.from({ length: 2 }, emptyRow));
    setSplitReason("");
    setReasonError(false);
  }

  function selectShareholder(acc: ShareholderAccount) {
    setSelectedShareholder(acc);
    // If the user searched without picking a register first, adopt the
    // selected shareholder's register automatically.
    setSplitRegister(acc.registerSymbol);
    setSearchTerm("");
    resetSplitForm();
  }

  function clearShareholder() {
    setSelectedShareholder(null);
    resetSplitForm();
  }

  function handleSubmit() {
    if (!selectedShareholder || !selectedDividendMeta) {
      toast.error("Please select an account and a dividend before submitting.");
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
    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    submitSplit(
      {
        registerId: selectedShareholder.registerId,
        sourceAccountNumber: selectedShareholder.accountNumber,
        dividendId: splitDividend,
        reason: splitReason,
        submittedBy: currentUser?.email,
        parts: partRows.slice(0, splitParts).map((p) => ({
          destinationAccountNumber: p.account,
          amount: Number(p.amount),
        })),
      },
      {
        onSuccess: () => {
          toast.success("Dividend split submitted for approval.");
          setSearchTerm("");
          setSelectedShareholder(null);
          resetSplitForm();
        },
        onError: (error: Error) => {
          toast.error(error.message || "Unable to submit split request.");
        },
      },
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ── Left: Source & Dividend ── */}
      <Card className="mrpsl-card p-6 space-y-5 h-full overflow-visible">
        <StepHeader
          n={1}
          title="Source & Dividend"
          subtitle="Find the shareholder and the dividend to split"
        />

        <div className="space-y-1.5">
          <label className="mrpsl-label">
            Register{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <Select
            value={splitRegister}
            onValueChange={(v) => setSplitRegister(v || "")}
          >
            <SelectTrigger className="mrpsl-input">
              <SelectValue placeholder="All registers" />
            </SelectTrigger>
            <SelectContent>
              {isRegisterLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                activeRegisters?.content?.map((r) => (
                  <SelectItem key={r.registerId} value={r.symbol}>
                    <span className="font-medium">{r.registerName}</span>{" "}
                    <span className="text-muted-foreground text-xs">
                      {r.symbol}
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Source shareholder */}
        <div className="space-y-1.5">
          <label className="mrpsl-label">Source Shareholder</label>
          {selectedShareholder ? (
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold font-mono text-sm">
                    {getInitials(selectedShareholder)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">
                    {fullName(selectedShareholder)}
                  </p>
                  <p className="text-[12px] text-muted-foreground font-mono truncate">
                    {selectedShareholder.accountNumber} ·{" "}
                    {selectedShareholder.registerSymbol}
                    {selectedShareholder.chn
                      ? ` · CHN ${selectedShareholder.chn}`
                      : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={clearShareholder}
                >
                  Change
                </Button>
              </div>
              {typeof selectedShareholder.holdings === "number" && (
                <div className="mt-3 pt-3 border-t border-border/60 flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Holdings</span>
                  <span className="font-mono font-semibold">
                    {selectedShareholder.holdings.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search by account no, name or CHN…"
                className="mrpsl-input"
                style={{ paddingLeft: "2.25rem" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {debouncedSearch.length > 0 && (
                <div className="absolute z-999 top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg overflow-hidden">
                  {isSearchingAccounts ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      No accounts found
                    </div>
                  ) : (
                    <div className="max-h-62.5 overflow-y-auto">
                      {searchResults.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors border-b last:border-0"
                          onClick={() => selectShareholder(acc)}
                        >
                          <p className="text-sm font-medium">{fullName(acc)}</p>
                          <p className="text-[12px] text-muted-foreground font-mono">
                            {acc.accountNumber} · {acc.registerSymbol}
                            {acc.chn ? ` · ${acc.chn}` : ""}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Eligible dividend */}
        {selectedShareholder && (
          <div className="space-y-1.5">
            <label className="mrpsl-label flex items-center gap-2">
              Eligible Dividend
            </label>
            <Select
              value={splitDividend}
              onValueChange={(value) => setSplitDividend(value || "")}
            >
              <SelectTrigger className="mrpsl-input">
                <SelectValue>
                  {(value: unknown) => {
                    const key = value ? String(value) : "";
                    if (!key)
                      return isEligibleLoading
                        ? "Loading eligible dividends…"
                        : "Select an eligible dividend";
                    const d = dividendOptions.find(
                      (o) => String(o.dividendId) === key,
                    );
                    return d?.dividendNumber ?? key;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                {isEligibleLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : dividendOptions.length === 0 ? (
                  <div className="py-6 px-3 text-center text-sm text-muted-foreground">
                    No eligible dividends for this account
                  </div>
                ) : (
                  dividendOptions.map((d) => (
                    <SelectItem key={d.dividendId} value={String(d.dividendId)}>
                      <span className="font-mono font-medium">
                        {d.dividendNumber}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        · ₦{naira(d.netAmount)}
                      </span>{" "}
                      {d.eligible ? (
                        <span className="text-green-700 text-xs">Eligible</span>
                      ) : (
                        <span className="text-red-600 text-xs">Ineligible</span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Selected dividend summary */}
        {selectedDividendMeta && (
          <div className="rounded-xl border p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold">
                Selected Dividend
              </span>
              {selectedDividendMeta.eligible ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 text-[12px] font-medium px-2 py-0.5">
                  <Check className="h-3 w-3" /> Eligible · Unpaid
                </span>
              ) : (
                <span className="rounded-full bg-red-100 text-red-700 text-[12px] font-medium px-2 py-0.5">
                  Ineligible · {selectedDividendMeta.status}
                </span>
              )}
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Payment No</span>
              {/* Payment number is not part of the eligible-dividend object;
                  it will be supplied by the backend. */}
              <span className="font-mono font-medium">—</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Warrant No</span>
              <span className="font-mono font-medium">
                {selectedDividendMeta.warrantNumber}
              </span>
            </div>
            <div className="pt-2.5 border-t border-border/60 flex items-baseline justify-between">
              <span className="text-[13px] text-muted-foreground">
                Net Amount
              </span>
              <span className="text-xl font-bold font-mono text-green-600">
                ₦{naira(selectedDividendMeta.netAmount)}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* ── Right: Configure Split ── */}
      <Card className="mrpsl-card p-6 space-y-5 overflow-visible">
        <StepHeader
          n={2}
          title="Configure Split"
          subtitle="Allocate the net amount across destination accounts"
        />

        {!isDividendEligible ? (
          <div className="flex flex-col items-center justify-center text-center gap-3 py-16 text-muted-foreground">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Split className="h-6 w-6 rotate-90" />
            </div>
            <p className="text-sm max-w-xs">
              Select a source shareholder and an eligible dividend on the left
              to start configuring the split.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Allocation progress */}
            <div className="rounded-xl border p-4 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-muted-foreground">
                  Allocated
                </span>
                <span className="font-mono text-sm">
                  <span
                    className={cn(
                      "font-bold",
                      isOver
                        ? "text-red-600"
                        : isBalanced
                          ? "text-green-600"
                          : "text-foreground",
                    )}
                  >
                    ₦{naira(allocatedTotal)}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    / ₦{naira(warrantAmount)}
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isOver
                      ? "bg-red-500"
                      : isBalanced
                        ? "bg-green-500"
                        : "bg-primary",
                  )}
                  style={{ width: `${allocationPct}%` }}
                />
              </div>
              <div className="flex items-center justify-end text-[12px]">
                {isBalanced ? (
                  <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                    <Check className="h-3.5 w-3.5" /> Fully allocated
                  </span>
                ) : isOver ? (
                  <span className="text-red-600 font-medium">
                    ₦{naira(Math.abs(remaining))} over-allocated
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    ₦{naira(remaining)} remaining
                  </span>
                )}
              </div>
            </div>

            {/* Parts selector + even split */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Number of Parts</label>
                <div className="inline-flex rounded-lg border p-1 bg-muted/30">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handlePartsChange(n)}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                        splitParts === n
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 self-end"
                onClick={splitEvenly}
              >
                <Wand2 className="h-3.5 w-3.5" /> Split evenly
              </Button>
            </div>

            {/* Destination rows */}
            <div className="space-y-3">
              <p className="text-[12px] text-muted-foreground">
                Destinations must be in register{" "}
                <span className="font-mono font-medium">
                  {selectedShareholder?.registerSymbol}
                </span>
                . The parts must add up to the full net amount.
              </p>
              {partRows.slice(0, splitParts).map((row, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-[13px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DestinationAccountField
                      index={i}
                      registerSymbol={selectedShareholder?.registerSymbol}
                      selectedAccountNumber={row.account}
                      selectedName={row.accountName}
                      excludeAccountNumbers={excludeFor(i)}
                      onSelect={(acc) => setRowAccount(i, acc)}
                      onClear={() => setRowAccount(i, null)}
                    />
                  </div>
                  <div className="relative w-36 shrink-0">
                    <Input
                      type="number"
                      placeholder="₦0.00"
                      className="mrpsl-input pl-6 font-mono"
                      value={row.amount}
                      onChange={(e) => updateRowAmount(i, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="mrpsl-label">Reason for Split</label>
              <Textarea
                placeholder="Explain why this dividend is being split…"
                className={cn(
                  "focus-visible:ring-primary resize-none",
                  reasonError && "border-red-500",
                )}
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
              className="w-full gap-1.5"
              onClick={handleSubmit}
              disabled={isPending || !canSubmit}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  Submit for Approval <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function StepHeader({
  n,
  title,
  subtitle,
}: {
  n: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b pb-3">
      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
        {n}
      </div>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-[12px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function DestinationAccountField({
  index,
  registerSymbol,
  selectedAccountNumber,
  selectedName,
  excludeAccountNumbers,
  onSelect,
  onClear,
}: {
  index: number;
  registerSymbol?: string;
  selectedAccountNumber: string;
  selectedName: string;
  excludeAccountNumbers: string[];
  onSelect: (acc: ShareholderAccount) => void;
  onClear: () => void;
}) {
  const [term, setTerm] = useState("");
  const debounced = useDebounce(term, 500);

  const { data, isFetching } = useGetAccounts(
    { q: debounced, registerId: registerSymbol || undefined },
    { enabled: debounced.length > 2 && !!registerSymbol },
  );

  const results = (data?.data?.data ?? []).filter(
    (a) => !excludeAccountNumbers.includes(a.accountNumber),
  );

  if (selectedAccountNumber) {
    return (
      <div className="flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 h-9 text-[13px] text-blue-800 min-w-0">
        <span className="truncate">
          <span className="font-mono font-medium">{selectedAccountNumber}</span>
          {selectedName ? (
            <span className="text-blue-700"> · {selectedName}</span>
          ) : null}
        </span>
        <button
          type="button"
          className="text-blue-600 hover:text-blue-800 shrink-0"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder={`Destination ${index + 1}`}
        className="mrpsl-input"
        style={{ paddingLeft: "2.25rem" }}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {debounced.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg overflow-hidden">
          {isFetching ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No eligible accounts found in this register
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {results.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors border-b last:border-0"
                  onClick={() => {
                    onSelect(acc);
                    setTerm("");
                  }}
                >
                  <p className="text-sm font-medium">{fullName(acc)}</p>
                  <p className="text-[12px] text-muted-foreground font-mono">
                    {acc.accountNumber} · {acc.registerSymbol}
                    {acc.chn ? ` · ${acc.chn}` : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

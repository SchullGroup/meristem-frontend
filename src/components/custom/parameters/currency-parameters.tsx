"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  useGetCurrencies,
  useCreateCurrency,
  useUpdateCurrency,
  useDeleteCurrency,
} from "@/hooks/useCurrency";
import { Currency } from "@/types/parameters";
import { CurrencyCombobox } from "./currency-combobox";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block";

interface CurrencyParametersProps {
  tab: string;
  confirmDelete: (label: string, onConfirm: () => void) => void;
}

export default function CurrencyParameters({
  tab,
  confirmDelete,
}: CurrencyParametersProps) {
  // ── Currencies ------──────────────
  const { data: currenciesData, isLoading: currenciesLoading } =
    useGetCurrencies(undefined, { enabled: tab === "currency" });
  const currencies = currenciesData?.content || [];

  const createCurrencyMutation = useCreateCurrency();
  const updateCurrencyMutation = useUpdateCurrency();
  const deleteCurrencyMutation = useDeleteCurrency();

  // ── Currency dialog ------──────────
  const [currOpen, setCurrOpen] = useState(false);
  const [currMode, setCurrMode] = useState<"add" | "edit">("add");
  const [editCurr, setEditCurr] = useState<Currency | null>(null);
  const [pickedCurr, setPickedCurr] = useState<Omit<
    Currency,
    "reasonForChange" | "id" | "createdAt" | "updatedAt"
  > | null>(null);
  const [currNote, setCurrNote] = useState("");

  const openAddCurrency = () => {
    setCurrMode("add");
    setEditCurr(null);
    setPickedCurr(null);
    setCurrNote("");
    setCurrOpen(true);
  };

  const openEditCurrency = (c: Currency) => {
    setCurrMode("edit");
    setEditCurr(c);
    setPickedCurr({
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      exchangeRate: c.exchangeRate,
    });
    setCurrNote("");
    setCurrOpen(true);
  };

  const saveCurrency = () => {
    if (!pickedCurr) return;
    if (currMode === "add") {
      createCurrencyMutation.mutate(
        {
          code: pickedCurr.code,
          name: pickedCurr.name,
          symbol: pickedCurr.symbol,
          exchangeRate: pickedCurr.exchangeRate,
          reasonForChange: currNote || "Added new currency",
        },
        {
          onSuccess: () => {
            toast.success("Currency added.");
            setCurrOpen(false);
          },
          onError: (err) =>
            toast.error(err.message || "Failed to add currency"),
        },
      );
    } else if (editCurr) {
      updateCurrencyMutation.mutate(
        {
          id: editCurr.id,
          payload: {
            code: pickedCurr.code,
            name: pickedCurr.name,
            symbol: pickedCurr.symbol,
            exchangeRate: pickedCurr.exchangeRate,
            reasonForChange: currNote || "Updated currency",
          },
        },
        {
          onSuccess: () => {
            toast.success("Currency updated.");
            setCurrOpen(false);
          },
          onError: (err) =>
            toast.error(err.message || "Failed to update currency"),
        },
      );
    }
  };

  const deleteCurrency = (id: number) => {
    deleteCurrencyMutation.mutate(id, {
      onSuccess: () => toast.success("Currency removed."),
      onError: (err) => toast.error(err.message || "Failed to remove currency"),
    });
  };

  return (
    <>
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Currencies</h3>
          <Button size="sm" variant="outline" onClick={openAddCurrency}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Currency
          </Button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Symbol</th>
              <th className="px-5 py-3 text-right">Rate</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {currenciesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="mrpsl-table-row">
                  <td className="px-5 py-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-6 w-12" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-8 w-10" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Skeleton className="h-6 w-12 ml-auto" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </td>
                </tr>
              ))
            ) : currencies.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-muted-foreground"
                >
                  No currencies found.
                </td>
              </tr>
            ) : (
              currencies.map((cur) => (
                <tr key={cur.id} className="mrpsl-table-row">
                  <td className="px-5 py-3 font-medium">{cur.name}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-bold">
                      {cur.code}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-8 w-10 rounded-lg border border-border/60 flex items-center justify-center font-bold text-sm bg-muted/30">
                      {cur.symbol}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm">
                    {cur.exchangeRate ?? "-"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => openEditCurrency(cur)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          confirmDelete(cur.name, () => deleteCurrency(cur.id))
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

      <Dialog open={currOpen} onOpenChange={setCurrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currMode === "add" ? "Add Currency" : "Edit Currency"}
            </DialogTitle>
            <DialogDescription>
              {currMode === "add"
                ? "Select a currency to enable in the system."
                : `Updating ${editCurr?.name}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Currency *</label>
              <CurrencyCombobox
                value={pickedCurr}
                onChange={(c) =>
                  setPickedCurr((prev) => ({
                    ...prev,
                    name: c.code,
                    symbol: c.symbol,
                    code: c.code,
                  }))
                }
                exclude={
                  currMode === "add" ? currencies.map((c) => c.code) : []
                }
              />
            </div>

            {pickedCurr && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>ISO Code</label>
                  <div className="h-11 px-3 rounded-lg border border-border/60 bg-muted/40 flex items-center gap-2">
                    <span className="font-mono font-bold text-sm tracking-widest">
                      {pickedCurr.code}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto uppercase tracking-wider">
                      read-only
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Symbol</label>
                  <div className="h-11 px-3 rounded-lg border border-border/60 bg-muted/40 flex items-center gap-2">
                    <span className="font-bold text-base">
                      {pickedCurr.symbol}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto uppercase tracking-wider">
                      read-only
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className={labelClass}>Exchange Rate</label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="Enter exchange rate (e.g. 1.0)"
                    value={pickedCurr.exchangeRate ?? ""}
                    onChange={(e) => setPickedCurr(prev => prev ? { ...prev, exchangeRate: parseFloat(e.target.value) || undefined } : null)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className={labelClass}>Notes</label>
              <Textarea
                value={currNote}
                onChange={(e) => setCurrNote(e.target.value)}
                placeholder="Reason for change…"
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCurrOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveCurrency}
              disabled={
                !pickedCurr ||
                createCurrencyMutation.isPending ||
                updateCurrencyMutation.isPending
              }
            >
              {(createCurrencyMutation.isPending ||
                updateCurrencyMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
              {currMode === "add" ? "Add Currency" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

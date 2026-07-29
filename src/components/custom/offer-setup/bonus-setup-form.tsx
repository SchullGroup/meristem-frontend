"use client";

import { useState } from "react";
import { Plus, Eye, ArrowRight, FileText, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import { toast } from "sonner";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  CREATE_BONUS_OFFER,
  EDIT_BONUS_OFFER,
  GET_BONUS_OFFERS,
  MOVE_BONUS_TO_REGISTER,
} from "@/actions/offerSetUp";
import { useStore } from "@/lib/store";
import { useServerPagination } from "@/lib/use-server-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

type BonusStatus = "DRAFT" | "OPEN" | "CLOSED" | "ALLOTTED" | "CONCLUDED";

interface BonusOffer {
  id: string;
  name: string;
  registerId: string;
  ratioNumerator: number;
  ratioDenominator: number;
  qualificationDate: Date | null;
  closureDate: Date | null;
  allotmentDate: Date | null;
  roundingRule: string;
  eventId: string;
  fractionAccountNumber: string;
  receivingBanks: { bankName: string; accountNumber: string }[];
  narrative: string;
  status: BonusStatus;
}

const STATUS_MAP: Record<BonusStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-amber-100 text-amber-800",
  ALLOTTED: "bg-blue-100 text-blue-800",
  CONCLUDED: "bg-purple-100 text-purple-800",
};

const ROUNDING_RULES = ["Round Down", "Round Up", "Round to Nearest"];

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

type FormState = Omit<BonusOffer, "id" | "status">;

const EMPTY_FORM: FormState = {
  name: "",
  registerId: "",
  ratioNumerator: 1,
  ratioDenominator: 1,
  qualificationDate: null,
  closureDate: null,
  allotmentDate: null,
  roundingRule: "Round Down",
  eventId: "",
  fractionAccountNumber: "",
  receivingBanks: [],
  narrative: "",
};

export function BonusSetupForm() {
  const queryClient = useQueryClient();
  const { currentUser } = useStore();

  const { data: registersData, isLoading: isRegisterLoading } = useGetRegisters(
    { size: 100 },
  );
  const registerList = registersData?.content;

  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<BonusStatus | "">("");
  const [filterRegisterId, setFilterRegisterId] = useState("");

  const pg = useServerPagination(20);
  const resetPage = () => pg.setPage(0);

  const { data: offersData, isLoading: isOffersLoading } = useQuery({
    queryKey: [
      "bonus-offers",
      {
        page: pg.page,
        size: pg.pageSize,
        filterSearch,
        filterStatus,
        filterRegisterId,
      },
    ],
    queryFn: () =>
      GET_BONUS_OFFERS({
        page: pg.page,
        size: pg.pageSize,
        ...(filterSearch && { search: filterSearch }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterRegisterId && { registerId: filterRegisterId }),
      }),
  });

  const bonuses: BonusOffer[] = (offersData?.data?.content ?? []).map(
    (item: any) => ({
      id: String(item.id),
      name: item.name,
      registerId: item.registerId,
      ratioNumerator: item.ratioNumerator ?? 1,
      ratioDenominator: item.ratioDenominator ?? 1,
      qualificationDate: item.qualificationDate
        ? new Date(item.qualificationDate)
        : null,
      closureDate: item.closureDate ? new Date(item.closureDate) : null,
      allotmentDate: item.allotmentDate ? new Date(item.allotmentDate) : null,
      roundingRule: item.roundingRule ?? "Round Down",
      eventId: item.eventId ?? "",
      fractionAccountNumber: item.fractionAccountNumber ?? "",
      receivingBanks: item.receivingBanks ?? [],
      narrative: item.narrative ?? "",
      status: item.status as BonusStatus,
    }),
  );

  const { mutate: createBonus, isPending: isCreating } = useMutation({
    mutationFn: CREATE_BONUS_OFFER,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-offers"] });
      toast.success("New bonus issue profile created as Draft.");
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const { mutate: editBonus, isPending: isEditing } = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof EDIT_BONUS_OFFER>[1];
    }) => EDIT_BONUS_OFFER(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-offers"] });
      toast.success("Bonus issue profile updated.");
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const [movingId, setMovingId] = useState<string | null>(null);

  const { mutate: moveToRegister } = useMutation({
    mutationFn: (id: string) =>
      MOVE_BONUS_TO_REGISTER(id, { openedBy: currentUser?.email ?? "" }),
    onSuccess: () => {
      setMovingId(null);
      queryClient.invalidateQueries({ queryKey: ["bonus-offers"] });
      toast.success("Bonus issue moved to register and set to Open.");
    },
    onError: (err: Error) => {
      setMovingId(null);
      toast.error(err.message);
    },
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editing, setEditing] = useState<BonusOffer | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setIsDirty(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open && isDirty) {
      setConfirmClose(true);
      return;
    }
    setSheetOpen(open);
  };

  const handleDiscard = () => {
    setConfirmClose(false);
    setIsDirty(false);
    setSheetOpen(false);
  };

  const addBank = () => {
    if (form.receivingBanks.length < 3) {
      set("receivingBanks", [
        ...form.receivingBanks,
        { bankName: "", accountNumber: "" },
      ]);
    }
  };

  const updateBank = (
    index: number,
    field: "bankName" | "accountNumber",
    value: string,
  ) => {
    const updated = form.receivingBanks.map((b, i) =>
      i === index ? { ...b, [field]: value } : b,
    );
    set("receivingBanks", updated);
  };

  const removeBank = (index: number) => {
    set(
      "receivingBanks",
      form.receivingBanks.filter((_, i) => i !== index),
    );
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsDirty(false);
    setSheetOpen(true);
  };

  const openEdit = (bonus: BonusOffer) => {
    setEditing(bonus);
    const { id, status, ...rest } = bonus;
    void id;
    void status;
    setForm(rest);
    setIsDirty(false);
    setSheetOpen(true);
  };

  const isReadOnly = !!(editing && editing.status !== "DRAFT");

  const buildPayload = () => ({
    name: form.name,
    registerId: form.registerId,
    ratioNumerator: form.ratioNumerator,
    ratioDenominator: form.ratioDenominator,
    qualificationDate: form.qualificationDate
      ? format(form.qualificationDate, "yyyy-MM-dd")
      : "",
    closureDate: form.closureDate ? format(form.closureDate, "yyyy-MM-dd") : "",
    allotmentDate: form.allotmentDate
      ? format(form.allotmentDate, "yyyy-MM-dd")
      : "",
    roundingRule: form.roundingRule,
    eventId: form.eventId,
    fractionAccountNumber: form.fractionAccountNumber,
    receivingBanks: form.receivingBanks,
    narrative: form.narrative,
  });

  const handleSave = () => {
    if (!form.name || !form.registerId) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (editing) {
      editBonus({ id: editing.id, data: buildPayload() });
    } else {
      createBonus({ ...buildPayload(), createdBy: currentUser?.email ?? "" });
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {offersData?.data?.totalElements ?? 0} bonus issue
            {(offersData?.data?.totalElements ?? 0) !== 1 ? "s" : ""} configured
          </p>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Bonus Issue
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 lg:w-1/2">
          <input
            className="mrpsl-input h-9 w-56"
            placeholder="Search by name…"
            value={filterSearch}
            onChange={(e) => {
              resetPage();
              setFilterSearch(e.target.value);
            }}
          />
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              resetPage();
              setFilterStatus(v as BonusStatus | "");
            }}
          >
            <SelectTrigger className="h-10 w-40 cursor-pointer">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="ALLOTTED">Allotted</SelectItem>
              <SelectItem value="CONCLUDED">Concluded</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterRegisterId}
            onValueChange={(v) => {
              resetPage();
              setFilterRegisterId(v ?? "");
            }}
          >
            <SelectTrigger className="h-10 w-52 cursor-pointer">
              <SelectValue placeholder="All Registers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Registers</SelectItem>
              {registerList
                ?.filter((r) => r?.status === "ACTIVE")
                .map((r) => (
                  <SelectItem key={r.registerId} value={r.registerId}>
                    {r.registerName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isOffersLoading ? (
          <Card className="mrpsl-card p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ) : bonuses.length === 0 ? (
          <Card className="mrpsl-card p-12 flex flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-sm">No bonus issues configured</p>
            <p className="text-xs text-muted-foreground">
              Click &quot;New Bonus Issue&quot; to configure a bonus issue
              before processing.
            </p>
          </Card>
        ) : (
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-3 font-medium">
                      Bonus Issue Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Register
                    </th>
                    <th className="text-center px-4 py-3 font-medium">Ratio</th>
                    <th className="text-left px-4 py-3 font-medium">
                      Qual. Date
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Closure Date
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Allotment Date
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Rounding
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses.map((bonus) => (
                    <tr key={bonus.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-medium">{bonus.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {registerList?.find(
                          (r) => r.registerId === bonus.registerId,
                        )?.registerName ?? bonus.registerId}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs">
                        {bonus.ratioNumerator}:{bonus.ratioDenominator}
                      </td>
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
                        <Badge
                          className={`border-0 text-[12px] ${STATUS_MAP[bonus.status]}`}
                        >
                          {bonus.status.charAt(0) +
                            bonus.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {bonus.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              disabled={movingId === bonus.id}
                              onClick={() => {
                                setMovingId(bonus.id);
                                moveToRegister(bonus.id);
                              }}
                            >
                              {movingId === bonus.id ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <ArrowRight className="h-3.5 w-3.5 mr-1" />
                              )}
                              Move to Register
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(bonus)}
                          >
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

        <TablePagination {...pg.tableProps(offersData?.data)} />
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="w-130 sm:max-w-130 overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle>
              {isReadOnly
                ? "View Bonus Issue"
                : editing
                  ? "Edit Bonus Issue Profile"
                  : "New Bonus Issue"}
            </SheetTitle>
            <SheetDescription>
              {isReadOnly
                ? "This bonus issue is read-only. Only Draft offers can be edited."
                : "Configure the bonus issue parameters. Fields marked * are required."}
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-5 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="mrpsl-label">Bonus Issue Name *</label>
              <input
                className="mrpsl-input h-9 w-full"
                placeholder="e.g. Zenith Bank Bonus Issue 2024"
                value={form.name}
                disabled={isReadOnly}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            {/* Register */}
            <div className="space-y-1.5">
              <label className="mrpsl-label">Register *</label>
              <Select
                value={form.registerId}
                disabled={isReadOnly}
                onValueChange={(v) => set("registerId", v ?? "")}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select register…" />
                </SelectTrigger>
                <SelectContent>
                  {isRegisterLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    registerList
                      ?.filter((r) => r?.status === "ACTIVE")
                      .map((r) => (
                        <SelectItem key={r.registerId} value={r.registerId}>
                          <span className="font-bold">{r.registerName}</span>
                          {" - "}
                          <span className="text-sm">{r.symbol}</span>
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Bonus Ratio */}
            <div className="space-y-1.5">
              <label className="mrpsl-label">Bonus Ratio *</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  className="mrpsl-input h-9 w-10! text-center font-mono px-1"
                  placeholder="1"
                  disabled={isReadOnly}
                  value={form.ratioNumerator || ""}
                  onChange={(e) =>
                    set("ratioNumerator", Number(e.target.value))
                  }
                />
                <span className="text-lg font-semibold text-muted-foreground select-none">
                  :
                </span>
                <input
                  type="number"
                  min={1}
                  className="mrpsl-input h-9 w-10! text-center font-mono px-1"
                  placeholder="5"
                  disabled={isReadOnly}
                  value={form.ratioDenominator || ""}
                  onChange={(e) =>
                    set("ratioDenominator", Number(e.target.value))
                  }
                />
                <span className="text-xs text-muted-foreground ml-1">
                  bonus share{form.ratioNumerator !== 1 ? "s" : ""} for every{" "}
                  {form.ratioDenominator || 1} held
                </span>
              </div>
            </div>

            {/* Dates row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Qualification Date *"
                date={form.qualificationDate}
                disabled={isReadOnly}
                setDate={(d) => set("qualificationDate", d)}
              />
              <DateInput
                label="Closure Date *"
                date={form.closureDate}
                disabled={isReadOnly}
                setDate={(d) => set("closureDate", d)}
              />
            </div>

            {/* Dates row 2 + Rounding Rule */}
            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Allotment Date"
                date={form.allotmentDate}
                disabled={isReadOnly}
                setDate={(d) => set("allotmentDate", d)}
              />
              <div className="space-y-1.5">
                <label className="mrpsl-label">Rounding Rule *</label>
                <Select
                  value={form.roundingRule}
                  disabled={isReadOnly}
                  onValueChange={(v) => set("roundingRule", v ?? "Round Down")}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select rule…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUNDING_RULES.map((rule) => (
                      <SelectItem key={rule} value={rule}>
                        {rule}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Event ID + Fraction Account */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Event ID</label>
                <input
                  className="mrpsl-input h-9 w-full font-mono"
                  placeholder="e.g. BNS-2024-001"
                  disabled={isReadOnly}
                  value={form.eventId}
                  onChange={(e) => set("eventId", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">Fraction Account Number</label>
                <input
                  className="mrpsl-input h-9 w-full font-mono"
                  placeholder="e.g. REG-ZB-001"
                  disabled={isReadOnly}
                  value={form.fractionAccountNumber}
                  onChange={(e) => set("fractionAccountNumber", e.target.value)}
                />
              </div>
            </div>

            {/* Receiving Banks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="mrpsl-label">Receiving Bank Accounts</label>
                <span className="text-xs text-muted-foreground">
                  {form.receivingBanks.length}/3
                </span>
              </div>

              {form.receivingBanks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">
                  No banks added yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.receivingBanks.map((bank, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-muted-foreground mt-2.5 shrink-0 w-4">
                        {i + 1}.
                      </span>
                      <div className="flex-1 space-y-1.5">
                        <Select
                          value={bank.bankName}
                          disabled={isReadOnly}
                          onValueChange={(v) =>
                            updateBank(i, "bankName", v ?? "")
                          }
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Select bank…" />
                          </SelectTrigger>
                          <SelectContent>
                            {NIGERIAN_BANKS.filter(
                              (b) =>
                                b === bank.bankName ||
                                !form.receivingBanks.some(
                                  (rb) => rb.bankName === b,
                                ),
                            ).map((b) => (
                              <SelectItem key={b} value={b}>
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input
                          className="mrpsl-input h-9 w-full"
                          placeholder="Account number"
                          disabled={isReadOnly}
                          value={bank.accountNumber}
                          onChange={(e) =>
                            updateBank(i, "accountNumber", e.target.value)
                          }
                          maxLength={10}
                        />
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => removeBank(i)}
                          className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 mt-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isReadOnly && form.receivingBanks.length < 3 && (
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

            {/* Narrative */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="mrpsl-label">Narrative / Notes</label>
                <span className="text-xs text-muted-foreground">
                  {form.narrative.length}/300
                </span>
              </div>
              <textarea
                className="mrpsl-input h-auto min-h-22 resize-none py-2.5 leading-relaxed"
                placeholder="Optional notes about this bonus issue…"
                maxLength={300}
                rows={4}
                disabled={isReadOnly}
                value={form.narrative}
                onChange={(e) => set("narrative", e.target.value)}
              />
            </div>
          </div>

          {(!editing || editing.status === "DRAFT") && (
            <div className="px-6 py-4 border-t border-border flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isCreating || isEditing}>
                {(isCreating || isEditing) && (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                )}
                {editing ? "Save Changes" : "Create Bonus Issue Profile"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Unsaved changes confirmation */}
      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
          <div className="px-6 pt-6 pb-5">
            <DialogHeader>
              <DialogTitle>Unsaved Changes</DialogTitle>
              <DialogDescription className="mt-1.5">
                You have unsaved changes that will be lost if you leave. Do you
                want to stay and continue editing?
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClose(false)}
            >
              Stay
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDiscard}>
              Discard & Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

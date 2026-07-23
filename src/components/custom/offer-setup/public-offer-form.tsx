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
import { DocUploadZone, DocPreview } from "@/components/custom/doc-upload-zone";
import {
  CREATE_NEW_OFFER,
  EDIT_OFFER,
  GET_IPO_OFFERS,
  MOVE_TO_REGISTER,
} from "@/actions/offerSetUp";
import { useStore } from "@/lib/store";
import { useServerPagination } from "@/lib/use-server-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

type OfferStatus = "DRAFT" | "OPEN" | "CLOSED" | "ALLOTTED" | "CONCLUDED";

interface PublicOffer {
  id: string;
  name: string;
  registerId: string;
  offerPrice: number;
  totalUnits: number;
  minUnits: number;
  multiples: number;
  openingDate: Date | null;
  closingDate: Date | null;
  secApprovalDate: Date | null;
  receivingBanks: { bankName: string; accountNumber: string }[];
  narration: string;
  status: OfferStatus;
  circularUrl?: string;
}

const STATUS_MAP: Record<OfferStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-amber-100 text-amber-800",
  ALLOTTED: "bg-blue-100 text-blue-800",
  CONCLUDED: "bg-purple-100 text-purple-800",
};

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

type FormState = Omit<PublicOffer, "id" | "status">;

const EMPTY_FORM: FormState = {
  name: "",
  registerId: "",
  offerPrice: 0,
  totalUnits: 0,
  minUnits: 100,
  multiples: 100,
  openingDate: null,
  closingDate: null,
  secApprovalDate: null,
  receivingBanks: [],
  narration: "",
  circularUrl: "",
};

export function PublicOfferForm() {
  const queryClient = useQueryClient();
  const { currentUser } = useStore();

  const { data: registersData, isLoading: isRegisterLoading } = useGetRegisters(
    { size: 100 },
  );
  const registerList = registersData?.content;

  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OfferStatus | "">("");
  const [filterRegisterId, setFilterRegisterId] = useState("");

  const pg = useServerPagination(20);

  const resetPage = () => pg.setPage(0);

  const { data: offersData, isLoading: isOffersLoading } = useQuery({
    queryKey: [
      "ipo-offers",
      {
        page: pg.page,
        size: pg.pageSize,
        filterSearch,
        filterStatus,
        filterRegisterId,
      },
    ],
    queryFn: () =>
      GET_IPO_OFFERS({
        page: pg.page,
        size: pg.pageSize,
        ...(filterSearch && { search: filterSearch }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterRegisterId && { registerId: filterRegisterId }),
      }),
  });

  const offers: PublicOffer[] = (offersData?.data?.content ?? []).map(
    (item: any) => ({
      id: item.id,
      name: item.name,
      registerId: item.registerId,
      offerPrice: item.offerPrice,
      totalUnits: item.totalUnits,
      minUnits: item.minUnits,
      multiples: item.multiples,
      openingDate: item.openingDate ? new Date(item.openingDate) : null,
      closingDate: item.closingDate ? new Date(item.closingDate) : null,
      secApprovalDate: item.secApprovalDate
        ? new Date(item.secApprovalDate)
        : null,
      receivingBanks: item.receivingBanks ?? [],
      narration: item.narration ?? "",
      status: item.status as OfferStatus,
      circularUrl: item.circularUrl,
    }),
  );

  const { mutate: createOffer, isPending: isCreating } = useMutation({
    mutationFn: CREATE_NEW_OFFER,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipo-offers"] });
      toast.success("New offer profile created as Draft.");
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const { mutate: editOffer, isPending: isEditing } = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof EDIT_OFFER>[1];
    }) => EDIT_OFFER(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipo-offers"] });
      toast.success("Offer profile updated.");
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editing, setEditing] = useState<PublicOffer | null>(null);
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

  const openEdit = (offer: PublicOffer) => {
    setEditing(offer);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, status, ...rest } = offer;
    setForm(rest);
    setIsDirty(false);
    setSheetOpen(true);
  };

  const isReadOnly = !!(editing && editing.status !== "DRAFT");

  const handleSave = () => {
    if (!form.name || !form.registerId) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (editing) {
      editOffer({
        id: editing.id,
        data: {
          name: form.name,
          registerId: form.registerId,
          offerPrice: form.offerPrice,
          totalUnits: form.totalUnits,
          minUnits: form.minUnits,
          multiples: form.multiples,
          openingDate: form.openingDate
            ? format(form.openingDate, "yyyy-MM-dd")
            : "",
          closingDate: form.closingDate
            ? format(form.closingDate, "yyyy-MM-dd")
            : "",
          secApprovalDate: form.secApprovalDate
            ? format(form.secApprovalDate, "yyyy-MM-dd")
            : "",
          receivingBanks: form.receivingBanks,
          circularUrl: form.circularUrl ?? "",
          narration: form.narration,
        },
      });
      return;
    }
    createOffer({
      name: form.name,
      registerId: form.registerId,
      offerPrice: form.offerPrice,
      totalUnits: form.totalUnits,
      minUnits: form.minUnits,
      multiples: form.multiples,
      openingDate: form.openingDate
        ? format(form.openingDate, "yyyy-MM-dd")
        : "",
      closingDate: form.closingDate
        ? format(form.closingDate, "yyyy-MM-dd")
        : "",
      secApprovalDate: form.secApprovalDate
        ? format(form.secApprovalDate, "yyyy-MM-dd")
        : "",
      receivingBanks: form.receivingBanks,
      circularUrl: form.circularUrl ?? "",
      narration: form.narration,
      createdBy: currentUser?.email ?? "",
    });
  };

  const { mutate: moveToRegister, isPending: isMoving } = useMutation({
    mutationFn: (id: string) =>
      MOVE_TO_REGISTER(id, { openedBy: currentUser?.email ?? "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipo-offers"] });
      toast.success("Offer moved to register and set to Open.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleMoveToRegister = (id: string) => moveToRegister(id);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {offersData?.data?.totalElements ?? 0} offer
            {(offersData?.data?.totalElements ?? 0) !== 1 ? "s" : ""} configured
          </p>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Public Offer
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:w-1/2">
          <input
            className="mrpsl-input h-9 w-56"
            placeholder="Search by offer name…"
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
              setFilterStatus(v as OfferStatus | "");
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

        {isOffersLoading ? (
          <Card className="mrpsl-card p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ) : offers.length === 0 ? (
          <Card className="mrpsl-card p-12 flex flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-sm">No offer profiles configured</p>
            <p className="text-xs text-muted-foreground">
              Click &quot;New Public Offer&quot; to configure an IPO or Public
              Offer before processing.
            </p>
          </Card>
        ) : (
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-3 font-medium">
                      Offer Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Register
                    </th>
                    <th className="text-right px-4 py-3 font-medium">
                      Offer Price
                    </th>
                    <th className="text-right px-4 py-3 font-medium">
                      Total Units
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Opens</th>
                    <th className="text-left px-4 py-3 font-medium">Closes</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-medium">{offer.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {registerList?.find(
                          (r) => r.registerId === offer.registerId,
                        )?.registerName ?? offer.registerId}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        ₦{offer.offerPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {offer.totalUnits.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {offer.openingDate
                          ? format(offer.openingDate, "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {offer.closingDate
                          ? format(offer.closingDate, "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`border-0 text-[12px] ${STATUS_MAP[offer.status]}`}
                        >
                          {offer.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {offer.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              disabled={isMoving}
                              onClick={() => handleMoveToRegister(offer.id)}
                            >
                              {isMoving ? (
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
                            onClick={() => openEdit(offer)}
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

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="w-130 sm:max-w-130 overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle>
              {isReadOnly ? "View Offer" : editing ? "Edit Offer Profile" : "New Public Offer / IPO"}
            </SheetTitle>
            <SheetDescription>
              {isReadOnly
                ? "This offer is read-only. Only Draft offers can be edited."
                : "Configure the offer parameters. Fields marked * are required before the offer can go live."}
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Offer / IPO Name *</label>
              <input
                className="mrpsl-input h-9 w-full"
                placeholder="e.g. Access Holdings PLC Public Offer 2024"
                value={form.name}
                disabled={isReadOnly}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Offer Price (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="mrpsl-input h-9 w-full"
                  placeholder="0.00"
                  disabled={isReadOnly}
                  value={form.offerPrice || ""}
                  onChange={(e) => set("offerPrice", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">Total Units *</label>
                <input
                  type="number"
                  className="mrpsl-input h-9 w-full"
                  placeholder="0"
                  disabled={isReadOnly}
                  value={form.totalUnits || ""}
                  onChange={(e) => set("totalUnits", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">Min. Units *</label>
                <input
                  type="number"
                  className="mrpsl-input h-9 w-full"
                  placeholder="100"
                  disabled={isReadOnly}
                  value={form.minUnits || ""}
                  onChange={(e) => set("minUnits", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="mrpsl-label">Subsequent Multiples *</label>
              <input
                type="number"
                className="mrpsl-input h-9 w-48"
                placeholder="100"
                disabled={isReadOnly}
                value={form.multiples || ""}
                onChange={(e) => set("multiples", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Units must be applied for in multiples of this number.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <DateInput
                label="Opening Date *"
                date={form.openingDate}
                disabled={isReadOnly}
                setDate={(d) => set("openingDate", d)}
              />
              <DateInput
                label="Closing Date *"
                date={form.closingDate}
                disabled={isReadOnly}
                setDate={(d) => set("closingDate", d)}
              />
              <DateInput
                label="SEC Approval Date"
                date={form.secApprovalDate}
                disabled={isReadOnly}
                setDate={(d) => set("secApprovalDate", d)}
              />
            </div>

            {/* Receiving Banks — up to 3 */}
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

            {isReadOnly ? (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Offer Circular
                </span>
                {form.circularUrl ? (
                  <DocPreview url={form.circularUrl} />
                ) : (
                  <p className="text-xs text-muted-foreground py-1">No circular uploaded.</p>
                )}
              </div>
            ) : (
              <DocUploadZone
                label="Offer Circular"
                fileTypes={["PDF"]}
                maxSizeMB={10}
                folderName="offercircular"
                initialUrl={form.circularUrl}
                onUploadSuccess={(url) => set("circularUrl", url)}
              />
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="mrpsl-label">Narration</label>
                <span className="text-xs text-muted-foreground">
                  {form.narration.length}/300
                </span>
              </div>
              <textarea
                className="mrpsl-input h-auto min-h-22 resize-none py-2.5 leading-relaxed"
                placeholder="Optional notes or description about this offer…"
                maxLength={300}
                rows={4}
                disabled={isReadOnly}
                value={form.narration}
                onChange={(e) => set("narration", e.target.value)}
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
                {editing ? "Save Changes" : "Create Offer Profile"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

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

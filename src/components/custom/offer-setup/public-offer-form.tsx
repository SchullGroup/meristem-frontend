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

interface PublicOffer {
  id: string;
  name: string;
  register: string;
  offerPrice: number;
  totalUnits: number;
  minUnits: number;
  multiples: number;
  openingDate: Date | null;
  closingDate: Date | null;
  secApprovalDate: Date | null;
  receivingBanks: string[];
  narration: string;
  status: OfferStatus;
}

const MOCK_OFFERS: PublicOffer[] = [
  {
    id: "1",
    name: "Access Holdings PLC Public Offer 2024",
    register: "Access Holdings Ord. Shares",
    offerPrice: 22.5,
    totalUnits: 17_772_612_811,
    minUnits: 100,
    multiples: 100,
    openingDate: new Date("2024-10-07"),
    closingDate: new Date("2024-10-21"),
    secApprovalDate: new Date("2024-11-15"),
    receivingBanks: ["Access Bank", "GTBank", "Zenith Bank"],
    narration: "Public Offer at ₦22.50 per share.",
    status: "CLOSED",
  },
  {
    id: "2",
    name: "Transcorp Power PLC IPO 2024",
    register: "Transcorp Power Ord. Shares",
    offerPrice: 5.0,
    totalUnits: 7_500_000_000,
    minUnits: 500,
    multiples: 100,
    openingDate: null,
    closingDate: null,
    secApprovalDate: null,
    receivingBanks: [],
    narration: "",
    status: "DRAFT",
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
  "Transcorp Power Ord. Shares",
  "Fidelity Bank Ord. Shares",
  "Meristem Securities Ord. Shares",
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

type FormState = Omit<PublicOffer, "id" | "status">;

const EMPTY_FORM: FormState = {
  name: "",
  register: "",
  offerPrice: 0,
  totalUnits: 0,
  minUnits: 100,
  multiples: 100,
  openingDate: null,
  closingDate: null,
  secApprovalDate: null,
  receivingBanks: [],
  narration: "",
};

export function PublicOfferForm() {
  const [offers, setOffers] = useState<PublicOffer[]>(MOCK_OFFERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PublicOffer | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const addBank = () => {
    if (form.receivingBanks.length < 3) {
      set("receivingBanks", [...form.receivingBanks, ""]);
    }
  };

  const updateBank = (index: number, value: string) => {
    const updated = [...form.receivingBanks];
    updated[index] = value;
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

  const openEdit = (offer: PublicOffer) => {
    setEditing(offer);
    const { id, status, ...rest } = offer;
    setForm(rest);
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.register) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (editing) {
      setOffers((prev) =>
        prev.map((o) => (o.id === editing.id ? { ...o, ...form } : o))
      );
      toast.success("Offer profile updated.");
    } else {
      setOffers((prev) => [
        ...prev,
        { ...form, id: Date.now().toString(), status: "DRAFT" },
      ]);
      toast.success("New offer profile created as Draft.");
    }
    setSheetOpen(false);
  };

  const handleMoveToRegister = (id: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "OPEN" as OfferStatus } : o))
    );
    toast.success("Offer moved to register and set to Open.");
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {offers.length} offer{offers.length !== 1 ? "s" : ""} configured
          </p>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Public Offer
          </Button>
        </div>

        {offers.length === 0 ? (
          <Card className="mrpsl-card p-12 flex flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-sm">No offer profiles configured</p>
            <p className="text-xs text-muted-foreground">
              Click "New Public Offer" to configure an IPO or Public Offer before processing.
            </p>
          </Card>
        ) : (
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-3 font-medium">Offer Name</th>
                    <th className="text-left px-4 py-3 font-medium">Register</th>
                    <th className="text-right px-4 py-3 font-medium">Offer Price</th>
                    <th className="text-right px-4 py-3 font-medium">Total Units</th>
                    <th className="text-left px-4 py-3 font-medium">Opens</th>
                    <th className="text-left px-4 py-3 font-medium">Closes</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-medium">{offer.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{offer.register}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        ₦{offer.offerPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {offer.totalUnits.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {offer.openingDate ? format(offer.openingDate, "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {offer.closingDate ? format(offer.closingDate, "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-[12px] ${STATUS_MAP[offer.status]}`}>
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
                              onClick={() => handleMoveToRegister(offer.id)}
                            >
                              <ArrowRight className="h-3.5 w-3.5 mr-1" />
                              Move to Register
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => openEdit(offer)}>
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
            <SheetTitle>{editing ? "Edit Offer Profile" : "New Public Offer / IPO"}</SheetTitle>
            <SheetDescription>
              Configure the offer parameters. Fields marked * are required before the offer
              can go live.
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Offer / IPO Name *</label>
              <input
                className="mrpsl-input h-9 w-full"
                placeholder="e.g. Access Holdings PLC Public Offer 2024"
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Offer Price (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="mrpsl-input h-9 w-full"
                  placeholder="0.00"
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
                setDate={(d) => set("openingDate", d)}
              />
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

            {/* Receiving Banks — up to 3 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="mrpsl-label">Receiving Bank Accounts</label>
                <span className="text-xs text-muted-foreground">
                  {form.receivingBanks.length}/3
                </span>
              </div>

              {form.receivingBanks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">No banks added yet.</p>
              ) : (
                <div className="space-y-2">
                  {form.receivingBanks.map((bank, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 shrink-0 w-5">
                        <span className="text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                      </div>
                      <div className="flex-1">
                        <Select
                          value={bank}
                          onValueChange={(v) => updateBank(i, v ?? "")}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Select bank…" />
                          </SelectTrigger>
                          <SelectContent>
                            {NIGERIAN_BANKS.filter(
                              (b) => b === bank || !form.receivingBanks.includes(b)
                            ).map((b) => (
                              <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBank(i)}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
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
              <label className="mrpsl-label">Offer Circular (PDF)</label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => toast.info("File upload coming soon")}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload the offer prospectus / circular (PDF)
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
                placeholder="Optional notes or description about this offer…"
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
              {editing ? "Save Changes" : "Create Offer Profile"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

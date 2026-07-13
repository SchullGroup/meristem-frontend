"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import { useGetRegistersByType } from "@/hooks/useRegisters";
import { toast } from "sonner";

interface UnitHolder {
  id: string;
  accountNo: string;
  name: string;
  chn: string;
  email: string;
  fundManagerEmail: string;
  availableUnits: number;
  fund: string;
}

const MOCK_HOLDERS: UnitHolder[] = [
  {
    id: "h1",
    accountNo: "FND-00123456",
    name: "Adebayo Oluwaseun",
    chn: "CHN-0012345678",
    email: "adebayo@email.com",
    fundManagerEmail: "fm@stanbicastset.com",
    availableUnits: 15_000,
    fund: "Stanbic IBTC Dollar Fund",
  },
  {
    id: "h2",
    accountNo: "FND-00234567",
    name: "Chinwe Okafor-Nwosu",
    chn: "CHN-0023456789",
    email: "chinwe@email.com",
    fundManagerEmail: "fm@armgroup.net",
    availableUnits: 8_500,
    fund: "ARM Discovery Balanced Fund",
  },
  {
    id: "h3",
    accountNo: "FND-00345678",
    name: "Emeka Nwachukwu",
    chn: "CHN-0034567890",
    email: "emeka@email.com",
    fundManagerEmail: "fm@stanbicastset.com",
    availableUnits: 42_000,
    fund: "Stanbic IBTC Dollar Fund",
  },
  {
    id: "h4",
    accountNo: "FND-00456789",
    name: "Fatima Garba Abubakar",
    chn: "CHN-0045678901",
    email: "fatima@email.com",
    fundManagerEmail: "fm@coronationam.com",
    availableUnits: 120_000,
    fund: "Coronation Money Market Fund",
  },
];

let refCounter = 1;
function generateRef() {
  const ref = `REDM-2024-${String(refCounter).padStart(6, "0")}`;
  refCounter++;
  return ref;
}

function HolderDropdown({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (h: UnitHolder) => void;
}) {
  if (!query || query.length < 2) return null;
  const matches = MOCK_HOLDERS.filter(
    (h) =>
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.accountNo.toLowerCase().includes(query.toLowerCase()) ||
      h.chn.toLowerCase().includes(query.toLowerCase()),
  );
  if (!matches.length)
    return (
      <div className="absolute z-10 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-background shadow-md p-3 text-sm text-muted-foreground">
        No matching unit holders found.
      </div>
    );
  return (
    <div className="absolute z-10 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-background shadow-md overflow-hidden">
      {matches.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => onSelect(h)}
          className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors text-sm"
        >
          <p className="font-medium">{h.name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {h.accountNo} · {h.chn} · {h.availableUnits.toLocaleString()} units
            available
          </p>
        </button>
      ))}
    </div>
  );
}

export function RedemptionRequest() {
  const { data: fundRegisters, isLoading: loadingRegisters } =
    useGetRegistersByType("Fund");

  const [fundRegister, setFundRegister] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHolder, setSelectedHolder] = useState<UnitHolder | null>(null);
  const [unitsRequested, setUnitsRequested] = useState("");
  const [redemptionPrice, setRedemptionPrice] = useState("");
  const [redemptionAccount, setRedemptionAccount] = useState("");
  const [redemptionDate, setRedemptionDate] = useState<Date | null>(null);
  const [datePayable, setDatePayable] = useState<Date | null>(null);
  const [adviseNote, setAdviseNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");

  const parsedUnits = parseInt(unitsRequested, 10) || 0;
  const parsedPrice = parseFloat(redemptionPrice) || 0;
  const totalAmount = parsedUnits * parsedPrice;
  const insufficient = !!(
    selectedHolder &&
    parsedUnits > 0 &&
    parsedUnits > selectedHolder.availableUnits
  );

  const canSubmit = !!(
    fundRegister &&
    selectedHolder &&
    parsedUnits > 0 &&
    !insufficient &&
    parsedPrice > 0 &&
    redemptionAccount &&
    redemptionDate &&
    datePayable
  );

  const handleSelectHolder = (h: UnitHolder) => {
    setSelectedHolder(h);
    setSearchQuery(h.name);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    const ref = generateRef();
    setSubmittedRef(ref);
    setSubmitting(false);
    setSubmitted(true);
    toast.success(
      `Redemption request ${ref} submitted. Pending Team Lead approval.`,
    );
  };

  const handleReset = () => {
    setFundRegister("");
    setSearchQuery("");
    setSelectedHolder(null);
    setUnitsRequested("");
    setRedemptionPrice("");
    setRedemptionAccount("");
    setRedemptionDate(null);
    setDatePayable(null);
    setAdviseNote("");
    setSubmitted(false);
    setSubmittedRef("");
  };

  if (submitted) {
    return (
      <Card className="mrpsl-card p-8 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-lg">Redemption Request Submitted</p>
          <p className="font-mono text-sm text-muted-foreground mt-0.5">
            {submittedRef}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Pending review and approval. On approval, units will be deducted and
            the Fund Manager notified.
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          Submit Another Request
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Card className="mrpsl-card p-5 space-y-4">
            {/* Fund Register */}
            <div className="space-y-1.5">
              <label className="mrpsl-label">Fund Register *</label>
              <Select
                value={fundRegister}
                onValueChange={(v) => setFundRegister(v ?? "")}
              >
                <SelectTrigger className="mrpsl-input">
                  <SelectValue placeholder="Select Fund Register" />
                </SelectTrigger>
                <SelectContent>
                  {loadingRegisters ? (
                    <div className="py-6 flex items-center justify-center">
                      <Loader2 className="animate-spin h-4 w-4" />
                    </div>
                  ) : fundRegisters && fundRegisters.length > 0 ? (
                    fundRegisters.map((r) => (
                      <SelectItem key={r.registerId} value={r.registerId}>
                        {r.registerName}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="stanbic-dollar">
                        Stanbic IBTC Dollar Fund
                      </SelectItem>
                      <SelectItem value="arm-discovery">
                        ARM Discovery Balanced Fund
                      </SelectItem>
                      <SelectItem value="coronation-mm">
                        Coronation Money Market Fund
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Holder search */}
            <div className="space-y-1.5">
              <label className="mrpsl-label">
                Unit Holder (Account No., Name, or CHN) *
              </label>
              <div className="relative">
                <Input
                  className="mrpsl-input pl-8"
                  placeholder="Start typing to search…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedHolder(null);
                  }}
                />
                <HolderDropdown
                  query={searchQuery}
                  onSelect={handleSelectHolder}
                />
              </div>
              {selectedHolder && (
                <div className="rounded-xl bg-muted/40 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{selectedHolder.name}</span>
                    <span className="font-mono font-bold text-primary">
                      {selectedHolder.availableUnits.toLocaleString()} units
                      available
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedHolder.fund} · {selectedHolder.accountNo}
                  </p>
                </div>
              )}
            </div>

            {/* Units requested */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  Units Requested for Redemption *
                </label>
                <Input
                  className={`mrpsl-input font-mono ${insufficient ? "border-destructive" : ""}`}
                  type="number"
                  min={1}
                  placeholder="0"
                  value={unitsRequested}
                  onChange={(e) => setUnitsRequested(e.target.value)}
                />
                {insufficient && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Insufficient units. Available:{" "}
                    {selectedHolder!.availableUnits.toLocaleString()}.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  Available Units (read-only)
                </label>
                <Input
                  className="mrpsl-input font-mono bg-muted/30"
                  readOnly
                  value={
                    selectedHolder
                      ? selectedHolder.availableUnits.toLocaleString()
                      : "—"
                  }
                />
              </div>
            </div>

            {/* Insufficient units — advise note */}
            {insufficient && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-amber-700">
                  <Info className="h-3.5 w-3.5" />
                  Advise the unit holder that their requested units exceed
                  available balance. Document your advice below.
                </div>
                <Textarea
                  className="mrpsl-input resize-none"
                  rows={2}
                  placeholder="Note to unit holder / fund manager regarding insufficient units…"
                  value={adviseNote}
                  onChange={(e) => setAdviseNote(e.target.value)}
                />
              </div>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  Redemption Price (₦ per unit) *
                </label>
                <Input
                  className="mrpsl-input font-mono"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={redemptionPrice}
                  onChange={(e) => setRedemptionPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  Total Redemption Amount (auto)
                </label>
                <Input
                  className="mrpsl-input font-mono bg-muted/30"
                  readOnly
                  value={
                    totalAmount > 0 ? `₦${totalAmount.toLocaleString()}` : "—"
                  }
                />
              </div>
            </div>

            {/* Redemption account + ref */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  Redemption Account (bank account for payout) *
                </label>
                <Input
                  className="mrpsl-input font-mono"
                  placeholder="NUBAN or account reference"
                  value={redemptionAccount}
                  onChange={(e) => setRedemptionAccount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  Payment / Redemption Number (auto-generated)
                </label>
                <Input
                  className="mrpsl-input font-mono bg-muted/30 text-muted-foreground"
                  readOnly
                  value="Auto-generated on submission"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Redemption Date *"
                date={redemptionDate}
                setDate={(d: Date) => setRedemptionDate(d)}
              />
              <DateInput
                label="Date Payable *"
                date={datePayable}
                setDate={(d: Date) => setDatePayable(d)}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !canSubmit || insufficient}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                    Submitting…
                  </>
                ) : (
                  "Submit Redemption Request"
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: info panel */}
        <div className="space-y-3">
          <Card className="mrpsl-card p-4 text-sm space-y-3">
            <p className="font-semibold">Redemption Flow</p>
            <ol className="space-y-2 text-muted-foreground text-xs list-none">
              {[
                "Submit redemption request for Team Lead review.",
                "Team Lead reviews and approves or rejects.",
                "On approval: units deducted from holder balance.",
                "Redemption amount scheduled for payment.",
                "E-notification sent immediately to Fund Manager.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="mrpsl-card p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-sm text-foreground">Rules</p>
            <p>
              • Redemption is voluntary — triggered by the unit holder or fund
              manager, not by any system event.
            </p>
            <p>
              • If units requested exceed available balance, submission is
              blocked. Document your advice to the holder in the note field.
            </p>
            <p>
              • This flow is independent of IPO/Rights Issue Return Money
              queues.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

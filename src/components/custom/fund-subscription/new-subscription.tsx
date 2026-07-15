"use client";

import { useState } from "react";
import { User, Users, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
import { useGetRegistersByType } from "@/hooks/useRegisters";
import { toast } from "sonner";

type SubscriberType = "new" | "existing";

interface ExistingHolder {
  id: string;
  accountNo: string;
  name: string;
  chn: string;
  email: string;
  currentFund: string;
  availableUnits: number;
}

const MOCK_HOLDERS: ExistingHolder[] = [
  {
    id: "h1",
    accountNo: "FND-00123456",
    name: "Adebayo Oluwaseun",
    chn: "CHN-0012345678",
    email: "adebayo@email.com",
    currentFund: "Stanbic IBTC Dollar Fund",
    availableUnits: 15_000,
  },
  {
    id: "h2",
    accountNo: "FND-00234567",
    name: "Chinwe Okafor-Nwosu",
    chn: "CHN-0023456789",
    email: "chinwe@email.com",
    currentFund: "ARM Discovery Balanced Fund",
    availableUnits: 8_500,
  },
  {
    id: "h3",
    accountNo: "FND-00345678",
    name: "Emeka Nwachukwu",
    chn: "CHN-0034567890",
    email: "emeka@email.com",
    currentFund: "Stanbic IBTC Dollar Fund",
    availableUnits: 42_000,
  },
  {
    id: "h4",
    accountNo: "FND-00456789",
    name: "Fatima Garba Abubakar",
    chn: "CHN-0045678901",
    email: "fatima@email.com",
    currentFund: "Coronation Money Market Fund",
    availableUnits: 120_000,
  },
];

function SearchDropdown({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (h: ExistingHolder) => void;
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
            {h.accountNo} · {h.chn}
          </p>
        </button>
      ))}
    </div>
  );
}

export function NewSubscription() {
  const { data: fundRegisters, isLoading: loadingRegisters } =
    useGetRegistersByType("Fund");

  const [subscriberType, setSubscriberType] = useState<SubscriberType>("new");
  const [fundRegister, setFundRegister] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // New subscriber fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bvn, setBvn] = useState("");
  const [units, setUnits] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  // Existing unit holder fields
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHolder, setSelectedHolder] = useState<ExistingHolder | null>(
    null,
  );
  const [targetFundMode, setTargetFundMode] = useState<"same" | "different">(
    "same",
  );
  const [targetFund, setTargetFund] = useState("");
  const [existingUnits, setExistingUnits] = useState("");
  const [existingAmount, setExistingAmount] = useState("");

  const bvnValid = bvn.length === 0 || /^\d{11}$/.test(bvn);
  const canSubmitNew = !!(
    fundRegister &&
    name &&
    phone &&
    email &&
    bvnValid &&
    bvn.length === 11 &&
    units &&
    amountPaid
  );
  const canSubmitExisting = !!(
    selectedHolder &&
    existingUnits &&
    existingAmount &&
    (targetFundMode === "same" || targetFund)
  );

  const handleSelectHolder = (h: ExistingHolder) => {
    setSelectedHolder(h);
    setSearchQuery(h.name);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
    toast.success(
      subscriberType === "new"
        ? `New subscriber "${name}" created on ${fundRegisters?.find((r) => r.registerId === fundRegister)?.registerName ?? fundRegister}. Pending Team Lead approval.`
        : `Additional units recorded for ${selectedHolder?.name}. Pending Team Lead approval.`,
    );
  };

  const handleReset = () => {
    setName("");
    setAddress("");
    setPhone("");
    setEmail("");
    setBvn("");
    setUnits("");
    setAmountPaid("");
    setSearchQuery("");
    setSelectedHolder(null);
    setExistingUnits("");
    setExistingAmount("");
    setTargetFundMode("same");
    setTargetFund("");
    setFundRegister("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <Card className="mrpsl-card p-8 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-lg">Subscription Submitted</p>
          <p className="text-sm text-muted-foreground mt-1">
            The subscription is pending approval by the CSCS Liaison and Recon
            Team Lead.
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          Submit Another Subscription
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Subscriber type toggle */}
      <Card className="mrpsl-card p-4">
        <p className="mrpsl-label mb-3">Subscriber Type</p>
        <div className="flex gap-3">
          {(["new", "existing"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSubscriberType(type)}
              className={`flex cursor-pointer items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                subscriberType === type
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {type === "new" ? (
                <User className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {type === "new" ? "New Subscriber" : "Existing Unit Holder"}
            </button>
          ))}
        </div>
      </Card>

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
                        <span className="font-semibold">{r.registerName}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {r.symbol}
                        </span>
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
                      <SelectItem value="vetiva-equity">
                        Vetiva Griffin Fund
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {subscriberType === "new" ? (
              /* ── New Subscriber fields ── */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Full Name *</label>
                    <Input
                      className="mrpsl-input"
                      placeholder="e.g. John Adewale Okafor"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">BVN *</label>
                    <Input
                      className={`mrpsl-input font-mono ${!bvnValid ? "border-destructive" : ""}`}
                      placeholder="11-digit BVN"
                      maxLength={11}
                      value={bvn}
                      onChange={(e) =>
                        setBvn(e.target.value.replace(/\D/g, ""))
                      }
                    />
                    {!bvnValid && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> BVN must be exactly
                        11 digits.
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Address *</label>
                  <Textarea
                    className="mrpsl-input resize-none"
                    rows={2}
                    placeholder="Full residential address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Phone *</label>
                    <Input
                      className="mrpsl-input"
                      placeholder="+234…"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Email *</label>
                    <Input
                      className="mrpsl-input"
                      type="email"
                      placeholder="subscriber@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Units Subscribed *</label>
                    <Input
                      className="mrpsl-input font-mono"
                      type="number"
                      min={1}
                      placeholder="0"
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Amount Paid (₦) *</label>
                    <Input
                      className="mrpsl-input font-mono"
                      type="number"
                      min={0}
                      placeholder="0.00"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* ── Existing Unit Holder fields ── */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="mrpsl-label">
                    Search Unit Holder (Account No., Name, or CHN) *
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
                    <SearchDropdown
                      query={searchQuery}
                      onSelect={handleSelectHolder}
                    />
                  </div>
                </div>

                {selectedHolder && (
                  <div className="rounded-xl bg-muted/40 p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {selectedHolder.name}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {selectedHolder.accountNo}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current fund: {selectedHolder.currentFund}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CHN: {selectedHolder.chn}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="mrpsl-label">Target Fund *</label>
                  <div className="flex gap-3">
                    {(["same", "different"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTargetFundMode(mode)}
                        className={`flex-1 cursor-pointer py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                          targetFundMode === mode
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-muted-foreground"
                        }`}
                      >
                        {mode === "same"
                          ? "Same Fund (add to balance)"
                          : "Different Fund (new entry)"}
                      </button>
                    ))}
                  </div>
                  {targetFundMode === "different" && (
                    <Select
                      value={targetFund}
                      onValueChange={(v) => setTargetFund(v ?? "")}
                    >
                      <SelectTrigger className="mrpsl-input mt-2">
                        <SelectValue placeholder="Select different fund register" />
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
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Units Subscribed *</label>
                    <Input
                      className="mrpsl-input font-mono"
                      type="number"
                      min={1}
                      placeholder="0"
                      value={existingUnits}
                      onChange={(e) => setExistingUnits(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Amount Paid (₦) *</label>
                    <Input
                      className="mrpsl-input font-mono"
                      type="number"
                      min={0}
                      placeholder="0.00"
                      value={existingAmount}
                      onChange={(e) => setExistingAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (subscriberType === "new"
                    ? !canSubmitNew
                    : !canSubmitExisting)
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                    Submitting…
                  </>
                ) : (
                  "Submit Subscription"
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: summary / help panel */}
        <div className="space-y-3">
          <Card className="mrpsl-card p-4 text-sm space-y-3">
            <p className="font-semibold text-sm">What happens next</p>
            <ol className="space-y-2 text-muted-foreground text-xs list-none">
              {[
                "Subscription submitted for Team Lead review.",
                "CSCS Liaison and Recon Team Lead approves.",
                "Unit holder entry is confirmed on the fund register.",
                "Automatic email notification sent to the Fund Manager.",
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
            <p>• New subscribers are created fresh on the fund register.</p>
            <p>
              • Existing holders subscribing to the <em>same</em> fund have
              their balance incremented.
            </p>
            <p>
              • Existing holders subscribing to a <em>different</em> fund get a
              new entry on that register.
            </p>
            <p>• BVN is mandatory and must be exactly 11 digits.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Plus,
  Save,
  Users,
  Building2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import { toast } from "sonner";
import { useGetAgents } from "@/hooks/useAgents";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  GET_IPO_OFFERS,
  GET_RIGHT_OFFERS,
  GET_BONUS_OFFERS,
  ASSIGN_AGENT_TO_OFFER,
  GET_OFFER_ASSIGNED_AGENTS,
} from "@/actions/offerSetUp";
import type { Agent as ApiAgent } from "@/actions/agentAction";

type AgentType = "Bank" | "Stockbroker" | "Receiving Agent";
type OfferStatus = "DRAFT" | "OPEN" | "CLOSED" | "ALLOTTED" | "CONCLUDED";
type OfferKind = "IPO" | "RIGHTS" | "BONUS";

interface OfferSummary {
  id: string;
  name: string;
  registerId: string;
  price: number | null;
  status: OfferStatus;
}

interface Agent {
  id: string;
  agentId: number;
  name: string;
  agentType: AgentType;
  offerId: string;
  offerDate: Date | null;
  offerValue: number;
  numberOfForms: number;
  totalUnits: number;
  totalAmountPaid: number;
  commissionRate: number;
}

const STATUS_COLORS: Record<OfferStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-amber-100 text-amber-800",
  ALLOTTED: "bg-blue-100 text-blue-800",
  CONCLUDED: "bg-purple-100 text-purple-800",
};

const EMPTY_AGENT: Omit<Agent, "id"> = {
  agentId: 0,
  name: "",
  agentType: "Bank",
  offerId: "",
  offerDate: null,
  offerValue: 0,
  numberOfForms: 0,
  totalUnits: 0,
  totalAmountPaid: 0,
  commissionRate: 0,
};

const API_TYPE_MAP: Record<string, AgentType> = {
  BANK: "Bank",
  STOCKBROKER: "Stockbroker",
  COLLECTING_AGENT: "Receiving Agent",
};

function AgentPanel({
  agentType,
  apiAgentType,
  offerType,
  selectedOffer,
}: {
  agentType: AgentType;
  apiAgentType: "BANK" | "STOCKBROKER" | "COLLECTING_AGENT";
  offerType: string;
  selectedOffer: OfferSummary;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Agent | null>(null);
  const [form, setForm] = useState<Omit<Agent, "id">>(EMPTY_AGENT);
  const [isNew, setIsNew] = useState(false);

  const queryKey = ["offer-agents", offerType, selectedOffer.id];

  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey,
    queryFn: () => GET_OFFER_ASSIGNED_AGENTS(offerType, selectedOffer.id),
  });

  const agents: Agent[] = ((assignedData?.data ?? []) as any[])
    .filter((a: any) => a.agentType === apiAgentType)
    .map((a: any) => ({
      id: String(a.id),
      agentId: Number(a.agentId),
      name: a.agentName,
      agentType: API_TYPE_MAP[a.agentType] ?? agentType,
      offerId: String(a.offerId),
      offerDate: a.offerDate ? new Date(a.offerDate) : null,
      offerValue: a.offerValue,
      numberOfForms: a.numberOfForms,
      totalUnits: a.totalUnits,
      totalAmountPaid: a.totalAmountPaid,
      commissionRate: a.commissionRate,
    }));

  const { data: apiAgents, isLoading: agentsLoading } = useGetAgents({
    type: apiAgentType,
    status: "ACTIVE",
    size: 200,
  });

  const assignMutation = useMutation({
    mutationFn: (payload: {
      agentId: number;
      offerDate: string;
      offerValue: number;
      numberOfForms: number;
      totalUnits: number;
      totalAmountPaid: number;
      commissionRate: number;
    }) => ASSIGN_AGENT_TO_OFFER(offerType, selectedOffer.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${agentType} assigned.`);
      setSelected(null);
      setIsNew(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSelectApiAgent = (agentIdStr: string, apiAgent: ApiAgent) => {
    set("agentId", Number(agentIdStr));
    set("name", apiAgent.name);
    set("agentType", API_TYPE_MAP[apiAgent.type] ?? agentType);
  };

  const openNew = () => {
    setSelected(null);
    setForm({
      ...EMPTY_AGENT,
      agentType,
      offerId: selectedOffer.id,
      offerValue: selectedOffer.price ?? 0,
    });
    setIsNew(true);
  };

  const openView = (agent: Agent) => {
    setSelected(agent);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = agent;
    setForm(rest);
    setIsNew(false);
  };

  const handleSave = () => {
    if (!form.agentId) {
      toast.error("Please select an agent.");
      return;
    }
    if (!form.offerDate) {
      toast.error("Please enter an offer date.");
      return;
    }
    assignMutation.mutate({
      agentId: form.agentId,
      offerDate: format(form.offerDate!, "yyyy-MM-dd"),
      offerValue: form.offerValue,
      numberOfForms: form.numberOfForms,
      totalUnits: form.totalUnits,
      totalAmountPaid: form.totalAmountPaid,
      commissionRate: form.commissionRate,
    });
  };

  const set = <K extends keyof Omit<Agent, "id">>(
    k: K,
    v: Omit<Agent, "id">[K],
  ) => setForm((prev) => ({ ...prev, [k]: v }));

  const showForm = selected !== null || isNew;

  return (
    <div className="flex gap-4 min-h-100 h-[calc(100dvh-26rem)]">
      <Card className="mrpsl-card w-72 shrink-0 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {agentType}s ({agents.length})
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={openNew}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {assignedLoading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : agents.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No agents assigned yet.
            </div>
          ) : (
            agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => openView(agent)}
                className={`w-full text-left p-3.5 border-b border-border hover:bg-muted/40 transition-colors ${selected?.id === agent.id ? "bg-primary/5" : ""}`}
              >
                <p className="text-sm font-medium truncate">{agent.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {agent.offerDate && (
                    <span className="text-[11px] text-muted-foreground">
                      {format(agent.offerDate, "dd MMM yyyy")}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {agent.numberOfForms.toLocaleString()} forms
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ₦{(agent.totalAmountPaid / 1e6).toFixed(0)}M
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="mrpsl-card flex-1 flex flex-col overflow-hidden">
        {!showForm ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <Users className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-sm">
              No {agentType.toLowerCase()} selected
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Select a {agentType.toLowerCase()} from the left panel to view
              their details, or click Add to assign a new one.
            </p>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-border">
              <p className="font-semibold text-sm">
                {isNew ? `Assign ${agentType}` : selected?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedOffer.name}
              </p>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Agent *
                  </label>
                  {isNew ? (
                    <Select
                      value={form.agentId ? String(form.agentId) : ""}
                      onValueChange={(v) => {
                        const picked = apiAgents?.content.find(
                          (a) => String(a.id) === v,
                        );
                        if (v && picked) handleSelectApiAgent(v, picked);
                      }}
                    >
                      <SelectTrigger className="h-9 w-full">
                        {agentsLoading ? (
                          <span className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading agents…
                          </span>
                        ) : form.name ? (
                          <span className="text-sm">{form.name}</span>
                        ) : (
                          <SelectValue placeholder="Select agent…" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {(apiAgents?.content ?? []).map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-9 flex items-center px-3 rounded-lg border border-input bg-muted/40 text-sm">
                      {form.name}
                    </div>
                  )}
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Agent Type
                  </label>
                  <div className="h-9 flex items-center px-3 rounded-lg border border-input bg-muted/40 text-sm text-muted-foreground">
                    {form.agentType || (
                      <span className="italic">Auto-filled on selection</span>
                    )}
                  </div>
                </div>

                <DateInput
                  label="Offer Date"
                  date={form.offerDate}
                  setDate={(d) => set("offerDate", d)}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Offer Value (₦)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="mrpsl-input h-9 w-full"
                    placeholder="0.00"
                    value={form.offerValue || ""}
                    onChange={(e) => set("offerValue", Number(e.target.value))}
                    readOnly={!isNew}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    No. of Forms
                  </label>
                  <input
                    type="number"
                    className="mrpsl-input h-9 w-full"
                    placeholder="0"
                    value={form.numberOfForms || ""}
                    onChange={(e) =>
                      set("numberOfForms", Number(e.target.value))
                    }
                    readOnly={!isNew}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total No. of Units
                  </label>
                  <input
                    type="number"
                    className="mrpsl-input h-9 w-full"
                    placeholder="0"
                    value={form.totalUnits || ""}
                    onChange={(e) => set("totalUnits", Number(e.target.value))}
                    readOnly={!isNew}
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Amount Paid (₦)
                  </label>
                  <input
                    type="number"
                    className="mrpsl-input h-9 w-full"
                    placeholder="0"
                    value={form.totalAmountPaid || ""}
                    onChange={(e) =>
                      set("totalAmountPaid", Number(e.target.value))
                    }
                    readOnly={!isNew}
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="mrpsl-input h-9 w-full"
                    placeholder="0.00"
                    value={form.commissionRate || ""}
                    onChange={(e) =>
                      set("commissionRate", Number(e.target.value))
                    }
                    readOnly={!isNew}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used for agent commission calculation in Return Money. Leave
                    0 if not applicable.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  setSelected(null);
                  setIsNew(false);
                }}
              >
                Cancel
              </Button>
              {isNew && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={assignMutation.isPending}
                  className="cursor-pointer"
                >
                  {assignMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Assign {agentType}
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

const OFFER_KIND_LABELS: Record<OfferKind, string> = {
  IPO: "IPO / Public Offer",
  RIGHTS: "Rights Issue",
  BONUS: "Bonus Issue",
};

const OFFER_TYPE_PATH: Record<OfferKind, string> = {
  IPO: "ipo",
  RIGHTS: "rights-issue",
  BONUS: "bonus-issue",
};

export function AgentsStockbrokers() {
  const [offerKind, setOfferKind] = useState<OfferKind>("IPO");
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");
  console.log(selectedOfferId);
  const { data: registersData } = useGetRegisters({ size: 100 });
  const registerList = registersData?.content ?? [];

  const { data: offersData, isLoading: isOffersLoading } = useQuery({
    queryKey: ["open-offers", offerKind],
    queryFn: () => {
      const params = { status: "OPEN" as const, size: 100 };
      if (offerKind === "IPO") return GET_IPO_OFFERS(params);
      if (offerKind === "RIGHTS") return GET_RIGHT_OFFERS(params);
      return GET_BONUS_OFFERS(params);
    },
  });

  const offers: OfferSummary[] = (offersData?.data?.content ?? []).map(
    (item: any) => ({
      id: String(item.id),
      name: item.name,
      registerId: item.registerId,
      price: item.offerPrice ?? item.pricePerShare ?? null,
      status: item.status as OfferStatus,
    }),
  );

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) ?? null;
  const offerTypePath = OFFER_TYPE_PATH[offerKind];

  const handleKindSwitch = (kind: OfferKind) => {
    setOfferKind(kind);
    setSelectedOfferId("");
  };

  const registerName = (registerId: string) =>
    registerList.find((r) => r.registerId === registerId)?.registerName ??
    registerId;

  return (
    <div className="space-y-5">
      {/* Offer type toggle + selector */}
      <Card className="mrpsl-card p-4 space-y-3">
        {/* Offer type toggle */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium mr-2">Offer Type</span>
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {(["IPO", "RIGHTS", "BONUS"] as OfferKind[]).map((kind) => (
              <button
                key={kind}
                onClick={() => handleKindSwitch(kind)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  offerKind === kind
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {OFFER_KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        </div>

        {/* Offer selector */}
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-60">
            <Select
              value={selectedOfferId}
              onValueChange={(v) => setSelectedOfferId(v ?? "")}
              disabled={isOffersLoading}
            >
              <SelectTrigger className="h-9 w-full max-w-sm cursor-pointer">
                {isOffersLoading ? (
                  <span className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading offers…
                  </span>
                ) : selectedOffer ? (
                  <span className="text-sm">{selectedOffer.name}</span>
                ) : (
                  <SelectValue
                    placeholder={`Choose an open ${OFFER_KIND_LABELS[offerKind].toLowerCase()}…`}
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                {offers.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No open {OFFER_KIND_LABELS[offerKind].toLowerCase()}s found.
                  </div>
                ) : (
                  offers.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedOffer && (
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div>
                <span className="mrpsl-label mr-1">Register:</span>
                <span className="font-medium">
                  {registerName(selectedOffer.registerId)}
                </span>
              </div>
              {selectedOffer.price !== null && (
                <div>
                  <span className="mrpsl-label mr-1">Price:</span>
                  <span className="font-mono font-semibold">
                    ₦{selectedOffer.price.toFixed(2)}
                  </span>
                </div>
              )}
              <Badge
                className={`border-0 text-[11px] ${STATUS_COLORS[selectedOffer.status]}`}
              >
                {selectedOffer.status}
              </Badge>
            </div>
          )}

          {!selectedOffer && !isOffersLoading && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Select an open offer above to configure its receiving agents and
              stockbrokers.
            </div>
          )}
        </div>
      </Card>

      {/* Agents / Stockbrokers panels */}
      {!selectedOffer ? (
        <Card className="mrpsl-card p-16 flex flex-col items-center justify-center gap-3 text-center">
          <Users className="h-10 w-10 text-muted-foreground/20" />
          <p className="font-medium text-sm text-muted-foreground">
            No offer selected
          </p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Choose an open offer from the selector above to view and configure
            its receiving agents and stockbrokers.
          </p>
        </Card>
      ) : (
        <Tabs defaultValue="receiving-agents">
          <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5 mb-4">
            <TabsTrigger
              value="receiving-agents"
              className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all cursor-pointer"
            >
              Receiving Agents
            </TabsTrigger>
            <TabsTrigger
              value="banks"
              className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all cursor-pointer"
            >
              Banks
            </TabsTrigger>
            <TabsTrigger
              value="stockbrokers"
              className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all cursor-pointer"
            >
              Stockbrokers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receiving-agents">
            <AgentPanel
              agentType="Receiving Agent"
              apiAgentType="COLLECTING_AGENT"
              offerType={offerTypePath}
              selectedOffer={selectedOffer}
            />
          </TabsContent>
          <TabsContent value="banks">
            <AgentPanel
              agentType="Bank"
              apiAgentType="BANK"
              offerType={offerTypePath}
              selectedOffer={selectedOffer}
            />
          </TabsContent>
          <TabsContent value="stockbrokers">
            <AgentPanel
              agentType="Stockbroker"
              apiAgentType="STOCKBROKER"
              offerType={offerTypePath}
              selectedOffer={selectedOffer}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

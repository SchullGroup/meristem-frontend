"use client";

import { useState } from "react";
import { Plus, Save, Users, Building2, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
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
import type { Agent as ApiAgent } from "@/actions/agentAction";

type AgentType = "Bank" | "Stockbroker" | "Receiving Agent";
type OfferStatus = "DRAFT" | "OPEN" | "CLOSED" | "ALLOTTED" | "CONCLUDED";

interface PublicOfferSummary {
  id: string;
  name: string;
  register: string;
  offerPrice: number;
  status: OfferStatus;
}

interface Agent {
  id: string;
  name: string;
  agentType: AgentType;
  offerId: string;
  offerDate: Date | null;
  offerValue: number;
  noOfForms: number;
  totalUnits: number;
  totalAmountPaid: number;
  commissionRate: number;
}

const MOCK_PUBLIC_OFFERS: PublicOfferSummary[] = [
  {
    id: "1",
    name: "Access Holdings PLC Public Offer 2024",
    register: "Access Holdings Ord. Shares",
    offerPrice: 22.5,
    status: "CLOSED",
  },
  {
    id: "2",
    name: "Transcorp Power PLC IPO 2024",
    register: "Transcorp Power Ord. Shares",
    offerPrice: 5.0,
    status: "DRAFT",
  },
];

const STATUS_COLORS: Record<OfferStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-amber-100 text-amber-800",
  ALLOTTED: "bg-blue-100 text-blue-800",
  CONCLUDED: "bg-purple-100 text-purple-800",
};

const MOCK_RECEIVING_AGENTS: Agent[] = [
  {
    id: "ra1",
    name: "Meristem Registrars Ltd",
    agentType: "Receiving Agent",
    offerId: "1",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 5400,
    totalUnits: 18_000_000,
    totalAmountPaid: 405_000_000,
    commissionRate: 0.5,
  },
];

const MOCK_AGENTS: Agent[] = [
  {
    id: "1",
    name: "Access Bank PLC",
    agentType: "Bank",
    offerId: "1",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 12450,
    totalUnits: 45_200_000,
    totalAmountPaid: 1_017_000_000,
    commissionRate: 0.75,
  },
  {
    id: "2",
    name: "GTBank PLC",
    agentType: "Bank",
    offerId: "1",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 8320,
    totalUnits: 30_500_000,
    totalAmountPaid: 686_250_000,
    commissionRate: 0.75,
  },
  {
    id: "3",
    name: "Zenith Bank PLC",
    agentType: "Bank",
    offerId: "1",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 6740,
    totalUnits: 22_100_000,
    totalAmountPaid: 497_250_000,
    commissionRate: 0.75,
  },
];

const MOCK_STOCKBROKERS: Agent[] = [
  {
    id: "s1",
    name: "Meristem Securities Ltd",
    agentType: "Stockbroker",
    offerId: "1",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 3200,
    totalUnits: 11_500_000,
    totalAmountPaid: 258_750_000,
    commissionRate: 1.0,
  },
  {
    id: "s2",
    name: "CardinalStone Partners Ltd",
    agentType: "Stockbroker",
    offerId: "1",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 2800,
    totalUnits: 9_800_000,
    totalAmountPaid: 220_500_000,
    commissionRate: 1.0,
  },
  {
    id: "s3",
    name: "Stanbic IBTC Stockbrokers",
    agentType: "Stockbroker",
    offerId: "1",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 4100,
    totalUnits: 15_200_000,
    totalAmountPaid: 342_000_000,
    commissionRate: 1.0,
  },
];

const EMPTY_AGENT: Omit<Agent, "id"> = {
  name: "",
  agentType: "Bank",
  offerId: "",
  offerDate: null,
  offerValue: 0,
  noOfForms: 0,
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
  agents: initial,
  agentType,
  apiAgentType,
  selectedOffer,
}: {
  agents: Agent[];
  agentType: AgentType;
  apiAgentType: "BANK" | "STOCKBROKER" | "COLLECTING_AGENT";
  selectedOffer: PublicOfferSummary;
}) {
  const [agents, setAgents] = useState<Agent[]>(initial);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [form, setForm] = useState<Omit<Agent, "id">>(EMPTY_AGENT);
  const [isNew, setIsNew] = useState(false);

  const { data: apiAgents, isLoading: agentsLoading } = useGetAgents(
    { type: apiAgentType, status: "ACTIVE", size: 200 },
  );

  const offerAgents = agents.filter((a) => a.offerId === selectedOffer.id);

  const handleSelectApiAgent = (apiAgent: ApiAgent) => {
    set("name", apiAgent.name);
    set("agentType", API_TYPE_MAP[apiAgent.type] ?? agentType);
  };

  const openNew = () => {
    setSelected(null);
    setForm({ ...EMPTY_AGENT, agentType, offerId: selectedOffer.id, offerValue: selectedOffer.offerPrice });
    setIsNew(true);
  };

  const openEdit = (agent: Agent) => {
    setSelected(agent);
    const { id, ...rest } = agent;
    setForm(rest);
    setIsNew(false);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error("Please select an agent.");
      return;
    }
    if (isNew) {
      const newAgent: Agent = { ...form, id: Date.now().toString() };
      setAgents((prev) => [...prev, newAgent]);
      toast.success(`${agentType} added.`);
    } else if (selected) {
      setAgents((prev) =>
        prev.map((a) => (a.id === selected.id ? { ...a, ...form } : a))
      );
      toast.success("Record updated.");
    }
    setSelected(null);
    setIsNew(false);
  };

  const set = <K extends keyof Omit<Agent, "id">>(k: K, v: Omit<Agent, "id">[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const showForm = selected !== null || isNew;

  return (
    <div className="flex gap-4 min-h-100 h-[calc(100dvh-26rem)]">
      <Card className="mrpsl-card w-72 shrink-0 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {agentType}s ({offerAgents.length})
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {offerAgents.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No agents added yet.
            </div>
          ) : (
            offerAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => openEdit(agent)}
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
                    {agent.noOfForms.toLocaleString()} forms
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
            <p className="font-medium text-sm">No {agentType.toLowerCase()} selected</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Select a {agentType.toLowerCase()} from the left panel to view or edit their
              details, or click Add to create a new one.
            </p>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-border">
              <p className="font-semibold text-sm">
                {isNew ? `New ${agentType}` : selected?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedOffer.name}</p>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Agent name — dropdown from API */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Agent *
                  </label>
                  <Select
                    value={form.name}
                    onValueChange={(v) => {
                      const picked = apiAgents?.content.find((a) => a.name === v);
                      if (picked) handleSelectApiAgent(picked);
                    }}
                  >
                    <SelectTrigger className="h-9 w-full">
                      {agentsLoading ? (
                        <span className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading agents…
                        </span>
                      ) : (
                        <SelectValue placeholder="Select agent…" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {(apiAgents?.content ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.name}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Agent type — read-only, pre-filled from selection */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Agent Type
                  </label>
                  <div className="h-9 flex items-center px-3 rounded-lg border border-input bg-muted/40 text-sm text-muted-foreground">
                    {form.agentType || <span className="italic">Auto-filled on selection</span>}
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
                    value={form.noOfForms || ""}
                    onChange={(e) => set("noOfForms", Number(e.target.value))}
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
                    onChange={(e) => set("totalAmountPaid", Number(e.target.value))}
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
                    onChange={(e) => set("commissionRate", Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used for agent commission calculation in Return Money. Leave 0 if not applicable.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelected(null); setIsNew(false); }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {isNew ? `Add ${agentType}` : "Save Changes"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export function AgentsStockbrokers() {
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");
  const selectedOffer = MOCK_PUBLIC_OFFERS.find((o) => o.id === selectedOfferId) ?? null;

  return (
    <div className="space-y-5">
      {/* Offer selector */}
      <Card className="mrpsl-card p-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Select Offer</span>
          </div>
          <div className="flex-1 min-w-60">
            <Select value={selectedOfferId} onValueChange={(v) => setSelectedOfferId(v ?? "")}>
              <SelectTrigger className="h-9 w-full max-w-sm">
                <SelectValue placeholder="Choose a public offer to configure agents for…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_PUBLIC_OFFERS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedOffer && (
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div>
                <span className="mrpsl-label mr-1">Register:</span>
                <span className="font-medium">{selectedOffer.register}</span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Price:</span>
                <span className="font-mono font-semibold">₦{selectedOffer.offerPrice.toFixed(2)}</span>
              </div>
              <Badge className={`border-0 text-[11px] ${STATUS_COLORS[selectedOffer.status]}`}>
                {selectedOffer.status}
              </Badge>
            </div>
          )}
          {!selectedOffer && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Select a public offer above to configure its receiving agents and stockbrokers.
            </div>
          )}
        </div>
      </Card>

      {/* Agents / Stockbrokers panels */}
      {!selectedOffer ? (
        <Card className="mrpsl-card p-16 flex flex-col items-center justify-center gap-3 text-center">
          <Users className="h-10 w-10 text-muted-foreground/20" />
          <p className="font-medium text-sm text-muted-foreground">No offer selected</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Choose a public offer from the selector above to view and configure its receiving
            agents and stockbrokers.
          </p>
        </Card>
      ) : (
        <Tabs defaultValue="receiving-agents">
          <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5 mb-4">
            <TabsTrigger
              value="receiving-agents"
              className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
            >
              Receiving Agents
            </TabsTrigger>
            <TabsTrigger
              value="banks"
              className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
            >
              Banks
            </TabsTrigger>
            <TabsTrigger
              value="stockbrokers"
              className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
            >
              Stockbrokers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receiving-agents">
            <AgentPanel agents={MOCK_RECEIVING_AGENTS} agentType="Receiving Agent" apiAgentType="COLLECTING_AGENT" selectedOffer={selectedOffer} />
          </TabsContent>
          <TabsContent value="banks">
            <AgentPanel agents={MOCK_AGENTS} agentType="Bank" apiAgentType="BANK" selectedOffer={selectedOffer} />
          </TabsContent>
          <TabsContent value="stockbrokers">
            <AgentPanel agents={MOCK_STOCKBROKERS} agentType="Stockbroker" apiAgentType="STOCKBROKER" selectedOffer={selectedOffer} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

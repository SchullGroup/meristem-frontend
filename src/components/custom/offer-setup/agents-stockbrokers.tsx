"use client";

import { useState } from "react";
import { Plus, Save, Users } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DateInput from "@/components/ui/date-input";
import { toast } from "sonner";

type AgentType = "Bank" | "Stockbroker" | "Receiving Agent";

interface Agent {
  id: string;
  name: string;
  agentType: AgentType;
  offer: string;
  offerDate: Date | null;
  offerValue: number;
  noOfForms: number;
  totalUnits: number;
  totalAmountPaid: number;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: "1",
    name: "Access Bank PLC",
    agentType: "Bank",
    offer: "Access Holdings Public Offer 2024",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 12450,
    totalUnits: 45_200_000,
    totalAmountPaid: 1_017_000_000,
  },
  {
    id: "2",
    name: "GTBank PLC",
    agentType: "Bank",
    offer: "Access Holdings Public Offer 2024",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 8320,
    totalUnits: 30_500_000,
    totalAmountPaid: 686_250_000,
  },
  {
    id: "3",
    name: "Zenith Bank PLC",
    agentType: "Bank",
    offer: "Access Holdings Public Offer 2024",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 6740,
    totalUnits: 22_100_000,
    totalAmountPaid: 497_250_000,
  },
];

const MOCK_STOCKBROKERS: Agent[] = [
  {
    id: "s1",
    name: "Meristem Securities Ltd",
    agentType: "Stockbroker",
    offer: "Access Holdings Public Offer 2024",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 3200,
    totalUnits: 11_500_000,
    totalAmountPaid: 258_750_000,
  },
  {
    id: "s2",
    name: "CardinalStone Partners Ltd",
    agentType: "Stockbroker",
    offer: "Access Holdings Public Offer 2024",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 2800,
    totalUnits: 9_800_000,
    totalAmountPaid: 220_500_000,
  },
  {
    id: "s3",
    name: "Stanbic IBTC Stockbrokers",
    agentType: "Stockbroker",
    offer: "Access Holdings Public Offer 2024",
    offerDate: new Date("2024-10-07"),
    offerValue: 22.5,
    noOfForms: 4100,
    totalUnits: 15_200_000,
    totalAmountPaid: 342_000_000,
  },
];

const MOCK_OFFERS = [
  "Access Holdings Public Offer 2024",
  "Transcorp Power PLC IPO 2024",
  "Fidelity Bank PLC Rights Issue 2024",
];

const EMPTY_AGENT: Omit<Agent, "id"> = {
  name: "",
  agentType: "Bank",
  offer: "",
  offerDate: null,
  offerValue: 0,
  noOfForms: 0,
  totalUnits: 0,
  totalAmountPaid: 0,
};

function AgentPanel({ agents: initial, agentType, addLabel }: { agents: Agent[]; agentType: AgentType; addLabel: string }) {
  const [agents, setAgents] = useState<Agent[]>(initial);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [form, setForm] = useState<Omit<Agent, "id">>(EMPTY_AGENT);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => {
    setSelected(null);
    setForm({ ...EMPTY_AGENT, agentType });
    setIsNew(true);
  };

  const openEdit = (agent: Agent) => {
    setSelected(agent);
    const { id, ...rest } = agent;
    setForm(rest);
    setIsNew(false);
  };

  const handleSave = () => {
    if (!form.name || !form.offer) {
      toast.error("Agent name and offer are required.");
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
    <div className="flex gap-4 h-[520px]">
      <Card className="mrpsl-card w-72 shrink-0 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {agentType}s
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {agents.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No {agentType.toLowerCase()}s added yet.
            </div>
          ) : (
            agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => openEdit(agent)}
                className={`w-full text-left p-3.5 border-b border-border hover:bg-muted/40 transition-colors ${(selected?.id === agent.id || (isNew && !selected)) ? "bg-primary/5" : ""}`}
              >
                <p className="text-sm font-medium truncate">{agent.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{agent.offer}</p>
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
              {!isNew && selected && (
                <p className="text-xs text-muted-foreground mt-0.5">{selected.offer}</p>
              )}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Name of Agent *
                  </label>
                  <input
                    className="mrpsl-input h-9 w-full"
                    placeholder="Agent / institution name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Agent Type
                  </label>
                  <select
                    className="mrpsl-input h-9 w-full"
                    value={form.agentType}
                    onChange={(e) => set("agentType", e.target.value as AgentType)}
                  >
                    <option value="Bank">Bank</option>
                    <option value="Stockbroker">Stockbroker</option>
                    <option value="Receiving Agent">Receiving Agent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Offer *
                  </label>
                  <select
                    className="mrpsl-input h-9 w-full"
                    value={form.offer}
                    onChange={(e) => set("offer", e.target.value)}
                  >
                    <option value="">Select offer…</option>
                    {MOCK_OFFERS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <DateInput
                  label="Offer Date"
                  date={form.offerDate}
                  setDate={(d) => set("offerDate", d)}
                />

                <div className="space-y-1">
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

                <div className="space-y-1">
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

                <div className="space-y-1">
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

                <div className="col-span-2 space-y-1">
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
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(null);
                  setIsNew(false);
                }}
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
  return (
    <Tabs defaultValue="agents">
      <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5 mb-4">
        <TabsTrigger
          value="agents"
          className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
        >
          Receiving Agents
        </TabsTrigger>
        <TabsTrigger
          value="stockbrokers"
          className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
        >
          Stockbrokers
        </TabsTrigger>
      </TabsList>

      <TabsContent value="agents">
        <AgentPanel agents={MOCK_AGENTS} agentType="Bank" addLabel="Add Receiving Agent" />
      </TabsContent>
      <TabsContent value="stockbrokers">
        <AgentPanel
          agents={MOCK_STOCKBROKERS}
          agentType="Stockbroker"
          addLabel="Add Stockbroker"
        />
      </TabsContent>
    </Tabs>
  );
}

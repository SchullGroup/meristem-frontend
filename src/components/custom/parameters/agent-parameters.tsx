"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { AgentType } from "@/lib/types";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block";

interface AgentParametersProps {
  confirmDelete: (label: string, onConfirm: () => void) => void;
}

export default function AgentParameters({ confirmDelete }: AgentParametersProps) {
  const { agentTypes, addAgentType, updateAgentType, removeAgentType } =
    useStore();

  // ── Agent type dialog --//
  const [atOpen, setAtOpen] = useState(false);
  const [atMode, setAtMode] = useState<"add" | "edit">("add");
  const [editAt, setEditAt] = useState<AgentType | null>(null);
  const [atLabel, setAtLabel] = useState("");
  const [atNote, setAtNote] = useState("");

  const toCode = (label: string) =>
    label
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const openAddAt = () => {
    setAtMode("add");
    setEditAt(null);
    setAtLabel("");
    setAtNote("");
    setAtOpen(true);
  };

  const openEditAt = (t: AgentType) => {
    setAtMode("edit");
    setEditAt(t);
    setAtLabel(t.label);
    setAtNote("");
    setAtOpen(true);
  };

  const saveAt = () => {
    if (!atLabel.trim()) return;
    if (atMode === "add") {
      const newId = `AT-${Date.now()}`;
      addAgentType({
        id: newId,
        code: toCode(atLabel),
        label: atLabel.trim(),
        builtIn: false,
        active: true,
      });
      toast.success("Agent type added.");
    } else if (editAt) {
      updateAgentType(editAt.id, {
        label: atLabel.trim(),
        code: toCode(atLabel),
      });
      toast.success("Agent type updated.");
    }
    setAtOpen(false);
  };

  return (
    <>
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Agent Types</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              These types appear in the Agent setup dropdown and in all
              agent-related forms.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={openAddAt}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Type
          </Button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-5 py-3">Label</th>
              <th className="px-5 py-3">System Code</th>
              <th className="px-5 py-3 text-center">Built-in</th>
              <th className="px-5 py-3 text-center">Active</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {agentTypes.map((t) => (
              <tr key={t.id} className="mrpsl-table-row">
                <td className="px-5 py-3 font-semibold">{t.label}</td>
                <td className="px-5 py-3">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {t.code}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  {t.builtIn ? (
                    <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
                      System
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                      Custom
                    </Badge>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  <Switch
                    checked={t.active}
                    disabled={t.builtIn}
                    onCheckedChange={(v) => updateAgentType(t.id, { active: v })}
                  />
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      disabled={t.builtIn}
                      onClick={() => openEditAt(t)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={t.builtIn}
                      onClick={() =>
                        confirmDelete(t.label, () => removeAgentType(t.id))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={atOpen} onOpenChange={setAtOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {atMode === "add" ? "Add Agent Type" : "Edit Agent Type"}
            </DialogTitle>
            <DialogDescription>
              {atMode === "add"
                ? "Create a new agent type that will appear in all agent dropdowns."
                : `Editing "${editAt?.label}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Type Label *</label>
              <Input
                value={atLabel}
                onChange={(e) => setAtLabel(e.target.value)}
                placeholder="e.g. Custodian Bank"
                className="mrpsl-input"
                autoFocus
              />
            </div>
            {atLabel.trim() && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
                <span>System code:</span>
                <span className="font-mono font-bold text-foreground">
                  {toCode(atLabel)}
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className={labelClass}>Notes</label>
              <Textarea
                value={atNote}
                onChange={(e) => setAtNote(e.target.value)}
                placeholder="Optional notes…"
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAtOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAt} disabled={!atLabel.trim()}>
              {atMode === "add" ? "Add Type" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

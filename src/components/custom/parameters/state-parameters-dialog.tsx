"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateState, useUpdateState } from "@/hooks/useStates";
import { State } from "@/types/parameters";
import { Input } from "@base-ui/react";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initialData?: State | null;
  stateId?: number;
}

export default function StateDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  stateId,
}: StateDialogProps) {
  const [name, setName] = useState<string>("");
  const [newLgaName, setNewLgaName] = useState("");
  const [tempLgas, setTempLgas] = useState<string[]>([]);

  const createStateMutation = useCreateState();
  const updateStateMutation = useUpdateState();

  const handleSaveState = () => {
    if (!name.trim()) {
      toast.error("State name is required");
      return;
    }

    const payload = {
      name: name.trim(),
      lgas: tempLgas,
    };

    if (initialData) {
      updateStateMutation.mutate(
        { id: initialData.id, payload },
        {
          onSuccess: () => {
            toast.success("State updated successfully");
            onOpenChange(false);
          },
          onError: (err) =>
            toast.error(err.message || "Failed to update state"),
        },
      );
    } else {
      createStateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("State added successfully");
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message || "Failed to add state"),
      });
    }
  };

  const addLgaToTemp = () => {
    if (newLgaName.trim() && !tempLgas.includes(newLgaName.trim())) {
      setTempLgas([...tempLgas, newLgaName.trim()]);
      setNewLgaName("");
    }
  };

  const removeLgaFromTemp = (name: string) => {
    setTempLgas(tempLgas.filter((l) => l !== name));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md ">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New State" : "Edit State"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Define a new state and its local government areas."
              : `Update the details for ${initialData?.name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              State Name *
            </label>
            <Input
              placeholder="e.g. Lagos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mrpsl-input px-2 outline-[0.5px] outline-gray-300"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Local Government Areas
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter LGA name..."
                value={newLgaName}
                onChange={(e) => setNewLgaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLgaToTemp()}
                className="mrpsl-input h-9 text-xs w-full px-2 outline-[0.5px] outline-gray-300"
              />
              <Button size="sm" onClick={addLgaToTemp}>
                Add
              </Button>
            </div>

            <div className="border rounded-xl p-3 bg-muted/20 min-h-[100px] max-h-[200px] overflow-y-auto no-scrollbar space-y-2">
              {tempLgas.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-8">
                  No LGAs added yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tempLgas.map((name) => (
                    <div
                      key={name}
                      className="bg-background border border-border/60 rounded-lg px-2 py-1 text-[11px] font-medium flex items-center gap-1.5"
                    >
                      {name}
                      <button
                        onClick={() => removeLgaFromTemp(name)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveState}
            disabled={
              createStateMutation.isPending || updateStateMutation.isPending
            }
          >
            {(createStateMutation.isPending ||
              updateStateMutation.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {mode === "add" ? "Create State" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

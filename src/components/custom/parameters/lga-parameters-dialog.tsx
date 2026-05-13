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
import { useCreateLGA, useUpdateLGA } from "@/hooks/useLGAs";
import { LGA } from "@/types/parameters";
import { Input } from "@base-ui/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LgaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initialData?: LGA | null;
  stateId?: number | null;
}

export default function LGADialog({
  open,
  onOpenChange,
  mode,
  initialData,
  stateId,
}: LgaDialogProps) {
  const [name, setName] = useState<string>("");

  const createLgaMutation = useCreateLGA();
  const updateLgaMutation = useUpdateLGA();

  const handleSaveLga = () => {
    if (!stateId) {
      toast.error("Please select a state");
      return;
    }

    if (!name.trim()) {
      toast.error("LGA name is required");
      return;
    }

    if (initialData) {
      updateLgaMutation.mutate(
        {
          id: initialData.id,
          payload: { name: name.trim(), stateId },
        },
        {
          onSuccess: () => {
            toast.success("LGA updated successfully");
            setName("");
            onOpenChange(false);
          },
          onError: (err) => toast.error(err.message || "Failed to update LGA"),
        },
      );
    } else {
      createLgaMutation.mutate(
        { name: name.trim(), stateId },
        {
          onSuccess: () => {
            toast.success("LGA added successfully");
            onOpenChange(false);
          },
          onError: (err) => toast.error(err.message || "Failed to add LGA"),
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit LGA" : "Add LGA"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? `Update the name for ${initialData?.name}.`
              : `Add a new local government area`}
          </DialogDescription>
        </DialogHeader>
        <div className="p-8">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              LGA Name *
            </label>
            <Input
              placeholder="e.g. Alimosho"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mrpsl-input outline-[0.5px] px-2 outline-gray-300 "
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveLga}
            disabled={
              createLgaMutation.isPending || updateLgaMutation.isPending
            }
          >
            {(createLgaMutation.isPending || updateLgaMutation.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {mode === "edit" ? "Save Changes" : "Add LGA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

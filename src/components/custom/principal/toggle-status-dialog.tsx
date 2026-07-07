"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Principal } from "@/types/principal";

interface ToggleStatusDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedPrincipal: Principal | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ToggleStatusDialog = ({
  open,
  setOpen,
  selectedPrincipal,
  onConfirm,
  isLoading,
}: ToggleStatusDialogProps) => {
  if (!selectedPrincipal) return null;

  const isActive = selectedPrincipal.status === "ACTIVE";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Confirm {isActive ? "Deactivation" : "Activation"}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to {isActive ? "deactivate" : "activate"}{" "}
            <span className="font-semibold">
              {selectedPrincipal.principalName}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={isActive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToggleStatusDialog;

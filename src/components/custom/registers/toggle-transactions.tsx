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
import { useUpdateRegister } from "@/hooks/useRegisters";
import { Register } from "@/types/register";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ToggleTransactionDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedRegister: Register | null;
}

const ToggleTransactionDialog = ({
  open,
  setOpen,
  selectedRegister,
}: ToggleTransactionDialogProps) => {
  const updateRegister = useUpdateRegister();

  const toggleLock = () => {
    if (!selectedRegister) return;
    const newStatus =
      selectedRegister.status === "TRANSACTION_DISABLED"
        ? "ACTIVE"
        : "TRANSACTION_DISABLED";

    updateRegister.mutate(
      {
        registerId: selectedRegister.registerId,
        payload: {
          status: newStatus,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            `Register ${selectedRegister.symbol} has been ${newStatus === "ACTIVE" ? "unlocked" : "locked"}.`,
          );
          setOpen(false);
        },
        onError: (error) => {
          toast.error(error.message);
          setOpen(false);
        },
      },
    );
  };

  if (!selectedRegister) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            {selectedRegister?.status === "TRANSACTION_DISABLED"
              ? `Are you sure you want to unlock transactions for ${selectedRegister.symbol}?`
              : `Are you sure you want to lock transactions for ${selectedRegister?.symbol}? This will block all dividend declarations, certificate operations, and KYC updates.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={toggleLock}>
            {updateRegister.isPending ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : selectedRegister?.status === "TRANSACTION_DISABLED" ? (
              "Unlock"
            ) : (
              "Lock"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToggleTransactionDialog;

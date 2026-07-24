"use client";

import { useState } from "react";
import { Play, FileDown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// MD final-approval decision modal (§6.7) — branching, no reject: initiate
// payment via a gateway, or approve & forward the payment file for manual run.
export function MdDecisionDialog({
  open,
  onOpenChange,
  batchRef,
  onPay,
  onManual,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  batchRef: string;
  onPay: (gateway: "NIBSS" | "REMITA") => void;
  onManual: () => void;
  isPending: boolean;
}) {
  const [gateway, setGateway] = useState<"NIBSS" | "REMITA">("NIBSS");

  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setGateway("NIBSS");
  }
  if (!open && wasOpen) setWasOpen(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>MD Final Approval — {batchRef}</DialogTitle>
          <DialogDescription>
            Initiate the payment run now, or forward the payment file for manual
            NIBSS processing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          <label className="mrpsl-label">Payment Gateway</label>
          <Select
            value={gateway}
            onValueChange={(v) =>
              setGateway((v || "NIBSS") as "NIBSS" | "REMITA")
            }
          >
            <SelectTrigger className="mrpsl-input w-full">
              <SelectValue placeholder="Gateway" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NIBSS">NIBSS</SelectItem>
              <SelectItem value="REMITA">Remita</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-border/60">
          <Button
            className="w-full gap-1.5"
            onClick={() => onPay(gateway)}
            disabled={isPending}
          >
            <Play className="h-4 w-4" /> Approve &amp; Initiate Payment
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </Button>
          <Button
            variant="outline"
            className="w-full gap-1.5"
            onClick={onManual}
            disabled={isPending}
          >
            <FileDown className="h-4 w-4" /> Approve &amp; Forward for Manual
            Processing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

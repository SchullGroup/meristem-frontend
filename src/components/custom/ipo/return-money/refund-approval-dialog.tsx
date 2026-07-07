import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useOpsReviewRefundBatch, useIcuReviewRefundBatch } from "@/hooks/useIPO";
import { useStore } from "@/lib/store";

interface RefundApprovalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetIds: string[];
    batchRef: string;
    activeStatus: string; // the refund status of the current tab
    onSuccess: () => void;
}

const STATUS_LABELS: Record<string, string> = {
    PENDING_OPS_REVIEW: "Pending OPS Review",
    PENDING_ICU_REVIEW: "Pending ICU Review",
    OPS_REJECTED: "OPS Rejected",
    ICU_REJECTED: "ICU Rejected",
    ELIGIBLE_FOR_REFUND: "Eligible for Refund",
};

export function RefundApprovalModal({
    open,
    onOpenChange,
    targetIds,
    batchRef,
    activeStatus,
    onSuccess,
}: RefundApprovalModalProps) {
    const [remark, setRemark] = useState("");
    const currentUser = useStore((state) => state.currentUser);

    const opsMutation = useOpsReviewRefundBatch();
    const icuMutation = useIcuReviewRefundBatch();
    const mutation = activeStatus === "PENDING_OPS_REVIEW" ? opsMutation : icuMutation;

    const canReview = ["PENDING_OPS_REVIEW", "PENDING_ICU_REVIEW"].includes(activeStatus);

    const handleAction = (approved: boolean) => {
        if (!mutation || targetIds.length === 0) {
            toast.error("Please select subscribers");
            return;
        }

        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        // Rejection requires a remark
        if (!approved && !remark.trim()) {
            toast.error("A remark is required when rejecting subscribers.");
            return;
        }

        mutation.mutate(
            {
                batchRef,
                payload: {
                    approved,
                    reviewedBy: currentUser.email,
                    remark,
                    subscriberIds: targetIds,
                },
            },
            {
                onSuccess: () => {
                    const actionLabel = approved ? "approved" : "rejected";
                    toast.success(
                        `${targetIds.length} subscriber(s) ${actionLabel} successfully.`
                    );
                    setRemark("");
                    onOpenChange(false);
                    onSuccess();
                },
                onError: (error: any) =>
                    toast.error(error.message || "Failed to process request"),
            }
        );
    };

    const statusLabel = STATUS_LABELS[activeStatus] || activeStatus;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Review {targetIds.length > 1 ? `${targetIds.length} Subscribers` : "Subscriber"}
                    </DialogTitle>
                    <DialogDescription>
                        Current stage: <span className="font-semibold">{statusLabel}</span>
                        <br />
                        Add a remark (required for rejection) and choose an action.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 p-4">
                    <div className="space-y-1.5">
                        <label className="mrpsl-label">
                            Remark {!canReview ? "" : "(optional for approval, required for rejection)"}
                        </label>
                        <Textarea
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="Add a note…"
                            rows={3}
                            className="resize-none text-sm focus-visible:ring-primary rounded-xl"
                        />
                    </div>
                    {!canReview && (
                        <p className="text-xs text-destructive">
                            This batch cannot be reviewed in the current status.
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="destructive"
                        disabled={!canReview || mutation.isPending}
                        onClick={() => handleAction(false)}
                    >
                        {mutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Reject"
                        )}
                    </Button>
                    <Button
                        disabled={!canReview || mutation.isPending}
                        onClick={() => handleAction(true)}
                    >
                        {mutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Approve"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
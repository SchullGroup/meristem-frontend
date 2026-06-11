import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useAuthoriseKycChange, useRejectKycChange } from "@/hooks/useAccountMaintenance";
import { KycChange } from "@/types/account-maintenance";

interface KYCReviewDialogProps {
    reviewOpen: boolean;
    setReviewOpen: (open: boolean) => void;
    selected: KycChange | null;
}

export const KYCReviewDialog: React.FC<KYCReviewDialogProps> = ({
    reviewOpen,
    setReviewOpen,
    selected,
}) => {
    // Assuming context variables exist within outer closure scope
    const [comment, setComment] = useState("");
    const currentUser = useStore((state) => state.currentUser);

    const authorizeMutation = useAuthoriseKycChange();
    const rejectMutation = useRejectKycChange();

    const handleApprove = () => {
        if (!selected) return;

        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        authorizeMutation.mutate({
            id: selected?.id,
            data: {
                comment,
                authorisedBy: currentUser?.email
            }
        }, {
            onSuccess: () => {
                toast.success("KYC adjustment updated successfully");
                setReviewOpen(false);
            }, onError: (err: any) => {
                toast.error(err.message || "Failed to update account changes")
            }
        });
    };

    const handleReject = () => {
        if (!selected) return;

        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }
        if (!comment.trim()) {
            toast.error("Please insert a validation note containing the grounds for rejection.");
            return;
        }

        rejectMutation.mutate({
            id: selected?.id,
            data: {
                comment: comment,
                authorisedBy: currentUser?.email
            }
        }, {
            onSuccess: () => {
                toast.success("KYC adjustments rejected successfully.");
                setReviewOpen(false);
                setComment("");
            }, onError: (err: any) => {
                toast.error(err.message || "Failed to update account changes")
            }
        });
    };

    // UI Component Return Fragment:
    return (
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Review KYC Change Request</DialogTitle>
                </DialogHeader>
                {selected && (
                    <div className="space-y-6 px-4 pb-4">
                        <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                            <div className="space-y-2">
                                <div>
                                    <div className="mrpsl-section-title">Target Account Number</div>
                                    <div className="font-mono text-sm mt-0.5 text-muted-foreground">
                                        {selected?.accountNumber}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">Change Description</div>
                                    <div className="font-medium text-sm mt-0.5">
                                        Changed {selected?.fieldChanged} from &quot;{selected?.oldValue || 'N/A'}&quot; to &quot;{selected?.newValue}&quot;
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-border/60 rounded-xl p-4">
                            <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                                Approval Chain
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 bg-green-100">
                                        <Check className="h-3 w-3 text-green-600" />
                                    </div>
                                    <div className="text-sm">Submitted by {selected?.initiatorName || "System Initiator"}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 bg-amber-200 animate-pulse" />
                                    <div className="text-sm">Authoriser — Pending your action</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="mrpsl-label">Comment</label>
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Give a reason..."
                                className="resize-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-border/60">
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleReject}
                                disabled={rejectMutation.isPending || authorizeMutation.isPending}
                            >
                                {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleApprove}
                                disabled={rejectMutation.isPending || authorizeMutation.isPending}
                            >
                                {authorizeMutation.isPending ? "Authorising..." : "Authorise KYC Changes"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
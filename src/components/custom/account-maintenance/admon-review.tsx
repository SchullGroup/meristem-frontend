"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Admon, AdmonReversal } from "@/types/account-maintenance";
import {
    useAuthoriseAdmon,
    useRejectAdmon,
    useAuthoriseAdmonReversal,
    useRejectAdmonReversal,
} from "@/hooks/useAccountMaintenance";
import { formatDate } from "@/lib/utils/format";
import { DocPreview } from "../doc-upload-zone";

interface AdmonReversalDialogProps {
    reviewOpen: boolean;
    selected: AdmonReversal | null;
    setReviewOpen: (open: boolean) => void;
    onSuccess?: () => void;
}

interface AdmonReviewDialogProps {
    reviewOpen: boolean;
    selected: Admon | null;
    setReviewOpen: (open: boolean) => void;
    onSuccess?: () => void;
}

export function AdmonReviewDialog({
    reviewOpen,
    setReviewOpen,
    selected,
    onSuccess,
}: AdmonReviewDialogProps) {
    const [comment, setComment] = useState("");
    const { currentUser } = useStore();
    const authoriseMutation = useAuthoriseAdmon();
    const rejectMutation = useRejectAdmon();

    const handleAuthorise = () => {
        if (!selected) return;
        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        authoriseMutation.mutate({
            id: selected.id,
            data: {
                comment: comment,
                authorisedBy: currentUser.email,
            }
        }, {
            onSuccess: () => {
                toast.success("Administration authorised.");
                setReviewOpen(false);
                setComment("");
                onSuccess?.();
            },
            onError: (err) => {
                toast.error(err.message || "Failed to authorise administration");
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
            toast.error("Please enter a rejection comment");
            return;
        }

        rejectMutation.mutate({
            id: selected.id,
            data: {
                comment: comment,
                authorisedBy: currentUser.email,
            }
        }, {
            onSuccess: () => {
                toast.error("Administration rejected.");
                setReviewOpen(false);
                setComment("");
                onSuccess?.();
            },
            onError: (err) => {
                toast.error(err.message || "Failed to reject administration");
            }
        });
    };

    const isPending = authoriseMutation.isPending || rejectMutation.isPending;

    return (
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Review Estate Administration
                    </DialogTitle>
                </DialogHeader>
                {selected && (
                    <div className="space-y-6 px-8 pb-8 overflow-y-auto max-h-[600px]">
                        <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="mrpsl-section-title">Accounts</div>
                                    <div className="font-mono font-bold mt-0.5">
                                        {selected.deceasedAccountNumbers?.join(", ") || "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">
                                        Deceased Holder
                                    </div>
                                    <div className="font-semibold text-sm mt-0.5 text-destructive">
                                        {selected.deceasedHolderName}
                                    </div>
                                </div>

                                <div>
                                    <div className="mrpsl-section-title">Probate Court</div>
                                    <div className="font-mono text-sm mt-0.5">
                                        {selected.probateCourt}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">Probate No</div>
                                    <div className="font-mono text-sm mt-0.5">
                                        {selected.probateNumber}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">
                                        Administrator / Executor
                                    </div>
                                    <div className="text-sm mt-0.5">{selected.adminName}</div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">
                                        Probate Date
                                    </div>
                                    <div className="text-sm mt-0.5">{formatDate(selected.probateDate)}</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="mrpsl-section-title">
                                        Probate / Letter of Administration
                                    </div>
                                    <DocPreview url={selected?.probateDocUrl} />
                                </div>
                            </div>
                        </div>

                        <div className="border border-border/60 rounded-xl p-4">
                            <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                                Approval Chain
                            </h4>
                            <div className="space-y-4">
                                {[
                                    {
                                        label: `Submitted by ${selected.initiatorName}`,
                                        done: true,
                                        pending: false,
                                    },
                                    {
                                        label: "Authoriser — Pending your action",
                                        done: false,
                                        pending: true,
                                    },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div
                                            className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-100" : "bg-amber-200 animate-pulse"}`}
                                        >
                                            {step.done && (
                                                <Check className="h-3 w-3 text-green-600" />
                                            )}
                                        </div>
                                        <div className="text-sm">{step.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="mrpsl-label">Comment</label>
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Required for rejection..."
                                className="resize-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-border/60">
                            <Button
                                variant="destructive"
                                className="flex-1"
                                disabled={isPending}
                                onClick={handleReject}
                            >
                                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                            </Button>
                            <Button
                                className="flex-1"
                                disabled={isPending}
                                onClick={handleAuthorise}
                            >
                                {authoriseMutation.isPending ? "Authorising..." : "Authorise Administration"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export function AdmonReversalDialog({
    reviewOpen,
    setReviewOpen,
    selected,
    onSuccess,
}: AdmonReversalDialogProps) {
    const [comment, setComment] = useState("");
    const { currentUser } = useStore();
    const authoriseMutation = useAuthoriseAdmonReversal();
    const rejectMutation = useRejectAdmonReversal();

    const handleAuthorise = () => {
        if (!selected) return;
        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        authoriseMutation.mutate({
            reversalId: selected.id,
            data: {
                comment: comment,
                authorisedBy: currentUser.email,
            }
        }, {
            onSuccess: () => {
                toast.success("Administration reversal authorised.");
                setReviewOpen(false);
                setComment("");
                onSuccess?.();
            },
            onError: (err) => {
                toast.error(err.message || "Failed to authorise reversal");
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
            toast.error("Please enter a rejection comment");
            return;
        }

        rejectMutation.mutate({
            reversalId: selected.id,
            data: {
                comment: comment,
                authorisedBy: currentUser.email,
            }
        }, {
            onSuccess: () => {
                toast.error("Reversal rejected.");
                setReviewOpen(false);
                setComment("");
                onSuccess?.();
            },
            onError: (err) => {
                toast.error(err.message || "Failed to reject reversal");
            }
        });
    };

    const isPending = authoriseMutation.isPending || rejectMutation.isPending;

    return (
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Review Administration Reversal
                    </DialogTitle>
                </DialogHeader>
                {selected && (
                    <div className="space-y-6 px-8 pb-8">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                            Authorising this reversal will cancel the existing
                            administration and restore the account to its original holder
                            state.
                        </div>

                        <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="mrpsl-section-title">Account</div>
                                    <div className="font-mono font-bold mt-0.5">
                                        {selected.accountNumber}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">Reason for Reversal</div>
                                    <div className="text-sm mt-0.5">
                                        {selected.reason}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">
                                        Original Deceased
                                    </div>
                                    <div className="font-semibold text-sm mt-0.5 text-destructive">
                                        {selected.deceasedHolderName}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">
                                        Current Administrator
                                    </div>
                                    <div className="text-sm mt-0.5">{selected.currentAdminName}</div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-border/60 rounded-xl p-4">
                            <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                                Approval Chain
                            </h4>
                            <div className="space-y-4">
                                {[
                                    {
                                        label: `Submitted by ${selected.initiatorName}`,
                                        done: true,
                                        pending: false,
                                    },
                                    {
                                        label: "Authoriser — Pending your action",
                                        done: false,
                                        pending: true,
                                    },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div
                                            className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-100" : "bg-amber-200 animate-pulse"}`}
                                        >
                                            {step.done && (
                                                <Check className="h-3 w-3 text-green-600" />
                                            )}
                                        </div>
                                        <div className="text-sm">{step.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="mrpsl-label">Comment</label>
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Required for rejection..."
                                className="resize-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-border/60">
                            <Button
                                variant="destructive"
                                className="flex-1"
                                disabled={isPending}
                                onClick={handleReject}
                            >
                                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                            </Button>
                            <Button
                                className="flex-1"
                                disabled={isPending}
                                onClick={handleAuthorise}
                            >
                                {authoriseMutation.isPending ? "Authorising..." : "Authorise Reversal"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

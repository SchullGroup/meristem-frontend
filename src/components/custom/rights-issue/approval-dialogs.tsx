"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  useApproveRightsIssue,
  useIcuApprove,
  useIcuReject,
  useLodgeRightsIssueDeclaration,
  useRejectRightsIssue,
} from "@/hooks/useRights";
import { useStore } from "@/lib/store";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { RightsIssue } from "@/types/rights";
import { format } from "date-fns";

interface DialogProps {
  id: string;
  refCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  type: "icu" | "ops";
  rightsIssueDetails?: RightsIssue;
}

export function ApproveRightsDialog({
  id,
  refCode,
  open,
  onOpenChange,
  onSuccess,
  type,
}: DialogProps) {
  const { currentUser } = useStore();
  const approveMutation = useApproveRightsIssue();
  const approveIcuMutation = useIcuApprove();
  const [comment, setComment] = useState("");

  const handleApprove = () => {
    if (!comment.trim()) {
      toast.error("Please provide a comment");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again");
      return;
    }

    const payload = {
      id,
      decision: "APPROVED",
      comment,
      createdBy:
        currentUser?.username ||
        `${currentUser?.firstName} ${currentUser?.lastName}` ||
        currentUser?.email,
    };

    if (type === "icu") {
      approveIcuMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(`Rights Issue ${refCode} approved successfully`);
          onSuccess();
          setComment("");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(returnErrorMessage(err as ErrorLike));
        },
      });
    } else {
      approveMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(`Rights Issue ${refCode} approved successfully`);
          onSuccess();
          setComment("");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(returnErrorMessage(err as ErrorLike));
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Rights Issue</DialogTitle>
          <DialogDescription>
            Are you sure you want to approve this rights issue declaration (
            {refCode})?
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <Textarea
            placeholder="Enter comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={approveMutation.isPending}>
            {approveMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirm Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RejectRightsDialog({
  id,
  refCode,
  open,
  onOpenChange,
  onSuccess,
  type,
  rightsIssueDetails,
}: DialogProps) {
  const { currentUser } = useStore();
  const [comment, setComment] = useState("");
  const rejectMutation = useRejectRightsIssue();
  const rejectIcuMutation = useIcuReject();
  const setRejectedRightsIssue = useStore(
    (state) => state.setRejectedRightsIssue,
  );
  const addRejectedBatch = useStore((state) => state.addRejectedBatch);

  const handleReject = () => {
    if (!comment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again");
      return;
    }

    const payload = {
      id,
      decision: "REJECTED",
      comment,
      createdBy:
        currentUser?.username ||
        `${currentUser?.firstName} ${currentUser?.lastName}` ||
        currentUser?.email,
    };

    if (type === "icu") {
      rejectIcuMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(`Rights Issue ${refCode} rejected`);
          setRejectedRightsIssue({ ref: refCode, comment });
          addRejectedBatch({
            id,
            ref: refCode,
            comment,
            type: "rights",
            rightsIssueDetails,
          });
          onSuccess();
          setComment("");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(returnErrorMessage(err as ErrorLike));
        },
      });
    } else {
      rejectMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(`Rights Issue ${refCode} rejected`);
          setRejectedRightsIssue({ ref: refCode, comment });
          addRejectedBatch({
            id,
            ref: refCode,
            comment,
            type: "rights",
            rightsIssueDetails,
          });
          onSuccess();
          setComment("");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(returnErrorMessage(err as ErrorLike));
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">
            Reject Rights Issue
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting the rights issue declaration (
            {refCode}).
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <Textarea
            placeholder="Enter rejection reason..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-25"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Reject Declaration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LodgeRightsDialog({
  open,
  onOpenChange,
  onSuccess,
  rightsIssueDetails,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  rightsIssueDetails?: RightsIssue;
}) {
  const { currentUser } = useStore();
  const [notes, setNotes] = useState("");
  const lodgeMutation = useLodgeRightsIssueDeclaration();

  const handleProcessLodgment = () => {
    if (!rightsIssueDetails?.id) return;

    lodgeMutation.mutate(
      {
        id: rightsIssueDetails?.id,
        data: {
          lodgmentDate: format(new Date(), "yyyy-MM-dd"),
          lodgmentRef: rightsIssueDetails?.ref,
          notes,
          processedBy:
            currentUser?.username ||
            `${currentUser?.firstName} ${currentUser?.lastName}` ||
            currentUser?.email ||
            "ADMIN",
        },
      },
      {
        onSuccess: () => {
          toast.success(`${rightsIssueDetails?.ref} lodged successfully`);
          setNotes("");
          onSuccess();
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error(err?.message ?? "Failed to process lodgment"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-green-600">
            Lodge Rights Issue ({rightsIssueDetails?.ref})
          </DialogTitle>
          <DialogDescription>
            Please provide notes for the lodgment.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <Textarea
            placeholder="Enter lodgment notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-25"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleProcessLodgment}
            disabled={lodgeMutation.isPending}
          >
            {lodgeMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Process
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

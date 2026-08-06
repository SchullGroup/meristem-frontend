"use client";

import { useState } from "react";
import { ArrowLeft, Check, FileText, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { StepRegistersRecords } from "./step-registers-records";
import { StepResolveStates } from "./step-resolve-states";
import { StepReviewBankChanges } from "./step-review-bank-changes";
import { StepComputeTrades } from "./step-compute-trades";
import { StepApplyHandoff } from "./step-apply-handoff";
import { ProcessedLogView } from "./processed-log-view";
import { useCscsBatch, useDeleteCscsBatch } from "@/hooks/useCscsPipeline";

type StepNum = 1 | 2 | 3 | 4 | 5;
type ViewMode = "step" | "log";

const STEPS: { num: StepNum; label: string }[] = [
  { num: 1, label: "Registers & Records" },
  { num: 2, label: "Resolve States" },
  { num: 3, label: "Review Bank Changes" },
  { num: 4, label: "Compute Trade Balances" },
  { num: 5, label: "Apply & Hand-off" },
];

export interface WorkspaceBatch {
  batchRef: string;
  status: string;
}

interface BatchWorkspaceProps {
  batch: WorkspaceBatch;
  onBack: () => void;
}

export function BatchWorkspace({ batch, onBack }: BatchWorkspaceProps) {
  const [activeStep, setActiveStep] = useState<StepNum>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<StepNum>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("step");
  const [jumpRegister, setJumpRegister] = useState<string | undefined>(undefined);

  // Lock signals — once states are committed / balances applied / batch finalized,
  // those steps become read-only (no GIS regeneration, no recompute, no re-editing).
  const { data: batchDetail } = useCscsBatch(batch.batchRef);
  const batchCompleted = (batchDetail?.status ?? batch.status) === "COMPLETED";
  const statesLocked = !!batchDetail?.statesCommitted || batchCompleted;

  // Delete is blocked once balances are applied — those ledger writes can't be undone here.
  const applied = !!batchDetail?.balancesApplied;
  const del = useDeleteCscsBatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const handleDelete = () => {
    del.mutate(
      { batchRef: batch.batchRef },
      {
        onSuccess: () => {
          toast.success("Batch deleted.");
          setConfirmOpen(false);
          onBack();
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const markComplete = (step: StepNum) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
    if (step < 5) setActiveStep((step + 1) as StepNum);
  };

  const navigateTo = (step: StepNum, register?: string) => {
    setViewMode("step");
    setActiveStep(step);
    setJumpRegister(register);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          CSCS Updates
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-mono text-sm font-semibold">
          {batch.batchRef}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 disabled:opacity-50"
          disabled={applied || del.isPending}
          title={
            applied
              ? "Balances have been applied — this batch can no longer be deleted."
              : "Delete this batch and all its staged data"
          }
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete batch
        </Button>
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this batch?</DialogTitle>
            <DialogDescription>
              This permanently removes batch{" "}
              <span className="font-mono font-semibold">{batch.batchRef}</span> and all its staged data —
              registers, KYC records, transactions and computed trade balances. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={del.isPending}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={del.isPending}
              onClick={handleDelete}
            >
              {del.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Horizontal stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const isDone = completedSteps.has(s.num);
          const isActive = viewMode === "step" && activeStep === s.num;
          return (
            <div key={s.num} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setViewMode("step");
                  setActiveStep(s.num);
                  setJumpRegister(undefined);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-all border cursor-pointer
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : isDone
                        ? "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
                        : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                  }`}
              >
                <span
                  className={`flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold shrink-0
                    ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : isDone
                          ? "bg-green-200 text-green-800"
                          : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : s.num}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className="text-muted-foreground/30 text-xs px-0.5">
                  ›
                </span>
              )}
            </div>
          );
        })}

        {/* Processed Log — always available, outside numbered steps */}
        <div className="ml-auto shrink-0">
          <button
            onClick={() => setViewMode(viewMode === "log" ? "step" : "log")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-all border cursor-pointer
              ${
                viewMode === "log"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
              }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Processed Log</span>
          </button>
        </div>
      </div>

      {/* Step content */}
      <div className="mt-2">
        {viewMode === "log" ? (
          <ProcessedLogView batchRef={batch.batchRef} />
        ) : activeStep === 1 ? (
          <StepRegistersRecords
            batchRef={batch.batchRef}
            onProceed={() => markComplete(1)}
            onKycClick={(reg) => navigateTo(2, reg)}
            onTxClick={(reg) => navigateTo(4, reg)}
          />
        ) : activeStep === 2 ? (
          <StepResolveStates
            batchRef={batch.batchRef}
            onComplete={() => markComplete(2)}
            initialRegister={jumpRegister}
            readOnly={statesLocked}
          />
        ) : activeStep === 3 ? (
          <StepReviewBankChanges
            batchRef={batch.batchRef}
            onProceed={() => markComplete(3)}
          />
        ) : activeStep === 4 ? (
          <StepComputeTrades
            batchRef={batch.batchRef}
            onProceed={() => markComplete(4)}
            initialRegister={jumpRegister}
          />
        ) : (
          <StepApplyHandoff
            batchRef={batch.batchRef}
            onViewLog={() => setViewMode("log")}
          />
        )}
      </div>
    </div>
  );
}

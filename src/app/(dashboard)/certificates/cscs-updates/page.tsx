"use client";

import { useState } from "react";
import { BatchDashboard } from "@/components/custom/cscs/batch-dashboard";
import { BatchWorkspace, WorkspaceBatch } from "@/components/custom/cscs/batch-workspace";

export default function CSCSUpdatesPage() {
  const [view, setView]               = useState<"dashboard" | "workspace">("dashboard");
  const [selectedBatch, setSelectedBatch] = useState<WorkspaceBatch | null>(null);

  const handleOpenBatch = (batch: WorkspaceBatch) => {
    setSelectedBatch(batch);
    setView("workspace");
  };

  const handleBack = () => {
    setSelectedBatch(null);
    setView("dashboard");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CSCS Transaction Update</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload, process, and track daily CSCS batches — with anti-ghost-seller protection.
        </p>
      </div>

      {view === "dashboard" ? (
        <BatchDashboard onOpenBatch={handleOpenBatch} />
      ) : selectedBatch ? (
        <BatchWorkspace batch={selectedBatch} onBack={handleBack} />
      ) : null}
    </div>
  );
}

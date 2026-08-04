"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchDashboard } from "@/components/custom/cscs/batch-dashboard";
import { BatchWorkspace, WorkspaceBatch } from "@/components/custom/cscs/batch-workspace";
import { FragmentationPanel } from "@/components/custom/shared/fragmentation-panel";

const triggerCls =
  "rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all";

export default function CSCSUpdatesPage() {
  const [view, setView] = useState<"dashboard" | "workspace">("dashboard");
  const [selectedBatch, setSelectedBatch] = useState<WorkspaceBatch | null>(null);
  const [activeTab, setActiveTab] = useState<string>("batches");

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="batches" className={triggerCls}>
            Batches
          </TabsTrigger>
          <TabsTrigger value="fragmented" className={triggerCls}>
            Fragmented Accounts
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="batches">
            {view === "dashboard" ? (
              <BatchDashboard onOpenBatch={handleOpenBatch} />
            ) : selectedBatch ? (
              <BatchWorkspace batch={selectedBatch} onBack={handleBack} />
            ) : null}
          </TabsContent>

          <TabsContent value="fragmented">
            {/* Read-only: shareholders with multiple accounts per CHN in a register. */}
            <FragmentationPanel description="Shareholders with more than one account (same CHN) in the selected register — flag these for consolidation before applying CSCS updates." />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

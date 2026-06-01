"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessingQueue } from "@/components/custom/cscs/processing-queue";
import { FlaggedTransactions } from "@/components/custom/cscs/flagged-transactions";
import { ProcessedLogs } from "@/components/custom/cscs/processed-logs";
import CscsUpload from "@/components/custom/cscs/cscs-upload";

export default function CSCSUpdatesPage() {
  // ── Page state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("upload");

  const tabTriggerClass =
    "rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground " +
    "data-active:bg-background data-active:text-foreground data-active:shadow-sm " +
    "hover:text-foreground transition-all";

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          CSCS Transaction Update
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Process daily CSCS transaction files with anti-ghost-seller protection
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full flex! flex-col!"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="upload" className={tabTriggerClass}>
            Upload &amp; Process
          </TabsTrigger>
          <TabsTrigger value="queue" className={tabTriggerClass}>
            Processing Queue
          </TabsTrigger>
          <TabsTrigger value="flagged" className={tabTriggerClass}>
            Flagged Transactions
          </TabsTrigger>
          <TabsTrigger value="logs" className={tabTriggerClass}>
            Processed Log
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* ── Upload & Process ─────────────────────────────────── */}
          <TabsContent value="upload" className="space-y-6">
            <CscsUpload setActiveTab={setActiveTab} />
          </TabsContent>

          {/* ── Processing Queue ─────────────────────────────────── */}
          <TabsContent value="queue" className="space-y-4">
            <ProcessingQueue tab="queue" setActiveTab={setActiveTab} />
          </TabsContent>

          {/* ── Flagged Transactions ──────────────────────────────── */}
          <TabsContent value="flagged" className="space-y-4">
            <FlaggedTransactions tab="flagged" />
          </TabsContent>

          {/* ── Processed Log ────────────────────────────────────── */}
          <TabsContent value="logs" className="space-y-4">
            <ProcessedLogs tab="logs" setActiveTab={setActiveTab} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

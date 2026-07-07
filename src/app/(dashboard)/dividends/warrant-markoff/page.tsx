"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManualMarkoff from "@/components/custom/warrant-markoff/manual-markoff";
import EnBlocMarkoff from "@/components/custom/warrant-markoff/en-bloc-markoff";
import PendingApprovals from "@/components/custom/warrant-markoff/pending-approvals";
import History from "@/components/custom/warrant-markoff/history";
import UploadMarkoff from "@/components/custom/warrant-markoff/upload";

export default function MarkOffPage() {
  const [activeTab, setActiveTab] = useState("manual");
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [rejectedComment, setRejectedComment] = useState("");

  const handleReject = (id: string, comment: string) => {
    setRejectedId(id);
    setRejectedComment(comment);
    setActiveTab("manual");
  };

  const handleClearRejected = () => {
    setRejectedId(null);
    setRejectedComment("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Warrant Mark-Off
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Flag dividend warrants as paid (manual or bulk)
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="manual"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Manual Mark-Off
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            En Bloc Mark-Off
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="manual" className="space-y-6">
            <ManualMarkoff
              rejectedId={rejectedId}
              rejectedComment={rejectedComment}
              onClearRejected={handleClearRejected}
            />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <EnBlocMarkoff />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <UploadMarkoff />
          </TabsContent>

          <TabsContent value="auth">
            <PendingApprovals onReject={handleReject} />
          </TabsContent>

          <TabsContent value="history">
            <History tab="history" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

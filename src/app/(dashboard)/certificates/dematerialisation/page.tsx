"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CaptureDematerialization } from "@/components/custom/cert-dematerialization/capture-demat";
import CalloverDemat from "@/components/custom/cert-dematerialization/callover-demat";
import AuthoriseDemat from "@/components/custom/cert-dematerialization/authorise-demat";
import IcuApproveDemat from "@/components/custom/cert-dematerialization/icu-approve-demat";
import LodgeDemat from "@/components/custom/cert-dematerialization/lodge-demat";

const STEPS = [
  { step: 1, label: "Capture", tab: "capture" },
  { step: 2, label: "Callover", tab: "callover" },
  { step: 3, label: "Authorisation", tab: "auth" },
  { step: 4, label: "ICU Approval", tab: "icu" },
  { step: 5, label: "Lodgment", tab: "lodgment" },
];

export default function DematPage() {
  const [activeTab, setActiveTab] = useState("capture");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Dematerialisation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Convert physical certificates to electronic form at CSCS
          </p>
        </div>
        {/* <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Demat Record
        </Button> */}
      </div>

      {/* Step progress bar */}
      <div className="w-full flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-border -z-10" />
        {STEPS.map((s) => (
          <div
            key={s.step}
            className="flex flex-col items-center bg-background px-2 cursor-pointer"
            onClick={() => setActiveTab(s.tab)}
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${activeTab === s.tab ? "border-primary bg-primary text-white" : "border-border bg-muted text-muted-foreground"}`}
            >
              {s.step}
            </div>
            <span
              className={`text-[13px] mt-2 font-medium ${activeTab === s.tab ? "text-primary" : "text-muted-foreground"}`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <div className="mt-2">
          {/* ── Capture ── */}
          <TabsContent value="capture" className="space-y-4">
            <CaptureDematerialization
              tab="capture"
              setActiveTab={setActiveTab}
            />
          </TabsContent>

          {/* ── Callover ── */}
          <TabsContent value="callover" className="space-y-4">
            <CalloverDemat tab="callover" />
          </TabsContent>

          {/* ── Authorisation ── */}
          <TabsContent value="auth" className="space-y-4">
            <AuthoriseDemat tab="auth" />
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu" className="space-y-4">
            <IcuApproveDemat tab="icu" />
          </TabsContent>

          {/* ── Lodgment ── */}
          <TabsContent value="lodgment" className="space-y-4">
            <LodgeDemat tab="lodgment" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

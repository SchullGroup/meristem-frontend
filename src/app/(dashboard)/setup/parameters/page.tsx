"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Map, AlertTriangle, Files, Users } from "lucide-react";

// Sub-components
import CurrencyParameters from "@/components/custom/parameters/currency-parameters";
import StatesParameters from "@/components/custom/parameters/states-parameters";
import CautionParameters from "@/components/custom/parameters/caution-parameters";
import DocumentTypeParameters from "@/components/custom/parameters/document-type-parameters";
// import AgentParameters from "@/components/custom/parameters/agent-parameters";

// ── Page ------─────────────────────────
export default function ParametersPage() {
  const [activeTab, setActiveTab] = useState("currency");

  // ── Delete confirmation ------──────
  const [delOpen, setDelOpen] = useState(false);
  const [delTarget, setDelTarget] = useState<{
    label: string;
    onConfirm: () => void;
  } | null>(null);

  const confirmDelete = (label: string, onConfirm: () => void) => {
    setDelTarget({ label, onConfirm });
    setDelOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Other Parameters</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system-wide lookup values and document definitions
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full flex flex-col"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="currency"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            <Coins className="h-3.5 w-3.5 mr-1.5" /> Currencies
          </TabsTrigger>
          <TabsTrigger
            value="states"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            <Map className="h-3.5 w-3.5 mr-1.5" /> States &amp; LGAs
          </TabsTrigger>
          <TabsTrigger
            value="caution"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Caution Reasons
          </TabsTrigger>
          <TabsTrigger
            value="docs"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            <Files className="h-3.5 w-3.5 mr-1.5" /> Document Types
          </TabsTrigger>
          {/* <TabsTrigger
            value="agenttypes"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" /> Agent Types
          </TabsTrigger> */}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="currency">
            <CurrencyParameters tab={activeTab} confirmDelete={confirmDelete} />
          </TabsContent>

          <TabsContent value="states">
            <StatesParameters tab={activeTab} />
          </TabsContent>

          <TabsContent value="caution">
            <CautionParameters tab={activeTab} confirmDelete={confirmDelete} />
          </TabsContent>

          <TabsContent value="docs">
            <DocumentTypeParameters
              tab={activeTab}
              confirmDelete={confirmDelete}
            />
          </TabsContent>

          {/* <TabsContent value="agenttypes">
            <AgentParameters confirmDelete={confirmDelete} />
          </TabsContent> */}
        </div>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Parameter</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-bold text-foreground">
                &ldquo;{delTarget?.label}&rdquo;
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setDelOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                delTarget?.onConfirm();
                setDelOpen(false);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

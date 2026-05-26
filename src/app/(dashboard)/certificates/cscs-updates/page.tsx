"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle,
  AlertTriangle,
  FileArchive,
  Loader2,
  Check,
  Search,
  MapPin,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { NIGERIA_STATE_NAMES } from "@/lib/mocks/nigeria-geo";
import { ProcessingQueue } from "@/components/custom/cscs/processing-queue";
import { FlaggedTransactions } from "@/components/custom/cscs/flagged-transactions";
import { ProcessedLogs } from "@/components/custom/cscs/processed-logs";
import CscsUpload from "@/components/custom/cscs/cscs-upload";

// ── Types ─────────────────────────────────────────────────────────

type AddressRecord = {
  id: string;
  register: string;
  registerName: string;
  chn: string;
  accountNo: string;
  holderName: string;
  phone: string;
  email: string;
  address: string; // new CSCS address — always replaces old
  detectedState: string; // GIS-inferred state for tax jurisdiction
  confirmedState: string | null; // null = unconfirmed
};

// ── Mock data ─────────────────────────────────────────────────────

const INITIAL_RECORDS: AddressRecord[] = [
  {
    id: "r1",
    register: "DANGCEM",
    registerName: "Dangote Cement Plc",
    chn: "C00002198KL",
    accountNo: "DANGCEM-10044",
    holderName: "Chukwuemeka Obi",
    phone: "08031234567",
    email: "c.obi@email.com",
    address: "45 Aminu Kano Crescent, Wuse 2",
    detectedState: "Abuja (FCT)",
    confirmedState: null,
  },
  {
    id: "r2",
    register: "DANGCEM",
    registerName: "Dangote Cement Plc",
    chn: "C00003312MN",
    accountNo: "DANGCEM-10091",
    holderName: "Fatima Aliyu",
    phone: "07059876543",
    email: "f.aliyu@email.com",
    address: "7 Ahmadu Bello Way, Kaduna South",
    detectedState: "Kaduna",
    confirmedState: null,
  },
  {
    id: "r3",
    register: "DANGCEM",
    registerName: "Dangote Cement Plc",
    chn: "C00005023RT",
    accountNo: "DANGCEM-10109",
    holderName: "Yusuf Mohammed",
    phone: "08098765432",
    email: "y.mohammed@mail.com",
    address: "Plot 3 Ibrahim Taiwo Road, Nassarawa",
    detectedState: "Kano",
    confirmedState: null,
  },
  {
    id: "r4",
    register: "DANGCEM",
    registerName: "Dangote Cement Plc",
    chn: "C00006112BC",
    accountNo: "DANGCEM-10158",
    holderName: "Halima Yusuf",
    phone: "08123456789",
    email: "h.yusuf@company.ng",
    address: "14 Shehu Shagari Way, Minna",
    detectedState: "Niger",
    confirmedState: null,
  },
  {
    id: "r5",
    register: "ZENITHBANK",
    registerName: "Zenith Bank Plc",
    chn: "C00008821AB",
    accountNo: "ZENITHBANK-20033",
    holderName: "Adaeze Nwosu",
    phone: "08122334455",
    email: "adaeze.n@gmail.com",
    address: "14 Marina Street, Lagos Island",
    detectedState: "Lagos",
    confirmedState: null,
  },
  {
    id: "r6",
    register: "ZENITHBANK",
    registerName: "Zenith Bank Plc",
    chn: "C00009102XY",
    accountNo: "ZENITHBANK-20081",
    holderName: "Emeka Eze",
    phone: "07033221144",
    email: "emeka.e@yahoo.com",
    address: "22 New GRA, Trans Amadi",
    detectedState: "Rivers",
    confirmedState: null,
  },
  {
    id: "r7",
    register: "ZENITHBANK",
    registerName: "Zenith Bank Plc",
    chn: "C00010344PQ",
    accountNo: "ZENITHBANK-20102",
    holderName: "Tunde Adeyemi",
    phone: "09011223344",
    email: "t.adeyemi@mail.com",
    address: "3 Obafemi Awolowo Road, Alausa, Ikeja",
    detectedState: "Lagos",
    confirmedState: null,
  },
  {
    id: "r8",
    register: "ACCESSCORP",
    registerName: "Access Holdings Plc",
    chn: "C00011299PQ",
    accountNo: "ACCESSCORP-30017",
    holderName: "Ngozi Okafor",
    phone: "09012344321",
    email: "n.okafor@company.ng",
    address: "Plot 999 Danmole Street, Victoria Island",
    detectedState: "Lagos",
    confirmedState: null,
  },
  {
    id: "r9",
    register: "ACCESSCORP",
    registerName: "Access Holdings Plc",
    chn: "C00012580RS",
    accountNo: "ACCESSCORP-30044",
    holderName: "Uche Okeke",
    phone: "08077889900",
    email: "u.okeke@firm.ng",
    address: "18 Douglas Road, Owerri",
    detectedState: "Imo",
    confirmedState: null,
  },
  {
    id: "r10",
    register: "GTCO",
    registerName: "GTCO Holdings Plc",
    chn: "C00015001ZA",
    accountNo: "GTCO-40011",
    holderName: "Bello Musa",
    phone: "07022334455",
    email: "b.musa@email.com",
    address: "5 Paiko Road, Minna",
    detectedState: "Niger",
    confirmedState: null,
  },
  {
    id: "r11",
    register: "GTCO",
    registerName: "GTCO Holdings Plc",
    chn: "C00015894TW",
    accountNo: "GTCO-40039",
    holderName: "Chioma Ike",
    phone: "08166778899",
    email: "chioma.i@gmail.com",
    address: "22 Ogui Road, Enugu",
    detectedState: "Enugu",
    confirmedState: null,
  },
  {
    id: "r12",
    register: "GTCO",
    registerName: "GTCO Holdings Plc",
    chn: "C00016230WX",
    accountNo: "GTCO-40067",
    holderName: "Suleiman Garba",
    phone: "07099887766",
    email: "s.garba@kano.ng",
    address: "Plot 44 Ibrahim Taiwo Road",
    detectedState: "Kano",
    confirmedState: null,
  },
];

const PROCESSING_STAGES: [number, string][] = [
  [15, "Verifying ZIP integrity…"],
  [30, "Extracting register data…"],
  [50, "Parsing shareholder records…"],
  [70, "Running GIS state detection…"],
  [90, "Grouping by register…"],
  [100, "Ready for review"],
];

const REGISTER_COLORS: Record<string, string> = {
  DANGCEM: "bg-blue-100 text-blue-800",
  ZENITHBANK: "bg-purple-100 text-purple-800",
  ACCESSCORP: "bg-amber-100 text-amber-800",
  GTCO: "bg-teal-100 text-teal-800",
};

export default function CSCSUpdatesPage() {
  // ── Page state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("upload");
  const [flagSheetOpen, setFlagSheetOpen] = useState(false);
  const [insertMode, setInsertMode] = useState(false);

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

      {/* Pull History Dialog */}
      <Dialog
        open={flagSheetOpen}
        onOpenChange={(open) => {
          setFlagSheetOpen(open);
          if (!open) setInsertMode(false);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {insertMode
                ? "Insert Missing Transaction"
                : "Transaction History"}
            </DialogTitle>
            <DialogDescription className="tabular-nums">
              CHN: C00001045EL | Binta Lawal | DANGCEM
            </DialogDescription>
          </DialogHeader>

          {!insertMode ? (
            /* ── History view ─────────────────────────────────── */
            <div className="space-y-5 px-8 pb-8">
              <div className="bg-muted/40 p-4 rounded-xl">
                <h4 className="font-semibold text-sm mb-2">
                  Upload Historical CSCS Data
                </h4>
                <div className="flex gap-2">
                  <Input type="file" className="mrpsl-input bg-background" />
                  <Button variant="outline">Load</Button>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl overflow-hidden">
                <div className="px-3 py-2.5 bg-amber-50 text-amber-800 text-[13px] font-semibold flex items-center gap-2 border-b border-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Flagged Sell: 15,000 units on 29 Apr 2026. Current balance:
                  10,000. Shortfall: 5,000.
                </div>
                <table className="w-full text-[13px] text-left">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Transfer No</th>
                      <th className="px-3 py-2.5 text-right">Units</th>
                      <th className="px-3 py-2.5 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr className="bg-green-50/60">
                      <td className="px-3 py-2.5 tabular-nums">25 Apr 2026</td>
                      <td className="px-3 py-2.5 text-green-700 font-semibold">
                        Buy
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">
                        TRN-8944521
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-green-700 font-semibold">
                        +5,000
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        15,000
                      </td>
                    </tr>
                    <tr className="bg-amber-50/40">
                      <td
                        className="px-3 py-2.5 text-amber-700 italic text-[13px]"
                        colSpan={5}
                      >
                        ⚠ Missing in MRPSL register — CSCS shows this Buy but
                        MRPSL does not.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 tabular-nums">01 Jan 2026</td>
                      <td className="px-3 py-2.5 text-green-700 font-semibold">
                        Buy
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">
                        TRN-8100001
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-green-700 font-semibold">
                        +10,000
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        10,000
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <Button className="w-full" onClick={() => setInsertMode(true)}>
                  Insert Missing Transaction &amp; Resolve
                </Button>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => {
                    toast.error("Force commit logged for audit review.");
                    setFlagSheetOpen(false);
                    setInsertMode(false);
                  }}
                >
                  Override and Force Commit
                </Button>
              </div>
            </div>
          ) : (
            /* ── Insert form ──────────────────────────────────── */
            <div className="space-y-5 px-8 pb-8">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  This will insert the missing Buy transaction into the MRPSL
                  register and submit for checker approval before the flagged
                  sell is committed.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="mrpsl-label">Transaction Date *</label>
                  <Input defaultValue="25 Apr 2026" className="mrpsl-input" />
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Transfer No *</label>
                  <Input
                    defaultValue="TRN-8944521"
                    className="mrpsl-input font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Transaction Type</label>
                  <Select defaultValue="Buy">
                    <SelectTrigger className="mrpsl-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buy">Buy</SelectItem>
                      <SelectItem value="Sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Units *</label>
                  <Input
                    defaultValue="5000"
                    className="mrpsl-input font-mono"
                    type="number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="mrpsl-label">Resolution Reason *</label>
                <textarea
                  className="w-full mrpsl-input rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus-visible:outline-none"
                  placeholder="Explain why this transaction was missing from the MRPSL register…"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-border/60">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setInsertMode(false)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success(
                      "Missing transaction inserted. Flagged sell sent to checker for approval.",
                    );
                    setFlagSheetOpen(false);
                    setInsertMode(false);
                  }}
                >
                  Submit for Checker Approval
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

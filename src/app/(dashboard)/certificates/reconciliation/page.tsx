"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  CalendarIcon,
} from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";
import UpdateReconciliation from "@/components/custom/certificate-reconciliation/update-reconciliation";
import GeneralCertificateReconciliation from "@/components/custom/certificate-reconciliation/general-certificate-recon";

type PositionRow = {
  chn: string;
  accountNo: string;
  holder: string;
  mrpslUnits: number;
  cscsUnits: number;
};

const POSITION_DATA: PositionRow[] = [
  {
    chn: "C00001045EL",
    accountNo: "DANGCEM-10015",
    holder: "Binta Lawal",
    mrpslUnits: 10000,
    cscsUnits: 15000,
  },
  {
    chn: "C00002198KL",
    accountNo: "DANGCEM-10044",
    holder: "Chukwuemeka Obi",
    mrpslUnits: 15000,
    cscsUnits: 15000,
  },
  {
    chn: "C00003312MN",
    accountNo: "DANGCEM-10091",
    holder: "Fatima Aliyu",
    mrpslUnits: 28000,
    cscsUnits: 28000,
  },
  {
    chn: "C00005023RT",
    accountNo: "DANGCEM-10109",
    holder: "Yusuf Mohammed",
    mrpslUnits: 35000,
    cscsUnits: 35000,
  },
  {
    chn: "C00006112BC",
    accountNo: "DANGCEM-10158",
    holder: "Halima Yusuf",
    mrpslUnits: 20000,
    cscsUnits: 20000,
  },
  {
    chn: "C00007712ZZ",
    accountNo: "DANGCEM-10201",
    holder: "Musa Ibrahim",
    mrpslUnits: 2800,
    cscsUnits: 3000,
  },
  {
    chn: "C00009001AA",
    accountNo: "DANGCEM-10233",
    holder: "Adaeze Okwuosa",
    mrpslUnits: 12500,
    cscsUnits: 12500,
  },
  {
    chn: "C00011450BB",
    accountNo: "DANGCEM-10298",
    holder: "Tunde Oyelaran",
    mrpslUnits: 8000,
    cscsUnits: 8000,
  },
];

export default function ReconciliationPage() {
  const [activeTab, setActiveTab] = useState("cscs");


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Certificate Reconciliation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Identify and resolve discrepancies between the MRPSL register and CSCS
          positions
        </p>
      </div>

      {/* Tabs + Content — single vertical column */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full !flex !flex-col"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="cscs"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap
                       text-muted-foreground
                       data-active:bg-background data-active:text-foreground data-active:shadow-sm
                       hover:text-foreground transition-all"
          >
            CSCS Update Reconciliation
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap
                       text-muted-foreground
                       data-active:bg-background data-active:text-foreground data-active:shadow-sm
                       hover:text-foreground transition-all"
          >
            General Certificate Reconciliation
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {/* ── CSCS Update Reconciliation ── */}
          <TabsContent value="cscs" className="space-y-4">
            <UpdateReconciliation tab="cscs" />
          </TabsContent>

          {/* ── General Certificate Reconciliation ── */}
          <TabsContent value="general" className="space-y-4">
            <GeneralCertificateReconciliation />
          </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}

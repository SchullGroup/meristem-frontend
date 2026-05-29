"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Check,
  FileText,
  FileImage,
  Plus,
  UploadCloud,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  Eye,
  AlertCircle,
  X,
  Download,
  ExternalLink,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";
import { getDocType } from "@/lib/mocks/doc-types";
import { useStore } from "@/lib/store";
import type { Shareholder } from "@/lib/types";
import { CaptureDematerialization } from "@/components/custom/cert-dematerialization/capture-demat";
import CalloverDemat from "@/components/custom/cert-dematerialization/callover-demat";
import AuthoriseDemat from "@/components/custom/cert-dematerialization/authorise-demat";
import IcuApproveDemat from "@/components/custom/cert-dematerialization/icu-approve-demat";
import LodgeDemat from "@/components/custom/cert-dematerialization/lodge-demat";

type DematStatus =
  | "DRAFT"
  | "CALLOVER"
  | "AUTHORISATION"
  | "ICU"
  | "APPROVED"
  | "REJECTED";

type DematDoc = { name: string; fileType: "PDF" | "IMAGE"; url: string };

type DematRecord = {
  id: string;
  date: string;
  cert: string;
  holder: string;
  chn: string;
  broker: string;
  units: number;
  status: DematStatus;
  documents?: DematDoc[];
};

const MOCK_RECORDS: DematRecord[] = [
  {
    id: "D1",
    date: "29 Apr 2026",
    cert: "CERT-DANGCEM-00891",
    holder: "Adaeze Okonkwo",
    chn: "CHN-00192834",
    broker: "CSCS PLC",
    units: 5000,
    status: "DRAFT",
  },
  {
    id: "D2",
    date: "28 Apr 2026",
    cert: "CERT-DANGCEM-00745, CERT-DANGCEM-00746",
    holder: "Emeka Nwosu",
    chn: "CHN-00381920",
    broker: "Zenith Securities",
    units: 12500,
    status: "CALLOVER",
    documents: [
      { name: "Shareholder_ID_Emeka_Nwosu.jpg", fileType: "IMAGE", url: "#" },
      { name: "Demat_Form_D2_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00745.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00746.pdf", fileType: "PDF", url: "#" },
    ],
  },
  {
    id: "D3",
    date: "27 Apr 2026",
    cert: "CERT-DANGCEM-00612",
    holder: "Fatima Bello",
    chn: "CHN-00274510",
    broker: "Meristem Stockbrokers",
    units: 8000,
    status: "AUTHORISATION",
    documents: [
      { name: "Shareholder_ID_Fatima_Bello.jpg", fileType: "IMAGE", url: "#" },
      { name: "Demat_Form_D3_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00612.pdf", fileType: "PDF", url: "#" },
    ],
  },
  {
    id: "D4",
    date: "26 Apr 2026",
    cert: "CERT-DANGCEM-00503",
    holder: "Chukwudi Obi",
    chn: "CHN-00163824",
    broker: "CSCS PLC",
    units: 25000,
    status: "ICU",
    documents: [
      { name: "Shareholder_ID_Chukwudi_Obi.pdf", fileType: "PDF", url: "#" },
      { name: "Demat_Form_D4_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00503.pdf", fileType: "PDF", url: "#" },
    ],
  },
  {
    id: "D5",
    date: "24 Apr 2026",
    cert: "CERT-DANGCEM-00411",
    holder: "Blessing Okonkwo",
    chn: "CHN-00554321",
    broker: "Meristem Stockbrokers",
    units: 18000,
    status: "APPROVED",
    documents: [
      {
        name: "Shareholder_ID_Blessing_Okonkwo.pdf",
        fileType: "PDF",
        url: "#",
      },
      { name: "Demat_Form_D5_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00411.pdf", fileType: "PDF", url: "#" },
    ],
  },
  {
    id: "D6",
    date: "23 Apr 2026",
    cert: "CERT-DANGCEM-00388",
    holder: "Tunde Adegoke",
    chn: "CHN-00112988",
    broker: "Zenith Securities",
    units: 9500,
    status: "APPROVED",
    documents: [
      { name: "Shareholder_ID_Tunde_Adegoke.jpg", fileType: "IMAGE", url: "#" },
      { name: "Demat_Form_D6_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00388.pdf", fileType: "PDF", url: "#" },
    ],
  },
  {
    id: "D7",
    date: "22 Apr 2026",
    cert: "CERT-DANGCEM-00321, CERT-DANGCEM-00322",
    holder: "Ngozi Eze",
    chn: "CHN-00876543",
    broker: "CSCS PLC",
    units: 32000,
    status: "APPROVED",
    documents: [
      { name: "Shareholder_ID_Ngozi_Eze.pdf", fileType: "PDF", url: "#" },
      { name: "Demat_Form_D7_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00321.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00322.pdf", fileType: "PDF", url: "#" },
    ],
  },
];

const STATUS_MAP: Record<DematStatus, { cls: string; label: string }> = {
  DRAFT: { cls: "bg-gray-100 text-gray-600", label: "Draft" },
  CALLOVER: { cls: "bg-blue-100 text-blue-800", label: "Callover" },
  AUTHORISATION: { cls: "bg-amber-100 text-amber-800", label: "Pending Auth" },
  ICU: { cls: "bg-purple-100 text-purple-800", label: "ICU Review" },
  APPROVED: { cls: "bg-green-100 text-green-800", label: "Approved" },
  REJECTED: { cls: "bg-red-100 text-red-700", label: "Rejected" },
};

function StatusBadge({ status }: { status: DematStatus }) {
  const s = STATUS_MAP[status];
  return <Badge className={`border-0 text-[13px] ${s.cls}`}>{s.label}</Badge>;
}

const APPROVAL_STEPS: Record<
  string,
  Array<{
    label: string;
    done: boolean;
    pending: boolean;
    time?: string | null;
  }>
> = {
  CALLOVER: [
    {
      label: "Captured by Initiator — Chidi Okafor",
      done: true,
      pending: false,
      time: "28 Apr 2026, 08:45",
    },
    {
      label: "Callover Officer — Pending your action",
      done: false,
      pending: true,
      time: null,
    },
    { label: "Authoriser — Awaiting", done: false, pending: false, time: null },
    {
      label: "ICU Officer — Awaiting",
      done: false,
      pending: false,
      time: null,
    },
  ],
  AUTHORISATION: [
    {
      label: "Captured by Initiator — Chidi Okafor",
      done: true,
      pending: false,
      time: "27 Apr 2026, 08:45",
    },
    {
      label: "Callover by Ngozi Adeyemi (Callover Officer)",
      done: true,
      pending: false,
      time: "27 Apr 2026, 10:20",
    },
    {
      label: "Authoriser — Pending your action",
      done: false,
      pending: true,
      time: null,
    },
    {
      label: "ICU Officer — Awaiting",
      done: false,
      pending: false,
      time: null,
    },
  ],
  ICU: [
    {
      label: "Captured by Initiator — Chidi Okafor",
      done: true,
      pending: false,
      time: "26 Apr 2026, 08:45",
    },
    {
      label: "Callover by Ngozi Adeyemi (Callover Officer)",
      done: true,
      pending: false,
      time: "26 Apr 2026, 10:20",
    },
    {
      label: "Authorised by Emeka Eze (Operations Manager)",
      done: true,
      pending: false,
      time: "26 Apr 2026, 12:05",
    },
    {
      label: "ICU Officer — Pending your action",
      done: false,
      pending: true,
      time: null,
    },
  ],
};


const STEPS = [
  { step: 1, label: "Capture", tab: "capture" },
  { step: 2, label: "Callover", tab: "callover" },
  { step: 3, label: "Authorisation", tab: "auth" },
  { step: 4, label: "ICU Approval", tab: "icu" },
  { step: 5, label: "Lodgment", tab: "lodgment" },
];

export default function DematPage() {
  const { shareholders } = useStore();
  const [activeTab, setActiveTab] = useState("capture");
  const [formOpen, setFormOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<DematRecord | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [lastRejComment, setLastRejComment] = useState("");
  const [editingRejectedId, setEditingRejectedId] = useState<string | null>(
    null,
  );
  const [rejectComment, setRejectComment] = useState("");
  const [lodgedIds, setLodgedIds] = useState<Set<string>>(new Set());
  const [rinType, setRinType] = useState<"with_rin" | "no_rin">("with_rin");
  const [lodgmentSelectedIds, setLodgmentSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [holderQuery, setHolderQuery] = useState("");
  const [foundHolder, setFoundHolder] = useState<Shareholder | null>(null);
  const [holderNotFound, setHolderNotFound] = useState(false);

  function handleHolderLookup() {
    const q = holderQuery.trim().toUpperCase();
    if (!q) return;
    const match = shareholders.find(
      (s) => s.accountNumber.toUpperCase() === q || s.chn.toUpperCase() === q,
    );
    if (match) {
      setFoundHolder(match);
      setHolderNotFound(false);
    } else {
      setFoundHolder(null);
      setHolderNotFound(true);
    }
  }

  function resetForm() {
    setHolderQuery("");
    setFoundHolder(null);
    setHolderNotFound(false);
    setEditingRejectedId(null);
  }

  function openReview(rec: DematRecord) {
    setSelected(rec);
    setRejectComment("");
    setReviewOpen(true);
  }

  const draftRecords = MOCK_RECORDS.filter((r) => r.status === "DRAFT");
  const calloverRecords = MOCK_RECORDS.filter(
    (r) => r.status === "CALLOVER" && !rejectedIds.has(r.id),
  );
  const authRecords = MOCK_RECORDS.filter(
    (r) => r.status === "AUTHORISATION" && !rejectedIds.has(r.id),
  );
  const icuRecords = MOCK_RECORDS.filter(
    (r) => r.status === "ICU" && !rejectedIds.has(r.id),
  );
  const lodgmentRecords = MOCK_RECORDS.filter(
    (r) => r.status === "APPROVED" && !lodgedIds.has(r.id),
  );
  const draftPg = usePagination(draftRecords);
  const approvalSteps = selected ? (APPROVAL_STEPS[selected.status] ?? []) : [];

  const approveLabel =
    selected?.status === "CALLOVER"
      ? "Approve & Forward to Auth"
      : selected?.status === "AUTHORISATION"
        ? "Approve & Forward to ICU"
        : "Approve for Lodgment";

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
            <CaptureDematerialization tab="capture" setActiveTab={setActiveTab} />
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

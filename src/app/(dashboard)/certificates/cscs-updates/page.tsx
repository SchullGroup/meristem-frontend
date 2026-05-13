"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle,
  AlertTriangle,
  FileArchive,
  Loader2,
  Check,
  ChevronDown,
  Search,
  MoreHorizontal,
  Eye,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";

// ── Nigerian states ────────────────────────────────────────────────

const NG_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT (Abuja)",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

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
    detectedState: "FCT (Abuja)",
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
  const [stage, setStage] = useState<
    "idle" | "processing" | "review" | "preview"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [zipFileName, setZipFileName] = useState<string | null>(null);
  const [records, setRecords] = useState<AddressRecord[]>(INITIAL_RECORDS);
  const [flagSheetOpen, setFlagSheetOpen] = useState(false);

  // ── Review filters ────────────────────────────────────────────
  const [registerFilter, setRegisterFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // ── Queue + Flagged filters ───────────────────────────────────
  const [queueRegister, setQueueRegister] = useState("All");
  const [queueSearch, setQueueSearch] = useState("");
  const [flaggedRegister, setFlaggedRegister] = useState("All");
  const [flaggedType, setFlaggedType] = useState("All");
  const [flaggedStatus, setFlaggedStatus] = useState("All");
  const [flaggedSearch, setFlaggedSearch] = useState("");
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ── Derived ───────────────────────────────────────────────────
  const allRegisters = useMemo(
    () => Array.from(new Set(records.map((r) => r.register))),
    [records],
  );

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const matchReg =
          registerFilter === "All" || r.register === registerFilter;
        const matchStatus =
          statusFilter === "All" ||
          (statusFilter === "Confirmed" && r.confirmedState !== null) ||
          (statusFilter === "Unconfirmed" && r.confirmedState === null);
        const matchSearch =
          search === "" ||
          r.holderName.toLowerCase().includes(search.toLowerCase()) ||
          r.chn.toLowerCase().includes(search.toLowerCase()) ||
          r.accountNo.toLowerCase().includes(search.toLowerCase());
        return matchReg && matchStatus && matchSearch;
      }),
    [records, registerFilter, statusFilter, search],
  );

  const totalConfirmed = records.filter(
    (r) => r.confirmedState !== null,
  ).length;
  const totalUnconfirmed = records.filter(
    (r) => r.confirmedState === null,
  ).length;
  const allConfirmed = totalUnconfirmed === 0;

  // ── Actions ───────────────────────────────────────────────────
  const confirmState = (id: string, state: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, confirmedState: state } : r)),
    );
  };

  const confirmAllVisible = () => {
    setRecords((prev) =>
      prev.map((r) => {
        const match = filtered.find((f) => f.id === r.id);
        return match && r.confirmedState === null
          ? { ...r, confirmedState: r.detectedState }
          : r;
      }),
    );
    toast.success(
      `${filtered.filter((f) => f.confirmedState === null).length} GIS-detected states accepted.`,
    );
  };

  const startProcessing = (name: string) => {
    setZipFileName(name);
    setStage("processing");
    setProgress(0);
    let i = 0;
    const tick = () => {
      if (i < PROCESSING_STAGES.length) {
        const [val, label] = PROCESSING_STAGES[i++];
        setProgress(val);
        setProgressLabel(label);
        setTimeout(tick, 600);
      } else {
        setTimeout(() => {
          setStage("review");
          toast.success(
            `ZIP processed — ${INITIAL_RECORDS.length} address updates across ${allRegisters.length} registers need state confirmation.`,
          );
        }, 400);
      }
    };
    setTimeout(tick, 200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".zip")) startProcessing(file.name);
    else toast.error("Please drop a .zip file");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startProcessing(file.name);
  };

  const handleCommit = () => {
    setStage("preview");
    toast.success(
      "Address updates committed. Routed to Checker for authorisation.",
    );
  };

  const handleReset = () => {
    setStage("idle");
    setZipFileName(null);
    setRecords(INITIAL_RECORDS);
    setProgress(0);
    setRegisterFilter("All");
    setStatusFilter("All");
    setSearch("");
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

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
        className="w-full !flex !flex-col"
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
          <TabsTrigger value="log" className={tabTriggerClass}>
            Processed Log
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* ── Upload & Process ─────────────────────────────────── */}
          <TabsContent value="upload" className="space-y-6">
            {/* IDLE */}
            {stage === "idle" && (
              <>
                <label
                  htmlFor="zip-input"
                  className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl p-16 cursor-pointer transition-colors ${
                    isDraggingOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                >
                  <input
                    id="zip-input"
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <FileArchive
                    className={`h-14 w-14 mb-5 transition-colors ${isDraggingOver ? "text-primary" : "text-muted-foreground/30"}`}
                  />
                  <p className="font-semibold text-base">
                    Upload Master Data ZIP (All Registers)
                  </p>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Drag &amp; drop or click —{" "}
                    <span className="font-mono text-xs">.zip</span> only
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-3">
                    Contains master file + transaction file for all active
                    registers
                  </p>
                </label>
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <strong>Anti-Ghost Seller Protocol Active</strong> — BUY
                    transactions are processed before SELL within each
                    shareholder&apos;s batch. Shortfall SELLs are flagged and
                    routed to reconciliation.
                  </p>
                </div>
              </>
            )}

            {/* PROCESSING */}
            {stage === "processing" && (
              <Card className="mrpsl-card p-10 flex flex-col items-center gap-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <span className="font-semibold text-sm">{progressLabel}</span>
                </div>
                <div className="w-full max-w-md space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono truncate max-w-[260px]">
                      {zipFileName}
                    </span>
                    <span>{progress}%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Running GIS state detection across all address records…
                </p>
              </Card>
            )}

            {/* STATE CONFIRMATION REVIEW */}
            {stage === "review" && (
              <div className="space-y-4">
                {/* Action bar */}
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>
                        {totalUnconfirmed} record
                        {totalUnconfirmed !== 1 ? "s" : ""}
                      </strong>{" "}
                      need state confirmation for tax jurisdiction. GIS has
                      pre-filled detected states — review and confirm or
                      override each one.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCommit}
                    disabled={!allConfirmed}
                    className="shrink-0 ml-4"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Commit Updates
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 items-center flex-wrap">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search holder, CHN, account…"
                      className="pl-9 mrpsl-input"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select
                    value={registerFilter}
                    onValueChange={(v) => setRegisterFilter(v || "All")}
                  >
                    <SelectTrigger className="w-44 mrpsl-input">
                      <SelectValue placeholder="All Registers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Registers</SelectItem>
                      {allRegisters.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v || "All")}
                  >
                    <SelectTrigger className="w-40 mrpsl-input">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Records</SelectItem>
                      <SelectItem value="Unconfirmed">Unconfirmed</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      <span className="text-primary font-semibold">
                        {totalConfirmed}
                      </span>{" "}
                      / {records.length} confirmed
                    </span>
                    {filtered.some((f) => f.confirmedState === null) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs"
                        onClick={confirmAllVisible}
                      >
                        Accept all GIS suggestions
                        {registerFilter !== "All"
                          ? ` for ${registerFilter}`
                          : " (visible)"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Records table */}
                <Card className="mrpsl-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="mrpsl-table-header">
                        <tr>
                          <th className="px-4 py-3">REGISTER</th>
                          <th className="px-4 py-3">HOLDER</th>
                          <th className="px-4 py-3">NEW ADDRESS (CSCS)</th>
                          <th className="px-4 py-3 min-w-[220px]">
                            GIS-DETECTED STATE
                          </th>
                          <th className="px-4 py-3">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filtered.map((r) => (
                          <tr
                            key={r.id}
                            className="hover:bg-accent/5 align-top"
                          >
                            {/* Register */}
                            <td className="px-4 py-4">
                              <Badge
                                className={`border-0 text-xs ${REGISTER_COLORS[r.register] ?? "bg-gray-100 text-gray-800"}`}
                              >
                                {r.register}
                              </Badge>
                            </td>

                            {/* Holder details */}
                            <td className="px-4 py-4 text-xs space-y-0.5 min-w-[180px]">
                              <div className="font-semibold text-sm text-foreground">
                                {r.holderName}
                              </div>
                              <div className="text-muted-foreground font-mono">
                                {r.accountNo}
                              </div>
                              <div className="text-muted-foreground font-mono">
                                {r.chn}
                              </div>
                              <div className="text-muted-foreground">
                                {r.phone}
                              </div>
                              <div className="text-muted-foreground truncate max-w-[180px]">
                                {r.email}
                              </div>
                            </td>

                            {/* New address from CSCS */}
                            <td className="px-4 py-4 text-xs text-muted-foreground leading-relaxed max-w-[220px]">
                              {r.address}
                            </td>

                            {/* GIS state — pre-filled dropdown + explicit confirm button */}
                            <td className="px-4 py-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <Select
                                    value={r.confirmedState ?? r.detectedState}
                                    onValueChange={(state) => {
                                      if (!state) return;
                                      confirmState(r.id, state);
                                      toast.success(
                                        `${r.holderName} — state set to ${state}`,
                                      );
                                    }}
                                  >
                                    <SelectTrigger
                                      className={`h-9 text-xs flex-1 min-w-0 ${
                                        r.confirmedState === null
                                          ? "border-amber-300 bg-amber-50 text-amber-900"
                                          : "border-green-300 bg-green-50 text-green-900"
                                      }`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent
                                      align="start"
                                      alignItemWithTrigger={false}
                                      className="max-h-60"
                                    >
                                      {NG_STATES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                          {s}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {r.confirmedState === null ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-9 px-3 shrink-0 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                                      onClick={() => {
                                        confirmState(r.id, r.detectedState);
                                        toast.success(
                                          `${r.holderName} — ${r.detectedState} confirmed`,
                                        );
                                      }}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                  )}
                                </div>
                                {r.confirmedState !== null &&
                                  r.confirmedState !== r.detectedState && (
                                    <div className="text-[10px] text-muted-foreground">
                                      GIS suggested:{" "}
                                      <span className="font-medium">
                                        {r.detectedState}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4">
                              {r.confirmedState !== null ? (
                                <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                  Confirmed
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">
                                  Pending
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filtered.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-12 text-center text-muted-foreground text-sm"
                            >
                              No records match your filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2.5 border-t bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      Showing {filtered.length} of {records.length} records
                    </span>
                    {!allConfirmed ? (
                      <span className="text-amber-600 font-medium">
                        {totalUnconfirmed} remaining — confirm all to enable
                        commit
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">
                        All states confirmed — ready to commit
                      </span>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* PREVIEW — committed */}
            {stage === "preview" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-sm font-medium text-green-800">
                    {records.length} address updates committed with confirmed
                    states. Awaiting Checker authorisation.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto shrink-0"
                    onClick={handleReset}
                  >
                    Process New ZIP
                  </Button>
                </div>

                <Card className="mrpsl-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="mrpsl-table-header">
                        <tr>
                          <th className="px-4 py-3">REGISTER</th>
                          <th className="px-4 py-3">CHN</th>
                          <th className="px-4 py-3">HOLDER</th>
                          <th className="px-4 py-3">COMMITTED ADDRESS</th>
                          <th className="px-4 py-3">
                            STATE (TAX JURISDICTION)
                          </th>
                          <th className="px-4 py-3">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-xs">
                        {records.map((r) => (
                          <tr key={r.id} className="mrpsl-table-row">
                            <td className="px-4 py-3">
                              <Badge
                                className={`border-0 text-xs ${REGISTER_COLORS[r.register] ?? "bg-gray-100 text-gray-800"}`}
                              >
                                {r.register}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">
                              {r.chn}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {r.holderName}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                              {r.address}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {r.confirmedState}
                              {r.confirmedState !== r.detectedState && (
                                <span className="text-[10px] text-muted-foreground ml-1">
                                  (overridden)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                Committed
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── Processing Queue ─────────────────────────────────── */}
          <TabsContent value="queue" className="space-y-4">
            <div className="flex gap-2 items-center flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batch ref…"
                  className="pl-9 mrpsl-input"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                />
              </div>
              <Select
                value={queueRegister}
                onValueChange={(v) => setQueueRegister(v || "All")}
              >
                <SelectTrigger className="w-44 mrpsl-input">
                  <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Registers</SelectItem>
                  {["DANGCEM", "ZENITHBANK", "ACCESSCORP", "GTCO"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select defaultValue="All">
                <SelectTrigger className="w-36 mrpsl-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="All">
                <SelectTrigger className="w-40 mrpsl-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th
                        className="px-4 py-3 cursor-pointer select-none"
                        onClick={() => toggleSort("ref")}
                      >
                        BATCH REF{" "}
                        <SortIcon
                          sortDir={sortDir}
                          sortCol={sortCol}
                          col="ref"
                        />
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer select-none"
                        onClick={() => toggleSort("register")}
                      >
                        REGISTER{" "}
                        <SortIcon
                          sortDir={sortDir}
                          sortCol={sortCol}
                          col="register"
                        />
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer select-none"
                        onClick={() => toggleSort("date")}
                      >
                        DATE{" "}
                        <SortIcon
                          sortDir={sortDir}
                          sortCol={sortCol}
                          col="date"
                        />
                      </th>
                      <th
                        className="px-4 py-3 text-right cursor-pointer select-none"
                        onClick={() => toggleSort("total")}
                      >
                        TOTAL{" "}
                        <SortIcon
                          sortDir={sortDir}
                          sortCol={sortCol}
                          col="total"
                        />
                      </th>
                      <th className="px-4 py-3 text-right">BUYS</th>
                      <th className="px-4 py-3 text-right">SELLS</th>
                      <th className="px-4 py-3 text-right">FLAGGED</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[
                      {
                        ref: "BATCH-CSCS-20260429-001",
                        reg: "DANGCEM",
                        date: "29 Apr 2026",
                        total: 4200,
                        buys: 2100,
                        sells: 2098,
                        flagged: 2,
                        status: "Partial",
                      },
                      {
                        ref: "BATCH-CSCS-20260429-002",
                        reg: "ZENITHBANK",
                        date: "29 Apr 2026",
                        total: 6310,
                        buys: 3100,
                        sells: 3210,
                        flagged: 0,
                        status: "Complete",
                      },
                      {
                        ref: "BATCH-CSCS-20260429-003",
                        reg: "ACCESSCORP",
                        date: "29 Apr 2026",
                        total: 1920,
                        buys: 980,
                        sells: 940,
                        flagged: 1,
                        status: "Partial",
                      },
                      {
                        ref: "BATCH-CSCS-20260429-004",
                        reg: "GTCO",
                        date: "29 Apr 2026",
                        total: 5100,
                        buys: 2550,
                        sells: 2550,
                        flagged: 0,
                        status: "Complete",
                      },
                      {
                        ref: "BATCH-CSCS-20260428-001",
                        reg: "DANGCEM",
                        date: "28 Apr 2026",
                        total: 3800,
                        buys: 1900,
                        sells: 1900,
                        flagged: 0,
                        status: "Complete",
                      },
                      {
                        ref: "BATCH-CSCS-20260428-002",
                        reg: "ZENITHBANK",
                        date: "28 Apr 2026",
                        total: 8540,
                        buys: 4200,
                        sells: 4340,
                        flagged: 0,
                        status: "Complete",
                      },
                    ]
                      .filter(
                        (r) =>
                          queueRegister === "All" || r.reg === queueRegister,
                      )
                      .filter(
                        (r) =>
                          queueSearch === "" ||
                          r.ref
                            .toLowerCase()
                            .includes(queueSearch.toLowerCase()),
                      )
                      .map((row) => (
                        <tr key={row.ref} className="mrpsl-table-row">
                          <td className="px-4 py-3 tabular-nums text-xs text-muted-foreground">
                            {row.ref}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`border-0 text-xs ${REGISTER_COLORS[row.reg] ?? "bg-gray-100 text-gray-800"}`}
                            >
                              {row.reg}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {row.date}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">
                            {row.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-green-600">
                            {row.buys.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-red-600">
                            {row.sells.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {row.flagged > 0 ? (
                              <span className="text-amber-600 font-semibold">
                                {row.flagged}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`border-0 text-xs ${row.status === "Complete" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                            >
                              {row.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => toast.info("Batch detail")}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Batch
                                  Detail
                                </DropdownMenuItem>
                                {row.flagged > 0 && (
                                  <DropdownMenuItem
                                    onClick={() => setActiveTab("flagged")}
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />{" "}
                                    View Flagged ({row.flagged})
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ── Flagged Transactions ──────────────────────────────── */}
          <TabsContent value="flagged" className="space-y-4">
            <div className="flex gap-2 items-center flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search CHN or holder…"
                  className="pl-9 mrpsl-input"
                  value={flaggedSearch}
                  onChange={(e) => setFlaggedSearch(e.target.value)}
                />
              </div>
              <Select
                value={flaggedRegister}
                onValueChange={(v) => setFlaggedRegister(v || "All")}
              >
                <SelectTrigger className="w-44 mrpsl-input">
                  <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Registers</SelectItem>
                  {["DANGCEM", "ZENITHBANK", "ACCESSCORP", "GTCO"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={flaggedType}
                onValueChange={(v) => setFlaggedType(v || "All")}
              >
                <SelectTrigger className="w-32 mrpsl-input">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                  <SelectItem value="Buy">Buy</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={flaggedStatus}
                onValueChange={(v) => setFlaggedStatus(v || "All")}
              >
                <SelectTrigger className="w-40 mrpsl-input">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Force Committed">
                    Force Committed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th
                        className="px-4 py-3 cursor-pointer select-none"
                        onClick={() => toggleSort("chn")}
                      >
                        CHN{" "}
                        <SortIcon
                          sortDir={sortDir}
                          sortCol={sortCol}
                          col="chn"
                        />
                      </th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">HOLDER</th>
                      <th className="px-4 py-3">TRANSFER NO</th>
                      <th className="px-4 py-3">TYPE</th>
                      <th
                        className="px-4 py-3 text-right cursor-pointer select-none"
                        onClick={() => toggleSort("attempted")}
                      >
                        ATTEMPTED{" "}
                        <SortIcon
                          sortDir={sortDir}
                          sortCol={sortCol}
                          col="attempted"
                        />
                      </th>
                      <th className="px-4 py-3 text-right">HOLDINGS</th>
                      <th
                        className="px-4 py-3 text-right cursor-pointer select-none"
                        onClick={() => toggleSort("shortfall")}
                      >
                        SHORTFALL{" "}
                        <SortIcon
                          sortDir={sortDir}
                          sortCol={sortCol}
                          col="shortfall"
                        />
                      </th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[
                      {
                        chn: "C00001045EL",
                        reg: "DANGCEM",
                        holder: "Binta Lawal",
                        trn: "TRN-8944521",
                        type: "Sell",
                        attempted: 15000,
                        holdings: 10000,
                        shortfall: 5000,
                        status: "Pending",
                      },
                      {
                        chn: "C00009102XY",
                        reg: "ACCESSCORP",
                        holder: "Ngozi Okafor",
                        trn: "TRN-9012344",
                        type: "Sell",
                        attempted: 8000,
                        holdings: 6500,
                        shortfall: 1500,
                        status: "Pending",
                      },
                      {
                        chn: "C00007712ZZ",
                        reg: "DANGCEM",
                        holder: "Musa Ibrahim",
                        trn: "TRN-8711020",
                        type: "Sell",
                        attempted: 3000,
                        holdings: 2800,
                        shortfall: 200,
                        status: "Resolved",
                      },
                    ]
                      .filter(
                        (r) =>
                          flaggedRegister === "All" ||
                          r.reg === flaggedRegister,
                      )
                      .filter(
                        (r) => flaggedType === "All" || r.type === flaggedType,
                      )
                      .filter(
                        (r) =>
                          flaggedStatus === "All" || r.status === flaggedStatus,
                      )
                      .filter(
                        (r) =>
                          flaggedSearch === "" ||
                          r.holder
                            .toLowerCase()
                            .includes(flaggedSearch.toLowerCase()) ||
                          r.chn
                            .toLowerCase()
                            .includes(flaggedSearch.toLowerCase()),
                      )
                      .map((row) => (
                        <tr key={row.chn} className="mrpsl-table-row">
                          <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                            {row.chn}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`border-0 text-xs ${REGISTER_COLORS[row.reg] ?? "bg-gray-100 text-gray-800"}`}
                            >
                              {row.reg}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {row.holder}
                          </td>
                          <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
                            {row.trn}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`border-0 text-xs ${row.type === "Sell" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800"}`}
                            >
                              {row.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-red-600 font-semibold">
                            {row.attempted.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {row.holdings.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-amber-600 font-semibold">
                            {row.shortfall.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`border-0 text-xs ${row.status === "Resolved" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                            >
                              {row.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setFlagSheetOpen(true)}
                            >
                              Pull History
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ── Processed Log ────────────────────────────────────── */}
          <TabsContent value="log">
            <div className="flex gap-2 mb-4 flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search CHN, account, holder…"
                  className="pl-9 mrpsl-input"
                />
              </div>
              <Select defaultValue="All">
                <SelectTrigger className="w-44 mrpsl-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Registers</SelectItem>
                  {["DANGCEM", "ZENITHBANK", "ACCESSCORP", "GTCO"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select defaultValue="All">
                <SelectTrigger className="w-32 mrpsl-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Buy">Buy</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="mrpsl-card p-12 text-center text-sm text-muted-foreground">
              Searchable log of all committed transactions will appear here.
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Pull History Sheet */}
      <Sheet open={flagSheetOpen} onOpenChange={setFlagSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle>Transaction History</SheetTitle>
            <SheetDescription className="tabular-nums mt-1">
              CHN: C00001045EL | Binta Lawal | DANGCEM
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-xl">
              <h4 className="font-semibold text-sm mb-2">
                Upload Historical CSCS Data
              </h4>
              <div className="flex gap-2">
                <Input type="file" className="mrpsl-input bg-background" />
                <Button variant="secondary">Load</Button>
              </div>
            </div>
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 bg-amber-50 text-amber-800 text-xs font-semibold flex items-center gap-2 border-b border-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Flagged Sell: 15,000 units on 29 Apr 2026. Current balance:
                10,000.
              </div>
              <table className="w-full text-xs text-left">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5 text-right">Units</th>
                    <th className="px-3 py-2.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="bg-green-50">
                    <td className="px-3 py-2.5 tabular-nums">25 Apr 2026</td>
                    <td className="px-3 py-2.5 text-green-600 font-semibold">
                      Buy
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      5,000
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      15,000
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="px-3 py-2.5 text-muted-foreground italic text-[11px]"
                      colSpan={4}
                    >
                      Missing Buy transaction in MRPSL — not reflected in
                      register.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 tabular-nums">01 Jan 2026</td>
                    <td className="px-3 py-2.5 text-green-600 font-semibold">
                      Buy
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      10,000
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      10,000
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  toast.success(
                    "Transaction inserted. Awaiting checker approval.",
                  );
                  setFlagSheetOpen(false);
                }}
              >
                Insert Missing Transaction &amp; Resolve
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => {
                  toast.error("Force commit logged for audit review.");
                  setFlagSheetOpen(false);
                }}
              >
                Override and Force Commit
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const SortIcon = ({
  sortCol,
  sortDir,
  col,
}: {
  sortCol: string;
  sortDir: "asc" | "desc";
  col: string;
}) => (
  <ChevronDown
    className={`inline h-3 w-3 ml-1 transition-transform ${sortCol === col && sortDir === "asc" ? "rotate-180" : ""} ${sortCol !== col ? "opacity-20" : ""}`}
  />
);

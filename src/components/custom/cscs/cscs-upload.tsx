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
import { toast } from "sonner";
import { NIGERIA_STATE_NAMES } from "@/lib/mocks/nigeria-geo";
import {
  useInjectCscsFile,
  useGetHolders,
  useUpdateHolderStates,
} from "@/hooks/useCscs";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useDebounce } from "@/hooks/useDebounce";
import { PaginationBar } from "../pagination-bar";
import { PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

const REGISTER_COLORS: Record<string, string> = {
  DANGCEM: "bg-blue-100 text-blue-800",
  ZENITHBANK: "bg-purple-100 text-purple-800",
  ACCESSCORP: "bg-amber-100 text-amber-800",
  GTCO: "bg-teal-100 text-teal-800",
};

interface CscsUploadProps {
  setActiveTab: (tab: string) => void;
}

export default function CscsUpload({ setActiveTab }: CscsUploadProps) {
  // ── Page stage state ───────────────────────────────────────────
  const [stage, setStage] = useState<"idle" | "processing" | "review">("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [zipFileName, setZipFileName] = useState<string | null>(null);

  // ── Local confirmation states ──────────────────────────────────
  const [confirmedStates, setConfirmedStates] = useState<
    Record<string, string>
  >({});

  // ── Review filters & pagination ───────────────────────────────
  const [registerFilter, setRegisterFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(search, 500);

  // ── Mutations and Queries ──────────────────────────────────────
  const { mutateAsync: injectFile } = useInjectCscsFile();
  const { mutateAsync: updateHolderStates, isPending: isCommitting } =
    useUpdateHolderStates();

  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  const getSearchParams = (searchStr: string) => {
    if (!searchStr) return {};
    const trimmed = searchStr.trim();
    if (trimmed.includes("@")) return { email: trimmed };
    if (
      /^[cC]\d+/.test(trimmed) ||
      (trimmed.length > 5 && !trimmed.includes(" "))
    ) {
      return { chn: trimmed };
    }
    return { name: trimmed };
  };

  const { data: holdersData, isLoading: isLoadingHolders } = useGetHolders(
    {
      registerId: registerFilter !== "All" ? registerFilter : undefined,
      page: currentPage,
      size: pageSize,
      ...getSearchParams(debouncedSearch),
    },
    {
      enabled: stage === "review",
    },
  );

  // ── Derived Data ───────────────────────────────────────────────
  const filteredHolders = useMemo(() => {
    if (!holdersData?.content) return [];
    return holdersData.content.filter((h) => {
      const isConfirmed = confirmedStates[h.id] !== undefined;
      if (statusFilter === "Confirmed") return isConfirmed;
      if (statusFilter === "Unconfirmed") return !isConfirmed;
      return true;
    });
  }, [holdersData, confirmedStates, statusFilter]);

  const totalConfirmed = useMemo(() => {
    if (!holdersData?.content) return 0;
    return holdersData.content.filter(
      (h) => confirmedStates[h.id] !== undefined,
    ).length;
  }, [holdersData, confirmedStates]);

  const totalUnconfirmed = useMemo(() => {
    if (!holdersData?.content) return 0;
    return holdersData.content.length - totalConfirmed;
  }, [holdersData, totalConfirmed]);

  // ── Actions ───────────────────────────────────────────────────
  const confirmState = (id: string, state: string) => {
    setConfirmedStates((prev) => ({
      ...prev,
      [id]: state,
    }));
  };

  const confirmAllVisible = () => {
    if (!holdersData?.content) return;
    const newConfirmed = { ...confirmedStates };
    holdersData.content.forEach((h) => {
      newConfirmed[h.id] = h.state || "Lagos";
    });
    setConfirmedStates(newConfirmed);
    toast.success("Accepted all visible GIS suggestions.");
  };

  const startProcessing = async (file: File) => {
    setZipFileName(file.name);
    setStage("processing");
    setProgress(20);
    setProgressLabel("Uploading ZIP file...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress(60);
      setProgressLabel("Ingesting and processing CSCS data...");

      await injectFile(formData);

      setProgress(100);
      setProgressLabel("Ready for review");

      toast.success("CSCS ZIP uploaded and ingested successfully!");
      setStage("review");
    } catch (err) {
      setStage("idle");
      const errorMessage = returnErrorMessage(err as ErrorLike);
      toast.error(errorMessage || "Failed to upload ZIP file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".zip")) startProcessing(file);
    else toast.error("Please drop a .zip file");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startProcessing(file);
  };

  const handleCommit = async () => {
    if (!holdersData?.content) return;

    const updates = holdersData.content.map((h) => ({
      id: h.id,
      state: confirmedStates[h.id] || h.state || "Lagos",
    }));

    try {
      await updateHolderStates({ updates });
      toast.success("Holder states successfully committed.");
      // Move to Processing Queue tab
      setActiveTab("queue");
    } catch (err) {
      const errorMessage = returnErrorMessage(err as ErrorLike);
      toast.error(errorMessage || "Failed to commit updates");
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(0);
  };

  return (
    <div>
      {/* IDLE */}
      {stage === "idle" && (
        <div className="space-y-6">
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
              className={`h-14 w-14 mb-5 transition-colors ${
                isDraggingOver ? "text-primary" : "text-muted-foreground/30"
              }`}
            />
            <p className="font-semibold text-base">
              Upload Master Data ZIP (All Registers)
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">
              Drag &amp; drop or click —{" "}
              <span className="font-mono text-[13px]">.zip</span> only
            </p>
            <p className="text-[13px] text-muted-foreground/50 mt-3">
              Contains master file + transaction file for all active registers
            </p>
          </label>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Anti-Ghost Seller Protocol Active</strong> — BUY
              transactions are processed before SELL within each
              shareholder&apos;s batch. Shortfall SELLs are flagged and routed
              to reconciliation.
            </p>
          </div>
        </div>
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
            <div className="flex justify-between text-[13px] text-muted-foreground">
              <span className="font-mono truncate max-w-65">{zipFileName}</span>
              <span>{progress}%</span>
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground">
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
                  {totalUnconfirmed} record{totalUnconfirmed !== 1 ? "s" : ""}
                </strong>{" "}
                need state confirmation for tax jurisdiction. GIS has pre-filled
                detected states — review and confirm or override each one.
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleCommit}
              disabled={isCommitting}
              className="shrink-0 ml-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Committing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Commit Updates
                </>
              )}
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
              onValueChange={(v) => {
                setRegisterFilter(v || "All");
                setCurrentPage(0);
              }}
            >
              <SelectTrigger className="w-44 mrpsl-input">
                <SelectValue placeholder="All Registers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Registers</SelectItem>
                {activeRegisters?.content?.map((r) => (
                  <SelectItem key={r.registerId} value={r.registerId}>
                    {r.registerName} · {r.symbol}
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
              <span className="text-[13px] text-muted-foreground">
                <span className="text-primary font-semibold">
                  {totalConfirmed}
                </span>{" "}
                / {holdersData?.content?.length || 0} confirmed
              </span>
              {filteredHolders.some(
                (h) => confirmedStates[h.id] === undefined,
              ) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-[13px]"
                  onClick={confirmAllVisible}
                >
                  Accept all GIS suggestions (visible)
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
                    <th className="px-4 py-3 min-w-55">GIS-DETECTED STATE</th>
                    <th className="px-4 py-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoadingHolders ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <PendingListSkeleton />
                      </td>
                    </tr>
                  ) : filteredHolders.length > 0 ? (
                    filteredHolders.map((h) => {
                      const confirmedState =
                        confirmedStates[h.id] !== undefined;
                      return (
                        <tr key={h.id} className="hover:bg-accent/5 align-top">
                          {/* Register */}
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {h.registers && h.registers.length > 0 ? (
                                h.registers.map((reg) => (
                                  <Badge
                                    key={reg.id}
                                    className={`border-0 text-[13px] ${
                                      REGISTER_COLORS[reg.symbol] ??
                                      "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {reg.symbol}
                                  </Badge>
                                ))
                              ) : (
                                <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">
                                  N/A
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* Holder details */}
                          <td className="px-4 py-4 text-[13px] space-y-0.5 min-w-45">
                            <div className="font-semibold text-sm text-foreground">
                              {h.name}
                            </div>
                            <div className="text-muted-foreground font-mono">
                              {h.chn}
                            </div>
                            {h.phone && (
                              <div className="text-muted-foreground">
                                {h.phone}
                              </div>
                            )}
                            {h.email && (
                              <div className="text-muted-foreground truncate max-w-45">
                                {h.email}
                              </div>
                            )}
                          </td>

                          {/* New address */}
                          <td className="px-4 py-4 text-[13px] text-muted-foreground leading-relaxed max-w-55">
                            {h.address || "No address provided"}
                          </td>

                          {/* State Jurisdiction Dropdown */}
                          <td className="px-4 py-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Select
                                  value={confirmedStates[h.id] ?? h.state ?? ""}
                                  onValueChange={(state) => {
                                    if (!state) return;
                                    confirmState(h.id, state);
                                    toast.success(
                                      `${h.name} state set to ${state}`,
                                    );
                                  }}
                                >
                                  <SelectTrigger
                                    className={`h-9 text-[13px] flex-1 min-w-0 ${
                                      !confirmedState
                                        ? "border-amber-300 bg-amber-50 text-amber-900"
                                        : "border-green-300 bg-green-50 text-green-900"
                                    }`}
                                  >
                                    <SelectValue placeholder="Select State" />
                                  </SelectTrigger>
                                  <SelectContent
                                    align="start"
                                    alignItemWithTrigger={false}
                                    className="max-h-60"
                                  >
                                    {NIGERIA_STATE_NAMES.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {!confirmedState ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-3 shrink-0 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                                    onClick={() => {
                                      confirmState(h.id, h.state || "Lagos");
                                      toast.success(
                                        `${h.name} state confirmed`,
                                      );
                                    }}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                )}
                              </div>
                              {confirmedState &&
                                h.state &&
                                confirmedStates[h.id] !== h.state && (
                                  <div className="text-[13px] text-muted-foreground">
                                    Original:{" "}
                                    <span className="font-medium">
                                      {h.state}
                                    </span>
                                  </div>
                                )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            {confirmedState ? (
                              <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                                Confirmed
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                                Pending
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
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

            {/* Pagination controls using PaginationBar */}
            {holdersData && (
              <PaginationBar
                page={currentPage}
                pageSize={pageSize}
                total={holdersData.totalElements || 0}
                totalPages={holdersData.totalPages || 0}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

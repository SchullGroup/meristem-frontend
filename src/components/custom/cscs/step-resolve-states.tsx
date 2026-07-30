"use client";

import { useState } from "react";
import { Check, CheckCircle, MapPin, Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { toast } from "sonner";
import { NIGERIA_STATE_NAMES } from "@/lib/mocks/nigeria-geo";
import {
  useCscsBatchHolders,
  useCscsBatchRegisters,
  useUpdateCscsHolderState,
  useAcceptCscsGisStates,
  useCommitCscsStates,
} from "@/hooks/useCscsPipeline";
import type { CscsHolderItem } from "@/actions/cscsPipelineActions";

type ViewFilter = "ALL" | "MISSING" | "CONFIRMED";

interface StepResolveStatesProps {
  batchRef: string;
  onComplete: () => void;
  initialRegister?: string;
  /** Once states have been committed to the live register, the screen is display-only. */
  readOnly?: boolean;
}

export function StepResolveStates({
  batchRef,
  onComplete,
  initialRegister,
  readOnly = false,
}: StepResolveStatesProps) {
  const [registerFilter, setRegisterFilter] = useState(initialRegister ?? "All");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { data: registersData } = useCscsBatchRegisters(batchRef);
  const registerOptions = registersData?.registers.map((r) => r.symbol) ?? [];

  const { data, isLoading, isError, error } = useCscsBatchHolders(batchRef, {
    register: registerFilter === "All" ? undefined : registerFilter,
    stateFilter: viewFilter,
    page,
    pageSize,
  });

  const holders = data?.data ?? [];
  const meta = data?.meta;
  const missingCount = meta?.missingCount ?? 0;
  const confirmedCount = meta?.confirmedCount ?? 0;
  const totalHolders = missingCount + confirmedCount;

  const updateState = useUpdateCscsHolderState();
  const acceptAllGis = useAcceptCscsGisStates();
  const commit = useCommitCscsStates();

  const setRowState = (h: CscsHolderItem, resolvedState: string, source: "GIS" | "MANUAL") => {
    updateState.mutate(
      { batchRef, chn: h.chn, payload: { register: h.register, resolvedState, source } },
      {
        onSuccess: () => toast.success(`${h.name} → ${resolvedState}`),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  const handleAcceptAllGis = () => {
    acceptAllGis.mutate(
      { batchRef },
      {
        onSuccess: (res) => toast.success(`${res.updatedCount} GIS suggestion${res.updatedCount !== 1 ? "s" : ""} accepted.`),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  const handleCommit = () => {
    commit.mutate(
      { batchRef },
      {
        onSuccess: (res) => {
          toast.success(`Shareholder records updated — ${res.committedCount} state${res.committedCount !== 1 ? "s" : ""} committed.`);
          onComplete();
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* Header counters + actions */}
      {readOnly ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-900">
          <Lock className="h-4 w-4 text-green-700 shrink-0" />
          <span>
            <strong>States committed.</strong> These resolved states have already been written to the
            shareholders&apos; records — this screen is now read-only.
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <strong>{missingCount} MISSING STATE{missingCount !== 1 ? "S" : ""}</strong>
              &nbsp;·&nbsp;
              <strong>{confirmedCount} CONFIRMED</strong>
              &nbsp;— Review GIS suggestions and confirm or override each row.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {missingCount > 0 && (
              <Button
                className="cursor-pointer"
                size="sm"
                variant="outline"
                onClick={handleAcceptAllGis}
                disabled={acceptAllGis.isPending}
              >
                {acceptAllGis.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Accept All GIS Suggestions
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleCommit}
              disabled={missingCount > 0 || commit.isPending}
              className="cursor-pointer"
              title={missingCount > 0 ? `${missingCount} unresolved state(s) remaining` : undefined}
            >
              {commit.isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              Update Shareholders Records
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center">
        <Select value={registerFilter} onValueChange={(v) => { setRegisterFilter(v ?? "All"); setPage(1); }}>
          <SelectTrigger className="w-44 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Registers</SelectItem>
            {registerOptions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          {[
            { label: "View All", value: "ALL" as const },
            { label: "View Missing States", value: "MISSING" as const },
            { label: "Confirmed", value: "CONFIRMED" as const },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => { setViewFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border cursor-pointer
                ${viewFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[13px] text-muted-foreground">
          <span className="text-primary font-semibold">{confirmedCount}</span> / {totalHolders} confirmed
        </span>
      </div>

      {/* Guidance */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <p className="font-semibold text-emerald-900 text-sm mb-0.5">Recommended Workflow for Large Batches</p>
        <p className="text-[13px] text-emerald-800">
          Click <strong>View Missing States</strong>, review GIS suggestions, then use{" "}
          <strong>Accept All GIS Suggestions</strong> before saving. State is mandatory for legal
          compliance — you cannot save while any UNKNOWN states remain.
        </p>
      </div>

      {/* Table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">NAME</th>
                <th className="px-4 py-3">CHN / ACCOUNT</th>
                <th className="px-4 py-3">ADDRESS (FROM CSCS)</th>
                <th className="px-4 py-3">ACTUAL STATE (FILE)</th>
                <th className="px-4 py-3 min-w-52">GIS SUGGESTION</th>
                <th className="px-4 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading holders…
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-red-600 text-sm">
                    {(error as Error)?.message ?? "Failed to load holders."}
                  </td>
                </tr>
              )}
              {!isLoading && !isError && holders.map((h) => {
                const isConfirmed = h.isConfirmed;
                const hasFileState = !!h.fileState;
                const resolved = h.resolvedState ?? "";

                return (
                  <tr key={`${h.register}-${h.chn}`} className="hover:bg-accent/5 align-top">
                    <td className="px-4 py-3.5">
                      <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">{h.register}</Badge>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-sm">{h.name}</td>
                    <td className="px-4 py-3.5 font-mono text-[13px] text-muted-foreground">{h.chn}</td>
                    <td className="px-4 py-3.5 text-[13px] text-muted-foreground max-w-52 leading-relaxed">{h.address ?? "—"}</td>
                    <td className="px-4 py-3.5 text-[13px]">
                      {hasFileState ? (
                        <span>{h.fileState}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">UNKNOWN</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={resolved}
                          disabled={readOnly}
                          onValueChange={(v) => { if (v) setRowState(h, v, "MANUAL"); }}
                        >
                          <SelectTrigger
                            className={`h-9 text-[13px] flex-1 min-w-0 ${
                              !isConfirmed
                                ? "border-amber-300 bg-amber-50 text-amber-900"
                                : "border-green-300 bg-green-50 text-green-900"
                            }`}
                          >
                            <SelectValue placeholder={h.gisState ? `${h.gisState} (GIS)` : "Select state…"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {NIGERIA_STATE_NAMES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {!readOnly && !isConfirmed && h.gisState && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 px-2.5 shrink-0 border-green-300 text-green-700 hover:bg-green-50 text-xs"
                            onClick={() => setRowState(h, h.gisState!, "GIS")}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Accept GIS
                          </Button>
                        )}
                        {isConfirmed && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                      </div>
                      {isConfirmed && h.gisState && h.resolvedState !== h.gisState && (
                        <p className="text-[12px] text-muted-foreground mt-1">
                          GIS suggested: <span className="font-medium">{h.gisState}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {isConfirmed ? (
                        <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">Confirmed</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">Pending</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !isError && holders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.total > 0 && (
          <PaginationBar
            page={page - 1}
            total={meta.total}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p + 1)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            pageBase={0}
          />
        )}
      </Card>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Check, CheckCircle, MapPin } from "lucide-react";
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
import { toast } from "sonner";
import { NIGERIA_STATE_NAMES } from "@/lib/mocks/nigeria-geo";

interface HolderRecord {
  id: string;
  register: string;
  chn: string;
  name: string;
  address: string;
  actualState: string; // from file — may be "UNKNOWN"
  gisState: string; // Google geocoded suggestion
}

const SEED_HOLDERS: HolderRecord[] = [
  {
    id: "1",
    register: "DANGCEM",
    chn: "C0012345AK",
    name: "JOHN ADEYEMI BABATUNDE",
    address: "14 Allen Avenue, Ikeja, Lagos Island",
    actualState: "Lagos",
    gisState: "Lagos",
  },
  {
    id: "2",
    register: "DANGCEM",
    chn: "C0023456BK",
    name: "NGOZI CHIDINMA OKAFOR",
    address: "45 Trans-Ekulu Road, Enugu North",
    actualState: "UNKNOWN",
    gisState: "Enugu",
  },
  {
    id: "3",
    register: "DANGCEM",
    chn: "C0033211DK",
    name: "TUNDE ABIODUN SALAMI",
    address: "9 Taiwo Street, Ilorin",
    actualState: "UNKNOWN",
    gisState: "Kwara",
  },
  {
    id: "4",
    register: "MTNN",
    chn: "C0034567CK",
    name: "SAMUEL OLUWASEUN ADELEKE",
    address: "23 Old Bodija Estate, Ibadan",
    actualState: "UNKNOWN",
    gisState: "Oyo",
  },
  {
    id: "5",
    register: "MTNN",
    chn: "C0045678DK",
    name: "FATIMA ABUBAKAR MUSA",
    address: "12 Ahmadu Bello Way, Kaduna South",
    actualState: "Kaduna",
    gisState: "Kaduna",
  },
  {
    id: "6",
    register: "MTNN",
    chn: "C0046789EK",
    name: "ADAEZE CHIBUIKE IROEGBU",
    address: "3 Aba Road, Port Harcourt",
    actualState: "UNKNOWN",
    gisState: "Rivers",
  },
  {
    id: "7",
    register: "SEPLAT",
    chn: "C0056789EK",
    name: "EMEKA CHUKWUEMEKA EZE",
    address: "8 Owerri Road, Owerri North",
    actualState: "UNKNOWN",
    gisState: "Imo",
  },
  {
    id: "8",
    register: "SEPLAT",
    chn: "C0067890FK",
    name: "AMAKA NGOZI OKONKWO",
    address: "5 Onitsha Road, Onitsha North",
    actualState: "Anambra",
    gisState: "Anambra",
  },
  {
    id: "9",
    register: "UBA",
    chn: "C0078901GK",
    name: "IBRAHIM USMAN HASSAN",
    address: "7 Zaria Road, Kano Municipal",
    actualState: "UNKNOWN",
    gisState: "Kano",
  },
  {
    id: "10",
    register: "UBA",
    chn: "C0089012HK",
    name: "BLESSING CHISOM NWOSU",
    address: "22 Airport Road, Port Harcourt",
    actualState: "Rivers",
    gisState: "Rivers",
  },
  {
    id: "11",
    register: "UBA",
    chn: "C0099123IK",
    name: "CHUKWUEMEKA OKAFOR",
    address: "14 Agbani Road, Enugu South",
    actualState: "UNKNOWN",
    gisState: "Enugu",
  },
  {
    id: "12",
    register: "UBA",
    chn: "C0109234JK",
    name: "YETUNDE ADEFOPE ADEYEMI",
    address: "6 Ring Road, Ibadan North",
    actualState: "UNKNOWN",
    gisState: "Oyo",
  },
];

const REGISTERS = Array.from(new Set(SEED_HOLDERS.map((h) => h.register)));

interface StepResolveStatesProps {
  batchRef: string;
  onComplete: () => void;
  initialRegister?: string;
}

export function StepResolveStates({
  batchRef: _batchRef,
  onComplete,
  initialRegister,
}: StepResolveStatesProps) {
  const [registerFilter, setRegisterFilter] = useState(
    initialRegister ?? "All",
  );
  const [viewFilter, setViewFilter] = useState("All");
  // confirmed states keyed by holder id
  const [confirmedStates, setConfirmedStates] = useState<
    Record<string, string>
  >({});
  const [gisAccepted, setGisAccepted] = useState(false);

  const resolvedForRow = (h: HolderRecord): string | null => {
    if (confirmedStates[h.id] !== undefined) return confirmedStates[h.id];
    if (h.actualState !== "UNKNOWN") return h.actualState;
    if (gisAccepted) return h.gisState;
    return null;
  };

  const missingCount = SEED_HOLDERS.filter(
    (h) => resolvedForRow(h) === null,
  ).length;

  const confirmedCount = SEED_HOLDERS.filter(
    (h) => resolvedForRow(h) !== null,
  ).length;

  const filtered = useMemo(() => {
    return SEED_HOLDERS.filter((h) => {
      if (registerFilter !== "All" && h.register !== registerFilter)
        return false;
      if (viewFilter === "Missing") return resolvedForRow(h) === null;
      if (viewFilter === "Confirmed") return resolvedForRow(h) !== null;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerFilter, viewFilter, confirmedStates, gisAccepted]);

  const acceptGis = (h: HolderRecord) => {
    setConfirmedStates((prev) => ({ ...prev, [h.id]: h.gisState }));
  };

  const acceptAllGis = () => {
    const next: Record<string, string> = {};
    SEED_HOLDERS.forEach((h) => {
      if (h.actualState === "UNKNOWN") next[h.id] = h.gisState;
    });
    setConfirmedStates((prev) => ({ ...prev, ...next }));
    setGisAccepted(true);
    toast.success("All GIS suggestions accepted.");
  };

  const revertGis = () => {
    setGisAccepted(false);
    const next = { ...confirmedStates };
    SEED_HOLDERS.forEach((h) => {
      if (next[h.id] === h.gisState && h.actualState === "UNKNOWN")
        delete next[h.id];
    });
    setConfirmedStates(next);
    toast.info("GIS suggestions reverted.");
  };

  const handleCommit = () => {
    if (missingCount > 0) {
      toast.error(
        `YOU STILL HAVE ${missingCount} UNKNOWN STATE${missingCount !== 1 ? "S" : ""}. Resolve all before saving.`,
      );
      return;
    }
    toast.success(
      `Shareholder records updated — ${SEED_HOLDERS.length} rows committed.`,
    );
    onComplete();
  };

  return (
    <div className="space-y-4">
      {/* Header counters + actions */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-blue-900">
          <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            <strong>
              {missingCount} MISSING STATE{missingCount !== 1 ? "S" : ""}
            </strong>
            &nbsp;·&nbsp;
            <strong>
              {SEED_HOLDERS.filter((h) => h.actualState === "UNKNOWN").length}{" "}
              GIS SUGGESTED STATES
            </strong>
            &nbsp;— Review GIS suggestions and confirm or override each row.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {missingCount > 0 && (
            <Button
              className="cursor-pointer"
              size="sm"
              variant="outline"
              onClick={acceptAllGis}
            >
              Accept All GIS Suggestions
            </Button>
          )}
          {gisAccepted && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground cursor-pointer"
              onClick={revertGis}
            >
              Revert GIS Suggestions
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleCommit}
            disabled={missingCount > 0}
            className="cursor-pointer"
            title={
              missingCount > 0
                ? `${missingCount} unresolved state(s) remaining`
                : undefined
            }
          >
            <Check className="h-4 w-4 mr-1.5" />
            Update Shareholders Records
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center">
        <Select
          value={registerFilter}
          onValueChange={(v) => setRegisterFilter(v ?? "All")}
        >
          <SelectTrigger className="w-44 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Registers</SelectItem>
            {REGISTERS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          {[
            { label: "View All", value: "All" },
            { label: "View Missing States", value: "Missing" },
            { label: "Confirmed", value: "Confirmed" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setViewFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border cursor-pointer
                ${
                  viewFilter === f.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[13px] text-muted-foreground">
          <span className="text-primary font-semibold">{confirmedCount}</span> /{" "}
          {SEED_HOLDERS.length} confirmed
        </span>
      </div>

      {/* Guidance */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <p className="font-semibold text-emerald-900 text-sm mb-0.5">
          Recommended Workflow for Large Batches
        </p>
        <p className="text-[13px] text-emerald-800">
          Click <strong>View Missing States</strong>, review GIS suggestions,
          then use <strong>Accept All GIS Suggestions</strong> before saving.
          State is mandatory for legal compliance — you cannot save while any
          UNKNOWN states remain.
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
              {filtered.map((h) => {
                const resolved = resolvedForRow(h);
                const isConfirmed = resolved !== null;
                const isUnknown = h.actualState === "UNKNOWN";

                return (
                  <tr key={h.id} className="hover:bg-accent/5 align-top">
                    <td className="px-4 py-3.5">
                      <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">
                        {h.register}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-sm">
                      {h.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[13px] text-muted-foreground">
                      {h.chn}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-muted-foreground max-w-52 leading-relaxed">
                      {h.address}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]">
                      {isUnknown ? (
                        <span className="text-amber-600 font-semibold">
                          UNKNOWN
                        </span>
                      ) : (
                        <span>{h.actualState}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={resolved ?? ""}
                          onValueChange={(v) => {
                            if (!v) return;
                            setConfirmedStates((prev) => ({
                              ...prev,
                              [h.id]: v,
                            }));
                            toast.success(`${h.name} → ${v}`);
                          }}
                        >
                          <SelectTrigger
                            className={`h-9 text-[13px] flex-1 min-w-0 ${
                              !isConfirmed
                                ? "border-amber-300 bg-amber-50 text-amber-900"
                                : "border-green-300 bg-green-50 text-green-900"
                            }`}
                          >
                            <SelectValue
                              placeholder={
                                isUnknown
                                  ? h.gisState + " (GIS)"
                                  : h.actualState
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {NIGERIA_STATE_NAMES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {isUnknown && !isConfirmed && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 px-2.5 shrink-0 border-green-300 text-green-700 hover:bg-green-50 text-xs"
                            onClick={() => {
                              acceptGis(h);
                              toast.success(`${h.name} → ${h.gisState} (GIS)`);
                            }}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Accept GIS
                          </Button>
                        )}
                        {isConfirmed && (
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        )}
                      </div>
                      {isConfirmed &&
                        isUnknown &&
                        confirmedStates[h.id] !== h.gisState && (
                          <p className="text-[12px] text-muted-foreground mt-1">
                            GIS suggested:{" "}
                            <span className="font-medium">{h.gisState}</span>
                          </p>
                        )}
                    </td>
                    <td className="px-4 py-3.5">
                      {isConfirmed ? (
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
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground text-sm"
                  >
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

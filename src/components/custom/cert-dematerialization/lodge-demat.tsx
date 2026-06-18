"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Demat } from "@/actions/certDematActions";
import {
  useGetAllCertificateDemat,
  useLodgetDematRequest,
} from "@/hooks/useCertDematerialisation";
import {
  PendingListSkeleton,
  DataErrorState,
} from "@/components/custom/ipo/loaders";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationBar } from "../pagination-bar";

export default function LodgeDemat({ tab }: { tab: string }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rinType, setRinType] = useState<"RIN_AT_CSCS" | "RIN_NOT_AT_CSCS">(
    "RIN_AT_CSCS",
  );

  const { data, isLoading, isError, refetch } = useGetAllCertificateDemat(
    {
      status: "ICU_APPROVED",
      page: page,
      size: pageSize,
    },
    {
      enabled: tab === "lodgment",
    },
  );

  const { mutate: lodgetDemat, isPending: lodgetPending } =
    useLodgetDematRequest();

  if (isLoading) return <PendingListSkeleton />;

  const records = data?.content || [];

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll(ids: string[]) {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }

  const visibleIds = records.map((r) => r.id);

  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  function downloadTextFile(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const buildDematText = (record: Demat) => {
    const certificateLines = record.certificates
      ?.map(
        (certificate) =>
          `  • ${certificate.certNo} | Units: ${certificate.units.toLocaleString()} | Date: ${certificate.certDate}`,
      )
      .join("\n");

    return [
      "DEMATERIALIZATION LODGMENT RECORD",
      `ID: ${record.id}`,
      `Date: ${formatDate(record.icuApprovedAt)}`,
      `Holder: ${record.holderName}`,
      `CHN: ${record.chn}`,
      `Broker: ${record.broker}`,
      `Total Units: ${record.totalUnits?.toLocaleString() ?? 0}`,
      `RIN Status: ${record.rinStatus ?? rinType}`,
      `Lodgment Method: ${record.lodgmentMethod ?? "DOWNLOAD"}`,
      "Certificates:",
      certificateLines || "  - None",
    ].join("\n");
  };

  const handleRowDownload = (row: Demat) => {
    const filename = `demat_${row.id}.txt`;
    downloadTextFile(filename, buildDematText(row));
    toast.success(`${row.chn || row.holderName} downloaded as text file.`);
  };

  const handleBatchPush = (ids: string[]) => {
    ids.forEach((id) => {
      lodgetDemat(
        {
          id,
          data: {
            rinStatus: rinType,
            method: "PUSH",
          },
        },
        {
          onSuccess: () => {
            toast.success("Record pushed to CSCS.");
            setSelectedIds(new Set());
          },
          onError: (err) => toast.error(`Failed: ${err.message}`),
        },
      );
    });
  };

  const handleBatchDownload = (ids: string[]) => {
    const selectedRecords = records.filter((record) => ids.includes(record.id));

    if (selectedRecords.length === 0) {
      toast.error("No records selected for download.");
      return;
    }

    const fileName =
      selectedRecords.length === 1
        ? `demat_${selectedRecords[0].chn}.txt`
        : `demat_selected_${new Date().toISOString().slice(0, 10)}.txt`;

    const content = selectedRecords
      .map(buildDematText)
      .join("\n\n------------------------------\n\n");

    downloadTextFile(fileName, content);
    toast.success(
      `${selectedRecords.length} record(s) downloaded as text file.`,
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        ICU-approved records ready to be lodged at CSCS via text file download
        or direct API push.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-muted-foreground mr-1">
          Lodgment Format:
        </span>
        <RadioGroup
          value={rinType}
          onValueChange={(v) =>
            setRinType(v as "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS")
          }
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="RIN_AT_CSCS" id="rin-yes" />
            <label htmlFor="rin-yes" className="text-sm cursor-pointer">
              RIN at CSCS
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="RIN_NOT_AT_CSCS" id="rin-no" />
            <label htmlFor="rin-no" className="text-sm cursor-pointer">
              RIN NOT at CSCS
            </label>
          </div>
        </RadioGroup>
      </div>

      {isError ? (
        <DataErrorState
          message="Failed to load ICU-approved records."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-3">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-sm font-semibold text-primary">
                {selectedIds.size} selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/5"
                  onClick={() => handleBatchDownload([...selectedIds])}
                >
                  Download (.txt)
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBatchPush([...selectedIds])}
                >
                  Push to CSCS
                </Button>
              </div>
            </div>
          )}
          <Card className="mrpsl-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleSelectAll(visibleIds)}
                    />
                  </th>
                  <th className="p-3">DATE</th>
                  <th className="p-3">CERT NO(S)</th>
                  <th className="p-3">HOLDER</th>
                  <th className="p-3">CHN</th>
                  <th className="p-3">BROKER</th>
                  <th className="p-3">UNITS</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {records.map((row) => (
                  <tr key={row.id} className="mrpsl-table-row">
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={() => toggleSelect(row.id)}
                      />
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(row?.icuApprovedAt)}
                    </td>
                    <td
                      className="p-3 font-mono truncate max-w-40"
                      title={row.certificates?.map((c) => c.certNo).join(", ")}
                    >
                      {row.certificates?.map((c) => c.certNo).join(", ") || "-"}
                    </td>
                    <td className="p-3 font-medium">{row.holderName}</td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {row.chn}
                    </td>
                    <td className="p-3">{row.broker}</td>
                    <td className="p-3 text-right tabular-nums font-semibold">
                      {row.totalUnits?.toLocaleString() || 0}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[12px] gap-1"
                          onClick={() => handleRowDownload(row)}
                        >
                          <FileText className="h-3 w-3" /> Download
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-[12px] gap-1"
                          onClick={() => {
                            handleBatchPush([row.id]);
                          }}
                        >
                          <UploadCloud className="h-3 w-3" /> Push
                          {lodgetPending && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-12 text-center text-muted-foreground"
                    >
                      No records at this stage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={data?.totalElements || 0}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  );
}

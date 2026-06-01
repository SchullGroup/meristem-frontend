"use client";

import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Mail,
  CloudUpload,
  Download,
  Printer,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RightsIssue, AllotmentStatus } from "@/types/rights";
import { PaginationBar } from "../pagination-bar";
import {
  StickyLabelModal,
  EmailPreviewModal,
} from "@/components/custom/shareholder-outreach-modals";
import { format } from "date-fns";
import { toast } from "sonner";
import { useGetAllotment, useGetStickyLabels } from "@/hooks/useRights";
import { exportAllotmentExcel } from "@/actions/rightsActions";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

interface AllotmentDetailsViewProps {
  allotReviewing: RightsIssue;
}

export function AllotmentDetailsView({
  allotReviewing,
}: AllotmentDetailsViewProps) {
  // Page size & local paging/tab states
  const [pageSize, setPageSize] = useState(10);
  const [allotTab, setAllotTab] = useState<
    "approved" | "disapproved" | "invalid"
  >("approved");
  const [allotPage, setAllotPage] = useState(0);

  // Outreach modal visibility state
  const [stickyLabelOpen, setStickyLabelOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  // Allotment Data for the selected batch and tab
  const { data: allotmentData, isLoading: allotmentLoading } = useGetAllotment(
    {
      id: allotReviewing.id,
      status: allotTab.toUpperCase() as AllotmentStatus,
      page: allotPage,
      pageSize: pageSize,
    },
    {
      enabled: !!allotReviewing.id && allotReviewing?.id.length > 0,
    },
  );

  // Page state for Outreach sticky label pagination
  const [outreachPage, setOutreachPage] = useState(1);
  const outreachPageSize = 24; // 24 labels per page!

  // Shareholders outreach profile
  const { data: outreachShareholders, isLoading: shareholdersLoading } =
    useGetStickyLabels(
      {
        id: allotReviewing.id,
        page: outreachPage,
        pageSize: outreachPageSize,
      },
      {
        enabled: stickyLabelOpen || emailPreviewOpen,
      },
    );

  const modalShareholders = useMemo(() => {
    if (!outreachShareholders?.content) return [];

    return outreachShareholders.content.map((s) => {
      const parts = s.shareholderName
        ? s.shareholderName.trim().split(/\s+/)
        : [""];
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      return {
        id: s?.shareholderId,
        accountNumber: s?.accountNumber,
        firstName,
        lastName,
        address: s?.address || "No address on record",
        // state: s?.state || "---",
        state: "---",
        holdings: 0,
      };
    });
  }, [outreachShareholders]);

  // show the total based on the tab selected
  const totalAllotCount = useMemo(() => {
    if (allotTab === "approved")
      return allotmentData?.stats?.totalAllotted ?? 0;
    if (allotTab === "disapproved")
      return allotmentData?.stats?.totalDisapproved ?? 0;
    return allotmentData?.stats?.totalInvalid ?? 0;
  }, [allotTab, allotmentData?.stats]);

  const handleDownloadAllotment = async () => {
    if (!allotmentData?.content || allotmentData?.content?.length === 0) {
      toast.error("No allotment data available to download.");
      return;
    }

    try {
      const type = allotTab.toUpperCase() as AllotmentStatus;
      const data = await exportAllotmentExcel(allotReviewing.id, type);
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${allotReviewing.offerName}_${allotTab.toLowerCase()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export successful");
    } catch (error) {
      const errorMessge = new Error(returnErrorMessage(error as ErrorLike));
      toast.error(errorMessge?.message || "Failed to export data");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          {
            label: "Total Processed",
            value: (
              (allotmentData?.stats?.totalAllotted ?? 0) +
              (allotmentData?.stats?.totalDisapproved ?? 0) +
              (allotmentData?.stats?.totalInvalid ?? 0)
            ).toLocaleString(),
            color: "text-foreground",
          },
          {
            label: "Approved (Certificates)",
            value: (allotmentData?.stats?.totalAllotted ?? 0).toLocaleString(),
            color: "text-green-700",
            tab: "approved" as const,
          },
          {
            label: "Disapproved (Return)",
            value: (
              allotmentData?.stats?.totalDisapproved ?? 0
            ).toLocaleString(),
            color: "text-amber-600",
            tab: "disapproved" as const,
          },
          {
            label: "Invalid (Return)",
            value: (allotmentData?.stats?.totalInvalid ?? 0).toLocaleString(),
            color: "text-red-600",
            tab: "invalid" as const,
          },
          {
            label: "Total Return Amount",
            value: `₦${(allotmentData?.stats?.totalReturnAmount ?? 0).toLocaleString()}`,
            color: "text-foreground",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className={cn(
              "mrpsl-card p-3",
              "tab" in s &&
              s.tab &&
              "cursor-pointer hover:border-primary/40 transition-colors",
            )}
            onClick={() => "tab" in s && s.tab && setAllotTab(s.tab)}
          >
            <div className="mrpsl-section-title">{s.label}</div>
            <div className={cn("text-xl font-mono font-bold mt-1", s.color)}>
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mrpsl-card overflow-hidden">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 border-b px-4 bg-muted/10">
          {(["approved", "disapproved", "invalid"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setAllotTab(t);
                setAllotPage(1);
              }}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
                allotTab === t
                  ? t === "approved"
                    ? "border-green-600 text-green-700"
                    : t === "disapproved"
                      ? "border-amber-500 text-amber-700"
                      : "border-red-500 text-red-700"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "approved"
                ? `Approved (${allotmentData?.stats?.totalAllotted ?? 0})`
                : t === "disapproved"
                  ? `Disapproved (${allotmentData?.stats?.totalDisapproved ?? 0})`
                  : `Invalid (${allotmentData?.stats?.totalInvalid ?? 0})`}
            </button>
          ))}
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="my-1.5 mr-1"
            onClick={handleDownloadAllotment}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </div>

        {/* Dynamic Tables */}
        <div className="overflow-x-auto">
          {allotmentLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground mt-2">
                Loading allotment data...
              </span>
            </div>
          ) : (
            <>
              {allotTab === "approved" && (
                <table className="w-full text-left text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">SHAREHOLDER NAME</th>
                      <th className="px-4 py-2.5">CHN</th>
                      <th className="px-4 py-2.5">STOCKBROKER CODE</th>
                      <th className="px-4 py-2.5 text-right">UNITS HELD</th>
                      <th className="px-4 py-2.5 text-right">RIGHTS DUE</th>
                      <th className="px-4 py-2.5 text-right">
                        ADDITIONAL CERTIFICATE
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(allotmentData?.content || []).map((r, i) => (
                      <tr key={i} className="mrpsl-table-row">
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2.5 font-medium">
                          {r?.shareholderName}
                        </td>
                        <td className="px-4 py-2.5 font-mono">{r?.chn}</td>
                        <td className="px-4 py-2.5 font-mono">
                          {r?.stockbrokerCode}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {r?.unitsHeld?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-blue-600">
                          {r?.rightsDue?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">
                          {r?.additionalCertificate || "N/A"}
                        </td>
                      </tr>
                    ))}
                    {allotmentData?.content?.length === 0 && (
                      <tr className="mrpsl-table-row">
                        <td colSpan={5} className="px-4 py-2.5 text-center">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {allotTab === "disapproved" && (
                <table className="w-full text-left text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">NAME</th>
                      <th className="px-4 py-2.5">CHN</th>
                      <th className="px-4 py-2.5">BANK</th>
                      <th className="px-4 py-2.5">ACCOUNT NO</th>
                      <th className="px-4 py-2.5 text-right">
                        AMOUNT TO RETURN (₦)
                      </th>
                      <th className="px-4 py-2.5">REASON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {allotmentData?.content?.map((r, i) => (
                      <tr key={i} className="mrpsl-table-row">
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2.5 font-medium">
                          {r?.shareholderName}
                        </td>
                        <td className="px-4 py-2.5 font-mono">{r?.chn}</td>
                        <td className="px-4 py-2.5">{r?.bankName || "N/A"}</td>
                        <td className="px-4 py-2.5 font-mono">
                          {r?.accountNo || "N/A"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-amber-700">
                          {r?.amountToReturn?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-2.5">{r?.reason || "N/A"}</td>
                      </tr>
                    ))}
                    {(allotmentData?.content || [])?.length === 0 && (
                      <tr className="mrpsl-table-row">
                        <td colSpan={5} className="px-4 py-2.5 text-center">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {allotTab === "invalid" && (
                <table className="w-full text-left text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">NAME</th>
                      <th className="px-4 py-2.5">CHN</th>
                      <th className="px-4 py-2.5 text-right">
                        AMOUNT TO RETURN (₦)
                      </th>
                      <th className="px-4 py-2.5">REASON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(allotmentData?.content || []).map((r, i) => (
                      <tr key={i} className="mrpsl-table-row">
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2.5 font-medium">
                          {r?.shareholderName}
                        </td>
                        <td className="px-4 py-2.5 font-mono">{r?.chn}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-700">
                          {r?.amountToReturn?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-2.5">{r?.reason || "N/A"}</td>
                      </tr>
                    ))}
                    {allotmentData?.content?.length === 0 && (
                      <tr className="mrpsl-table-row">
                        <td colSpan={5} className="px-4 py-2.5 text-center">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        <PaginationBar
          page={allotPage}
          total={totalAllotCount}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onPageChange={setAllotPage}
        />
      </Card>

      <div className="flex flex-wrap gap-3 pt-2 border-t">
        <Button variant="outline" onClick={handleDownloadAllotment}>
          <Download className="mr-2 h-4 w-4" /> Download Excel
        </Button>
        <Button variant="outline" onClick={() => setStickyLabelOpen(true)}>
          <Printer className="mr-2 h-4 w-4" /> Print Sticky Labels
        </Button>
        <Button variant="outline" onClick={() => setEmailPreviewOpen(true)}>
          <Mail className="mr-2 h-4 w-4" /> Email Shareholders
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Allotment data pushed to CSCS API.")}
        >
          <CloudUpload className="mr-2 h-4 w-4" /> Push via CSCS API
        </Button>
      </div>

      <StickyLabelModal
        open={stickyLabelOpen}
        onOpenChange={setStickyLabelOpen}
        offerType="rights"
        companyName={
          allotReviewing.registerName ||
          "Neimeth International Pharmaceuticals Plc"
        }
        shareholders={modalShareholders}
        totalCount={outreachShareholders?.pagination?.total || 0}
        currentPage={outreachPage}
        onPageChange={(page) => setOutreachPage(page)}
        loading={shareholdersLoading}
      />

      <EmailPreviewModal
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        offerType="rights"
        companyName={
          allotReviewing.registerName ||
          "Neimeth International Pharmaceuticals Plc"
        }
        issueId={allotReviewing?.id}
        offerName={allotReviewing.offerName || "Rights Issue"}
        ratio={allotReviewing.ratio || "1 : 7"}
        closeDate={
          allotReviewing.closureDate
            ? format(new Date(allotReviewing.closureDate), "dd MMM yyyy")
            : "25 May 2026"
        }
        issuePrice={
          allotReviewing.issuePrice
            ? allotReviewing.issuePrice.toFixed(2)
            : "4.00"
        }
        contactEmail="registrars@meristemng.com"
        shareholders={modalShareholders}
        totalCount={outreachShareholders?.pagination?.total || 0}
      />
    </div>
  );
}

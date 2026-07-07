import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useDownloadBulkMarkoffTemplate,
  useSubmitBulkWarrantMarkoff,
  useUploadBulkMarkoffFile,
} from "@/hooks/useWarrantMarkoff";

export default function UploadMarkoff() {
  const currentUser = useStore((state) => state.currentUser);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkParsed, setBulkParsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // States for response data
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [unmatchedCount, setUnmatchedCount] = useState(0);

  // Hooks
  const downloadTemplateMutation = useDownloadBulkMarkoffTemplate();
  const uploadFileMutation = useUploadBulkMarkoffFile();
  const submitMarkoffMutation = useSubmitBulkWarrantMarkoff();

  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate(undefined, {
      onSuccess: (response) => {
        const fileContent = typeof response === "string" ? response : (response as any)?.data;
        if (!fileContent) {
          toast.error("Template is empty");
          return;
        }

        let blob: Blob;
        if (fileContent.startsWith("data:")) {
          const a = document.createElement("a");
          a.href = fileContent;
          a.download = "warrant_markoff_template.csv";
          a.click();
          return;
        } else {
          blob = new Blob([fileContent], { type: "text/csv;charset=utf-8;" });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "warrant_markoff_template.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Template downloaded successfully");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to download template");
      },
    });
  };

  const processFile = (file: File) => {
    setBulkFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    uploadFileMutation.mutate(formData, {
      onSuccess: (res) => {
        const data = res.data;
        if (data) {
          setPreviewRows(data.rows || []);
          setMatchedCount(data.matched || 0);
          setUnmatchedCount(data.unmatched || 0);
          setBulkParsed(true);
          toast.success("File parsed successfully");
        }
      },
      onError: (err) => {
        toast.error(err.message || "Failed to parse file");
        setBulkFileName("");
        setBulkParsed(false);
        setPreviewRows([]);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = "";
  };

  const handleBulkSubmit = () => {
    const matchedRows = previewRows.filter(
      (r) =>
        r.status?.toUpperCase() === "MATCHED" ||
        r.status?.toUpperCase() === "SUCCESS"
    );

    if (matchedRows.length === 0) {
      toast.error("No matched records to submit");
      return;
    }

    const payload = {
      rows: matchedRows.map((r) => ({
        register: r.register,
        dividendNumber: r.dividendNumber,
        accountNumber: r.accountNumber,
      })),
      submittedBy: currentUser?.email || "system",
      reason: `Bulk warrant mark-off upload: ${bulkFileName}`,
    };

    submitMarkoffMutation.mutate(payload as any, {
      onSuccess: (res) => {
        toast.success(
          `Successfully submitted ${res.data?.submitted || matchedRows.length} records for approval.`
        );
        // Clear state
        setBulkFileName("");
        setBulkParsed(false);
        setPreviewRows([]);
        setMatchedCount(0);
        setUnmatchedCount(0);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to submit records");
      },
    });
  };

  const isRowMatched = (row: any) => {
    return (
      row.status?.toUpperCase() === "MATCHED" ||
      row.status?.toUpperCase() === "SUCCESS" ||
      row.matched === true
    );
  };

  return (
    <div>
      <TabsContent value="upload" className="space-y-5">
        {/* Template download + file upload */}
        <Card className="mrpsl-card p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">Upload Mark-Off File</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Upload a CSV or Excel file with three columns:{" "}
                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                  register_id
                </span>
                ,{" "}
                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                  dividend_number
                </span>
                ,{" "}
                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                  shareholder_account_number
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              disabled={downloadTemplateMutation.isPending}
              onClick={handleDownloadTemplate}
            >
              {downloadTemplateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download Template
            </Button>
          </div>

          <label
            className={cn(
              "flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl py-10 cursor-pointer hover:bg-muted/30 transition-colors",
              isDragging && "border-primary bg-primary/5 text-primary"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) {
                const ext = file.name.split(".").pop()?.toLowerCase();
                if (ext !== "csv" && ext !== "xlsx") {
                  toast.error("Please upload a CSV or Excel (.xlsx) file");
                  return;
                }
                processFile(file);
              }
            }}
          >
            {uploadFileMutation.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Parsing file...</p>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground opacity-40" />
                {bulkFileName ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {bulkFileName}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                      Click to replace
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Click to upload or drag &amp; drop
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                      .xlsx or .csv files only
                    </p>
                  </div>
                )}
              </>
            )}
            <input
              type="file"
              accept=".xlsx,.csv"
              className="sr-only"
              disabled={uploadFileMutation.isPending}
              onChange={handleFileChange}
            />
          </label>
        </Card>

        {/* Preview table */}
        {bulkParsed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Upload Preview</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {matchedCount} matched · {unmatchedCount} unmatched
                </p>
              </div>
              {unmatchedCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Unmatched rows will be skipped
                </div>
              )}
            </div>

            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">REGISTER</th>
                    <th className="p-3">DIVIDEND</th>
                    <th className="p-3">ACCOUNT NO</th>
                    <th className="p-3">HOLDER NAME</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {previewRows.map((row, i) => {
                    const matched = isRowMatched(row);
                    return (
                      <tr
                        key={i}
                        className={`mrpsl-table-row ${matched ? "" : "bg-red-50/40"}`}
                      >
                        <td className="p-3 font-mono">{row.register}</td>
                        <td className="p-3 text-muted-foreground">
                          {row.dividendNumber}
                        </td>
                        <td className="p-3 font-mono">{row.accountNumber}</td>
                        <td className="p-3 font-medium">{row.holderName || "—"}</td>
                        <td className="p-3">
                          {matched ? (
                            <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Matched
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-red-600 font-medium" title={row.reason}>
                              <AlertCircle className="h-3.5 w-3.5" /> No match
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            <Button
              className="w-full"
              disabled={matchedCount === 0 || submitMarkoffMutation.isPending}
              onClick={handleBulkSubmit}
            >
              {submitMarkoffMutation.isPending ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </span>
              ) : (
                `Submit ${matchedCount} Records for Approval`
              )}
            </Button>
          </div>
        )}
      </TabsContent>
    </div>
  );
}

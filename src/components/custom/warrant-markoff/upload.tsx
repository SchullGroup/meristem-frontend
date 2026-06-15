import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const BULK_PREVIEW_ROWS = [
  {
    register: "DANGCEM",
    dividend: "DIV-2025-001",
    account: "DANGCEM-10029",
    holder: "Adaeze Okonkwo",
    matched: true,
  },
  {
    register: "DANGCEM",
    dividend: "DIV-2025-001",
    account: "DANGCEM-10045",
    holder: "Lukman Bello",
    matched: true,
  },
  {
    register: "ZENITH",
    dividend: "DIV-2025-001",
    account: "ZENITH-9921",
    holder: "Fatima Abdullahi",
    matched: true,
  },
  {
    register: "DANGCEM",
    dividend: "DIV-2025-002",
    account: "DANGCEM-99999",
    holder: "—",
    matched: false,
  },
];

export default function UploadMarkoff() {
  const { currentUser, addApprovalItem } = useStore();
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkParsed, setBulkParsed] = useState(false);

  function downloadBulkTemplate() {
    const csv = [
      "register_id,dividend_number,shareholder_account_number",
      "DANGCEM,DIV-2025-001,DANGCEM-10029",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "markoff_upload_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleBulkSubmit() {
    const matched = BULK_PREVIEW_ROWS.filter((r) => r.matched).length;
    const seq = Math.floor(1000 + Math.random() * 9000);
    addApprovalItem({
      id: `APPR-BULK-MARKOFF-${seq}`,
      module: "DIVIDENDS",
      transactionType: "Bulk Mark-Off",
      description: `Bulk mark-off upload — ${bulkFileName} · ${matched} matched records`,
      tier: 1,
      entityId: `BULK-MO-${seq}`,
      initiatorId: currentUser?.id ?? "USR-0001",
      initiatorName: currentUser
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : "System",
      submittedAt: new Date().toISOString(),
      status: "PENDING",
      approvalSteps: [],
      payload: { file: bulkFileName, matchedRows: matched },
    });
    toast.success(`${matched} mark-off records submitted to approvals queue.`);
    setBulkFileName("");
    setBulkParsed(false);
  }

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
              onClick={downloadBulkTemplate}
            >
              <Download className="h-4 w-4" /> Download Template
            </Button>
          </div>

          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl py-10 cursor-pointer hover:bg-muted/30 transition-colors">
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
            <input
              type="file"
              accept=".xlsx,.csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setBulkFileName(file.name);
                  setBulkParsed(true);
                }
                e.target.value = "";
              }}
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
                  {BULK_PREVIEW_ROWS.filter((r) => r.matched).length} matched ·{" "}
                  {BULK_PREVIEW_ROWS.filter((r) => !r.matched).length} unmatched
                </p>
              </div>
              {BULK_PREVIEW_ROWS.some((r) => !r.matched) && (
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
                  {BULK_PREVIEW_ROWS.map((row, i) => (
                    <tr
                      key={i}
                      className={`mrpsl-table-row ${row.matched ? "" : "bg-red-50/40"}`}
                    >
                      <td className="p-3 font-mono">{row.register}</td>
                      <td className="p-3 text-muted-foreground">
                        {row.dividend}
                      </td>
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3">
                        {row.matched ? (
                          <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                            <AlertCircle className="h-3.5 w-3.5" /> No match
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Button
              className="w-full"
              disabled={BULK_PREVIEW_ROWS.filter((r) => r.matched).length === 0}
              onClick={handleBulkSubmit}
            >
              Submit {BULK_PREVIEW_ROWS.filter((r) => r.matched).length} Records
              for Approval
            </Button>
          </div>
        )}
      </TabsContent>
    </div>
  );
}

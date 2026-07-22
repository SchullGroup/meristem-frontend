"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Upload,
  Download,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PaginationBar } from "../pagination-bar";

interface MockLodgmentBatch {
  batchReference: string;
  register: string;
  batchDate: string;
  approvedCount: number;
  totalAmount: number;
  icuApprovedBy: string;
  icuApprovedAt: string;
  status: "ICU_APPROVED" | "LODGED";
}

interface MockLodgmentRow {
  stockbrokerCode: string;
  chn: string;
  subscriberName: string;
  certNo: string;
  cscsAccountNo: string;
  symbol: string;
  units: number;
}

const MOCK_BATCHES: MockLodgmentBatch[] = [
  {
    batchReference: "BATCH-ACH-2024-004",
    register: "Access Holdings Ord. Shares",
    batchDate: "2024-09-25",
    approvedCount: 22000,
    totalAmount: 590_000_000,
    icuApprovedBy: "icu.officer@meristem.com",
    icuApprovedAt: "2024-09-28T11:00:00",
    status: "ICU_APPROVED",
  },
  {
    batchReference: "BATCH-TCP-2024-003",
    register: "Transcorp Power Ord. Shares",
    batchDate: "2024-09-28",
    approvedCount: 18500,
    totalAmount: 420_000_000,
    icuApprovedBy: "icu.officer@meristem.com",
    icuApprovedAt: "2024-09-29T09:30:00",
    status: "LODGED",
  },
];

const MOCK_LODGMENT_ROWS: MockLodgmentRow[] = [
  { stockbrokerCode: "SB-001", chn: "C0012345678", subscriberName: "Adebayo Oluwaseun Peters", certNo: "CERT-00123", cscsAccountNo: "CSC-012345678", symbol: "ACCESSCORP", units: 10_000 },
  { stockbrokerCode: "SB-002", chn: "C0023456789", subscriberName: "Chinwe Okafor-Nwosu", certNo: "CERT-00124", cscsAccountNo: "CSC-023456789", symbol: "ACCESSCORP", units: 5_000 },
  { stockbrokerCode: "SB-001", chn: "C0034567890", subscriberName: "Emeka Nwachukwu", certNo: "CERT-00125", cscsAccountNo: "CSC-034567890", symbol: "ACCESSCORP", units: 20_000 },
  { stockbrokerCode: "SB-003", chn: "C0045678901", subscriberName: "Fatima Garba Abubakar", certNo: "CERT-00126", cscsAccountNo: "CSC-045678901", symbol: "ACCESSCORP", units: 50_000 },
  { stockbrokerCode: "SB-002", chn: "C0056789012", subscriberName: "Ibrahim Usman Hassan", certNo: "CERT-00127", cscsAccountNo: "CSC-056789012", symbol: "ACCESSCORP", units: 8_000 },
];

export default function ICULodgment({ tab }: { tab: string }) {
  const [batches, setBatches] = useState<MockLodgmentBatch[]>(MOCK_BATCHES);
  const [lodgmentReviewing, setLodgmentReviewing] = useState<MockLodgmentBatch | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [subscribersPage, setSubscribersPage] = useState(0);
  const [subscribersPageSize, setSubscribersPageSize] = useState(20);
  const [downloadFormat, setDownloadFormat] = useState<"RIN_AT_CSCS" | "RIN_NOT_AT_CSCS">("RIN_AT_CSCS");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [isDownloading, setIsDownloading] = useState(false);

  const totalLodgmentPages = Math.max(1, Math.ceil(MOCK_LODGMENT_ROWS.length / subscribersPageSize));
  const paginatedRows = MOCK_LODGMENT_ROWS.slice(
    subscribersPage * subscribersPageSize,
    (subscribersPage + 1) * subscribersPageSize,
  );

  const handleDownload = async () => {
    if (!lodgmentReviewing) return;
    setIsDownloading(true);
    await new Promise(r => setTimeout(r, 800));
    setIsDownloading(false);
    toast.success("Lodgment file downloaded successfully.");
  };

  if (lodgmentReviewing === null) {
    return (
      <div className="space-y-6">
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/20">
            <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
              ICU Approved — Ready for Lodgment
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">BATCH REF</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">BATCH DATE</th>
                  <th className="px-4 py-3 text-right">APPROVED ALLOTTEES</th>
                  <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                  <th className="px-4 py-3">ICU APPROVER</th>
                  <th className="px-4 py-3">ICU APPROVAL DATE</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {batches.length > 0 ? (
                  batches.map((row) => (
                    <tr
                      key={row.batchReference}
                      className="mrpsl-table-row cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                        {row.batchReference}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {row.register}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[13px]">
                        {row.batchDate
                          ? format(new Date(row.batchDate), "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-green-700">
                        {row.approvedCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        ₦{row.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {row.icuApprovedBy}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {row.icuApprovedAt
                          ? format(
                              new Date(row.icuApprovedAt),
                              "dd MMM yyyy, HH:mm",
                            )
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {row.status !== "ICU_APPROVED" ? (
                          <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                            Lodged
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                            Pending Lodgment
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          onClick={() => setLodgmentReviewing(row)}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No ready batches found for lodgment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={currentPage}
            pageSize={pageSize}
            totalPages={Math.max(1, Math.ceil(batches.length / pageSize))}
            total={batches.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => setLodgmentReviewing(null)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Lodgment Queue
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <span className="font-mono text-sm font-semibold">
          {lodgmentReviewing.batchReference}
        </span>
        <span className="text-muted-foreground text-sm">
          · {lodgmentReviewing.register} ·{" "}
          {lodgmentReviewing.batchDate
            ? format(new Date(lodgmentReviewing.batchDate), "dd MMM yyyy")
            : "—"}
        </span>
        {lodgmentReviewing.status !== "ICU_APPROVED" ? (
          <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
            Lodged
          </Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
            Pending Lodgment
          </Badge>
        )}
        <div className="flex-1" />
        {lodgmentReviewing.status === "ICU_APPROVED" && (
          <Button
            size="sm"
            onClick={() => setIsApproveDialogOpen(true)}
            className="gap-1.5"
          >
            <CheckCircle className="h-4 w-4" /> Approve Lodgment
          </Button>
        )}
      </div>

      {/* ICU approval record */}
      <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
        <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          ICU Approval Record
        </p>
        <div className="flex items-center gap-8 text-sm flex-wrap">
          <div>
            <div className="mrpsl-section-title">ICU Approver</div>
            <div className="font-semibold mt-0.5">
              {lodgmentReviewing.icuApprovedBy}
            </div>
          </div>
          <div>
            <div className="mrpsl-section-title">Approval Date &amp; Time</div>
            <div className="font-mono mt-0.5">
              {lodgmentReviewing.icuApprovedAt
                ? format(
                    new Date(lodgmentReviewing.icuApprovedAt),
                    "dd MMM yyyy, HH:mm",
                  )
                : "—"}
            </div>
          </div>
          <div>
            <div className="mrpsl-section-title">Approved Allottees</div>
            <div className="font-mono font-semibold mt-0.5 text-green-700">
              {lodgmentReviewing.approvedCount.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="mrpsl-section-title">Total Amount</div>
            <div className="font-mono font-semibold mt-0.5">
              ₦{lodgmentReviewing.totalAmount.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mrpsl-card">
        <div className="p-5 space-y-6">
          <div className="space-y-3">
            <label className="mrpsl-label">Lodgment File Format</label>
            <RadioGroup
              value={downloadFormat}
              onValueChange={(val) =>
                setDownloadFormat(val as "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS")
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="RIN_AT_CSCS" id="r1" />
                <label htmlFor="r1" className="text-sm cursor-pointer">
                  RIN at CSCS
                </label>
              </div>
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="RIN_NOT_AT_CSCS" id="r2" />
                <label htmlFor="r2" className="text-sm cursor-pointer">
                  RIN NOT at CSCS
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="bg-muted/40 p-2 border-b text-[13px] tabular font-bold text-muted-foreground">
              PREVIEW (LODGMENT ROWS)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] tabular">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="p-2 text-left">STOCKBROKER CODE</th>
                    <th className="p-2 text-left">CHN</th>
                    <th className="p-2 text-left">SHAREHOLDER NAME</th>
                    <th className="p-2 text-left">CERT NO</th>
                    <th className="p-2 text-left">CSCS ACCOUNT NO</th>
                    <th className="p-2 text-left">SYMBOL</th>
                    <th className="p-2 text-right">UNITS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="p-2 font-mono">{row.stockbrokerCode}</td>
                        <td className="p-2 font-mono">{row.chn}</td>
                        <td className="p-2 font-medium">{row.subscriberName}</td>
                        <td className="p-2 font-mono">{row.certNo}</td>
                        <td className="p-2 font-mono">{row.cscsAccountNo}</td>
                        <td className="p-2 font-mono">{row.symbol}</td>
                        <td className="p-2 font-mono text-right font-semibold">
                          {row.units.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No lodgment preview rows available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={subscribersPage}
              pageSize={subscribersPageSize}
              totalPages={totalLodgmentPages}
              total={MOCK_LODGMENT_ROWS.length}
              onPageChange={setSubscribersPage}
              onPageSizeChange={setSubscribersPageSize}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isDownloading}
              onClick={handleDownload}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download Lodgment
                  File (.txt)
                </>
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                toast.success("Pushed to CSCS API successfully.");
              }}
            >
              <Upload className="mr-2 h-4 w-4" /> Push via CSCS API
            </Button>
          </div>
        </div>
      </Card>

      <ApproveLodgmentDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        batchReference={lodgmentReviewing.batchReference}
        onSuccess={() => {
          setBatches(prev =>
            prev.map(b =>
              b.batchReference === lodgmentReviewing.batchReference
                ? { ...b, status: "LODGED" as const }
                : b,
            ),
          );
          setLodgmentReviewing(null);
        }}
      />
    </div>
  );
}

interface ApproveLodgmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchReference: string;
  onSuccess?: () => void;
}

export function ApproveLodgmentDialog({
  open,
  onOpenChange,
  batchReference,
  onSuccess,
}: ApproveLodgmentDialogProps) {
  const [comment, setComment] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!comment.trim()) {
      toast.error("Please enter a comment.");
      return;
    }

    setIsApproving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsApproving(false);
    toast.success("Lodgment batch approved successfully.");
    setComment("");
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setComment("");
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Approve Lodgment Batch</DialogTitle>
          <DialogDescription>
            Confirm the lodgment of batch{" "}
            <span className="font-mono font-bold text-foreground">
              {batchReference}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="mrpsl-label">Comment *</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment or note about the lodgment…"
              rows={3}
              className="resize-none text-sm focus-visible:ring-primary rounded-xl"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isApproving}
              onClick={() => {
                setComment("");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-1.5"
              disabled={isApproving}
              onClick={handleApprove}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Confirm Approval"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, FileText, FileImage, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Demat } from "@/actions/certDematActions";

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  DRAFT: { cls: "bg-gray-100 text-gray-600", label: "Draft" },
  CALLOVER: { cls: "bg-blue-100 text-blue-800", label: "Callover" },
  AUTHORISED: { cls: "bg-amber-100 text-amber-800", label: "Pending Auth" },
  ICU_APPROVED: { cls: "bg-purple-100 text-purple-800", label: "ICU Review" },
  LODGED: { cls: "bg-green-100 text-green-800", label: "Lodged" },
  REJECTED: { cls: "bg-red-100 text-red-700", label: "Rejected" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { cls: "bg-gray-100 text-gray-600", label: status };
  return <Badge className={`border-0 text-[13px] ${s.cls}`}>{s.label}</Badge>;
}

export function ViewDematRecord({
  selected,
  open,
  onOpenChange,
  onApprove,
  onReject,
  approveLabel = "Approve",
  readOnly,
}: {
  selected: Demat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, comment: string) => void;
  approveLabel?: string;
  readOnly?: boolean;
}) {
  const [rejectComment, setRejectComment] = useState("");

  if (!selected) return null;

  // Recreate approval steps based on the demat record timestamps
  const approvalSteps = [
    {
      label: `Captured by ${selected.capturedBy || "Initiator"}`,
      done: !!selected.capturedAt,
      pending: !selected.capturedAt && selected.status === "DRAFT",
      time: selected.capturedAt ? new Date(selected.capturedAt).toLocaleString() : null,
    },
    {
      label: selected.calloverAt ? `Callover by ${selected.calloverBy}` : "Callover Officer — Pending action",
      done: !!selected.calloverAt,
      pending: !selected.calloverAt && selected.status === "CALLOVER",
      time: selected.calloverAt ? new Date(selected.calloverAt).toLocaleString() : null,
    },
    {
      label: selected.authorisedAt ? `Authorised by ${selected.authorisedBy}` : "Authoriser — Pending action",
      done: !!selected.authorisedAt,
      pending: !selected.authorisedAt && selected.status === "AUTHORISED",
      time: selected.authorisedAt ? new Date(selected.authorisedAt).toLocaleString() : null,
    },
    {
      label: selected.icuApprovedAt ? `ICU Approved by ${selected.icuApprovedBy}` : "ICU Officer — Pending action",
      done: !!selected.icuApprovedAt,
      pending: !selected.icuApprovedAt && selected.status === "ICU_APPROVED",
      time: selected.icuApprovedAt ? new Date(selected.icuApprovedAt).toLocaleString() : null,
    },
  ];

  // Mock documents if none exist since Demat API doesn't return full doc objects right now
  const documents = [
    { name: "Shareholder_ID.jpg", fileType: "IMAGE", url: selected.shareholderIdRef },
    { name: "Demat_Form.pdf", fileType: "PDF", url: selected.dematFormRef },
    { name: "Scanned_Certificates.pdf", fileType: "PDF", url: selected.scannedCertsRef },
  ].filter(d => d.url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh] p-0 gap-0">
        <DialogHeader className="pl-6 pr-14 pt-5 pb-4 border-b shrink-0">
          <DialogTitle>Record Details</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0 px-6 py-6 space-y-5">
          {/* Transaction details */}
          <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="mrpsl-section-title mb-1">Certificate(s)</div>
                <div className="font-mono text-sm font-semibold">
                  {selected.certificates?.map((c) => c.certNo).join(", ") || "-"}
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
              <div>
                <div className="mrpsl-section-title">Holder</div>
                <div className="font-semibold text-sm mt-0.5">{selected.holderName}</div>
              </div>
              <div>
                <div className="mrpsl-section-title">CHN</div>
                <div className="font-mono text-[13px] text-muted-foreground mt-0.5">{selected.chn}</div>
              </div>
              <div>
                <div className="mrpsl-section-title">Broker</div>
                <div className="text-sm mt-0.5">{selected.broker}</div>
              </div>
              <div>
                <div className="mrpsl-section-title">Units</div>
                <div className="text-xl tabular-nums font-bold mt-0.5">
                  {selected.totalUnits?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Submitted documents */}
          {documents.length > 0 && (
            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">Submitted Documents</h4>
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border">
                    {doc.fileType === "IMAGE" ? (
                      <FileImage className="h-4 w-4 text-blue-500 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span className="text-sm flex-1 truncate font-medium">{doc.name}</span>
                    <Badge variant="outline" className="text-[11px] font-mono shrink-0">
                      {doc.fileType}
                    </Badge>
                    <button
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Open"
                      onClick={() => toast.info(`Opening ${doc.name}…`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Download"
                      onClick={() => toast.info(`Downloading ${doc.name}…`)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval chain */}
          <div className="border border-border/60 rounded-xl p-4">
            <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">Approval Chain</h4>
            <div className="space-y-4">
              {approvalSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      step.done
                        ? "bg-green-500"
                        : step.pending
                          ? "bg-amber-200 animate-pulse"
                          : "border-2 border-muted bg-background"
                    }`}
                  >
                    {step.done && <Check className="h-3 w-3 text-white" style={{ strokeWidth: 3 }} />}
                  </div>
                  <div>
                    <div className="text-sm">{step.label}</div>
                    {step.time && <div className="text-[11px] text-muted-foreground mt-0.5">{step.time}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!readOnly && (
            <>
              {/* Comment + actions */}
              <div className="space-y-2">
                <label className="mrpsl-label">Comment</label>
                <Textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Required for rejection..."
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/60">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    if (!rejectComment.trim()) {
                      toast.error("Comment required to reject");
                      return;
                    }
                    if (onReject) onReject(selected.id, rejectComment);
                    setRejectComment("");
                    onOpenChange(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (onApprove) onApprove(selected.id);
                    setRejectComment("");
                    onOpenChange(false);
                  }}
                >
                  {approveLabel}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

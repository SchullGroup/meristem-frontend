"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertCircle, X, Pencil, Loader2 } from "lucide-react";
import {
  useSubmitTransferRequest,
  useGetAllTransferRequests,
} from "@/hooks/useCertTransfer";
import { CscsShareholder, TransferRequest } from "@/types/cscs";
import { GetPDFUrl } from "@/lib/utils/get-file-url";
import { useGetShareholdersCertificate } from "@/hooks/useCertificates";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export const Transfer = ({
  setTab,
}: {
  setTab: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { data: rejectedData } = useGetAllTransferRequests({
    status: "REJECTED",
  });
  const allRejectedTransfers: TransferRequest[] =
    rejectedData?.data?.content || [];
  const [hiddenRejectedIds, setHiddenRejectedIds] = useState<Set<string>>(
    new Set(),
  );
  const rejectedTransfers = allRejectedTransfers.filter(
    (c) => !hiddenRejectedIds.has(c.id),
  );
  const [autoLoad, setAutoLoad] = useState(false);
  const [showRejected, setShowRejected] = useState(false);

  const [srcSearch, setSrcSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");

  const [srcSearchResults, setSrcSearchResults] = useState<
    CscsShareholder[] | []
  >([]);
  const [destSearchResults, setDestSearchResults] = useState<
    CscsShareholder[] | []
  >([]);

  const [srcLoaded, setSrcLoaded] = useState<CscsShareholder | null>(null);
  const [destLoaded, setDestLoaded] = useState<CscsShareholder | null>(null);

  const [editingRejected, setEditingRejected] =
    useState<TransferRequest | null>(null);

  const [formData, setFormData] = useState({
    units: "",
    instrumentRef: "",
    stampDuty: "",
    comment: "",
    iotUrl: "",
  });
  const [uploadingIot, setUploadingIot] = useState(false);

  // Setup queries
  const { refetch: fetchSrc, isFetching: srcFetching } = useGetShareholdersCertificate(
    { search: srcSearch },
    { enabled: false },
  );
  const { refetch: fetchDest, isFetching: destFetching } = useGetShareholdersCertificate(
    { search: destSearch },
    { enabled: false },
  );

  const submitMutation = useSubmitTransferRequest();

  const handleSearchSrc = async () => {
    if (!srcSearch) return;
    setSrcLoaded(null);
    setSrcSearchResults([]);
    const res = await fetchSrc();
    const data = res.data?.data;
    if (data && data.length > 0) {
      setSrcSearchResults(data);
      if (data.length === 1) toast.success("1 shareholder found");
      else
        toast.success(`${data.length} shareholders found. Please select one.`);
    } else {
      setSrcSearchResults([]);
      toast.error("Source shareholder not found");
    }
  };

  const handleSearchDest = async () => {
    if (!destSearch) return;
    setDestLoaded(null);
    setDestSearchResults([]);
    const res = await fetchDest();
    const data = res.data?.data;
    if (data && data.length > 0) {
      setDestSearchResults(data);
      if (data.length === 1) toast.success("1 shareholder found");
      else
        toast.success(`${data.length} shareholders found. Please select one.`);
    } else {
      setDestSearchResults([]);
      toast.error("Destination shareholder not found");
    }
  };

  const handleSubmit = async () => {
    if (
      !srcLoaded ||
      !destLoaded ||
      Object.values(formData).some((values) => values === "")
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!srcLoaded.certificateId) {
      toast.error("Please select a shareholder with a valid certificate id");
      return;
    }

    const unitsToTransfer = Number(formData.units);
    if (unitsToTransfer <= 0) {
      toast.error("Units to transfer must be greater than zero");
      return;
    }

    if (unitsToTransfer > srcLoaded.holdings) {
      toast.error(
        `Cannot transfer more units than available balance (${srcLoaded.holdings.toLocaleString()})`,
      );
      return;
    }

    try {
      await submitMutation.mutateAsync({
        sourceCertId: srcLoaded.certificateId,
        toShareholderId: destLoaded.id,
        toAccountNumber: destLoaded.accountNumber,
        units: unitsToTransfer,
        instrumentRef: formData.instrumentRef,
        stampDuty: Number(formData.stampDuty),
        iotDocumentUrl: formData.iotUrl,
        reason: formData.comment,
        submittedBy: "user@meristem.com",
      });

      toast.success(
        editingRejected
          ? "Transfer resubmitted successfully!"
          : "Transfer submitted for approval",
      );

      if (editingRejected) {
        setEditingRejected(null);
      }

      setTab("pending"); // move to the next tab, assuming 'processing' or 'queue'
    } catch (error) {
      const errorMessage = returnErrorMessage(error as ErrorLike);
      toast.error(errorMessage || "Failed to submit transfer");
    }
  };

  useEffect(() => {
    if (autoLoad && srcSearch && destSearch) {
      //eslint-disable-next-line
      handleSearchSrc();
      handleSearchDest();
      setAutoLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcSearch, destSearch, autoLoad]);

  const resetForm = () => {
    setEditingRejected(null);
    setSrcLoaded(null);
    setDestLoaded(null);
    setSrcSearchResults([]);
    setDestSearchResults([]);
    setSrcSearch("");
    setDestSearch("");
    setFormData({
      units: "",
      instrumentRef: "",
      stampDuty: "",
      comment: "",
      iotUrl: "",
    });
  };

  return (
    <>
      {/* Rejected transfers toggle */}
      {rejectedTransfers.length > 0 && !editingRejected && !showRejected && (
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowRejected(true)}
            className="border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            View Rejected Transfers ({rejectedTransfers.length})
          </Button>
        </div>
      )}

      {/* Rejected transfers */}
      {rejectedTransfers.length > 0 && !editingRejected && showRejected && (
        <div className="space-y-4 mb-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-red-800 text-sm">
              Action Required: Rejected Transfers
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRejected(false)}
              className="text-muted-foreground h-8 px-2"
            >
              Hide
            </Button>
          </div>

          <div className="grid grid-cols-3 pb-2 gap-4">
            {rejectedTransfers.map((item) => (
              <Card
                key={item.id}
                className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 w-full shrink-0"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />

                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-sm text-red-800">
                      Request Rejected: {item.units?.toLocaleString()} units
                    </div>

                    <div className="text-[13px] text-red-700">
                      Comment:{" "}
                      {item.authoriserComment || "No comment provided."}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setHiddenRejectedIds((prev) =>
                        new Set(prev).add(item.id),
                      );
                      if (rejectedTransfers.length <= 1) setShowRejected(false);
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 pl-8">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100 gap-1.5"
                    onClick={() => {
                      setEditingRejected(item);
                      setSrcSearch(item.fromAccount);
                      setDestSearch(item.toAccount);
                      setFormData({
                        units: String(item.units),
                        instrumentRef: item.instrumentRef || "",
                        stampDuty: String(item.stampDuty || 0),
                        comment: item.reason || "",
                        iotUrl: item.iotDocumentUrl || "",
                      });
                      setHiddenRejectedIds((prev) =>
                        new Set(prev).add(item.id),
                      );
                      setShowRejected(false);
                      setAutoLoad(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit &amp; Resubmit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Editing state banner */}
      {editingRejected && (
        <Card className="mrpsl-card p-3 mb-6 border-l-4 border-l-amber-400 bg-amber-50/60 border-amber-200 flex items-center gap-3">
          <Pencil className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-[13px] text-amber-800 font-medium flex-1">
            Editing rejected transfer of{" "}
            <span className="font-semibold">
              {editingRejected.units.toLocaleString()} units
            </span>{" "}
            from{" "}
            <span className="font-semibold">
              {editingRejected.fromHolder}-{editingRejected?.sourceCertNumber}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {editingRejected.toHolder}-{editingRejected?.toAccount}
            </span>
            .
          </p>
          <button
            onClick={resetForm}
            className="text-amber-500 hover:text-amber-700"
          >
            <X className="h-4 w-4" />
          </button>
        </Card>
      )}

      {/* transferor and transferee forms */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="mrpsl-card p-4 space-y-4">
          <div className="font-semibold text-sm border-b pb-2">
            Transferor (Source)
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search by Account/Name"
              className="mrpsl-input"
              value={srcSearch}
              onChange={(e) => setSrcSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSrc()}
            />
            <Button onClick={handleSearchSrc} disabled={srcFetching}>
              {srcFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Search Results List for Source */}
          {srcSearchResults && srcSearchResults.length > 0 && !srcLoaded && (
            <div className="mt-2 border rounded-md divide-y max-h-48 overflow-y-auto bg-background">
              {srcSearchResults.map((sh) => (
                <div
                  key={sh.id}
                  className="p-3 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => {
                    setSrcLoaded(sh);
                    setSrcSearchResults([]);
                  }}
                >
                  <div className="font-semibold text-sm">
                    {sh.firstName} {sh.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                    <span>Account: {sh.accountNumber}</span>
                    {sh.chn && <span>• CHN: {sh.chn}</span>}
                    {sh.certNumber && <span>• Cert: {sh.certNumber}</span>}
                  </div>
                  <div className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-1.5 py-0.5 rounded inline-block mt-1">
                    {sh.registerName} — {sh.registerSymbol}
                  </div>
                </div>
              ))}
            </div>
          )}

          {srcLoaded && (
            <div className="bg-muted/20 p-3 rounded text-sm space-y-1 animate-in fade-in relative">
              <button
                onClick={() => {
                  setSrcLoaded(null);
                  setSrcSearch("");
                }}
                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="font-bold">
                {srcLoaded.firstName} {srcLoaded.lastName}
              </div>
              <div className="text-muted-foreground font-mono">
                {srcLoaded.accountNumber}{" "}
                {srcLoaded.certNumber ? `• Cert: ${srcLoaded.certNumber}` : ""}
              </div>
              <div className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded inline-block mt-0.5">
                {srcLoaded.registerName} — {srcLoaded.registerSymbol}
              </div>
              {srcLoaded.holdings > 0 && (
                <div className="font-mono text-lg font-bold mt-2">
                  {srcLoaded.holdings.toLocaleString()} units
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="mrpsl-card p-4 space-y-4">
          <div className="font-semibold text-sm border-b pb-2">
            Transferee (Destination)
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search by Account/Name"
              className="mrpsl-input"
              value={destSearch}
              onChange={(e) => setDestSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchDest()}
            />
            <Button onClick={handleSearchDest} disabled={destFetching}>
              {destFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Search Results List for Destination */}
          {destSearchResults && destSearchResults.length > 0 && !destLoaded && (
            <div className="mt-2 border rounded-md divide-y max-h-48 overflow-y-auto bg-background">
              {destSearchResults.map((sh) => (
                <div
                  key={sh.id}
                  className="p-3 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => {
                    setDestLoaded(sh);
                    setDestSearchResults([]);
                  }}
                >
                  <div className="font-semibold text-sm">
                    {sh.firstName} {sh.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                    <span>Account: {sh.accountNumber}</span>
                    {sh.chn && <span>• CHN: {sh.chn}</span>}
                    {sh?.certNumber ? `• Cert: ${sh?.certNumber}` : ""}
                  </div>
                  <div className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-1.5 py-0.5 rounded inline-block mt-1">
                    {sh.registerName} — {sh.registerSymbol}
                  </div>
                </div>
              ))}
            </div>
          )}

          {destLoaded && (
            <div className="bg-muted/20 p-3 rounded text-sm space-y-1 animate-in fade-in relative">
              <button
                onClick={() => {
                  setDestLoaded(null);
                  setDestSearch("");
                }}
                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="font-bold">
                {destLoaded.firstName} {destLoaded.lastName}
              </div>
              <div className="text-muted-foreground font-mono">
                {destLoaded.accountNumber}
                {destLoaded?.certNumber
                  ? `• Cert: ${destLoaded?.certNumber}`
                  : ""}
              </div>
              <div className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded inline-block mt-0.5">
                {destLoaded.registerName} — {destLoaded.registerSymbol}
              </div>
            </div>
          )}
        </Card>
      </div>

      {srcLoaded && destLoaded && (
        <Card className="mrpsl-card p-6 mt-6 space-y-4 animate-in fade-in">
          <h3 className="font-semibold text-sm border-b pb-2">
            Transfer Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mrpsl-label">Units to Transfer *</label>
              <Input
                type="number"
                value={formData.units}
                onChange={(e) =>
                  setFormData({ ...formData, units: e.target.value })
                }
                className="mrpsl-input font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">
                Instrument of Transfer Ref *
              </label>
              <Input
                value={formData.instrumentRef}
                onChange={(e) =>
                  setFormData({ ...formData, instrumentRef: e.target.value })
                }
                className="mrpsl-input"
              />
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Stamp Duty (₦)</label>
              <Input
                value={formData.stampDuty}
                onChange={(e) =>
                  setFormData({ ...formData, stampDuty: e.target.value })
                }
                className="mrpsl-input font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Upload IoT Document *</label>
              <Input
                type="file"
                accept=".pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingIot(true);
                  const res = await GetPDFUrl(file, "certificateTransfers");
                  setUploadingIot(false);
                  if (res?.type === "success") {
                    setFormData({ ...formData, iotUrl: res.result });
                    toast.success("Document uploaded");
                  } else {
                    toast.error(
                      typeof res?.result === "string"
                        ? res.result
                        : "Upload failed",
                    );
                  }
                }}
                className="mrpsl-input"
                disabled={uploadingIot}
              />
              {uploadingIot && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                </p>
              )}
              {formData.iotUrl && !uploadingIot && (
                <p className="text-xs text-green-600 mt-1">
                  Document uploaded successfully
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="mrpsl-label">Comment</label>
            <Textarea
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={
                submitMutation.isPending ||
                uploadingIot ||
                !formData.units ||
                !formData.instrumentRef ||
                !formData.iotUrl
              }
            >
              {submitMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingRejected ? "Resubmit Transfer" : "Submit Transfer"}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};

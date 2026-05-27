"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertCircle, X, Pencil, Loader2 } from "lucide-react";
import { useSubmitTransferRequest } from "@/hooks/useCertTransfer";
import { CscsShareholder, TransferRequest } from "@/types/cscs";
import { useStore } from "@/lib/store";
import { GetPDFUrl } from "@/lib/utils/get-file-url";
import { useGetShareholders } from "@/hooks/useCertificates";

export const Transfer = ({
    setTab,
}: {
    setTab: React.Dispatch<React.SetStateAction<string>>;
}) => {

    // Zustand store for rejected transfers
    const rejectedTransfers = useStore((state) => state.rejectedTransfers);
    const removeRejectedTransfer = useStore((state) => state.removeRejectedTransfer);

    const [srcSearch, setSrcSearch] = useState("");
    const [destSearch, setDestSearch] = useState("");

    const [srcSearchResults, setSrcSearchResults] = useState<CscsShareholder[] | []>([]);
    const [destSearchResults, setDestSearchResults] = useState<CscsShareholder[] | []>([]);

    const [srcLoaded, setSrcLoaded] = useState<CscsShareholder | null>(null);
    const [destLoaded, setDestLoaded] = useState<CscsShareholder | null>(null);

    const [editingRejected, setEditingRejected] = useState<TransferRequest | null>(null);

    const [units, setUnits] = useState("");
    const [instrumentRef, setInstrumentRef] = useState("");
    const [stampDuty, setStampDuty] = useState("");
    const [comment, setComment] = useState("");

    const [uploadingIot, setUploadingIot] = useState(false);
    const [iotUrl, setIotUrl] = useState("");

    // Setup queries
    const { refetch: fetchSrc, isFetching: srcFetching } = useGetShareholders(
        { search: srcSearch },
        { enabled: false }
    );
    const { refetch: fetchDest, isFetching: destFetching } = useGetShareholders(
        { search: destSearch },
        { enabled: false }
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
            else toast.success(`${data.length} shareholders found. Please select one.`);
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
            else toast.success(`${data.length} shareholders found. Please select one.`);
        } else {
            setDestSearchResults([]);
            toast.error("Destination shareholder not found");
        }
    };

    const handleSubmit = async () => {
        if (!srcLoaded || !destLoaded || !units || !instrumentRef || !iotUrl) {
            toast.error("Please fill all required fields and upload the IoT document");
            return;
        }

        if (!srcLoaded.certificateId) {
            toast.error("Please select a shareholder with a valid certificate id")
            return;
        }

        const unitsToTransfer = Number(units);
        if (unitsToTransfer <= 0) {
            toast.error("Units to transfer must be greater than zero");
            return;
        }

        // if (unitsToTransfer > srcLoaded.holdings) {
        //     toast.error(`Cannot transfer more units than available balance (${srcLoaded.holdings.toLocaleString()})`);
        //     return;
        // }

        try {
            await submitMutation.mutateAsync({
                sourceCertId: srcLoaded.certificateId,
                toShareholderId: destLoaded.id,
                toAccountNumber: destLoaded.accountNumber,
                units: unitsToTransfer,
                instrumentRef,
                stampDuty: Number(stampDuty) || 0,
                iotDocumentUrl: iotUrl,
                reason: comment,
                submittedBy: "user@meristem.com",
            });

            toast.success(
                editingRejected
                    ? "Transfer resubmitted successfully!"
                    : "Transfer submitted for approval"
            );

            if (editingRejected) {
                removeRejectedTransfer(editingRejected.id);
                setEditingRejected(null);
            }

            // reset form
            setSrcLoaded(null);
            setDestLoaded(null);
            setSrcSearchResults([]);
            setDestSearchResults([]);
            setSrcSearch("");
            setDestSearch("");
            setUnits("");
            setStampDuty("");
            setInstrumentRef("");
            setComment("");
            setIotUrl("");

            setTab("pending"); // move to the next tab, assuming 'processing' or 'queue'
        } catch (error: any) {
            toast.error(error.message || "Failed to submit transfer");
        }
    };

    // const handleEditRejected = (transfer: TransferRequest) => {
    //     setEditingRejected(transfer);

    //     // Populate the form fields. In a real scenario, we'd also fetch the shareholder records 
    //     // to populate `srcLoaded` and `destLoaded` properly. Here we will mock them if needed
    //     // or just set search fields and manually click search. Let's set search and prefill form.
    //     setSrcSearch(transfer.fromAccount);
    //     setDestSearch(transfer.toAccount);
    //     setUnits(String(transfer.units));
    //     setStampDuty(String(transfer.stampDuty || 0));
    //     setInstrumentRef(transfer.instrumentRef || "");
    //     setIotUrl(transfer.iotDocumentUrl || "");

    //     // We set dummy loaded info just to show the form, or we can rely on user hitting search.
    //     // The prompt says "When editing, the information of the shareholders and form would be prefilled"
    //     setSrcLoaded({
    //         id: transfer.id,
    //         firstName: transfer.fromHolder,
    //         lastName: "",
    //         accountNumber: transfer.fromAccount,
    //         chn: "",
    //         registerId: transfer.registerId,
    //         registerName: "",
    //         registerSymbol: transfer.registerSymbol,
    //         holdings: 0,
    //         status: "",
    //         bankName: "",
    //         certificateId: transfer.sourceCertId,
    //         certNumber: transfer.sourceCertNumber,
    //         bankAccountNumber: ""
    //     });

    //     setDestLoaded({
    //         id: "", // dest ID unknown here until search, but form needs it
    //         firstName: transfer.toHolder,
    //         lastName: "",
    //         accountNumber: transfer.toAccount,
    //         chn: "",
    //         registerId: transfer.registerId,
    //         registerName: "",
    //         registerSymbol: transfer.registerSymbol,
    //         holdings: 0,
    //         status: "",
    //         bankName: "",
    //         bankAccountNumber: "",
    //         certificateId: transfer.sourceCertId,
    //         certNumber: transfer.sourceCertNumber,
    //     });
    // };

    return (
        <>
            {/* Rejected transfers from Zustand */}
            {rejectedTransfers.length > 0 && !editingRejected && (
                <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-red-800 text-sm">Action Required: Rejected Transfers</h3>
                    {rejectedTransfers.map((item) => (
                        <Card key={item.id} className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-1">
                                    <div className="font-semibold text-sm text-red-800">
                                        Request Rejected: {item.units.toLocaleString()} units
                                    </div>
                                    <div className="text-[13px] text-red-700">
                                        Comment: {item.authoriserComment || "No comment provided."}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeRejectedTransfer(item.id)}
                                    className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            {/* <div className="mt-3 pl-8">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-700 hover:bg-red-100 gap-1.5"
                                    onClick={() => handleEditRejected(item)}
                                >
                                    <Pencil className="h-3.5 w-3.5" /> Edit &amp; Resubmit
                                </Button>
                            </div> */}
                        </Card>
                    ))}
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
                        <span className="font-semibold">{editingRejected.fromHolder}</span>{" "}
                        to <span className="font-semibold">{editingRejected.toHolder}</span>
                        .
                    </p>
                    <button
                        onClick={() => {
                            setEditingRejected(null);
                            setSrcLoaded(null);
                            setDestLoaded(null);
                            setSrcSearchResults([]);
                            setDestSearchResults([]);
                            setSrcSearch("");
                            setDestSearch("");
                            setUnits("");
                            setStampDuty("");
                            setInstrumentRef("");
                            setComment("");
                            setIotUrl("");
                        }}
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
                            {srcFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                    </div>

                    {/* Search Results List for Source */}
                    {srcSearchResults && srcSearchResults.length > 0 && !srcLoaded && (
                        <div className="mt-2 border rounded-md divide-y max-h-48 overflow-y-auto bg-background">
                            {srcSearchResults.map(sh => (
                                <div
                                    key={sh.id}
                                    className="p-3 hover:bg-muted cursor-pointer transition-colors"
                                    onClick={() => {
                                        setSrcLoaded(sh);
                                        setSrcSearchResults([]);
                                    }}
                                >
                                    <div className="font-semibold text-sm">{sh.firstName} {sh.lastName}</div>
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
                            <div className="font-bold">{srcLoaded.firstName} {srcLoaded.lastName}</div>
                            <div className="text-muted-foreground font-mono">
                                {srcLoaded.accountNumber} {srcLoaded.certNumber ? `• Cert: ${srcLoaded.certNumber}` : ''}
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
                            {destFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                    </div>

                    {/* Search Results List for Destination */}
                    {destSearchResults && destSearchResults.length > 0 && !destLoaded && (
                        <div className="mt-2 border rounded-md divide-y max-h-48 overflow-y-auto bg-background">
                            {destSearchResults.map(sh => (
                                <div
                                    key={sh.id}
                                    className="p-3 hover:bg-muted cursor-pointer transition-colors"
                                    onClick={() => {
                                        setDestLoaded(sh);
                                        setDestSearchResults([]);
                                    }}
                                >
                                    <div className="font-semibold text-sm">{sh.firstName} {sh.lastName}</div>
                                    <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                                        <span>Account: {sh.accountNumber}</span>
                                        {sh.chn && <span>• CHN: {sh.chn}</span>}
                                        {sh?.certNumber ? `• Cert: ${sh?.certNumber}` : ''}

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
                            <div className="font-bold">{destLoaded.firstName} {destLoaded.lastName}</div>
                            <div className="text-muted-foreground font-mono">
                                {destLoaded.accountNumber}
                                {destLoaded?.certNumber ? `• Cert: ${destLoaded?.certNumber}` : ''}
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
                                value={units}
                                onChange={(e) => setUnits(e.target.value)}
                                className="mrpsl-input font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">
                                Instrument of Transfer Ref *
                            </label>
                            <Input
                                value={instrumentRef}
                                onChange={(e) => setInstrumentRef(e.target.value)}
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Stamp Duty (₦)</label>
                            <Input
                                value={stampDuty}
                                onChange={(e) => setStampDuty(e.target.value)}
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
                                        setIotUrl(res.result);
                                        toast.success("Document uploaded");
                                    } else {
                                        toast.error(typeof res?.result === "string" ? res.result : "Upload failed");
                                    }
                                }}
                                className="mrpsl-input"
                                disabled={uploadingIot}
                            />
                            {uploadingIot && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                            {iotUrl && !uploadingIot && <p className="text-xs text-green-600 mt-1">Document uploaded successfully</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="mrpsl-label">Comment</label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            size="lg"
                            onClick={handleSubmit}
                            disabled={submitMutation.isPending || uploadingIot || !units || !instrumentRef || !iotUrl}
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

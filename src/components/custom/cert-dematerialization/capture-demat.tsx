"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Plus, Pencil, X } from "lucide-react";
import { useGetHolders } from "@/hooks/useCscs";
import { useGetAllCertificateDemat, useCaptureDematRequest, useSubmitForCalloverDematRequest } from "@/hooks/useCertDematerialisation";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";
import { getDocType } from "@/lib/mocks/doc-types";
import { useGetRegisters } from "@/hooks/useRegisters";

export const CaptureDematerialization = ({ tab, setActiveTab }: { tab: string, setActiveTab: React.Dispatch<React.SetStateAction<string>> }) => {
  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  const [editingRejectedId, setEditingRejectedId] = useState<string | null>(null);
  const [holderQuery, setHolderQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [register, setRegister] = useState("");
  const [stockbroker, setStockbroker] = useState("");
  const [certificates, setCertificates] = useState([{ certNo: "", units: "" }]);
  const [shareholderIdUrl, setShareholderIdUrl] = useState("");
  const [dematFormUrl, setDematFormUrl] = useState("");
  const [scannedCertsUrl, setScannedCertsUrl] = useState("");

  const { data: holders, isFetching: isSearchingHolder } = useGetHolders({
    chn: searchQuery || undefined
  }, {
    enabled: !!searchQuery
  });
  const foundHolder = holders?.content?.[0] || null;
  const holderNotFound = !!searchQuery && !isSearchingHolder && !foundHolder;

  const { data: rejectedData } = useGetAllCertificateDemat({
    status: "REJECTED",
    size: 100
  }, {
    enabled: tab === "capture"
  });

  const { mutate: captureDemat, isPending: isCapturing } = useCaptureDematRequest();
  // const { mutate: submitForCallover, isPending: isSubmitting } = useSubmitForCalloverDematRequest();

  function handleHolderLookup() {
    setSearchQuery(holderQuery.trim());
  }

  function resetForm() {
    setHolderQuery("");
    setSearchQuery("");
    setEditingRejectedId(null);
    setRegister("");
    setStockbroker("");
    setCertificates([{ certNo: "", units: "" }]);
    setShareholderIdUrl("");
    setDematFormUrl("");
    setScannedCertsUrl("");
  }

  // const handleSubmitForCallover = () => {
  //   if (!register || !stockbroker || certificates.some(c => !c.certNo || !c.units)) {
  //     toast.error("Please fill all required fields before saving.");
  //     return;
  //   }
  //   if (!shareholderIdUrl || !dematFormUrl || !scannedCertsUrl) {
  //     toast.error("Please upload all required supporting documents.");
  //     return;
  //   }
  //   const payload = {
  //     register,
  //     chn: foundHolder?.chn || holderQuery,
  //     holderName: foundHolder ? foundHolder.name : "Unknown",
  //     broker: stockbroker,
  //     certificates: certificates.map(c => ({ certNo: c.certNo, units: Number(c.units), certDate: new Date().toISOString() })),
  //     shareholderIdRef: shareholderIdUrl,
  //     dematFormRef: dematFormUrl,
  //     scannedCertsRef: scannedCertsUrl
  //   };

  //   // First save draft, then sub mit for callover
  //   captureDemat(payload, {
  //     onSuccess: (res) => {
  //       submitForCallover(res.id, {
  //         onSuccess: () => {
  //           toast.success(editingRejectedId ? "Record corrected and resubmitted for callover." : "Submitted for callover.");
  //           setActiveTab("callover");
  //           resetForm();
  //         },
  //         onError: (err) => toast.error(`Failed to submit for callover: ${err.message}`)
  //       });
  //     },
  //     onError: (err) => toast.error(`Failed to capture record: ${err.message}`)
  //   });
  // }

  const handleSubmit = () => {
    if (!register || !stockbroker || certificates.some(c => !c.certNo || !c.units)) {
      toast.error("Please fill all required fields before saving.");
      return;
    }
    if (!shareholderIdUrl || !dematFormUrl || !scannedCertsUrl) {
      toast.error("Please upload all required supporting documents.");
      return;
    }
    captureDemat({
      register,
      chn: foundHolder?.chn || holderQuery,
      holderName: foundHolder ? foundHolder.name : "Unknown",
      broker: stockbroker,
      certificates: certificates.map(c => ({ certNo: c.certNo, units: Number(c.units), certDate: new Date().toISOString() })),
      shareholderIdRef: shareholderIdUrl,
      dematFormRef: dematFormUrl,
      scannedCertsRef: scannedCertsUrl
    }, {
      onSuccess: () => {
        toast.success("Saved as draft.");
        resetForm();
      },
      onError: (err) => toast.error(`Failed to save draft: ${err.message}`)
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Capture new physical certificates for dematerialisation or edit rejected records.
      </p>

      {/* REJECTED RECORDS ALERT */}
      {rejectedData && rejectedData.content && rejectedData.content.length > 0 && (
        <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="font-semibold text-sm text-red-800">
                {rejectedData.content.length === 1
                  ? "Record Rejected"
                  : `${rejectedData.content.length} Records Rejected`}
              </div>
              <div className="text-[13px] text-red-700">
                Review the comments from the callover officer and correct the details below.
              </div>
              <div className="space-y-1.5 mt-1">
                {rejectedData.content.map(
                  (rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center gap-3 text-[13px] bg-red-100/50 p-2 rounded-lg border border-red-200/60"
                    >
                      <span className="font-mono text-red-800 truncate max-w-[200px] font-semibold">
                        {rec.certificates?.map(c => c.certNo).join(', ') || 'No Cert'}
                      </span>
                      <span className="text-red-700">— {rec.holderName}</span>
                      <span className="text-red-600/80 italic line-clamp-1 flex-1">
                        &quot;Please review the attached documents.&quot;
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto border-red-300 text-red-700 hover:bg-red-100 gap-1.5 h-8 text-[12px] bg-white/50"
                        onClick={() => {
                          setEditingRejectedId(rec.id);
                          setHolderQuery(rec.chn || "");
                        }}
                      >
                        <Pencil className="h-3 w-3" /> Edit &amp; Resubmit
                      </Button>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* NEW/EDIT FORM */}
      <Card className="mrpsl-card">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {editingRejectedId ? (
              <>
                <Pencil className="h-5 w-5 text-primary" />
                Edit &amp; Resubmit Demat Record
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                New Demat Capture
              </>
            )}
          </h2>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Registration &amp; Identity
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <label className="mrpsl-label">Register *</label>
                <Select value={register} onValueChange={(value) => {
                  setRegister(value || "")
                }}>
                  <SelectTrigger className="mrpsl-input h-11">
                    <SelectValue placeholder="Select Register" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRegisters?.content?.map((r) => (
                      <SelectItem key={r.registerId} value={r.registerId}>
                        {r.registerName} · {r.symbol}
                      </SelectItem>
                    ))}                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="mrpsl-label">Stockbroker *</label>
                <Select value={stockbroker} onValueChange={(value) => {
                  setStockbroker(value || "")
                }}>
                  <SelectTrigger className="mrpsl-input h-11">
                    <SelectValue placeholder="Select Stockbroker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSCS">CSCS PLC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="mrpsl-label">Holder Lookup</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="CHN or Account No"
                    className="mrpsl-input h-11 flex-1"
                    value={holderQuery}
                    onChange={(e) => {
                      setHolderQuery(e.target.value);
                      if (e.target.value === "") setSearchQuery("");
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleHolderLookup()
                    }
                  />
                  <Button
                    variant="outline"
                    className="h-11 px-6 font-bold"
                    onClick={handleHolderLookup}
                  >
                    Lookup
                  </Button>
                </div>
                {foundHolder && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50/60 mt-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm font-mono">
                        {foundHolder.name.charAt(0).toUpperCase() + foundHolder.name.charAt(1).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-800">
                        {foundHolder.name} . {foundHolder.email}
                      </p>

                    </div>
                    <div className="text-right">
                      <p className="text-[13px] text-muted-foreground">
                        {foundHolder.bank}
                      </p>
                      <p className="text-[13px] text-green-700 font-mono">
                        {foundHolder.bvnAccount} · {foundHolder.chn}
                      </p>
                    </div>
                  </div>
                )}
                {holderNotFound && (
                  <p className="text-[13px] text-red-600 mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    No shareholder found for &quot;{holderQuery}&quot;. Check the CHN or account number.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                Certificate Details
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-primary text-[13px] font-bold"
                onClick={() => setCertificates([...certificates, { certNo: "", units: "" }])}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Certificate
              </Button>
            </div>
            <div className="space-y-4 rounded-xl border p-6 bg-muted/5">
              {certificates.map((cert, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="space-y-2 flex-1">
                    <label className="text-[13px] font-bold uppercase text-muted-foreground">
                      Certificate No *
                    </label>
                    <Input
                      placeholder="00000000"
                      className="mrpsl-input h-11"
                      value={cert.certNo}
                      onChange={(e) => {
                        const newCerts = [...certificates];
                        newCerts[index].certNo = e.target.value;
                        setCertificates(newCerts);
                      }}
                    />
                  </div>
                  <div className="space-y-2 w-48">
                    <label className="text-[13px] font-bold uppercase text-muted-foreground">
                      Units *
                    </label>
                    <Input
                      placeholder="0"
                      type="number"
                      className="mrpsl-input h-11 font-mono"
                      value={cert.units}
                      onChange={(e) => {
                        const newCerts = [...certificates];
                        newCerts[index].units = e.target.value;
                        setCertificates(newCerts);
                      }}
                    />
                  </div>
                  {certificates.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 border border-transparent hover:border-red-200"
                      onClick={() => {
                        const newCerts = certificates.filter((_, i) => i !== index);
                        setCertificates(newCerts);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t border-border/40">
                <span className="text-[13px] font-bold text-muted-foreground">
                  Total Units:{" "}
                  <span className="text-foreground font-mono">
                    {certificates.reduce((sum, c) => sum + (Number(c.units) || 0), 0)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Supporting Documents
            </h3>
            <div className="space-y-3">
              {(() => {
                const id = getDocType("National ID");
                const form = getDocType("Demat Form");
                const cert = getDocType("Scanned Certificates");
                return (
                  <>
                    <DocUploadZone
                      label="Shareholder ID"
                      required
                      fileTypes={id?.fileTypes ?? ["JPG", "PNG", "PDF"]}
                      maxSizeMB={id?.maxSizeMB ?? 5}
                      onUploadSuccess={(url) => setShareholderIdUrl(url)}
                    />
                    <DocUploadZone
                      label="Demat Form"
                      required
                      fileTypes={form?.fileTypes ?? ["PDF"]}
                      maxSizeMB={form?.maxSizeMB ?? 5}
                      onUploadSuccess={(url) => setDematFormUrl(url)}
                    />
                    <DocUploadZone
                      label="Scanned Certs"
                      required
                      fileTypes={cert?.fileTypes ?? ["PDF", "JPG", "PNG"]}
                      maxSizeMB={cert?.maxSizeMB ?? 20}
                      onUploadSuccess={(url) => setScannedCertsUrl(url)}
                    />
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/50 bg-muted/10 flex justify-end gap-3">
          {editingRejectedId && (
            <Button
              variant="ghost"
              className="font-bold px-6 h-11"
              onClick={resetForm}
            >
              Cancel Edit
            </Button>
          )}
          {/* <Button
            variant="outline"
            className="font-bold px-6 h-11"
            disabled={isCapturing || isSubmitting}
            onClick={handleSaveDraft}
          >
            Save Draft
          </Button> */}
          <Button
            className="font-bold px-8 h-11"
            disabled={isCapturing}
            onClick={handleSubmit}
          >
            {isCapturing ? "Processing..." : editingRejectedId ? "Resubmit Record" : "Submit Record"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
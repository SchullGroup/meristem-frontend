"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertCircle, Pencil, X, Loader2, Search } from "lucide-react";
import {
  useGetAllCertificateDemat,
  useCaptureDematRequest,
} from "@/hooks/useCertDematerialisation";
import { useGetAllCertificates } from "@/hooks/useCertificates";
import { useGetAccounts } from "@/hooks/useAccountMaintenance";
import { useDebounce } from "@/hooks/useDebounce";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";
import { getDocType } from "@/lib/mocks/doc-types";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Agent, GET_AGENTS } from "@/actions/agentAction";
import RegisterSelect from "../register-select";
import { ShareholderAccount } from "@/types/account-maintenance";
import { Certificate } from "@/types/cscs";
import { cn } from "@/lib/utils";

function fullName(acc: ShareholderAccount) {
  return [acc.firstName, acc.otherNames, acc.lastName].filter(Boolean).join(" ");
}

export const CaptureDematerialization = ({
  tab,
  setActiveTab,
}: {
  tab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { data: agents, isLoading: loadingAgents } = useQuery({
    queryKey: ["agents"],
    queryFn: () => GET_AGENTS({ type: "STOCKBROKER", size: 100 }),
  });

  const [editingRejectedId, setEditingRejectedId] = useState<string | null>(null);

  // ── Shareholder search ──
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHolder, setSelectedHolder] = useState<ShareholderAccount | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: accountsResponse, isFetching: isSearchingAccounts } = useGetAccounts(
    { q: debouncedSearch },
    { enabled: debouncedSearch.length > 2 },
  );
  const searchResults = accountsResponse?.data?.data ?? [];

  // ── Active certificates for selected holder ──
  const { data: certsData, isLoading: isLoadingCerts } = useGetAllCertificates(
    {
      accountNumber: selectedHolder?.accountNumber,
      status: "ACTIVE",
      pageSize: 100,
    },
    { enabled: !!selectedHolder?.accountNumber },
  );
  const availableCerts: Certificate[] = certsData?.data?.content ?? [];

  // ── Selected certificate IDs (checkbox set) ──
  const [selectedCertIds, setSelectedCertIds] = useState<Set<string>>(new Set());

  // ── Form states ──
  const [register, setRegister] = useState("");
  const [stockbroker, setStockbroker] = useState("");
  const [shareholderIdUrl, setShareholderIdUrl] = useState("");
  const [dematFormUrl, setDematFormUrl] = useState("");
  const [scannedCertsUrl, setScannedCertsUrl] = useState("");

  const stockBrokerList = agents?.data?.content || [];

  // rejected items
  const { data: rejectedData } = useGetAllCertificateDemat(
    { status: "REJECTED", size: 100 },
    { enabled: tab === "capture" },
  );

  const { mutate: captureDemat, isPending: isCapturing } = useCaptureDematRequest();

  function toggleCert(id: string) {
    setSelectedCertIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllCerts() {
    if (selectedCertIds.size === availableCerts.length) {
      setSelectedCertIds(new Set());
    } else {
      setSelectedCertIds(new Set(availableCerts.map((c) => c.id)));
    }
  }

  function resetForm() {
    setSearchTerm("");
    setSelectedHolder(null);
    setSelectedCertIds(new Set());
    setEditingRejectedId(null);
    setRegister("");
    setStockbroker("");
    setShareholderIdUrl("");
    setDematFormUrl("");
    setScannedCertsUrl("");
  }

  const handleSubmit = () => {
    if (!register || !stockbroker) {
      toast.error("Please fill all required fields before saving.");
      return;
    }
    if (!selectedHolder) {
      toast.error("Please search and select a shareholder.");
      return;
    }
    if (selectedCertIds.size === 0) {
      toast.error("Please select at least one certificate.");
      return;
    }
    if (!shareholderIdUrl || !dematFormUrl || !scannedCertsUrl) {
      toast.error("Please upload all required supporting documents.");
      return;
    }

    const selectedCerts = availableCerts.filter((c) => selectedCertIds.has(c.id));

    captureDemat(
      {
        register,
        chn: selectedHolder.chn || "",
        holderName: fullName(selectedHolder),
        broker: stockbroker,
        certificates: selectedCerts.map((c) => ({
          certNo: c.certNumber,
          units: c.units,
          certDate: format(new Date(c.issueDate || new Date()), "yyyy-MM-dd"),
        })),
        shareholderIdRef: shareholderIdUrl,
        dematFormRef: dematFormUrl,
        scannedCertsRef: scannedCertsUrl,
      },
      {
        onSuccess: () => {
          toast.success("Saved as draft.");
          resetForm();
          setActiveTab("callover");
        },
        onError: (err) => toast.error(`Failed to save draft: ${err.message}`),
      },
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Capture new physical certificates for dematerialisation or edit rejected
        records.
      </p>

      {/* REJECTED RECORDS ALERT */}
      {rejectedData &&
        rejectedData.content &&
        rejectedData.content.length > 0 && (
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
                  Review the comments from the callover officer and correct the
                  details below.
                </div>
                <div className="space-y-1.5 mt-1">
                  {rejectedData.content.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center gap-3 text-[13px] bg-red-100/50 p-2 rounded-lg border border-red-200/60"
                    >
                      <span className="font-mono text-red-800 truncate max-w-50 font-semibold">
                        {rec.certificates?.map((c) => c.certNo).join(", ") ||
                          "No Cert"}
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
                        }}
                      >
                        <Pencil className="h-3 w-3" /> Edit &amp; Resubmit
                      </Button>
                    </div>
                  ))}
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
                New Demat Capture
              </>
            )}
          </h2>
        </div>

        <div className="p-6 space-y-8">
          {/* ── Registration & Identity ── */}
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Registration &amp; Identity
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <RegisterSelect label="Register *" value={register} onChange={(val) => setRegister(val)} />
              <div className="space-y-2">
                <label className="mrpsl-label">Stockbroker *</label>
                <Select
                  value={stockbroker}
                  onValueChange={(value) => setStockbroker(value || "")}
                >
                  <SelectTrigger className="mrpsl-input h-11">
                    <SelectValue placeholder="Select Stockbroker" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingAgents ? (
                      <SelectItem value="_loading" disabled>
                        Loading Stockbrokers...
                      </SelectItem>
                    ) : (
                      stockBrokerList?.map((s: Agent) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name} · {s.code}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Shareholder search — full width */}
              <div className="space-y-2 col-span-2">
                <label className="mrpsl-label">Holder Search *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    className="mrpsl-input h-11 pl-9"
                    placeholder="Search by name, CHN or account number…"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      // Clear selected holder when user starts typing again
                      if (selectedHolder) {
                        setSelectedHolder(null);
                        setSelectedCertIds(new Set());
                      }
                    }}
                  />
                  {/* Dropdown */}
                  {debouncedSearch.length > 2 && !selectedHolder && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg overflow-hidden">
                      {isSearchingAccounts ? (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          No shareholders found for &quot;{debouncedSearch}&quot;
                        </div>
                      ) : (
                        <div className="max-h-[250px] overflow-y-auto">
                          {searchResults.map((acc) => (
                            <button
                              key={acc.id}
                              type="button"
                              className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors border-b last:border-0"
                              onClick={() => {
                                setSelectedHolder(acc);
                                setSearchTerm(fullName(acc));
                                setSelectedCertIds(new Set());
                              }}
                            >
                              <p className="text-sm font-medium">{fullName(acc)}</p>
                              <p className="text-[12px] text-muted-foreground font-mono">
                                {acc.accountNumber} · {acc.chn} · {acc.registerSymbol}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected holder pill */}
                {selectedHolder && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50/60 mt-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm font-mono">
                        {(selectedHolder.firstName?.[0] ?? "").toUpperCase()}
                        {(selectedHolder.lastName?.[0] ?? "").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-800">
                        {fullName(selectedHolder)}
                      </p>
                      <p className="text-[12px] text-muted-foreground font-mono">
                        {selectedHolder.accountNumber} · {selectedHolder.chn}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => {
                        setSelectedHolder(null);
                        setSearchTerm("");
                        setSelectedCertIds(new Set());
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Certificate Selection ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                Certificate Details
              </h3>
              {availableCerts.length > 0 && (
                <span className="text-[13px] text-muted-foreground">
                  {selectedCertIds.size} of {availableCerts.length} selected
                </span>
              )}
            </div>

            {!selectedHolder ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Search and select a shareholder above to load their active certificates.
              </div>
            ) : isLoadingCerts ? (
              <div className="rounded-xl border p-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading certificates…
              </div>
            ) : availableCerts.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6 text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                No active certificates found for this shareholder.
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="p-3 w-10">
                        <Checkbox
                          checked={selectedCertIds.size === availableCerts.length}
                          onCheckedChange={toggleAllCerts}
                        />
                      </th>
                      <th className="p-3">CERT NO</th>
                      <th className="p-3">REGISTER</th>
                      <th className="p-3 text-right">UNITS</th>
                      <th className="p-3">ISSUE DATE</th>
                      <th className="p-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {availableCerts.map((cert) => {
                      const isSelected = selectedCertIds.has(cert.id);
                      return (
                        <tr
                          key={cert.id}
                          className={cn(
                            "mrpsl-table-row cursor-pointer",
                            isSelected && "bg-primary/5",
                          )}
                          onClick={() => toggleCert(cert.id)}
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleCert(cert.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-3 font-mono font-semibold">{cert.certNumber}</td>
                          <td className="p-3 text-muted-foreground">{cert.registerSymbol}</td>
                          <td className="p-3 text-right font-mono">
                            {cert.units.toLocaleString()}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {cert.issueDate ? format(new Date(cert.issueDate), "dd MMM yyyy") : "—"}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                              {cert.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Total units summary */}
                <div className="flex justify-end px-4 py-2.5 border-t border-border/40 bg-muted/10">
                  <span className="text-[13px] font-bold text-muted-foreground">
                    Total Units:{" "}
                    <span className="text-foreground font-mono">
                      {availableCerts
                        .filter((c) => selectedCertIds.has(c.id))
                        .reduce((sum, c) => sum + c.units, 0)
                        .toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Supporting Documents ── */}
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
          <Button
            className="font-bold px-8 h-11"
            disabled={isCapturing}
            onClick={handleSubmit}
          >
            {isCapturing
              ? "Processing..."
              : editingRejectedId
                ? "Resubmit Record"
                : "Submit Record"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

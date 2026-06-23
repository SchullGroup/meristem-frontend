"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, Download, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetAgents, useGetAgentDetail, useGetAgentMandates, useUploadMandate, useBulkUploadMandate } from "@/hooks/useEnquiry";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils/format";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";
import { downloadMandateTemplate } from "@/actions/enquiryActions";
import RegisterSelect from "@/components/custom/register-select";

export default function AgentEnquiryPage() {
  const [query, setQuery] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedRegister, setSelectedRegister] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"ACTIVE" | "INACTIVE" | "">("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMandates, setShowMandates] = useState(false);
  const [mandatePage, setMandatePage] = useState(0);
  const [mandatePageSize, setMandatePageSize] = useState(20);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);


  const debouncedQuery = useDebounce(query, 300);

  // Fetch agents matching the debounced search term
  const { data: agentsData, isLoading: isLoadingAgents, isError: isErrorAgents } = useGetAgents(
    { q: debouncedQuery },
    { enabled: debouncedQuery.length > 2 && showDropdown }
  );

  // Fetch detailed information for the selected agent
  const { data: agentDetail, isLoading: isLoadingDetail, isError: isErrorDetail, error: detailError } = useGetAgentDetail(
    selectedAgentId,
    { enabled: !!selectedAgentId }
  );

  // Fetch mandates for the selected agent when they choose to view them
  const { data: mandatesData, isLoading: isLoadingMandates } = useGetAgentMandates(
    selectedAgentId,
    {
      page: mandatePage,
      size: mandatePageSize,
      registerSymbol: selectedRegister !== "" ? selectedRegister : undefined,
      status: selectedStatus !== "" ? selectedStatus : undefined
    },
    { enabled: !!selectedAgentId && showMandates }
  );

  // Template download mutation

  // Single upload state
  const [singleForm, setSingleForm] = useState({
    accountNo: "",
    holderName: "",
    registerId: "",
    name: "",
    position: "",
    email: "",
    phone: "",
    signatureFile: "",
    documentFile: "",
  });

  const uploadSingleMutation = useUploadMandate();

  // Bulk upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  // const [zipFile, setZipFile] = useState<File | null>(null);

  const uploadBulkMutation = useBulkUploadMandate();

  const resetSingleForm = () => {
    setSingleForm({
      accountNo: "",
      holderName: "",
      registerId: "",
      name: "",
      position: "",
      email: "",
      phone: "",
      signatureFile: "",
      documentFile: "",
    });
  };

  const handleSingleSubmit = () => {
    if (!selectedAgentId) return;

    uploadSingleMutation.mutate(singleForm, {
      onSuccess: () => {
        toast.success("Mandate uploaded successfully");
        setUploadDialogOpen(false);
        resetSingleForm();
      },
      onError: (error: any) => toast.error(error.message),
    });
  };

  const handleBulkSubmit = () => {
    if (!selectedAgentId || !csvFile) {
      toast.error("Please select CSV file");
      return;
    }
    const formData = new FormData();
    // formData.append("agentId", selectedAgentId);
    formData.append("data", csvFile);
    // formData.append("files", zipFile); // ZIP containing signature/document files

    uploadBulkMutation.mutate({
      data: formData,
      id: selectedAgentId
    }, {
      onSuccess: () => {
        toast.success("Bulk mandates uploaded successfully");
        setUploadDialogOpen(false);
        setCsvFile(null);
      },
      onError: (error: any) => toast.error(error.message),
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const blob = await downloadMandateTemplate("csv");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "agent-mandate-template.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to download template");
    } finally {
      setIsDownloading(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Enquiry</h1>
          <p className="text-sm text-muted-foreground mt-1">Search and view details for banks, stockbrokers, and collecting agents</p>
        </div>
      </div>

      <Card className="mrpsl-card p-5 max-w-2xl relative">
        <div className="space-y-2">
          <label className="mrpsl-label">Search Agent Name or Code</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="e.g. Zenith Bank"
              className="mrpsl-input pl-9 text-base h-12"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length <= 2) {
                  setSelectedAgentId("");
                  setShowDropdown(false);
                } else {
                  setShowDropdown(true);
                }
              }}
            />
          </div>
        </div>

        {/* Dropdown search results */}
        {showDropdown && debouncedQuery.length > 2 && (
          <div className="mt-1 bg-popover text-popover-foreground rounded-md border shadow-md z-50 max-h-60 overflow-y-auto">
            {isLoadingAgents ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : isErrorAgents ? (
              <div className="p-3 text-sm text-destructive">
                Error occurred while searching.
              </div>
            ) : !agentsData?.content || agentsData.content.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No agents found.
              </div>
            ) : (
              <div className="divide-y">
                {agentsData.content.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition flex justify-between items-center"
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setQuery(agent.agentName);
                      setShowDropdown(false);
                      setShowMandates(false);
                      setMandatePage(0);
                    }}
                  >
                    <div>
                      <span className="font-semibold">{agent.agentName}</span>
                      <span className="text-xs text-muted-foreground ml-2">({agent.agentCode})</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {agent.agentType?.replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {selectedAgentId && (
        <div className="space-y-6 w-full animate-in fade-in">
          {isLoadingDetail && (
            <div className="flex items-center justify-center p-8 bg-background rounded-lg border mrpsl-card">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground font-medium">Fetching agent details...</span>
            </div>
          )}

          {isErrorDetail && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Detail Fetch Failed</AlertTitle>
              <AlertDescription>
                {detailError instanceof Error ? detailError.message : "Could not retrieve details for the selected agent."}
              </AlertDescription>
            </Alert>
          )}

          {!isLoadingDetail && !isErrorDetail && agentDetail?.data && (
            <Card className="mrpsl-card p-6 space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold">{agentDetail?.data.agentName}</h2>
                  <div className="text-sm text-muted-foreground mt-1">
                    Agent Code: <span className="font-mono text-foreground font-bold">{agentDetail?.data.agentCode}</span>
                  </div>
                  {agentDetail?.data.cscsCode && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      CSCS Code: <span className="font-mono font-medium">{agentDetail?.data.cscsCode}</span>
                    </div>
                  )}
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-0 text-xs uppercase font-semibold">
                  {agentDetail?.data.agentType?.replace("_", " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="mrpsl-section-title border-b pb-2">Profile</h3>
                  <div className="text-sm">
                    <span className="text-muted-foreground block text-xs">Address</span>
                    <span className="font-medium">{agentDetail?.data.primaryAddress || "N/A"}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground block text-xs">Status</span>
                    <Badge className={
                      agentDetail?.data.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 border-0 text-xs mt-1"
                        : "bg-red-100 text-red-800 border-0 text-xs mt-1"
                    }>
                      {agentDetail?.data.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="mrpsl-section-title border-b pb-2">Sub-Records</h3>
                  <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded border border-dashed flex justify-between items-center">
                    <span>Signatures: None uploaded</span>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded border border-dashed flex justify-between items-center">
                    <span>Mandates: {agentDetail?.data.totalMandates || 0} total ({agentDetail?.data.activeMandates || 0} active)</span>
                    <div className="flex items-center gap-2">
                      {/* Download Template button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        disabled={isDownloading}
                        className="h-auto p-0 font-bold"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Template
                      </Button>
                      {/* Upload button */}
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 font-bold"
                        onClick={() => setShowMandates(!showMandates)}
                      >
                        {showMandates ? "Hide table" : "View table"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadDialogOpen(true)}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {showMandates && (
                <div className="space-y-3 pt-4 border-t animate-in slide-in-from-top duration-200">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Mandate List</h3>
                  <div className="flex items-center gap-5 max-w-md">
                    <RegisterSelect label="Register *" value={selectedRegister} onChange={(value) => setSelectedRegister(value)} enabled={showMandates || !isLoadingMandates} />
                    <div className="space-y-1.5">
                      <Select
                        value={selectedStatus}
                        onValueChange={(v) => setSelectedStatus(v ?? "")}
                      >
                        <SelectTrigger className="mrpsl-input w-40">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Select Status</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted text-muted-foreground uppercase font-bold text-[10px]">
                          <tr>
                            <th className="p-2.5">Account No</th>
                            <th className="p-2.5">Holder Name</th>
                            <th className="p-2.5">Register</th>
                            <th className="p-2.5">Mandate Date</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-mono">
                          {isLoadingMandates ? (
                            <tr>
                              <td colSpan={10}>
                                <div className="flex justify-center p-4">
                                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                              </td>
                            </tr>
                          ) :
                            mandatesData?.content && mandatesData?.content?.length > 0 ?
                              mandatesData.content.map((mandate, idx) => (
                                <tr key={idx} className="hover:bg-accent/5">
                                  <td className="p-2.5 font-bold">{mandate?.accountNo}</td>
                                  <td className="p-2.5 font-sans font-medium">{mandate?.holderName}</td>
                                  <td className="p-2.5 text-primary font-sans font-medium">{mandate?.registerSymbol}</td>
                                  <td className="p-2.5">{formatDate(mandate?.mandateDate)}</td>
                                  <td className="p-2.5 font-sans">
                                    <Badge className={
                                      mandate?.status === "ACTIVE"
                                        ? "bg-green-50 text-green-700 hover:bg-green-50 border-green-200/50 text-[10px]"
                                        : "bg-red-50 text-red-700 hover:bg-red-50 border-red-200/50 text-[10px]"
                                    }>
                                      {mandate?.status}
                                    </Badge>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td
                                    colSpan={10}
                                    className="px-4 py-12 text-center text-muted-foreground text-sm"
                                  >
                                    No mandates uploaded for this agent.
                                  </td>
                                </tr>


                              )}

                        </tbody>
                      </table>
                    </div>

                    <PaginationBar
                      page={mandatePage}
                      pageSize={mandatePageSize}
                      totalPages={mandatesData?.totalPages || 1}
                      total={mandatesData?.totalElements || 0}
                      onPageChange={setMandatePage}
                      onPageSizeChange={setMandatePageSize}
                    />
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Upload Mandate Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[700px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Mandates for {agentDetail?.data?.agentName}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="single" className="px-4">
            <TabsList className="p-2">
              <TabsTrigger value="single">Single Mandate</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label>Name (Signatory)</label>
                  <Input value={singleForm.name} onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label>Position</label>
                  <Input value={singleForm.position} onChange={(e) => setSingleForm({ ...singleForm, position: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <RegisterSelect label="Register *" value={singleForm.registerId} onChange={(value) => setSingleForm({ ...singleForm, registerId: value })} />
                </div>
                <div className="space-y-1.5">
                  <label>Email</label>
                  <Input type="email" value={singleForm.email} onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label>Phone</label>
                  <Input value={singleForm.phone} onChange={(e) => setSingleForm({ ...singleForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <DocUploadZone maxSizeMB={10} label="Signature" required fileTypes={["image"]} onUploadSuccess={(value) => setSingleForm({ ...singleForm, signatureFile: value })} />

                </div>
                <div className="space-y-1.5">
                  <DocUploadZone maxSizeMB={10} label="Document" required fileTypes={["pdf"]} onUploadSuccess={(value) => setSingleForm({ ...singleForm, documentFile: value })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSingleSubmit} disabled={uploadSingleMutation.isPending}>
                  {uploadSingleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upload Mandate
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4 py-4">
              <div className="rounded border border-dashed p-4 bg-muted/20 text-sm text-muted-foreground">
                <p className="font-medium mb-2">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Download the CSV template and fill in the required columns.</li>
                  <li>Place all signature and document files referenced in the template into a ZIP file. Ensure file names match exactly.</li>
                  <li>Upload the CSV and the ZIP file below.</li>
                </ol>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label>CSV Template</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={isDownloading}>
                      <Download className="h-4 w-4 mr-1" /> Template
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label>Upload CSV</label>
                  <Input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                  {csvFile && <span className="text-xs text-green-600">{csvFile.name}</span>}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleBulkSubmit} disabled={!csvFile || uploadBulkMutation.isPending}>
                  {uploadBulkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upload Bulk
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
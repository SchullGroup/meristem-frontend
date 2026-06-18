"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetAgents, useGetAgentDetail, useGetAgentMandates } from "@/hooks/useEnquiry";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils/format";
import { PaginationBar } from "@/components/custom/pagination-bar";

export default function AgentEnquiryPage() {
  const [query, setQuery] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMandates, setShowMandates] = useState(false);
  const [mandatePage, setMandatePage] = useState(0);
  const [mandatePageSize, setMandatePageSize] = useState(20);

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
    },
    { enabled: !!selectedAgentId && showMandates }
  );

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
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 font-bold"
                      onClick={() => setShowMandates(!showMandates)}
                    >
                      {showMandates ? "Hide table" : "View table"}
                    </Button>
                  </div>
                </div>
              </div>

              {showMandates && (
                <div className="space-y-3 pt-4 border-t animate-in slide-in-from-top duration-200">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Mandate List</h3>
                  {isLoadingMandates ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
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
                            {
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
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
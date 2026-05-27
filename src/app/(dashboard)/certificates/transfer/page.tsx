"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transfer } from "@/components/custom/certificate-transfer/transfer";
import { PendingApprovals } from "@/components/custom/certificate-transfer/pending-approvals";
import { ApprovedTransfers } from "@/components/custom/certificate-transfer/approved-transfers";


export default function TransferPage() {
  const [activeTab, setActiveTab] = useState("transfer");


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Transfer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transfer ownership of units between accounts
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "transfer")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="transfer"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Transfer
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Approved Transfers
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="transfer" className="space-y-6">
            <Transfer setTab={setActiveTab} />
            {/* {rejectedIds.size > 0 && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-sm text-red-800">
                      {rejectedIds.size === 1
                        ? "Request Rejected"
                        : `${rejectedIds.size} Requests Rejected`}
                    </div>
                    <div className="text-[13px] text-red-700">
                      {lastRejComment || "No comment provided."}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRejectedIds(new Set());
                      setLastRejComment("");
                      setEditingRejected(null);
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
                      const item = PENDING_TRANSFERS.find((t) =>
                        rejectedIds.has(t.id),
                      );
                      if (item) {
                        setEditingRejected(item);
                        setSrcLoaded(true);
                        setDestLoaded(true);
                        setUnits(String(item.units));
                        setStampDuty(String(item.stampDuty));
                      }
                      setRejectedIds(new Set());
                      setLastRejComment("");
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit &amp; Resubmit
                  </Button>
                </div>
              </Card>
            )}
            {editingRejected && (
              <Card className="mrpsl-card p-3 border-l-4 border-l-amber-400 bg-amber-50/60 border-amber-200 flex items-center gap-3">
                <Pencil className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-[13px] text-amber-800 font-medium flex-1">
                  Editing rejected transfer of{" "}
                  <span className="font-semibold">
                    {editingRejected.units.toLocaleString()} units
                  </span>{" "}
                  from{" "}
                  <span className="font-semibold">{editingRejected.from}</span>{" "}
                  to <span className="font-semibold">{editingRejected.to}</span>
                  .
                </p>
                <button
                  onClick={() => {
                    setEditingRejected(null);
                    setSrcLoaded(false);
                    setDestLoaded(false);
                    setUnits("");
                    setStampDuty("");
                  }}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )}
            <div className="grid grid-cols-2 gap-6">
              <Card className="mrpsl-card p-4 space-y-4">
                <div className="font-semibold text-sm border-b pb-2">
                  Transferor (Source)
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Account Search" className="mrpsl-input" />
                  <Button onClick={() => setSrcLoaded(true)}>Search</Button>
                </div>
                {srcLoaded && (
                  <div className="bg-muted/20 p-3 rounded text-sm space-y-1">
                    <div className="font-bold">Binta Lawal</div>
                    <div className="text-muted-foreground font-mono">
                      DANGCEM-10015
                    </div>
                    <div className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded inline-block mt-0.5">
                      Dangote Cement — DANGCEM
                    </div>
                    <div className="font-mono text-lg font-bold mt-2">
                      15,000 units
                    </div>
                  </div>
                )}
              </Card>

              <Card className="mrpsl-card p-4 space-y-4">
                <div className="font-semibold text-sm border-b pb-2">
                  Transferee (Destination)
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Account Search" className="mrpsl-input" />
                  <Button onClick={() => setDestLoaded(true)}>Search</Button>
                </div>
                {destLoaded && (
                  <div className="bg-muted/20 p-3 rounded text-sm space-y-1">
                    <div className="font-bold">Adeyemi John</div>
                    <div className="text-muted-foreground font-mono">
                      DANGCEM-10088
                    </div>
                    <div className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded inline-block mt-0.5">
                      Dangote Cement — DANGCEM
                    </div>
                    <div className="font-mono text-lg font-bold mt-2">
                      2,500 units
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {srcLoaded && destLoaded && (
              <Card className="mrpsl-card p-6 space-y-4 animate-in fade-in">
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
                      placeholder={
                        editingRejected ? String(editingRejected.units) : ""
                      }
                      className="mrpsl-input font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">
                      Instrument of Transfer Ref *
                    </label>
                    <Input className="mrpsl-input" />
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
                    <label className="mrpsl-label">Upload IoT Document</label>
                    <Input type="file" className="mrpsl-input" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Comment</label>
                  <Textarea />
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    size="lg"
                    onClick={() => {
                      toast.success("Transfer submitted for approval");
                      setEditingRejected(null);
                      setSrcLoaded(false);
                      setDestLoaded(false);
                      setUnits("");
                      setStampDuty("");
                    }}
                  >
                    {editingRejected ? "Resubmit Transfer" : "Submit Transfer"}
                  </Button>
                </div>
              </Card>
            )} */}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <PendingApprovals />
            {/* {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                <span className="text-sm font-semibold text-primary">
                  {selectedIds.size} selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => setBatchRejectOpen(true)}
                  >
                    Reject Selected
                  </Button>
                  <Button size="sm" onClick={handleBatchApprove}>
                    Approve Selected
                  </Button>
                </div>
              </div>
            )}
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={transferAllSelected}
                        onCheckedChange={() =>
                          toggleSelectAll(visibleTransferIds)
                        }
                      />
                    </th>
                    <th className="p-3">DATE</th>
                    <th className="p-3">CERTIFICATE</th>
                    <th className="p-3">FROM</th>
                    <th className="p-3">TO</th>
                    <th className="p-3">UNITS</th>
                    <th className="p-3">STAMP DUTY</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {transferPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </td>
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.cert}</td>
                      <td className="p-3">
                        <div className="font-medium">{row.from}</div>
                        <div className="font-mono text-muted-foreground text-[13px]">
                          {row.fromAcct}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{row.to}</div>
                        <div className="font-mono text-muted-foreground text-[13px]">
                          {row.toAcct}
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        {row.units.toLocaleString()}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        ₦{row.stampDuty.toLocaleString()}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.submittedBy}
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" onClick={() => openReview(row)}>
                          Review &amp; Decide
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {transferPg.total === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-12 text-center text-muted-foreground"
                      >
                        No pending transfer approvals.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={transferPg.page}
              pageSize={transferPg.pageSize}
              totalPages={transferPg.totalPages}
              from={transferPg.from}
              to={transferPg.to}
              total={transferPg.total}
              onPageChange={transferPg.setPage}
              onPageSizeChange={transferPg.setPageSize}
            /> */}
          </TabsContent>
          <TabsContent value="approved" className="space-y-4">
            <ApprovedTransfers />
          </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}

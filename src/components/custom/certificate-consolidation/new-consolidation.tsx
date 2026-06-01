"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2, AlertCircle, X, Pencil } from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useGetAllCertificates } from "@/hooks/useCertificates";
import {
  useSubmitConsolidationRequest,
  useGetAllCertConsolidations,
} from "@/hooks/useCertConsolidation";
import { CertificateConsolidation } from "@/types/cscs";
import { formatDate } from "@/lib/utils/format";

export default function NewConsolidation({
  setTab,
}: {
  setTab: (tab: string) => void;
}) {
  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  const [selectedRegister, setSelectedRegister] = useState("All");
  const [certsLoaded, setCertsLoaded] = useState(false);
  const [editingRejected, setEditingRejected] =
    useState<CertificateConsolidation | null>(null);
  const [search, setSearch] = useState("");
  const [autoLoad, setAutoLoad] = useState(false);
  const [hiddenRejectedIds, setHiddenRejectedIds] = useState<Set<string>>(
    new Set(),
  );

  const currentUser = useStore((state) => state.currentUser);

  const { data, isLoading, refetch } = useGetAllCertificates(
    {
      registerId: selectedRegister !== "All" ? selectedRegister : undefined,
      accountNumber: search !== "" ? search : undefined,
      status: "ACTIVE",
    },
    {
      enabled: false, // We will manually trigger refetch on button click
    },
  );

  const certList = data?.data?.content || [];
  const firstCert = certList[0];

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [consolOpen, setConsolOpen] = useState(false);
  const [newCertNumber, setNewCertNumber] = useState("");
  const [reason, setReason] = useState("");

  const submitMutation = useSubmitConsolidationRequest();

  const { data: rejectedData } = useGetAllCertConsolidations({
    status: "REJECTED",
  });

  const rejectedConsols: CertificateConsolidation[] =
    rejectedData?.data?.content || [];
  const visibleRejectedConsols = rejectedConsols.filter(
    (c) => !hiddenRejectedIds.has(c.id),
  );

  const handleLoadCertificates = () => {
    if (!search) {
      toast.error("Please enter an account number.");
      return;
    }
    refetch().then(() => setCertsLoaded(true));
  };

  useEffect(() => {
    if (autoLoad && search) {
      handleLoadCertificates();
      //eslint-disable-next-line
      setAutoLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, autoLoad]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  };

  const handleSubmitConsolidation = () => {
    if (!newCertNumber.trim()) {
      toast.error("Please enter the new certificate number.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter a reason for consolidation.");
      return;
    }

    submitMutation.mutate(
      {
        certIds: Array.from(selectedIds),
        newCertNumber,
        reason,
        submittedBy:
          currentUser?.username ||
          `${currentUser?.firstName} ${currentUser?.lastName}` ||
          "ADMIN",
      },
      {
        onSuccess: () => {
          toast.success("Consolidation submitted for authorizer review.");
          setConsolOpen(false);
          setNewCertNumber("");
          setReason("");
          setSelectedIds(new Set());
          setCertsLoaded(false);
          setSearch("");
          setEditingRejected(null);
          setTab("auth"); // Move to pending approvals tab
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to submit consolidation request.");
        },
      },
    );
  };

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 pb-2 gap-4">
        {visibleRejectedConsols.map((item) => (
          <Card
            key={item.id}
            className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 mb-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-sm text-red-800">
                  Consolidation Request Rejected - {item.accountNumber}
                </div>
                <div className="text-[13px] text-red-700">
                  {item.authoriserComment || "No comment provided."}
                </div>
              </div>
              <button
                onClick={() => {
                  setHiddenRejectedIds((prev) => new Set(prev).add(item.id));
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
                  setSearch(item.accountNumber);
                  setSelectedRegister(item.registerId);
                  setNewCertNumber(item.newCertNumber);
                  setReason(item.reason);
                  setHiddenRejectedIds((prev) => new Set(prev).add(item.id));
                  setAutoLoad(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit &amp; Resubmit
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {editingRejected && (
        <Card className="mrpsl-card p-3 border-l-4 border-l-amber-400 bg-amber-50/60 border-amber-200 flex items-center gap-3 mb-4">
          <Pencil className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-[13px] text-amber-800 font-medium flex-1">
            Editing rejected consolidation for account{" "}
            <span className="font-semibold">
              {editingRejected.accountNumber}
            </span>{" "}
            — {editingRejected.certCount} certificates,{" "}
            {editingRejected.totalUnits?.toLocaleString()} units.
          </p>
          <button
            onClick={() => {
              setEditingRejected(null);
              setCertsLoaded(false);
              setSearch("");
              setNewCertNumber("");
              setReason("");
            }}
            className="text-amber-500 hover:text-amber-700"
          >
            <X className="h-4 w-4" />
          </button>
        </Card>
      )}

      <Card className="mrpsl-card p-4">
        <div className="flex items-end gap-3">
          <div className="flex flex-col">
            <label className="mrpsl-label">Register</label>
            <Select
              value={selectedRegister}
              onValueChange={(v) => setSelectedRegister(v || "All")}
            >
              {" "}
              <SelectTrigger className="w-52 mrpsl-input">
                <SelectValue placeholder="Select register" />
              </SelectTrigger>
              <SelectContent className="w-max">
                <SelectItem value="All">All Registers</SelectItem>
                {activeRegisters?.content?.map((r) => (
                  <SelectItem key={r.registerId} value={r.registerId}>
                    {r.registerName} · {r.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleLoadCertificates();
            }}
          >
            <div className="flex flex-col">
              <label className="mrpsl-label">Account No or CHN</label>
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. DANGCEM-10015 or C00001EL"
                className="mrpsl-input w-64"
              />
            </div>
            <Button
              size="xl"
              onClick={handleLoadCertificates}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Load Certificates
            </Button>
          </form>
        </div>
      </Card>

      {certsLoaded && certList.length > 0 && (
        <div className="space-y-4 animate-in fade-in">
          <Card className="mrpsl-card p-4 bg-green-50/60 border-green-200">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">
                  {firstCert?.shareholderName
                    ? firstCert.shareholderName.substring(0, 2).toUpperCase()
                    : "SH"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-green-900">
                  {firstCert?.shareholderName}
                </div>
                <div className="font-mono text-[13px] text-green-700">
                  {firstCert?.accountNumber}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] font-semibold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded mb-1">
                  {firstCert?.registerName} — {firstCert?.registerSymbol}
                </div>
                <div className="font-mono text-sm font-bold text-green-900">
                  {certList
                    .reduce((acc, cert) => acc + (cert.units || 0), 0)
                    .toLocaleString()}{" "}
                  total units
                </div>
              </div>
            </div>
          </Card>

          <Card className="mrpsl-card">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={
                        certList.length > 0 &&
                        selectedIds.size === certList.length
                      }
                      onCheckedChange={() =>
                        toggleSelectAll(certList.map((c) => c.id))
                      }
                    />
                  </th>
                  <th className="p-3">CERT NO</th>
                  <th className="p-3">UNITS</th>
                  <th className="p-3">ISSUE DATE</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {certList.map((c) => (
                  <tr key={c.id} className="hover:bg-accent/5">
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.has(c.id)}
                        onCheckedChange={() => toggleSelect(c.id)}
                      />
                    </td>
                    <td className="p-3 font-mono text-[13px]">
                      {c.certNumber}
                    </td>
                    <td className="p-3 font-mono text-right">
                      {c.units?.toLocaleString()}
                    </td>
                    <td className="p-3 text-muted-foreground text-[13px]">
                      {c.issueDate ? formatDate(c.issueDate) : "N/A"}
                    </td>
                    <td className="p-3">
                      <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {selectedIds.size > 0 && (
            <div className="sticky bottom-4 z-10">
              <Card className="mrpsl-card bg-card shadow-lg border-primary/25 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">
                      {selectedIds.size}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">
                      {selectedIds.size} certificate
                      {selectedIds.size !== 1 ? "s" : ""} selected
                    </div>
                    <div className="text-[13px] text-muted-foreground tabular-nums mt-0.5">
                      {certList
                        .filter((c) => selectedIds.has(c.id))
                        .reduce((acc, cert) => acc + (cert.units || 0), 0)
                        .toLocaleString()}{" "}
                      total units
                    </div>
                  </div>
                </div>
                <Button onClick={() => setConsolOpen(true)}>
                  Consolidate Selected
                </Button>
              </Card>
            </div>
          )}
        </div>
      )}

      {certsLoaded && certList.length === 0 && (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-muted-foreground mt-4">
          <p>No active certificates found for this account number.</p>
        </Card>
      )}

      <Dialog open={consolOpen} onOpenChange={setConsolOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Consolidation Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <label className="mrpsl-label">
                New Certificate Number{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                value={newCertNumber}
                onChange={(e) => setNewCertNumber(e.target.value)}
                placeholder="Enter new certificate number"
              />
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">
                Reason for Consolidation{" "}
                <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g. Shareholder request"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConsolOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitConsolidation}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit for Approval
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

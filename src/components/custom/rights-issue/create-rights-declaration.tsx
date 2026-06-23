"use client";

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

import DateInput from "@/components/ui/date-input";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  useCreateRightsIssue,
  useGetRightsIssueShareholders,
  useSubmitForApproval,
  useAllRightsIssues,
} from "@/hooks/useRights";
import { CreateRightsIssue } from "@/types/rights";
import { toast } from "sonner";
import { PaginationBar } from "../pagination-bar";
import {
  ShholderTableHead,
  ShholderRows,
  ShholderTfoot,
} from "./entitlement-table";
import { Download, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { EntitlementStatsSkeleton, EntitlementTableSkeleton } from "./loaders";
import { DataErrorState } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function CreateRightsDeclaration() {
  const router = useRouter();

  const { data: activeRegisters, isLoading: loadingRegisters } =
    useGetRegisters({ status: "ACTIVE" });
  const [createdIssueId, setCreatedIssueId] = useState<string>("");
  const [computed, setComputed] = useState(false);
  const [newRightsIssue, setNewRightsIssue] = useState({
    registerId: "",
    issueName: "",
    issuePrice: 0.01,
    ratioNew: 1,
    ratioExisting: 1,
    allotmentDate: new Date(),
    closureDate: new Date(),
    qualificationDate: new Date(),
    narrative: "",
  });

  // show rejected rights issues if exist
  const { currentUser, setCurrentUser } = useStore();
  const { data: rejectedData } = useAllRightsIssues({
    status: "AUTH_REJECTED",
  });

  const allRejectedBatches = rejectedData?.content || [];
  const [hiddenRejectedIds, setHiddenRejectedIds] = useState<Set<string>>(
    new Set(),
  );
  const rejectedBatches = allRejectedBatches.filter(
    (b) => !hiddenRejectedIds.has(b.id),
  );
  const [showRejected, setShowRejected] = useState(false);

  // Pagination
  const [declPage, setDeclPage] = useState(1);
  const [retryId, setRetryId] = useState<string | null>(null);

  // Fetch rejected declaration details for retry directly from store rejections
  const retryDeclarationData = rejectedBatches.find((b) => b.id === retryId);

  useEffect(() => {
    if (retryDeclarationData) {
      // Parse ratio (e.g. "1:2")
      const ratioParts = retryDeclarationData.ratio
        ? retryDeclarationData.ratio.split(":")
        : ["1", "2"];
      const ratioNew = parseInt(ratioParts[0]) || 1;
      const ratioExisting = parseInt(ratioParts[1]) || 2;

      // prefill the form with the rejected declaration details
      // eslint-disable-next-line
      setNewRightsIssue((prev) => ({
        ...prev,
        registerId: retryDeclarationData.registerId || "",
        issueName: retryDeclarationData.offerName || "",
        issuePrice: retryDeclarationData.issuePrice || 0.01,
        ratioNew,
        ratioExisting,
        allotmentDate: retryDeclarationData.allotmentDate
          ? new Date(retryDeclarationData.allotmentDate)
          : new Date(),
        closureDate: retryDeclarationData.closureDate
          ? new Date(retryDeclarationData.closureDate)
          : new Date(),
        qualificationDate: retryDeclarationData.qualificationDate
          ? new Date(retryDeclarationData.qualificationDate)
          : new Date(),
        narrative: retryDeclarationData.narrative || "",
      }));
      toast.success("Form prefilled with rejected declaration details.");
    }
  }, [retryDeclarationData]);

  // Hooks
  const createMutation = useCreateRightsIssue();
  const submitMutation = useSubmitForApproval();

  const {
    data: shareholdersData,
    isLoading: shLoading,
    isError: shError,
    refetch: refetchSh,
  } = useGetRightsIssueShareholders({
    params: {
      id: createdIssueId || "",
      page: declPage,
      pageSize: 10,
    },
    options: {
      enabled: computed && !!createdIssueId && createdIssueId.length > 0,
    },
  });

  /* handlers */
  const handleDeclare = () => {
    if (!newRightsIssue.registerId || !newRightsIssue.issueName) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!currentUser) {
      toast.error("You session has expired. Please login again to continue");
      setCurrentUser(null);
      router.push("/login");
      return;
    }

    const payload: CreateRightsIssue = {
      registerId: newRightsIssue.registerId,
      offerName: newRightsIssue.issueName,
      ratio: `${newRightsIssue.ratioNew}:${newRightsIssue.ratioExisting}`,
      issuePrice: newRightsIssue.issuePrice,
      qualificationDate: format(newRightsIssue.qualificationDate, "yyyy-MM-dd"),
      closureDate: format(newRightsIssue.closureDate, "yyyy-MM-dd"),
      allotmentDate: format(newRightsIssue.allotmentDate, "yyyy-MM-dd"), // Default or add another field
      narrative: newRightsIssue.narrative,
      createdBy: currentUser?.email,
      declarationId: retryId || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: (data) => {
        const newId = data?.data?.id.toString();
        setCreatedIssueId(newId);
        toast.success("Rights issue declared successfully.");
        setComputed(true);
      },
      onError: (err) => {
        const errorMessage = new Error(returnErrorMessage(err as ErrorLike));
        toast.error(errorMessage?.message || "Failed to declare rights issue");
      },
    });
  };

  const handleResetForm = () => {
    setNewRightsIssue({
      registerId: "",
      issueName: "",
      issuePrice: 0.01,
      ratioNew: 1,
      ratioExisting: 2,
      allotmentDate: new Date(),
      closureDate: new Date(),
      qualificationDate: new Date(),
      narrative: "",
    });
    setCreatedIssueId("");
    setComputed(false);
    setRetryId(null);
    toast.success("Form reset successfully.");
  };

  const handleSubmitForApproval = () => {
    submitMutation.mutate(createdIssueId || "", {
      onSuccess: () => {
        toast.success("Declaration submitted for approval.");
        // Clear rejection state
        // clearRejectedBatches();
        // Reset state
        setCreatedIssueId("");
        setComputed(false);
        setRetryId(null);
        setNewRightsIssue({
          registerId: "",
          issueName: "",
          issuePrice: 0.01,
          ratioNew: 1,
          ratioExisting: 2,
          allotmentDate: new Date(),
          closureDate: new Date(),
          qualificationDate: new Date(),
          narrative: "",
        });
      },
      onError: (err) => {
        const errorMessage = new Error(returnErrorMessage(err as ErrorLike));
        toast.error(errorMessage?.message || "Failed to submit for approval");
      },
    });
  };

  return (
    <>
      {/* Rejected Rights declarations toggle */}
      {rejectedBatches && rejectedBatches.length > 0 && !showRejected && (
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowRejected(true)}
            className="border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            View Rejected Declarations ({rejectedBatches.length})
          </Button>
        </div>
      )}

      {/* Rejected Rights declarations list */}
      {rejectedBatches && rejectedBatches.length > 0 && showRejected && (
        <div className="space-y-4 mb-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-red-800 text-sm">
              Action Required: Rejected Declarations
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
            {rejectedBatches.map((batch) => (
              <Card
                key={batch.ref}
                className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 w-full shrink-0"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">
                      Declaration Rejected — Ref: {batch.ref}
                    </p>
                    <p className="text-[13px] text-red-700 mt-0.5">
                      Authorizer comment:{" "}
                      {batch.authorizedReason || "No comment provided."}
                    </p>
                    <div className="text-[13px] text-muted-foreground mt-1.5 flex flex-col gap-2">
                      <span>
                        Please review the entitlement data and resubmit for
                        approval.
                      </span>
                      {batch.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRetryId(batch.id || null);
                            toast.info(
                              `Loading declaration details for ${batch.ref}...`,
                            );
                            setHiddenRejectedIds((prev) =>
                              new Set(prev).add(batch.id),
                            );
                            setShowRejected(false);
                          }}
                          className="h-7 px-3 text-xs bg-red-100 hover:bg-red-200 border-0 text-red-800 self-start"
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setHiddenRejectedIds((prev) =>
                        new Set(prev).add(batch.id),
                      );
                      if (rejectedBatches.length <= 1) setShowRejected(false);
                    }}
                    className="rounded-full hover:bg-red-100 p-0.5"
                  >
                    <X className="h-3.5 w-3.5 text-red-600" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="mrpsl-card p-6">
        <h2 className="font-semibold text-lg border-b pb-2 mb-4">
          New Rights Declaration
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mrpsl-label">Register *</label>

              <Select
                value={newRightsIssue.registerId}
                onValueChange={(value) =>
                  setNewRightsIssue({
                    ...newRightsIssue,
                    registerId: value || "",
                  })
                }
              >
                <SelectTrigger className="mrpsl-input">
                  <SelectValue placeholder="Select Register" />
                </SelectTrigger>
                <SelectContent>
                  {loadingRegisters ? (
                    <div className="py-10 flex items-center justify-center">
                      <Loader2 className="animate-spin w-4 h-4" />
                    </div>
                  ) : (
                    <>
                      <SelectItem value="">All Register</SelectItem>
                      {activeRegisters?.content?.map((r) => (
                        <SelectItem key={r.registerId} value={r.symbol}>
                          <span className="font-bold">{r.registerName}</span> -{" "}
                          <span className="text-xs translate-y-0.5">
                            {r.symbol}
                          </span>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Rights Issue Name *</label>
              <Input
                value={newRightsIssue.issueName}
                onChange={(e) =>
                  setNewRightsIssue({
                    ...newRightsIssue,
                    issueName: e.target.value,
                  })
                }
                placeholder="e.g. Zenith Bank 2026 Rights Issue 1-for-2"
                className="mrpsl-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="mrpsl-label">Rights Ratio</label>
            <div className="flex items-center gap-3">
              <Input
                value={newRightsIssue.ratioNew}
                onChange={(e) =>
                  setNewRightsIssue({
                    ...newRightsIssue,
                    ratioNew: +e.target.value,
                  })
                }
                min={1}
                type="number"
                defaultValue="1"
                className="w-20 font-mono mrpsl-input"
              />
              <span className="text-sm font-medium">for</span>
              <Input
                value={newRightsIssue.ratioExisting}
                onChange={(e) =>
                  setNewRightsIssue({
                    ...newRightsIssue,
                    ratioExisting: +e.target.value,
                  })
                }
                min={1}
                type="number"
                defaultValue="2"
                className="w-20 font-mono mrpsl-input"
              />
              <span className="text-sm text-muted-foreground ml-2 italic">
                {newRightsIssue.ratioNew} new share for every{" "}
                {newRightsIssue.ratioExisting} held
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <DateInput
              date={newRightsIssue.qualificationDate}
              setDate={(date) =>
                setNewRightsIssue({
                  ...newRightsIssue,
                  qualificationDate: date,
                })
              }
              // label="Record Date"
              label="Qualification Date"
            />

            <DateInput
              date={newRightsIssue.closureDate}
              setDate={(date) =>
                setNewRightsIssue({ ...newRightsIssue, closureDate: date })
              }
              // label="Acceptance Close"
              label="Closure Date"
            />

            <DateInput
              date={newRightsIssue.allotmentDate}
              setDate={(date) =>
                setNewRightsIssue({ ...newRightsIssue, allotmentDate: date })
              }
              // label="Acceptance Open"
              label="Allotment Date"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mrpsl-label">Issue Price (₦) *</label>
              <Input
                value={newRightsIssue.issuePrice}
                type="number"
                step="0.01"
                min={0}
                onChange={(e) =>
                  setNewRightsIssue({
                    ...newRightsIssue,
                    issuePrice: +e.target.value,
                  })
                }
                className="mrpsl-input font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Offer Circular Reference</label>
              <Input
                value={newRightsIssue.narrative}
                onChange={(e) =>
                  setNewRightsIssue({
                    ...newRightsIssue,
                    narrative: e.target.value,
                  })
                }
                className="mrpsl-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <Button onClick={handleDeclare} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {createMutation.isPending ? "Computing..." : "Compute Rights Due"}
            </Button>
            {(retryId ||
              newRightsIssue.registerId !== "" ||
              newRightsIssue.issueName !== "") && (
              <Button
                variant="outline"
                onClick={handleResetForm}
                disabled={createMutation.isPending}
              >
                Reset Form
              </Button>
            )}
          </div>
          {computed && (
            <div className="flex items-center gap-2 mt-2 text-green-700 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Declaration & Entitlements Computed
            </div>
          )}
        </div>

        {computed && (
          <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 border-t pt-8">
            {shLoading ? (
              <EntitlementStatsSkeleton />
            ) : shError ? (
              <DataErrorState
                message="Failed to load stats"
                onRetry={refetchSh}
              />
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    // label: "Eligible Shareholders",
                    label: "Total Shareholders",
                    value:
                      shareholdersData?.stats?.totalShareholders?.toLocaleString() ||
                      "0",
                    color: "text-foreground",
                  },
                  {
                    //   label: "Rights Declared",
                    label: "Total Rights Due",
                    value:
                      shareholdersData?.stats?.totalRightsDue?.toLocaleString() ||
                      "0",
                    color: "text-blue-600",
                  },
                  {
                    label: "Total Amount Due (₦)",
                    value: `₦${shareholdersData?.stats?.totalAmountDue.toLocaleString() || "0"}`,
                    color: "text-foreground",
                  },
                  {
                    // label: "Fractional Shares",
                    label: "Total Units Held",
                    value:
                      shareholdersData?.stats?.totalUnitsHeld?.toLocaleString() ||
                      "0",
                    color: "text-amber-600",
                  },
                ].map((s) => (
                  <Card key={s.label} className="mrpsl-card p-3">
                    <div className="mrpsl-section-title">{s.label}</div>
                    <div
                      className={cn(
                        "text-xl font-mono font-bold mt-1",
                        s.color,
                      )}
                    >
                      {s.value}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {shLoading ? (
              <EntitlementTableSkeleton />
            ) : shError ? (
              <DataErrorState
                message="Failed to load shareholders"
                onRetry={refetchSh}
              />
            ) : (
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <ShholderTableHead />
                    <tbody className="divide-y">
                      <ShholderRows
                        rows={shareholdersData?.content || []}
                        pageStart={declPage * 10}
                      />
                    </tbody>
                    <ShholderTfoot
                      rows={shareholdersData?.content || []}
                      total={shareholdersData?.pagination.total || 0}
                    />
                  </table>
                </div>
                {shareholdersData?.pagination && (
                  <PaginationBar
                    page={declPage}
                    total={shareholdersData.pagination.total}
                    pageSize={10}
                    onPageChange={setDeclPage}
                    pageBase={1}
                  />
                )}
              </Card>
            )}

            <div className="flex justify-between items-center border-t pt-4">
              <Button
                variant="outline"
                onClick={() => toast.info("Downloading entitlement list...")}
              >
                <Download className="mr-2 h-4 w-4" /> Download Excel
              </Button>
              <Button
                size="lg"
                onClick={handleSubmitForApproval}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Declaration for Approval
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

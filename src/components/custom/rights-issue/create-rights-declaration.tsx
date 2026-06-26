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
} from "@/hooks/useRights";
import { CreateRightsIssue } from "@/types/rights";
import { toast } from "sonner";
import { PaginationBar } from "../pagination-bar";
import {
  ShholderTableHead,
  ShholderRows,
  ShholderTfoot,
} from "./entitlement-table";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
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

  // Pagination
  const [declPage, setDeclPage] = useState(1);
  const [retryId] = useState<string | null>(null);

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
  );
}

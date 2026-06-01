"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, AlertTriangle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  useGetWarrantSearch,
  useSubmitManualWarrantMarkoff,
} from "@/hooks/useWarrantMarkoff";
import { DataErrorState } from "../ipo/loaders";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";

interface ManualMarkoffProps {
  rejectedId: string | null;
  rejectedComment: string;
  onClearRejected: () => void;
}

export default function ManualMarkoff({
  rejectedId,
  rejectedComment,
  onClearRejected,
}: ManualMarkoffProps) {
  const { currentUser } = useStore();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  // Search query
  const {
    data: searchResponse,
    isLoading: isSearching,
    isError: isSearchError,
    error: searchError,
    refetch: refetchSearch,
  } = useGetWarrantSearch({ q: searchQuery }, { enabled: !!searchQuery });

  // Submit manual mark-off mutation
  const submitManualMutation = useSubmitManualWarrantMarkoff();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
    } else {
      toast.error("Please enter a search query.");
    }
  };

  const handleManualSubmit = () => {
    if (!reason.trim()) {
      setReasonError(true);
      return;
    }
    setReasonError(false);

    const warrant = searchResponse?.data;
    if (!warrant) return;

    submitManualMutation.mutate(
      {
        warrantNumber: warrant.warrantNumber,
        reason: reason.trim(),
        submittedBy: currentUser?.username || currentUser?.email || "System",
      },
      {
        onSuccess: (res) => {
          if (res?.isSuccessful) {
            toast.success("Mark-off submitted for 1st approval.");
            setSearchInput("");
            setSearchQuery("");
            setReason("");
          } else {
            toast.error(res?.responseMessage || "Failed to submit mark-off.");
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to submit mark-off.");
        },
      },
    );
  };

  const warrant = searchResponse?.data;
  const isNotFound = searchQuery && !isSearching && !isSearchError && !warrant;

  return (
    <div className="space-y-6">
      {rejectedId && (
        <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="font-semibold text-sm text-red-800">
              Mark-Off Rejected — ID: {rejectedId}
            </div>
            <div className="text-[13px] text-red-700">
              {rejectedComment || "No comment provided."}
            </div>
          </div>
          <button
            onClick={onClearRejected}
            className="text-red-400 hover:text-red-600 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </Card>
      )}

      <Card className="mrpsl-card p-6 max-w-xl mx-auto space-y-4 mt-12">
        <h3 className="font-semibold text-lg text-center mb-2">Find Warrant</h3>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            placeholder="Warrant No / Account No / CHN"
            className="mrpsl-input"
            value={searchInput}
            type="search"
            name="warrant-no"
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Search
          </Button>
        </form>
      </Card>

      {isSearching && (
        <div className="max-w-xl mx-auto mt-6">
          <EntitlementTableSkeleton />
        </div>
      )}

      {isSearchError && (
        <div className="max-w-xl mx-auto mt-6">
          <DataErrorState
            message={searchError?.message || "An error occurred during search."}
            onRetry={refetchSearch}
          />
        </div>
      )}

      {isNotFound && (
        <div className="max-w-xl mx-auto mt-6 text-center p-6 border border-dashed rounded-xl text-muted-foreground">
          No warrant found matching &quot;{searchQuery}&quot;.
        </div>
      )}

      {warrant && !isSearching && !isSearchError && (
        <div className="max-w-xl mx-auto space-y-4">
          <Card className="mrpsl-card p-5 space-y-3">
            <h4 className="font-semibold text-sm border-b pb-2">
              Warrant Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <span className="text-muted-foreground">Warrant No</span>
                <div className="font-mono font-bold mt-0.5">
                  {warrant.warrantNumber}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Account</span>
                <div className="font-mono mt-0.5">{warrant.accountNumber}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Holder</span>
                <div className="font-semibold mt-0.5">{warrant.holderName}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Dividend</span>
                <div className="font-mono mt-0.5">
                  {warrant.registerSymbol || warrant.paymentNumber || "N/A"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Net Amount</span>
                <div className="font-mono font-bold text-green-600 mt-0.5">
                  ₦{warrant.netAmount.toLocaleString()}.00
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <div className="mt-0.5">
                  <span className="bg-amber-100 text-amber-800 text-[12px] px-2 py-0.5 rounded uppercase font-medium">
                    {warrant.status || "UNPAID"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="mrpsl-card p-5 space-y-4 border-red-200">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                This action permanently marks the warrant as{" "}
                <strong>PAID</strong>. Three-tier approval required.
              </span>
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Reason / Comment</label>
              <Textarea
                placeholder="Reason is required..."
                className={`resize-none focus-visible:ring-primary ${
                  reasonError ? "border-red-500" : ""
                }`}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) setReasonError(false);
                }}
              />
              {reasonError && (
                <p className="text-[12px] text-red-600">Reason is required.</p>
              )}
            </div>
            <Button
              className="w-full border-2 border-red-500 bg-red-500 hover:bg-red-600 text-white font-semibold"
              onClick={handleManualSubmit}
              disabled={submitManualMutation.isPending}
            >
              {submitManualMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Submit Mark-Off for Approval
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Eye, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApprovePaymentRun, useListPaymentRuns } from "@/hooks/useDividendPayment";
import { DataErrorState } from "../ipo/loaders";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { DateRange } from "react-day-picker";
import { formatLargeNumber } from "@/lib/utils";
import StatusBadge from "../status-badge";
import { PaginationBar } from "../pagination-bar";
import { PaymentRun } from "@/actions/dividendPayments";
import { useStore } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import RegisterSelect from "../register-select";
import { DateRangePicker } from "../date-range-picker";
import { formatDate } from "@/lib/utils/format";


export const IcuApproval = ({ tab }: { tab: string }) => {
  const currentUser = useStore((state) => state.currentUser)
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [comment, setComment] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [selectedRegister, setSelectedRegister] = useState("")
  const [gateway, setGateway] = useState("")

  const [icuViewOpen, setIcuViewOpen] = useState(false);
  const [icuViewTarget, setIcuViewTarget] = useState<PaymentRun | null>(null);


  const { data, isLoading, isError, error, refetch } = useListPaymentRuns({
    page,
    size,
    dateFrom: dateRange?.from
      ? format(dateRange.from, "yyyy-MM-dd")
      : undefined,
    dateTo: dateRange?.to
      ? format(dateRange.to, "yyyy-MM-dd")
      : undefined,
    registerId: selectedRegister !== "" ? selectedRegister : undefined,
    gateway: gateway !== "" ? gateway : undefined,
    status: "PENDING_ICU"
  }, {
    enabled: tab === "icu"
  });

  const approveMutation = useApprovePaymentRun()


  function approvePaymentRun() {
    if (!icuViewTarget?.id) {
      toast.error("No active payment run to approve.");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    if (!comment || comment === "") {
      toast.error("Please leave a comment");
      return;
    }

    approveMutation.mutate(
      {
        id: icuViewTarget?.id,
        body: {
          comment,
          authorisedBy: currentUser?.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Payment run approved.");
          setComment("");
          setIcuViewOpen(false);
          setIcuViewTarget(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to approve payment run.");
        },
      },
    );
  }

  const total = data?.data?.totalElements || 0;
  const totalPages = data?.data?.totalPages || 1;
  const pendingIcuApprovals = data?.data?.content || [];

  return (
    <div>
      <Card className="mrpsl-card p-5">
        <div className="flex gap-3 items-start flex-wrap">
          {/* Register */}
          <RegisterSelect label="Register" value={selectedRegister} onChange={setSelectedRegister} />


          {/* Date range */}
          <div className="">
            <label className="mrpsl-label">Date Range</label>
            <DateRangePicker
              className="mt-0"
              date={dateRange}
              setDate={setDateRange}
            />
          </div>

          <div className="">
            <label className="mrpsl-label">PAYMENT GATEWAY</label>
            <Select
              value={gateway}
              onValueChange={(value) => {
                setGateway(value || "");
              }}
            >
              <SelectTrigger
                className="w-48 mrpsl-input"
                id="payment-gateway"
              >
                <SelectValue placeholder="Select Payment Gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nibss">NIBSS</SelectItem>
                <SelectItem value="remita">Remita</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2 bg-muted/20">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">
            Pending Payment Runs — {data?.data?.totalElements}
          </span>
        </div>
        <div className="overflow-x-auto">
          {
            isLoading ? (
              <EntitlementTableSkeleton />
            ) : isError ? (
              <DataErrorState message={error?.message || "Failed to load pending ICU approvals"} onRetry={refetch} />
            ) :
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-3">PAY RUN REF</th>
                    <th className="px-4 py-3">DIVIDEND NO</th>
                    <th className="px-4 py-3">REGISTER</th>
                    <th className="px-4 py-3">GATEWAY</th>
                    <th className="px-4 py-3">RECORDS</th>
                    <th className="px-4 py-3">TOTAL PAYOUT (₦)</th>
                    <th className="px-4 py-3">DATE INITIATED</th>
                    <th className="px-4 py-3">STATUS</th>
                    <th className="px-4 py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {
                    pendingIcuApprovals.length > 0 ?

                      pendingIcuApprovals.map((row) => (
                        <tr key={row?.ref} className="mrpsl-table-row">
                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            {row?.ref}
                          </td>
                          <td className="px-4 py-3 font-mono">{row?.paymentNumber}</td>
                          <td className="px-4 py-3 font-semibold">{row?.registerSymbol}</td>
                          <td className="px-4 py-3">{row?.gateway}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {row?.totalRecords.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">
                            ₦{formatLargeNumber(row?.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(row?.dateRun)}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={row?.status as string} /></td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                className="h-7 text-[13px]"
                                onClick={() => {
                                  setIcuViewTarget(row);
                                  setIcuViewOpen(true);
                                }}
                              >
                                <Eye className="mr-1 h-3 w-3" /> Review
                              </Button>


                            </div>
                          </td>
                        </tr>
                      )) :
                      <tr>
                        <td colSpan={10} className="mrpsl-empty">
                          No {selectedRegister} payment runs found.
                        </td>
                      </tr>
                  }
                </tbody>
              </table>}

          {
            total > 0 && (
              <PaginationBar
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={size}
                onPageChange={setPage}
                onPageSizeChange={setSize}
              />
            )
          }
        </div>
      </Card>

      {/* ── Payment Run View Dialog ── */}
      <Dialog open={icuViewOpen} onOpenChange={setIcuViewOpen}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90vh] p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>Payment Run Details</DialogTitle>
          </DialogHeader>
          {icuViewTarget && (
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Reference",
                    value: icuViewTarget?.ref,
                    mono: true,
                  },
                  {
                    label: "Payment Number",
                    value: icuViewTarget?.paymentNumber,
                    mono: true,
                  },
                  {
                    label: "Register",
                    value: icuViewTarget?.registerSymbol,
                    mono: false,
                  },
                  { label: "Gateway", value: icuViewTarget?.gateway, mono: false },
                  {
                    label: "Date Run",
                    value: formatDate(icuViewTarget?.dateRun),
                    mono: false,
                  },

                  {
                    label: "Total Records",
                    value: icuViewTarget?.totalRecords,
                    mono: true,
                  },
                  {
                    label: "Total Amount",
                    value: `₦${formatLargeNumber(icuViewTarget?.totalAmount)}`,
                    mono: true,
                  },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                      {label}
                    </div>
                    <div
                      className={`mt-0.5 text-sm font-medium ${mono ? "font-mono" : ""}`}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>


              <div className="space-y-2">
                <label className="mrpsl-label">Comment</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => {
                    setIcuViewOpen(false);
                    setIcuViewTarget(null)
                  }}
                  disabled={approveMutation.isPending}

                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={approvePaymentRun}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? "Approving...." : "Approve"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

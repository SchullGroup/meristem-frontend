import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { format, parseISO } from "date-fns";
import { Eye, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";

type PayRunItem = {
  ref: string;
  dividendNo: string;
  reg: string;
  gateway: string;
  records: number;
  totalPayout: number;
  initiator: string;
  initiatedAt: string;
  status: "PENDING_ICU" | "APPROVED" | "SUBMITTED";
  payload: Record<string, unknown>;
};

const INITIAL_PAY_RUNS: PayRunItem[] = [
  {
    ref: "PAY-DIV-4821-20250610",
    dividendNo: "DIV-2025-004",
    reg: "DANGCEM",
    gateway: "NIBSS",
    records: 180248,
    totalPayout: 69010000000,
    initiator: "Amara Osei",
    initiatedAt: "2025-06-10T09:30:00Z",
    status: "PENDING_ICU",
    payload: {
      dividendId: "DIV-2025-004",
      registerId: "REG-001",
      gateway: "nibss",
      records: 180248,
      totalPayout: 69010000000,
    },
  },
  {
    ref: "PAY-DIV-3319-20250608",
    dividendNo: "DIV-2025-003",
    reg: "ACCESSCORP",
    gateway: "Remita",
    records: 92410,
    totalPayout: 12500000000,
    initiator: "Tunde Adeleke",
    initiatedAt: "2025-06-08T14:15:00Z",
    status: "APPROVED",
    payload: {
      dividendId: "DIV-2025-003",
      registerId: "REG-002",
      gateway: "remita",
      records: 92410,
      totalPayout: 12500000000,
    },
  },
];

export const IcuApproval = () => {
  const {
    registers,
    shareholders,
    dividendDeclarations,
    currentUser,
    addApprovalItem,
  } = useStore();
  const authDivs = dividendDeclarations.filter(
    (d) => d.status === "AUTHORIZED",
  );
  const [pendingPayRuns, setPendingPayRuns] =
    useState<PayRunItem[]>(INITIAL_PAY_RUNS);
  const [selectedDiv, setSelectedDiv] = useState("");
  const [icuViewTarget, setIcuViewTarget] = useState<PayRunItem | null>(null);
  const [icuViewOpen, setIcuViewOpen] = useState(false);

  const selectedDivDecl = authDivs.find((d) => d.id === selectedDiv);

  function formatPayout(n: number): string {
    if (n === 0) return "—";
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    return n.toLocaleString();
  }

  function icuStatusBadge(status: PayRunItem["status"]) {
    if (status === "SUBMITTED")
      return (
        <Badge className="border-0 text-[13px] bg-green-100 text-green-800">
          Submitted
        </Badge>
      );
    if (status === "APPROVED")
      return (
        <Badge className="border-0 text-[13px] bg-blue-100 text-blue-800">
          Approved
        </Badge>
      );
    return (
      <Badge className="border-0 text-[13px] bg-amber-100 text-amber-800">
        Pending ICU
      </Badge>
    );
  }

  function handleICUApprove(ref: string) {
    setPendingPayRuns((prev) =>
      prev.map((r) => (r.ref === ref ? { ...r, status: "APPROVED" } : r)),
    );
    toast.success(`Payment run ${ref} approved.`);
  }

  function handleICUSubmit(item: PayRunItem) {
    const seq = Math.floor(1000 + Math.random() * 9000);
    addApprovalItem({
      id: `APPR-PAYRUN-${seq}`,
      module: "DIVIDENDS",
      transactionType: "Payment Run",
      description: `${item.ref} — ${item.reg} · ${item.records.toLocaleString()} recipients · ₦${formatPayout(item.totalPayout)} via ${item.gateway}`,
      amount: item.totalPayout,
      tier: selectedDivDecl?.tier ?? 1,
      entityId: item.ref,
      initiatorId: currentUser?.id ?? "USR-0001",
      initiatorName: item.initiator,
      submittedAt: new Date().toISOString(),
      status: "PENDING",
      approvalSteps: [],
      payload: item.payload,
    });
    setPendingPayRuns((prev) =>
      prev.map((r) => (r.ref === item.ref ? { ...r, status: "SUBMITTED" } : r)),
    );
    toast.success(`${item.ref} submitted to approvals queue.`);
    setIcuViewOpen(false);
  }
  return (
    <div>
      <TabsContent value="icu" className="space-y-4">
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2 bg-muted/20">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">
              Pending Payment Runs —{" "}
              {pendingPayRuns.filter((r) => r.status !== "SUBMITTED").length}{" "}
              active
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">PAY RUN REF</th>
                  <th className="px-4 py-3">DIVIDEND NO</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">GATEWAY</th>
                  <th className="px-4 py-3">RECORDS</th>
                  <th className="px-4 py-3">TOTAL PAYOUT (₦)</th>
                  <th className="px-4 py-3">INITIATED BY</th>
                  <th className="px-4 py-3">DATE INITIATED</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {pendingPayRuns.map((row) => (
                  <tr key={row.ref} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {row.ref}
                    </td>
                    <td className="px-4 py-3 font-mono">{row.dividendNo}</td>
                    <td className="px-4 py-3 font-semibold">{row.reg}</td>
                    <td className="px-4 py-3">{row.gateway}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.records.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      ₦{formatPayout(row.totalPayout)}
                    </td>
                    <td className="px-4 py-3">{row.initiator}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(parseISO(row.initiatedAt), "dd MMM yyyy, HH:mm")}
                    </td>
                    <td className="px-4 py-3">{icuStatusBadge(row.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[13px]"
                          onClick={() => {
                            setIcuViewTarget(row);
                            setIcuViewOpen(true);
                          }}
                        >
                          <Eye className="mr-1 h-3 w-3" /> View
                        </Button>
                        {row.status === "PENDING_ICU" && (
                          <Button
                            size="sm"
                            className="h-7 text-[13px]"
                            onClick={() => handleICUApprove(row.ref)}
                          >
                            Approve
                          </Button>
                        )}
                        {row.status === "APPROVED" && (
                          <Button
                            size="sm"
                            className="h-7 text-[13px]"
                            onClick={() => handleICUSubmit(row)}
                          >
                            Submit
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingPayRuns.length === 0 && (
                  <tr>
                    <td colSpan={10} className="mrpsl-empty">
                      No pending payment runs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </TabsContent>
    </div>
  );
};

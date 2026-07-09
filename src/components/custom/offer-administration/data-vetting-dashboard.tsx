"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Copy, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/custom/stat-card";
import { toast } from "sonner";

interface RejectedApplication {
  id: string;
  applicantName: string;
  chn: string;
  applicationRef: string;
  unitsApplied: number;
  amountPaid: number;
  rejectionReason: string;
}

interface DuplicateApp {
  id: string;
  applicantName: string;
  chn: string;
  bvn: string;
  address: string;
  applicationRef: string;
  unitsApplied: number;
  amountPaid: number;
  stockbroker: string;
}

interface DuplicateGroup {
  id: string;
  matchType: "BVN" | "CHN" | "Name+Address";
  applications: DuplicateApp[];
}

const MOCK_REJECTED: RejectedApplication[] = [
  {
    id: "1",
    applicantName: "Oluwaseun Adeyemi",
    chn: "10012345678",
    applicationRef: "IPO-2024-00123",
    unitsApplied: 5000,
    amountPaid: 125000,
    rejectionReason: "Missing CHN",
  },
  {
    id: "2",
    applicantName: "Chinwe Okafor",
    chn: "10098765432",
    applicationRef: "IPO-2024-00456",
    unitsApplied: 10000,
    amountPaid: 250000,
    rejectionReason: "Uncleared Funds",
  },
  {
    id: "3",
    applicantName: "Emeka Nwosu",
    chn: "10011223344",
    applicationRef: "IPO-2024-00789",
    unitsApplied: 2000,
    amountPaid: 50000,
    rejectionReason: "KYC Incomplete",
  },
  {
    id: "4",
    applicantName: "Fatima Abubakar",
    chn: "—",
    applicationRef: "IPO-2024-01012",
    unitsApplied: 15000,
    amountPaid: 375000,
    rejectionReason: "Invalid BVN",
  },
  {
    id: "5",
    applicantName: "Yemi Olatunde",
    chn: "10033445566",
    applicationRef: "IPO-2024-01345",
    unitsApplied: 7500,
    amountPaid: 187500,
    rejectionReason: "Uncleared Funds",
  },
];

const MOCK_DUPLICATES: DuplicateGroup[] = [
  {
    id: "dup-1",
    matchType: "BVN",
    applications: [
      {
        id: "d1a",
        applicantName: "Adebayo Johnson",
        chn: "10055667788",
        bvn: "22312345678",
        address: "12 Marina Road, Lagos",
        applicationRef: "IPO-2024-02001",
        unitsApplied: 5000,
        amountPaid: 125000,
        stockbroker: "Meristem Securities",
      },
      {
        id: "d1b",
        applicantName: "A. Johnson",
        chn: "10055667788",
        bvn: "22312345678",
        address: "12 Marina Road Lagos",
        applicationRef: "IPO-2024-02002",
        unitsApplied: 5000,
        amountPaid: 125000,
        stockbroker: "CardinalStone Partners",
      },
    ],
  },
  {
    id: "dup-2",
    matchType: "Name+Address",
    applications: [
      {
        id: "d2a",
        applicantName: "Ngozi Ibe",
        chn: "10077889900",
        bvn: "22398765432",
        address: "45 Awolowo Avenue, Ikoyi",
        applicationRef: "IPO-2024-03001",
        unitsApplied: 20000,
        amountPaid: 500000,
        stockbroker: "Stanbic IBTC Stockbrokers",
      },
      {
        id: "d2b",
        applicantName: "Ngozi Ibe",
        chn: "10099001122",
        bvn: "22387654321",
        address: "45 Awolowo Avenue, Ikoyi",
        applicationRef: "IPO-2024-03002",
        unitsApplied: 20000,
        amountPaid: 500000,
        stockbroker: "First Stockbrokers",
      },
    ],
  },
];

type ComparisonKey =
  | "applicantName"
  | "chn"
  | "bvn"
  | "address"
  | "applicationRef"
  | "unitsApplied"
  | "amountPaid"
  | "stockbroker";

const COMPARISON_FIELDS: {
  label: string;
  key: ComparisonKey;
  format?: (v: unknown) => string;
}[] = [
  { label: "Name", key: "applicantName" },
  { label: "CHN", key: "chn" },
  { label: "BVN", key: "bvn" },
  { label: "Address", key: "address" },
  { label: "Reference", key: "applicationRef" },
  {
    label: "Units Applied",
    key: "unitsApplied",
    format: (v) => Number(v).toLocaleString(),
  },
  {
    label: "Amount Paid",
    key: "amountPaid",
    format: (v) => `₦${Number(v).toLocaleString()}`,
  },
  { label: "Stockbroker", key: "stockbroker" },
];

interface DataVettingDashboardProps {
  totalApplications?: number;
  rejectedCount?: number;
  duplicateCount?: number;
}

export function DataVettingDashboard({
  totalApplications = 15200,
  rejectedCount,
  duplicateCount,
}: DataVettingDashboardProps) {
  const [selectedDupGroup, setSelectedDupGroup] =
    useState<DuplicateGroup | null>(null);
  const [rejectedSearch, setRejectedSearch] = useState("");

  const effectiveRejected = rejectedCount ?? MOCK_REJECTED.length;
  const effectiveDuplicates = duplicateCount ?? MOCK_DUPLICATES.length;
  const effectiveValid =
    totalApplications - effectiveRejected - effectiveDuplicates * 2;

  const filteredRejected = MOCK_REJECTED.filter(
    (r) =>
      r.applicantName.toLowerCase().includes(rejectedSearch.toLowerCase()) ||
      r.applicationRef.toLowerCase().includes(rejectedSearch.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Valid Applications"
          value={effectiveValid.toLocaleString()}
          icon={CheckCircle2}
        />
        <StatCard
          label="Rejected Applications"
          value={effectiveRejected.toLocaleString()}
          icon={XCircle}
          variant="destructive"
        />
        <StatCard
          label="Suspected Duplicates"
          value={effectiveDuplicates.toLocaleString()}
          icon={Copy}
          variant="warning"
        />
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <Tabs defaultValue="rejected">
          <div className="px-5 pt-0 border-b border-border">
            <TabsList className="h-auto p-0 bg-transparent gap-6 rounded-none">
              <TabsTrigger
                value="rejected"
                className="rounded-none py-3 text-[13px] font-medium text-muted-foreground data-active:text-primary"
              >
                Rejected Applications ({effectiveRejected})
              </TabsTrigger>
              <TabsTrigger
                value="duplicates"
                className="rounded-none py-3 text-[13px] font-medium text-muted-foreground data-active:text-primary"
              >
                Duplicate Resolution Queue ({effectiveDuplicates})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="rejected" className="p-5 space-y-3">
            <div className="relative w-fit">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                className="mrpsl-input pl-9 h-9 w-72"
                placeholder="Search by name or reference…"
                value={rejectedSearch}
                onChange={(e) => setRejectedSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-2.5 font-medium">
                      Applicant
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium">
                      Reference
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                    <th className="text-right px-4 py-2.5 font-medium">
                      Units Applied
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium">
                      Amount Paid
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium">
                      Rejection Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRejected.map((r) => (
                    <tr key={r.id} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 font-medium">
                        {r.applicantName}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                        {r.applicationRef}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.chn}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {r.unitsApplied.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        ₦{r.amountPaid.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className="bg-red-100 text-red-700 border-0 text-[12px]">
                          {r.rejectionReason}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="duplicates" className="p-0">
            <div className="flex h-[440px]">
              <div className="w-72 border-r border-border overflow-y-auto shrink-0">
                {MOCK_DUPLICATES.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedDupGroup(group)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-muted/40 transition-colors ${selectedDupGroup?.id === group.id ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">
                        Match: {group.matchType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {group.applications.length} records
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">
                      {group.applications[0].applicantName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {group.applications[0].applicationRef}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex-1 p-5 overflow-y-auto">
                {!selectedDupGroup ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                    <Copy className="h-8 w-8 text-muted-foreground/30" />
                    <p className="font-medium text-sm">
                      Select a duplicate group
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Click a group on the left to compare the applications side
                      by side.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDupGroup.applications.map((app, i) => {
                        const other =
                          selectedDupGroup.applications[i === 0 ? 1 : 0];
                        return (
                          <div key={app.id} className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Application {i + 1}
                            </p>
                            <Card className="p-3 space-y-0.5 text-sm">
                              {COMPARISON_FIELDS.map(
                                ({ label, key, format }) => {
                                  const val = format
                                    ? format(app[key])
                                    : String(app[key]);
                                  const otherVal = format
                                    ? format(other[key])
                                    : String(other[key]);
                                  const differs = val !== otherVal;
                                  return (
                                    <div
                                      key={label}
                                      className={`flex justify-between gap-2 px-1.5 py-1 rounded ${differs ? "bg-orange-50" : ""}`}
                                    >
                                      <span className="text-muted-foreground text-xs shrink-0">
                                        {label}
                                      </span>
                                      <span
                                        className={`text-xs font-medium text-right truncate ${differs ? "text-orange-700" : ""}`}
                                      >
                                        {val}
                                      </span>
                                    </div>
                                  );
                                },
                              )}
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info("Merge coming soon")}
                      >
                        Merge Applications
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast.info("Mark as distinct coming soon")
                        }
                      >
                        Approve as Distinct
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => toast.info("Reject both coming soon")}
                      >
                        Reject Both
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  CheckCircle,
  Merge,
  Scissors,
  RefreshCw,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { TablePagination } from "@/components/custom/table-pagination";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGetRegisters } from "@/hooks/useRegisters";
import { getCertificates } from "@/actions/enquiryActions";
import type { CertificatesParams } from "@/types/enquiry";

// Filter keys persisted to the URL (the page's source of truth)
const FILTER_KEYS = [
  "registerSymbol",
  "transferNo",
  "accountNo",
  "certificateNo",
  "exactUnits",
  "minUnits",
] as const;

export default function CertificateEnquiryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filter inputs — seeded from the URL so they survive a back navigation.
  const [registerFilter, setRegisterFilter] = useState(
    searchParams.get("registerSymbol") ?? "",
  );
  const [transferNo, setTransferNo] = useState(
    searchParams.get("transferNo") ?? "",
  );
  const [accountNo, setAccountNo] = useState(
    searchParams.get("accountNo") ?? "",
  );
  const [certificateNo, setCertificateNo] = useState(
    searchParams.get("certificateNo") ?? "",
  );
  const [exactUnits, setExactUnits] = useState(
    searchParams.get("exactUnits") ?? "",
  );
  const [minUnits, setMinUnits] = useState(searchParams.get("minUnits") ?? "");

  // The URL is the source of truth for what's actually applied/displayed.
  const hasFilters = FILTER_KEYS.some((k) => searchParams.get(k));
  const page = Number(searchParams.get("page") ?? 0);
  const pageSize = Number(searchParams.get("size") ?? 20);

  const appliedFilters = useMemo<CertificatesParams | null>(() => {
    if (!hasFilters) return null;
    const f: CertificatesParams = {};
    const reg = searchParams.get("registerSymbol");
    const trf = searchParams.get("transferNo");
    const acct = searchParams.get("accountNo");
    const cert = searchParams.get("certificateNo");
    const exact = searchParams.get("exactUnits");
    const min = searchParams.get("minUnits");
    if (reg) f.registerSymbol = reg;
    if (trf) f.transferNo = trf;
    if (acct) f.accountNo = acct;
    if (cert) f.certificateNo = cert;
    if (exact) f.exactUnits = Number(exact);
    if (min) f.minUnits = Number(min);
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { data: registersData, isLoading: isRegisterLoading } = useGetRegisters(
    { size: 100 },
  );
  const activeRegisters =
    registersData?.content?.filter((r) => r.status === "ACTIVE") ?? [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["certificates", appliedFilters, page, pageSize],
    queryFn: () =>
      getCertificates({
        ...appliedFilters,
        page,
        size: pageSize,
      }),
    enabled: !!appliedFilters,
  });
  const certificates = data?.content ?? [];

  useEffect(() => {
    if (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load certificates.",
      );
    }
  }, [error]);

  // Keep the inputs in sync with the URL on back/forward navigation.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setRegisterFilter(searchParams.get("registerSymbol") ?? "");
    setTransferNo(searchParams.get("transferNo") ?? "");
    setAccountNo(searchParams.get("accountNo") ?? "");
    setCertificateNo(searchParams.get("certificateNo") ?? "");
    setExactUnits(searchParams.get("exactUnits") ?? "");
    setMinUnits(searchParams.get("minUnits") ?? "");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  // Push the current URL (filters + page/size) — adds a history entry.
  function pushParams(params: URLSearchParams) {
    router.push(`${pathname}?${params.toString()}`);
  }
  // Update part of the URL in place (no extra history entry) — used for paging.
  function replaceParams(updates: Record<string, string | number>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => params.set(k, String(v)));
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleSearch() {
    const params = new URLSearchParams();
    if (registerFilter) params.set("registerSymbol", registerFilter);
    if (transferNo.trim()) params.set("transferNo", transferNo.trim());
    if (accountNo.trim()) params.set("accountNo", accountNo.trim());
    if (certificateNo.trim()) params.set("certificateNo", certificateNo.trim());
    if (exactUnits.trim()) params.set("exactUnits", exactUnits.trim());
    if (minUnits.trim()) params.set("minUnits", minUnits.trim());

    if ([...params.keys()].length === 0) {
      toast.error("Set at least one filter before searching.");
      return;
    }

    params.set("page", "0");
    params.set("size", String(pageSize));
    pushParams(params);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Enquiry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search, verify, and action physical certificates
          </p>
        </div>
      </div>

      <Card className="mrpsl-card p-5">
        <div className="flex gap-4 items-end flex-nowrap overflow-x-auto pb-1">
          <div className="">
            <label className="mrpsl-label">Register</label>
            <Select
              value={registerFilter || "all"}
              onValueChange={(v) =>
                setRegisterFilter(v && v !== "all" ? v : "")
              }
            >
              <SelectTrigger className="w-48 mrpsl-input">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {isRegisterLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <>
                    <SelectItem value="">All</SelectItem>
                    {activeRegisters.map((r) => (
                      <SelectItem key={r.registerId} value={r.symbol}>
                        {r.registerName} - {r.symbol}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="mrpsl-label">Transfer No</label>
            <Input
              className="mrpsl-input w-36"
              value={transferNo}
              onChange={(e) => setTransferNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="mrpsl-label">Account No</label>
            <Input
              className="mrpsl-input w-36"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="mrpsl-label">Certificate No</label>
            <Input
              className="mrpsl-input w-40"
              value={certificateNo}
              onChange={(e) => setCertificateNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="mrpsl-label">Units</label>
            <Input
              type="number"
              placeholder="Exactly X units"
              className="mrpsl-input w-40"
              value={exactUnits}
              onChange={(e) => setExactUnits(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="mrpsl-label">Holder Units</label>
            <Input
              type="number"
              placeholder="≥ X units"
              className="mrpsl-input w-40"
              value={minUnits}
              onChange={(e) => setMinUnits(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button
            size="lg"
            className="h-10 px-8 cursor-pointer"
            onClick={handleSearch}
          >
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>
      </Card>

      {appliedFilters && (
        <Card className="mrpsl-card animate-in fade-in">
          <TooltipProvider delay={2000}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">CERTIFICATE NO</th>
                    <th className="p-3">ACCOUNT NO</th>
                    <th className="p-3">HOLDER NAME</th>
                    <th className="p-3">DATE ISSUED</th>
                    <th className="p-3 text-right">UNITS</th>
                    <th className="p-3 text-center">ACTIVE</th>
                    <th className="p-3" colSpan={5}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[13px]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={11} className="p-12 text-center">
                        <Loader2 className="h-4 w-4 animate-spin inline text-primary" />
                      </td>
                    </tr>
                  ) : certificates.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="p-12 text-center text-muted-foreground font-sans"
                      >
                        No certificates match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    certificates.map((cert) => (
                      <tr
                        key={cert.certificateNo}
                        className="hover:bg-accent/5"
                      >
                        <td className="p-3 text-primary font-bold">
                          {cert.certificateNo}
                        </td>
                        <td className="p-3">{cert.accountNo}</td>
                        <td className="p-3 font-sans font-medium">
                          {cert.holderName}
                        </td>
                        <td className="p-3 font-sans text-muted-foreground text-[13px]">
                          {cert.dateIssued}
                        </td>
                        <td className="p-3 text-right font-bold text-sm">
                          {(cert.units ?? 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className={
                              cert.status === "ACTIVE"
                                ? "bg-green-50 text-green-700 border-green-200 text-[13px]"
                                : "bg-gray-100 text-gray-600 border-gray-200 text-[13px]"
                            }
                          >
                            {cert.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="cursor-pointer"
                                >
                                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              }
                            />
                            <TooltipContent>
                              Verify this certificate before issuing a
                              replacement
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="p-3 text-center">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="cursor-pointer"
                                  onClick={() =>
                                    router.push(
                                      `/certificates/consolidation?register=${encodeURIComponent(
                                        cert.registerSymbol,
                                      )}&accountNo=${encodeURIComponent(
                                        cert.accountNo,
                                      )}`,
                                    )
                                  }
                                >
                                  <Merge className="h-4 w-4 text-blue-600" />
                                </Button>
                              }
                            />
                            <TooltipContent>
                              Amalgamate — combine multiple certificates into
                              one
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="p-3 text-center">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="cursor-pointer"
                                  onClick={() =>
                                    router.push(
                                      `/certificates/split?search=${encodeURIComponent(
                                        cert.holderName,
                                      )}`,
                                    )
                                  }
                                >
                                  <Scissors className="h-4 w-4 text-amber-600" />
                                </Button>
                              }
                            />
                            <TooltipContent>
                              Split this certificate into smaller holdings
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="p-3 text-center">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="cursor-pointer"
                                >
                                  <RefreshCw className="h-4 w-4 text-primary" />
                                </Button>
                              }
                            />
                            <TooltipContent>
                              Replace a lost or damaged certificate
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="p-3 text-center">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="cursor-pointer"
                                  onClick={() =>
                                    router.push(
                                      `/certificates/transfer?register=${encodeURIComponent(
                                        cert.registerSymbol,
                                      )}&src=${encodeURIComponent(cert.holderName)}`,
                                    )
                                  }
                                >
                                  <ArrowRight className="h-4 w-4 text-purple-600" />
                                </Button>
                              }
                            />
                            <TooltipContent>
                              Transfer this certificate to another holder
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {data && (
              <div className="px-4 py-2 border-t">
                <TablePagination
                  page={page + 1}
                  pageSize={pageSize}
                  totalPages={Math.max(1, data.totalPages ?? 1)}
                  from={
                    (data.totalElements ?? 0) === 0 ? 0 : page * pageSize + 1
                  }
                  to={Math.min((page + 1) * pageSize, data.totalElements ?? 0)}
                  total={data.totalElements ?? 0}
                  onPageChange={(p) => replaceParams({ page: p - 1 })}
                  onPageSizeChange={(sz) =>
                    replaceParams({ size: sz, page: 0 })
                  }
                />
              </div>
            )}
          </TooltipProvider>
        </Card>
      )}
    </div>
  );
}

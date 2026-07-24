"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/custom/table-pagination";
import type { PrelistRow } from "@/types/dividend-declaration-flow";
import {
  categoryBadgeClass,
  categoryLabel,
  formatNaira,
} from "./helpers";

export type ShareholderColumn =
  | "serial"
  | "accountNumber"
  | "chn"
  | "holderName"
  | "email"
  | "address"
  | "category"
  | "bvn"
  | "nin"
  | "bankName"
  | "bankAccountNumber"
  | "sortCode"
  | "units"
  | "grossAmount"
  | "whtAmount"
  | "netAmount"
  | "paymentStatus"
  | "failureReason"
  | "emailStatus"
  | "deliveryStatus";

const HEADERS: Record<ShareholderColumn, string> = {
  serial: "S/N",
  accountNumber: "ACCOUNT NO",
  chn: "CHN",
  holderName: "HOLDER NAME",
  email: "EMAIL",
  address: "ADDRESS",
  category: "CATEGORY",
  bvn: "BVN",
  nin: "NIN",
  bankName: "BANK NAME",
  bankAccountNumber: "BANK ACCOUNT NO",
  sortCode: "SORT CODE",
  units: "UNITS",
  grossAmount: "GROSS (₦)",
  whtAmount: "WHT (₦)",
  netAmount: "NET (₦)",
  paymentStatus: "PAYMENT",
  failureReason: "FAILURE REASON",
  emailStatus: "EMAIL",
  deliveryStatus: "DELIVERY",
};

const RIGHT_ALIGNED = new Set<ShareholderColumn>([
  "units",
  "grossAmount",
  "whtAmount",
  "netAmount",
]);

function renderCell(col: ShareholderColumn, row: PrelistRow, index: number) {
  switch (col) {
    case "serial":
      return <span className="text-muted-foreground">{index + 1}</span>;
    case "holderName":
      return <span className="font-sans font-medium">{row.holderName}</span>;
    case "email":
      return <span className="font-sans">{row.email}</span>;
    case "address":
      return <span className="font-sans">{row.address}</span>;
    case "category":
      return (
        <Badge className={`border-0 text-[12px] ${categoryBadgeClass(row.category)}`}>
          {categoryLabel(row.category)}
        </Badge>
      );
    case "units":
      return row.units.toLocaleString();
    case "grossAmount":
      return formatNaira(row.grossAmount);
    case "whtAmount":
      return formatNaira(row.whtAmount);
    case "netAmount":
      return <span className="font-semibold">{formatNaira(row.netAmount)}</span>;
    case "paymentStatus":
      return row.paymentStatus ? (
        <Badge
          className={`border-0 text-[12px] ${
            row.paymentStatus === "SUCCESS"
              ? "bg-green-100 text-green-800"
              : row.paymentStatus === "FAILED"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {row.paymentStatus}
        </Badge>
      ) : (
        "—"
      );
    case "failureReason":
      return <span className="font-sans text-red-600">{row.failureReason ?? "—"}</span>;
    case "emailStatus":
      return row.emailStatus === "SENT" ? (
        <Badge className="border-0 text-[12px] bg-blue-100 text-blue-800">Sent</Badge>
      ) : (
        <span className="text-muted-foreground">Not sent</span>
      );
    case "deliveryStatus":
      return row.deliveryStatus ? (
        <Badge
          className={`border-0 text-[12px] ${
            row.deliveryStatus === "DELIVERED"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.deliveryStatus === "DELIVERED" ? "Delivered" : "Bounced"}
        </Badge>
      ) : (
        "—"
      );
    default:
      return row[col];
  }
}

const SEARCH_FIELDS: (keyof PrelistRow)[] = [
  "holderName",
  "accountNumber",
  "bankName",
  "bvn",
  "nin",
  "chn",
];

export function ShareholderTable({
  rows,
  columns,
  searchable = true,
  bankFilter = false,
  categoryFilter = false,
  selectable = false,
  selectedIds,
  onToggle,
  onToggleAll,
  emptyMessage = "No records found.",
}: {
  rows: PrelistRow[];
  columns: ShareholderColumn[];
  searchable?: boolean;
  bankFilter?: boolean;
  categoryFilter?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
  emptyMessage?: string;
}) {
  const [search, setSearch] = useState("");
  const [bank, setBank] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const bankOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.bankName))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (bank && r.bankName !== bank) return false;
      if (category && r.category !== category) return false;
      if (q) {
        const hit = SEARCH_FIELDS.some((f) =>
          String(r[f] ?? "").toLowerCase().includes(q),
        );
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, search, bank, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageIds = pageRows.map((r) => r.id);
  const allPageSelected =
    selectable && pageIds.length > 0 && pageIds.every((id) => selectedIds?.has(id));

  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className="space-y-3">
      {(searchable || bankFilter || categoryFilter) && (
        <div className="flex items-end gap-3 flex-wrap">
          {searchable && (
            <div className="relative w-72 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search name, account, bank, BVN, CHN…"
                className="mrpsl-input"
                style={{ paddingLeft: "2.25rem" }}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}
          {bankFilter && (
            <div className="flex flex-col">
              <label className="mrpsl-label">Bank</label>
              <Select value={bank} onValueChange={(v) => { setBank(v || ""); setPage(1); }}>
                <SelectTrigger className="w-44 mrpsl-input">
                  <SelectValue placeholder="All Banks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Banks</SelectItem>
                  {bankOptions.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {categoryFilter && (
            <div className="flex flex-col">
              <label className="mrpsl-label">Category</label>
              <Select value={category} onValueChange={(v) => { setCategory(v || ""); setPage(1); }}>
                <SelectTrigger className="w-44 mrpsl-input">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="MANDATED">Mandated</SelectItem>
                  <SelectItem value="OTHERS">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-[13px] text-muted-foreground ml-auto pb-2">
            {filtered.length.toLocaleString()} record
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      <div className="mrpsl-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                {selectable && (
                  <th className="px-3 py-2 w-10">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={() => onToggleAll?.(pageIds)}
                    />
                  </th>
                )}
                {columns.map((c) => (
                  <th
                    key={c}
                    className={`px-3 py-2 ${RIGHT_ALIGNED.has(c) ? "text-right" : ""}`}
                  >
                    {HEADERS[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-3 py-10 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`mrpsl-table-row font-mono ${
                      row.excluded ? "opacity-50 line-through" : ""
                    } ${selectedIds?.has(row.id) ? "bg-primary/5" : ""}`}
                  >
                    {selectable && (
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selectedIds?.has(row.id)}
                          onCheckedChange={() => onToggle?.(row.id)}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c}
                        className={`px-3 py-2 ${RIGHT_ALIGNED.has(c) ? "text-right" : ""}`}
                      >
                        {renderCell(c, row, (safePage - 1) * pageSize + i)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        page={safePage}
        pageSize={pageSize}
        totalPages={totalPages}
        from={filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
        to={Math.min(safePage * pageSize, filtered.length)}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />
    </div>
  );
}

// CSV helper shared by the drill-in screens (full row set, not just the page).
export function prelistCsvRows(rows: PrelistRow[]) {
  const headers = [
    "Account No",
    "CHN",
    "Holder Name",
    "Address",
    "Category",
    "BVN",
    "NIN",
    "Bank Name",
    "Bank Account No",
    "Sort Code",
    "Units",
    "Gross (NGN)",
    "WHT (NGN)",
    "Net (NGN)",
    "Payment Status",
    "Failure Reason",
  ];
  const body = rows.map((r) => [
    r.accountNumber,
    r.chn,
    r.holderName,
    r.address,
    categoryLabel(r.category),
    r.bvn,
    r.nin,
    r.bankName,
    r.bankAccountNumber,
    r.sortCode,
    String(r.units),
    r.grossAmount.toFixed(2),
    r.whtAmount.toFixed(2),
    r.netAmount.toFixed(2),
    r.paymentStatus ?? "-",
    r.failureReason ?? "-",
  ]);
  return { headers, body };
}

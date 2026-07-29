"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAccounts } from "@/hooks/useAccountMaintenance";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useDebounce } from "@/hooks/useDebounce";
import { ShareholderAccount } from "@/types/account-maintenance";
import { fullName } from "@/lib/utils/shareholder";

/**
 * Shared shareholder search (name / CHN / account no. / BVN / register) used by
 * Standard KYC and NIBSS Single. Same KYC-style dropdown as elsewhere.
 */
export function AccountSearch({
  onSelect,
}: {
  onSelect: (acc: ShareholderAccount) => void;
}) {
  const [register, setRegister] = useState("");
  const [term, setTerm] = useState("");
  const debounced = useDebounce(term, 500);

  const { data: registers } = useGetRegisters({ size: 100, status: "ACTIVE" });
  const { data: accountsResponse, isFetching } = useGetAccounts(
    { q: debounced, registerId: register || undefined },
    { enabled: debounced.length > 2 },
  );
  const results = accountsResponse?.data?.data ?? [];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select value={register} onValueChange={(v) => setRegister(v || "")}>
        <SelectTrigger className="w-full sm:w-56 mrpsl-input">
          <SelectValue placeholder="All Registers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Registers</SelectItem>
          {registers?.content?.map((r) => (
            <SelectItem key={r.registerId} value={r.symbol}>
              {r.registerName} {r.symbol}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search by name, CHN, account no. or BVN…"
          className="mrpsl-input"
          style={{ paddingLeft: "2.25rem" }}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        {debounced.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg overflow-hidden">
            {isFetching ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">No accounts found</div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {results.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors border-b last:border-0"
                    onClick={() => {
                      onSelect(acc);
                      setTerm("");
                    }}
                  >
                    <p className="text-sm font-medium">{fullName(acc)}</p>
                    <p className="text-[12px] text-muted-foreground font-mono">
                      {acc.accountNumber} · {acc.registerSymbol}
                      {acc.chn ? ` · ${acc.chn}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

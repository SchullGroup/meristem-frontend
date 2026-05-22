"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

function getVisiblePages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

interface PaginationBarProps {
  page: number;
  total: number;
  onPageChange: (p: number) => void;
  pageSize: number;
  onPageSizeChange?: (s: number) => void;
  pageBase?: 0 | 1;
  totalPages?: number
}

export function PaginationBar({
  page,
  total,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageBase = 0,
  totalPages: propTotalPages
}: PaginationBarProps) {
  const uiPage = pageBase === 0 ? page + 1 : page;

  const totalPages = propTotalPages ? propTotalPages : Math.max(1, Math.ceil(total / pageSize));

  const visible = getVisiblePages(uiPage, totalPages); // Adjustment for 0-based index if needed, but the logic here assumes 1-based current page

  const start = total === 0 ? 0 : (uiPage - 1) * pageSize + 1;

  const end = total === 0 ? 0 : Math.min(uiPage * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 text-[13px]">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">
          Showing {start}–{end} of {total.toLocaleString()}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-6 w-16 text-[13px] px-2 py-0 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-[13px]">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">rows</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-[13px]"
          disabled={page === totalPages}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        {visible.map((p, idx) =>
          p === "…" ? (
            <span
              key={`e${idx}`}
              className="px-1.5 text-muted-foreground select-none"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={uiPage === p ? "default" : "outline"}
              size="sm"
              className="h-7 w-7 p-0 text-[13px]"
              onClick={() => onPageChange(pageBase === 0 ? p - 1 : p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-[13px]"
          disabled={page + 1 > totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

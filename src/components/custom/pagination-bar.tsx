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
  // Convert to 1‑based for UI (page numbers shown to user start at 1)
  const uiPage = pageBase === 0 ? page + 1 : page;

  // Determine total pages – ensure at least 1
  const totalPages = propTotalPages ?? Math.max(1, Math.ceil(total / pageSize));

  // Generate visible page numbers (1‑based)
  const visible = getVisiblePages(uiPage, totalPages);

  // Compute displayed record range (always 1‑based, user‑friendly)
  const start = total === 0 ? 0 : (uiPage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(uiPage * pageSize, total);

  // Helper to reset to first page when page size changes
  const handlePageSizeChange = (newSize: number) => {
    onPageSizeChange?.(newSize);
    // Reset to first page in the correct base
    onPageChange(pageBase === 0 ? 0 : 1);
  };

  // Helper for navigation – directly modify the external `page` value
  const goToPrevious = () => {
    if (uiPage > 1) onPageChange(page - 1);
  };
  const goToNext = () => {
    if (uiPage < totalPages) onPageChange(page + 1);
  };


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
              onValueChange={(v) => handlePageSizeChange(Number(v))}

            >
              <SelectTrigger className="h-6 w-16 text-[13px] px-2 py-0 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 25, 50, 100].map((n) => (
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
          disabled={uiPage === 1}          // ✓ Correct: disabled on first page
          onClick={goToPrevious}
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
          disabled={uiPage === totalPages}
          onClick={goToNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

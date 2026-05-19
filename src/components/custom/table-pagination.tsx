"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE_OPTIONS } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

export function TablePagination({
  page, pageSize, totalPages, from, to, total,
  onPageChange, onPageSizeChange, className,
}: TablePaginationProps) {
  const pages = pageNumbers(page, totalPages);

  return (
    <div className={cn("flex items-center justify-between gap-4 px-1 pt-3 flex-wrap", className)}>
      {/* Entries selector */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Show</span>
        <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-[70px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map(n => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>entries</span>
      </div>

      {/* Count */}
      <span className="text-sm text-muted-foreground tabular">
        {total === 0 ? "No records" : `Showing ${from}–${to} of ${total.toLocaleString()}`}
      </span>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="icon" className="h-8 w-8"
          disabled={page === 1} onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="w-8 text-center text-muted-foreground text-sm select-none">…</span>
          ) : (
            <Button
              key={p}
              size="icon"
              className="h-8 w-8 text-sm"
              variant={p === page ? "default" : "outline"}
              onClick={() => onPageChange(Number(p))}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline" size="icon" className="h-8 w-8"
          disabled={page === totalPages} onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

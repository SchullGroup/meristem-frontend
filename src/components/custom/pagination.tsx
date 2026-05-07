import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "p-6 border-t border-gray-50 flex items-center justify-between",
        className,
      )}
    >
      <p className="text-xs text-gray-400 font-medium">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg h-8 px-3 text-xs font-bold border-gray-100"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg h-8 px-3 text-xs font-bold border-gray-100 bg-gray-50"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

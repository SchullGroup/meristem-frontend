"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarRange, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

/**
 * A reusable date range picker component that fixes the "premature close" bug.
 * It stays open during selection and only closes when the user clicks outside.
 */
export function DateRangePicker({
  date,
  setDate,
  placeholder = "Select date range",
  className,
}: DateRangePickerProps) {
  // Use internal state for the popover open status to ensure it stays open as requested
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "mrpsl-input w-full justify-start gap-2 px-3 font-normal text-sm transition-all hover:bg-muted/50",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarRange className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left truncate">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd MMM yyyy")} –{" "}
                    {format(date.to, "dd MMM yyyy")}
                  </>
                ) : (
                  format(date.from, "dd MMM yyyy")
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
            {date && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDate(undefined);
                }}
                className="ml-auto rounded-full hover:bg-muted p-0.5 shrink-0 transition-colors"
                title="Clear date range"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            className="rounded-xl border-0 shadow-lg"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

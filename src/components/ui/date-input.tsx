import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Button } from "./button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./calendar";

export default function DateInput({
  date,
  setDate,
  label = "Date",
  disabled,
}: {
  date: Date | null;
  setDate: (date: Date) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="mrpsl-label">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full mrpsl-input justify-start text-left font-normal overflow-hidden"
          >
            <span className="flex-1 truncate">
              {date ? format(date, "PPP") : "Pick a date"}
            </span>
            <CalendarIcon className="ml-2 h-4 w-4 opacity-40 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={date ? date : undefined}
            onSelect={(d) => d && setDate(d)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

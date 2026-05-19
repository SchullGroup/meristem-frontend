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
}: {
  date: Date;
  setDate: (date: Date) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="mrpsl-label">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full mrpsl-input justify-start text-left font-normal"
          >
            {format(date, "PPP")}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

import { useGetRegisters } from "@/hooks/useRegisters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  enabled?: boolean;
  label?: string;
}

export default function RegisterSelect({
  value,
  onChange,
  label,
  enabled = true,
}: Props) {
  const { data: registers, isLoading: activeRegistersLoading } =
    useGetRegisters(
      {
        status: "ACTIVE",
        size: 100,
      },
      {
        enabled,
      },
    );

  return (
    <div className="">
      {label && (
        <label htmlFor="register-select" className="mrpsl-label">
          {label}
        </label>
      )}

      <Select
        name="register-select"
        value={value}
        onValueChange={(v) => {
          onChange(v ?? "");
        }}
      >
        <SelectTrigger className="mrpsl-input w-full">
          <SelectValue placeholder="All Registers" />
        </SelectTrigger>
        <SelectContent>
          {activeRegistersLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <>
              <SelectItem value="">All Registers</SelectItem>
              {registers?.content?.map((r) => (
                <SelectItem key={r.registerId} value={r.symbol}>
                  {r.registerName} - {r.symbol}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

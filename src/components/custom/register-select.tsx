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
  className?: string;
}

export default function RegisterSelect({
  value,
  onChange,
  label,
  enabled = true,
  className,
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
    <div className={className}>
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
          <SelectValue placeholder="Select Active Register" />
        </SelectTrigger>
        <SelectContent>
          {value && (
            <SelectItem value="">
              <span className="text-muted-foreground">Clear Selection</span>
            </SelectItem>
          )}
          {activeRegistersLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            registers?.content?.map((r) => (
              <SelectItem key={r.registerId} value={r.symbol}>
                <span className="font-bold">{r?.registerName}</span> -{" "}
                <span className="translate-y-1 text-xs">{r?.symbol}</span>{" "}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

import { useGetRegisters } from "@/hooks/useRegisters";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Props {
    value: string;
    onChange: (value: string) => void;
    enabled?: boolean
    label?: string
}

export default function RegisterSelect({ value, onChange, label, enabled = true }: Props) {
    const { data: registers, isLoading: activeRegistersLoading } = useGetRegisters({
        status: "ACTIVE",
        size: 100,
    }, {
        enabled
    });

    return (
        <div className="space-y-1.5">
            {
                label &&
                <label className="mrpsl-label">{label}</label>}

            <Select
                value={value}
                onValueChange={(v) => {
                    onChange(v ?? "");
                }}
            >
                <SelectTrigger className="mrpsl-input w-full">
                    <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All Registers</SelectItem>
                    {registers?.content?.map((r) => (
                        <SelectItem key={r.registerId} value={r.symbol}>
                            {r.symbol}
                        </SelectItem>
                    ))}
                    {activeRegistersLoading && (
                        <SelectItem value="_loading" disabled>
                            Loading registers…
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    )
}
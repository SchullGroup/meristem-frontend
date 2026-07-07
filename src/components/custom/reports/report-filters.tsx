// components/ReportFilters.tsx
"use client"
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ReportFilterSchemaField } from "@/actions/reportActions";
import { DateRangePicker } from "../date-range-picker";
import RegisterSelect from "../register-select";
import DateInput from "@/components/ui/date-input";
import { format } from "date-fns";

interface ReportFiltersProps {
    schema: ReportFilterSchemaField[];
    filterValues: Record<string, any>;
    onFilterChange: (field: string, value: any) => void;
    onRun: () => void;
    isRunning: boolean;
}

export function ReportFilters({
    schema,
    filterValues,
    onFilterChange,
    onRun,
    isRunning,
}: ReportFiltersProps) {
    // Group dateFrom + dateTo into a single date-range control
    const { fields, hasDateRange } = useMemo(() => {
        const hasFrom = schema.some((f) => f.field === "dateFrom");
        const hasTo = schema.some((f) => f.field === "dateTo");
        const dateRange = hasFrom && hasTo;

        // Remove dateFrom/dateTo from the list; we'll render them as one
        const filtered = schema.filter(
            (f) => f.field !== "dateFrom" && f.field !== "dateTo"
        );

        return {
            fields: filtered,
            hasDateRange: dateRange,
        };
    }, [schema]);

    return (
        <div className="space-y-4">
            <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Report Parameters
            </p>

            <div className="flex flex-wrap gap-4 items-end">
                {/* Date range (combined) */}
                {hasDateRange && (
                    <div className="space-y-1.5 min-w-[220px]">
                        <Label className="mrpsl-label">Date Range</Label>
                        <DateRangePicker
                            date={{
                                from: filterValues["dateFrom"]
                                    ? new Date(filterValues["dateFrom"])
                                    : undefined,
                                to: filterValues["dateTo"]
                                    ? new Date(filterValues["dateTo"])
                                    : undefined,
                            }}
                            setDate={(range) => {
                                onFilterChange(
                                    "dateFrom",
                                    range?.from ? format(range?.from, "yyyy-MM-dd") : ""
                                );
                                onFilterChange(
                                    "dateTo",
                                    range?.to ? format(range?.to, "yyyy-MM-dd") : ""
                                );
                            }}
                            className="w-full"
                        />
                    </div>
                )}

                {/* All other fields (including register, selects, text, number, boolean, single date) */}
                {fields.map((field) => (
                    <FilterField
                        key={field.field}
                        field={field}
                        value={filterValues[field.field] ?? ""}
                        onChange={(val) => onFilterChange(field.field, val)}
                    />
                ))}

                {/* Run button - always at the end, bottom aligned */}
                <div className="flex items-end pb-0.5">
                    <Button
                        className="mrpsl-input px-6 font-semibold"
                        onClick={onRun}
                        disabled={isRunning}
                    >
                        {isRunning ? "Running..." : "Run Report"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Individual field renderer
function FilterField({
    field,
    value,
    onChange,
}: {
    field: ReportFilterSchemaField;
    value: any;
    onChange: (val: any) => void;
}) {
    const label = (
        <Label className="mrpsl-label">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
    );

    const wrapper = (children: React.ReactNode) => (
        <div className="space-y-1.5 min-w-[200px]">{children}</div>
    );

    switch (field.type) {
        // Register – use the dedicated RegisterSelect (fetches active registers)
        case "SELECT":
            if (field.field === "registerId") {
                return wrapper(
                    <>
                        <label className="mrpsl-label">{label}</label>
                        <RegisterSelect value={value} onChange={(v) => onChange(v)} />
                    </>
                );
            }
            // Other static selects
            return wrapper(
                <>
                    <label className="mrpsl-label">{label}</label>
                    <Select value={value || ""} onValueChange={onChange}>
                        <SelectTrigger className="mrpsl-input w-full">
                            <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </>
            );

        case "DATE":
            const dateValue = value ? new Date(value) : new Date();
            return wrapper(
                <>
                    <label className="mrpsl-label">{label}</label>
                    <DateInput
                        date={dateValue}
                        setDate={(d) => {
                            // Convert Date back to ISO string (yyyy-MM-dd)
                            const iso = d ? format(d, "yyyy-MM-dd") : "";
                            onChange(iso);
                        }}
                    />
                </>
            );
        case "TEXT":
            return wrapper(
                <>
                    <label className="mrpsl-label">{label}</label>
                    <Input
                        className="mrpsl-input w-full"
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={`Enter ${field.label}`}
                    />
                </>
            );

        case "NUMBER":
            return wrapper(
                <>
                    <label className="mrpsl-label">{label}</label>
                    <Input
                        type="number"
                        className="mrpsl-input w-full"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={`Enter ${field.label}`}
                    />
                </>
            );

        case "BOOLEAN":
            return wrapper(
                <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                        id={field.field}
                        checked={value === true || value === "true"}
                        onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
                    />
                    <Label htmlFor={field.field} className="mrpsl-label cursor-pointer">
                        {field.label}
                    </Label>
                </div>
            );

        default:
            return null;
    }
}
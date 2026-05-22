import { ChevronDown } from "lucide-react";

type SortIconProps = {
    col: string;
    sortCol: string;
    sortDir: "asc" | "desc";
};

export const SortIcon = ({ col, sortCol, sortDir }: SortIconProps) => (
    <ChevronDown
        className={`inline h-3 w-3 ml-1 transition-transform ${sortCol === col && sortDir === "asc" ? "rotate-180" : ""
            } ${sortCol !== col ? "opacity-20" : ""}`}
    />
);

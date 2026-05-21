import { useState } from "react";
import * as XLSX from "xlsx";
import { Download, Loader2 } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export default function ExportToExcel({
  size,
  data,
  name,
  exclude = [],
}: {
  size?:
    | "default"
    | "xs"
    | "sm"
    | "lg"
    | "xl"
    | "icon"
    | "icon-xs"
    | "icon-sm"
    | "icon-lg";
  data: unknown[];
  name: string;
  exclude?: string[];
}) {
  const [loading, setLoading] = useState(false);

  const exportToExcel = () => {
    if (!data?.length) return;

    setLoading(true);

    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cleanedData = data.map((item: any) => {
        const newItem = { ...item };
        exclude.forEach((field) => delete newItem[field]);
        return newItem;
      });

      const date = new Date();
      const timestamp = date.toISOString().replace(/[:.]/g, "-");

      const worksheet = XLSX.utils.json_to_sheet(cleanedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "sheet");
      XLSX.writeFile(workbook, `${name}_data_${timestamp}.xlsx`);

      setLoading(false);
    }, 5000);
  };

  const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center cursor-pointer disabled:cursor-not-allowed justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
          outline:
            "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
          secondary:
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
          ghost:
            "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
          destructive:
            "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
          link: "text-primary underline-offset-4 hover:underline",
        },
        size: {
          default:
            "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
          xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
          sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
          lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
          xl: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
          icon: "size-8",
          "icon-xs":
            "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
          "icon-sm":
            "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
          "icon-lg": "size-9",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    },
  );

  return (
    <div className="inline-block text-left">
      <button
        disabled={data?.length === 0 || loading}
        onClick={exportToExcel}
        className={cn(
          buttonVariants({ size, variant: "outline" }),
          "text-sm border border-[#E5E7EB] rounded-[10px] text-[#1A1A1A] px-3.25 font-medium flex items-center gap-2 py-2 cursor-pointer transition-all ease-linear duration-150 hover:bg-[#E5E7EB]/20",
          !(data?.length > 0 && !loading) &&
            "bg-gray-300 text-gray-400 cursor-not-allowed",
        )}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Download size={18} />
        )}
        Excel
      </button>
    </div>
  );
}

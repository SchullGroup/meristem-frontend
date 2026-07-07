import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    PENDING_ICU: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    ICU_APPROVED: "bg-green-100 text-green-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    UNPAID: "bg-amber-100 text-amber-700",
    FAILED: "bg-red-100 text-red-700",
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-amber-100 text-amber-800",
    CAUTION: "bg-red-100 text-red-700",
    AUTHORISED: "bg-blue-100 text-blue-800",
    REJECTED: "bg-orange-100 text-orange-700",
  };

  return (
    <Badge
      className={`${map[status] ?? "bg-gray-100 text-gray-700"} border-0 text-[12px]`}
    >
      {status}
    </Badge>
  );
}

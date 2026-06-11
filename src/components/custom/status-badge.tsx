import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        PENDING: "bg-amber-100 text-amber-800",
        APPROVED: "bg-green-100 text-green-800",
        ACTIVE: "bg-green-100 text-green-800",
        INACTIVE: "bg-gray-100 text-gray-800",
        AUTHORISED: "bg-blue-100 text-blue-800",
        REJECTED: "bg-red-100 text-red-700",
    };
    return (
        <Badge className={`${map[status] ?? "bg-gray-100 text-gray-700"} border-0 text-[12px]`}>
            {status}
        </Badge>
    );
};
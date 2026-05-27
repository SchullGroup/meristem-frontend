import { format } from "date-fns";

export function formatNaira(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `₦${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(2)}M`;
  }
  return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(num?: number): string {
  if (num === null || num === undefined) return "—";
  return num.toLocaleString();
}

export function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  const ms = new Date().getTime() - new Date(dateString).getTime();
  const hrs = ms / 3600000;
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${Math.floor(hrs)}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function computeTier(amount: number): 1 | 2 | 3 | 4 {
  if (amount <= 500000) return 1;
  if (amount <= 5000000) return 2;
  if (amount <= 50000000) return 3;
  return 4;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export const formatCurrency = (num?: number | null) => {
  if (num === null || num === undefined) return "—";
  return `₦${num.toLocaleString()}`;
};


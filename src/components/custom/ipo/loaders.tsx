// ── Helper Components ──

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

export const DataErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-red-50/30 border-red-100">
    <AlertCircle className="h-10 w-10 text-red-500/50 mb-3" />
    <h3 className="font-semibold text-red-900">Failed to load data</h3>
    <p className="text-sm text-red-700/70 max-w-xs mt-1">{message}</p>
    <Button
      variant="outline"
      size="sm"
      onClick={onRetry}
      className="mt-4 gap-2 border-red-200 hover:bg-red-50 text-red-700"
    >
      <RefreshCw className="h-3.5 w-3.5" /> Retry
    </Button>
  </div>
);

export const PendingListSkeleton = ({ cols = 5 }: { cols?: number }) => (
  <div className="space-y-4">
    <div className="border rounded-xl overflow-hidden">
      <div className="bg-muted/30 h-10 w-full animate-pulse" />
      {[...Array(cols)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-t items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export const BatchDetailSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-8 w-60" />
    </div>
    <div className="grid grid-cols-5 gap-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

export const SubscribersSkeleton = ({ }) => (
  <div className="p-4 space-y-3">
    <div className="flex gap-4">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
    </div>
    {Array(5).map((_, i) => (
      <div key={i} className="flex gap-4 items-center border-t pt-3">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

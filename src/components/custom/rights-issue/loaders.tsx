"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EntitlementStatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="mrpsl-card p-4">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </Card>
      ))}
    </div>
  );
}

export function EntitlementTableSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="mrpsl-card overflow-hidden">
        <div className="p-4 border-b">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex gap-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32 ml-auto" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

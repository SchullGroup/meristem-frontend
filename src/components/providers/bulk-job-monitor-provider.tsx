// components/BulkJobMonitorProvider.tsx
'use client';

import { useStore } from '@/lib/store';
import { JobPoller } from '../custom/job-poller';

export function BulkJobMonitorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const jobs = useStore((s) => s.jobs);

  return (
    <>
      {children}
      {jobs.map((job) => (
        <JobPoller
          key={`${job.type}-${job.id}`}
          job={job}
        />
      ))}
    </>
  );
}
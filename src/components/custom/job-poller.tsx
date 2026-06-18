// hooks/useJobPoller.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BulkJob, useStore } from '@/lib/store';
import { jobHandlers } from '@/lib/utils/job-handlers';

interface Props {
  job: BulkJob;
}

export function JobPoller({ job }: Props) {
  const router = useRouter();

  const handler = jobHandlers[job.type];

  const updateJob = useStore((s) => s.updateJob);

  const toastShown = useRef(false);

  const { data, error } = useQuery({
    queryKey: ["background-job", job.type, job.id],
    queryFn: () => handler.getStatus(job.id),
    refetchInterval: 5000,
    enabled:
      job.status !== "SUCCESS" &&
      job.status !== "FAILED",
  });

  useEffect(() => {
    if (error) {
      if (!toastShown.current) {
        toastShown.current = true;

        toast.error(
          `Unable to check ${job.type.toUpperCase()} status`,
        );

        setTimeout(() => {
          toastShown.current = false;
        }, 10000);
      }

      return;
    }

    if (!data) return;

    const transformed =
      handler.transform(data);

    const hasChanged =
      transformed.status !== job.status ||
      transformed.progress !== job.progress ||
      transformed.message !== job.message;

    if (hasChanged) {
      updateJob(job.id, {
        status: transformed.status,
        progress: transformed.progress,
        message: transformed.message,
      });
    }

    if (
      transformed.status === "SUCCESS" &&
      !toastShown.current
    ) {
      toastShown.current = true;

      toast.success(
        `${job.type.toUpperCase()} upload completed`,
        {
          action: {
            label: "View",
            onClick: () =>
              router.push(job.route),
          },
        },
      );
    }

    if (
      transformed.status === "FAILED" &&
      !toastShown.current
    ) {
      toastShown.current = true;

      toast.error(
        `${job.type.toUpperCase()} upload failed`,
        {
          action: {
            label: "Open",
            onClick: () =>
              router.push(job.route),
          },
        },
      );
    }
  }, [
    data,
    error,
    job.id,
    job.route,
    job.type,
    job.status,
    job.progress,
    job.message,
    updateJob,
    router,
    handler,
  ]);

  return null;
}
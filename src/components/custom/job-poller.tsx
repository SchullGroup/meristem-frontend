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

      if (job.type === "reports") {
        toast.success("Export completed", {
          action: {
            label: "Download",
            onClick: () => {
              // Use the download URL from the job (we'll have stored it via updateJob)
              const currentJob = useStore.getState().jobs.find(j => j.id === job.id);
              if (currentJob) {
                // call download endpoint
                import("@/actions/reportActions").then(({ downloadReportJob }) => {
                  downloadReportJob(job.id).then((blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${job.id}.xlsx`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  });
                });
              }
              // Optionally remove job after download
              useStore.getState().removeJob(job.id);
            },
          },
          duration: 15000, // longer so user has time to act
        });
      } else {
        // existing generic success toast
        toast.success(`${job.type.toUpperCase()} completed`, {
          action: {
            label: "View",
            onClick: () => router.push(job.route),
          },
        });
      }
    }
    // Also ensure we update the store with downloadUrl when transformed includes it
    if (transformed.downloadUrl) {
      updateJob(job.id, { downloadUrl: transformed.downloadUrl });
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
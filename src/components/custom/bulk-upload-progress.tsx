// components/BulkJobProgress.tsx
'use client';

import { BulkJobType, useStore } from '@/lib/store';

interface Props {
    jobId: string;
    jobType: BulkJobType;
    message?: string;
}

export function BulkJobProgress({ jobId, jobType, message }: Props) {
    const job = useStore((s) => s.jobs.find((j) => j.id === jobId && j.type === jobType));
    if (!job) return null;

    const isProcessing = job.status === 'PENDING' || job.status === 'PROCESSING';
    const progress = job.progress ?? 50;
    const info = message || job.message || 'Processing...';

    return (
        <div className="mt-4 w-full">
            <p className="text-sm font-medium text-gray-700">{info}</p>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                    className={`h-full bg-primary transition-all duration-500 ${isProcessing ? 'bg-stripes animate-stripes' : ''
                        }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-xs text-gray-500 mt-1">
                {isProcessing && '⏳ In progress'}
                {job.status === 'SUCCESS' && '✅ Completed'}
                {job.status === 'FAILED' && '❌ Failed'}
            </p>
        </div>
    );
}
// lib/jobHandlers.ts

import { GET_CSCS_INJECT_STATUS } from '@/actions/cscsActions';
import { BulkJob, BulkJobType } from '../store';
import { getConsolidationUploadJob, getKycUploadJob } from '@/actions/accountMaintenanceActions';
import { ApiResponse } from '@/types';
import { CscsInjectStatus } from '@/types/cscs';
import { ConsolidationUploadJob, KycUploadJob } from '@/types/account-maintenance';
import { getReportJobStatus, ReportJobStatus } from '@/actions/reportActions';


type JobHandler = {
    getStatus: (id: string) => Promise<any>;
    transform: (data: any) => {
        status: BulkJob['status'];
        progress: number;
        message: string;
        downloadUrl?: string;
    };
};

// Helper to map API status strings to our internal ones
function mapStatus(apiStatus: string): BulkJob['status'] {
    if (apiStatus === 'SUCCESS' || apiStatus === 'COMPLETED') return 'SUCCESS';
    if (apiStatus === 'FAILED') return 'FAILED';
    return 'PROCESSING';
}

export const jobHandlers: Record<BulkJobType, JobHandler> = {
    cscs: {
        getStatus: GET_CSCS_INJECT_STATUS,
        transform: (data: CscsInjectStatus) => {
            // data: CscsInjectStatus (raw, no wrapper)
            const status = mapStatus(data.status);
            let progress = 0;
            if (status === 'SUCCESS') progress = 100;
            else if (status === 'FAILED') progress = 0;
            else progress = 50; // no total, show partial progress
            return {
                status,
                progress,
                message: data.message || 'Processing CSCS injection...',
            };
        },
    },

    kyc: {
        getStatus: getKycUploadJob,
        transform: (response: ApiResponse<KycUploadJob>) => {
            // response is ApiResponse<KycUploadJob>
            if (!response.isSuccessful || !response.data) {
                // If the API call itself indicates failure, treat as FAILED
                return {
                    status: 'FAILED',
                    progress: 0,
                    message: response.responseMessage || 'KYC upload failed to fetch status',
                };
            }
            const job = response.data;
            const status = mapStatus(job.status);
            const progress = job.totalRows > 0
                ? Math.round((job.processed / job.totalRows) * 100)
                : 0;
            const message = `Processed ${job.processed} of ${job.totalRows} rows (${job.succeeded} succeeded, ${job.failed} failed)`;
            return { status, progress, message };
        },
    },

    consolidation: {
        getStatus: getConsolidationUploadJob,
        transform: (response: ApiResponse<ConsolidationUploadJob>) => {
            if (!response.isSuccessful || !response.data) {
                return {
                    status: 'FAILED',
                    progress: 0,
                    message: response.responseMessage || 'Consolidation upload failed to fetch status',
                };
            }
            const job = response.data;
            const status = mapStatus(job.status);
            const progress = job.totalRows > 0
                ? Math.round((job.processed / job.totalRows) * 100)
                : 0;
            const message = `Processed ${job.processed} of ${job.totalRows} rows (${job.succeeded} succeeded, ${job.failed} failed)`;
            return { status, progress, message };
        },
    },

    reports: {
        getStatus: getReportJobStatus,
        transform: (response: ReportJobStatus): {
            status: BulkJob['status'];
            progress: number;
            message: string;
            downloadUrl?: string;
        } => {
            const data = response.data; // ReportJobStatus.data
            const status = mapStatus(data.status);
            const progress = data.progress ?? 0;
            const message = data.status === 'COMPLETED'
                ? 'Export ready'
                : data.errorMessage || `Processing… ${progress}%`;
            return {
                status,
                progress,
                message,
                downloadUrl: data.downloadUrl, // available when COMPLETED
            };
        },
    }
};
import api from "@/services/api";
import { ApiResponse, PaginatedResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export interface Notification {
    id: string;
    recipientId: string;
    type: string;
    title: string;
    body: string;
    comment: string;
    module: string;
    actionable: boolean;
    actionUrl: string;
    read: boolean;
    createdAt: string;
}

export interface NotificationSummary {
    unreadCount: number;
    pendingApprovalsCount: number;
    systemAlertsCount: number;
}

export interface NotificationsParams {
    type?:
    | "APPROVAL_PENDING"
    | "APPROVAL_APPROVED"
    | "APPROVAL_REJECTED"
    | "CSCS_BATCH"
    | "EMAIL_DISPATCH"
    | "TRANSFER_COMPLETE"
    | "SYSTEM_ALERT";
    read?: boolean;
    module?:
    | "SETUP"
    | "DIVIDENDS"
    | "CERTIFICATES"
    | "ACCOUNT_MAINTENANCE"
    | "OFFERS"
    | "SYSTEM";
    page?: number;
    size?: number;
    performedBy?: string;
}

export interface MarkAllNotificationsReadRequest {
    type?: string;
    performedBy?: string;
}

export const getNotifications = async (
    params: Partial<NotificationsParams>,
) => {
    try {
        const response = await api.get<
            PaginatedResponse<Notification>
        >("/notifications", {
            params,
        });

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const getNotificationSummary = async (
    performedBy?: string,
) => {
    try {
        const response = await api.get<
            ApiResponse<NotificationSummary>
        >("/notifications/summary", {
            params: { performedBy },
        });

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const markNotificationRead = async (
    id: string,
    performedBy: string,
) => {
    try {
        const response = await api.post<
            ApiResponse<Notification>
        >(
            `/notifications/${id}/read`, {},
            {
                params: {
                    performedBy,
                },
            },
        );

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const markAllNotificationsRead = async (
    payload: MarkAllNotificationsReadRequest,
) => {
    try {
        const response = await api.post<
            ApiResponse<Record<string, unknown>>
        >("/notifications/read-all", payload);

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const deleteNotification = async (
    id: string,
    performedBy: string,
) => {
    try {
        const response = await api.delete(
            `/notifications/${id}`,
            {
                params: {
                    performedBy,
                },
            }, //TODO: Check why body is required for delete request
        );

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const createNotificationStream = (
    performedBy: string,
    lastEventId?: string,
) => {
    const params = new URLSearchParams({
        performedBy,
    });

    const eventSource = new EventSource(
        `/api/v1/notifications/stream?${params.toString()}`,
    );

    return eventSource;
};
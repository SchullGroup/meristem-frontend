import { createNotificationStream, deleteNotification, getNotifications, getNotificationSummary, markAllNotificationsRead, MarkAllNotificationsReadRequest, markNotificationRead, Notification, NotificationsParams, NotificationSummary } from "@/actions/notificationActions";
import { ApiResponse, PaginatedResponse } from "@/types";
import {
    useMutation,
    UseMutationOptions,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from "@tanstack/react-query";
import { useEffect } from "react";

export const useGetNotifications = (
    params: Partial<NotificationsParams>,
    options?: Omit<
        UseQueryOptions<
            PaginatedResponse<Notification>,
            Error,
            PaginatedResponse<Notification>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["notifications", params],
        queryFn: () => getNotifications(params),
        ...options,
    });
};

export const useGetNotificationSummary = (
    performedBy?: string,
    options?: Omit<
        UseQueryOptions<
            ApiResponse<NotificationSummary>,
            Error,
            ApiResponse<NotificationSummary>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["notification-summary", performedBy],
        queryFn: () =>
            getNotificationSummary(performedBy),
        enabled: !!performedBy,
        ...options,
    });
};

export const useMarkNotificationRead = (
    options?: Omit<
        UseMutationOptions<
            ApiResponse<Notification>,
            Error,
            {
                id: string;
                performedBy: string;
            }
        >,
        "mutationKey" | "mutationFn"
    >,
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            performedBy,
        }: {
            id: string;
            performedBy: string;
        }) => markNotificationRead(id, performedBy),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["notifications"],
            });

            queryClient.invalidateQueries({
                queryKey: ["notification-summary"],
            });
        },

        ...options,
    });
};

export const useMarkAllNotificationsRead = (
    options?: Omit<
        UseMutationOptions<
            ApiResponse<Record<string, unknown>>,
            Error,
            MarkAllNotificationsReadRequest
        >,
        "mutationKey" | "mutationFn"
    >,
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: MarkAllNotificationsReadRequest) => markAllNotificationsRead(data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["notifications"],
            });

            queryClient.invalidateQueries({
                queryKey: ["notification-summary"],
            });
        },

        ...options,
    });
};

export const useDeleteNotification = (
    options?: Omit<
        UseMutationOptions<
            unknown,
            Error,
            {
                id: string;
                performedBy: string;
            }
        >,
        "mutationKey" | "mutationFn"
    >,
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            performedBy,
        }: {
            id: string;
            performedBy: string;
        }) => deleteNotification(id, performedBy),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["notifications"],
            });

            queryClient.invalidateQueries({
                queryKey: ["notification-summary"],
            });
        },

        ...options,
    });
};

export const useNotificationStream = (
    performedBy: string,
    onNotification: (data: unknown) => void,
) => {
    useEffect(() => {
        if (!performedBy) return;

        const source = createNotificationStream(
            performedBy,
        );

        source.addEventListener("notification", event => {
            onNotification(JSON.parse(event.data));
        });

        return () => source.close();
    }, [performedBy, onNotification]);
};
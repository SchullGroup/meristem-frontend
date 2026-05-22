import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions
} from "@tanstack/react-query";
import { GET_CERTIFICATES, GET_CERTIFICATE_BY_ID, ISSUE_CERTIFICATE, DISABLE_CERTIFICATE, GET_SHAREHOLDERS_CERTIFICATE } from "@/actions/certificateActions";
import { ApiResponse, PaginatedResponse } from "@/types";
import { Certificate, CertificateParams, CscsShareholder } from "@/types/cscs";


export const useGetAllCertificates = (params?: CertificateParams, options?: Omit<UseQueryOptions<PaginatedResponse<Certificate>, any, PaginatedResponse<Certificate>>, 'queryKey' | 'queryFn'>) => {

    return useQuery({
        queryKey: ["certificates", params],
        queryFn: () => GET_CERTIFICATES(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useGetCertificateById = (id: string, options?: Omit<UseQueryOptions<ApiResponse<Certificate>, any, ApiResponse<Certificate>>, 'queryKey' | 'queryFn'>) => {

    return useQuery({
        queryKey: ["certificates", id],
        queryFn: () => GET_CERTIFICATE_BY_ID(id),
        refetchOnWindowFocus: false,
        ...options,
    });
};


export const useIssueCertificate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            registerId: string;
            shareholderId: string;
            accountNumber: string;
            units: number;
            issueDate: string;
            certNumber: string;
            notes?: string;
        }) => ISSUE_CERTIFICATE(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["certificates"] });
        },
    });
};

export const useDisableCertificate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: string,
            data: {
                reason?: string,
            }
        }) => DISABLE_CERTIFICATE(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transfer-requests"] });
        },
    });
}

export const useGetShareholders = (params: { search: string, registerId?: string }, options?: Omit<UseQueryOptions<ApiResponse<CscsShareholder[]>, any, ApiResponse<CscsShareholder[]>>, 'queryKey' | 'queryFn'>) => {

    return useQuery({
        queryKey: ["shareholders", params],
        queryFn: () => GET_SHAREHOLDERS_CERTIFICATE(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};


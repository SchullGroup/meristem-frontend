import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { GET_AGENTS, Agent } from "@/actions/agentAction";

interface GetAgentsParams {
  type?: "BANK" | "STOCKBROKER" | "COLLECTING_AGENT";
  page?: number;
  size?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  sortDirection?: "asc" | "desc";
}

interface AgentsPage {
  content: Agent[];
  totalElements: number;
  totalPages: number;
}

export const agentKeys = {
  all: ["agents"] as const,
  list: (params?: GetAgentsParams) => [...agentKeys.all, "list", params] as const,
};

export const useGetAgents = (
  params?: GetAgentsParams,
  options?: Omit<UseQueryOptions<AgentsPage, Error>, "queryKey" | "queryFn">,
) => {
  return useQuery<AgentsPage, Error>({
    queryKey: agentKeys.list(params),
    queryFn: async () => {
      const res = await GET_AGENTS(params);
      return res.data as AgentsPage;
    },
    ...options,
  });
};

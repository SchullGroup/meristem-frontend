import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";
import { CscsInjectStatus } from "@/types/cscs";

// The old CSCS pull/upload/reconciliation flow was retired; the only surviving caller is the
// background job poller (lib/utils/job-handlers.ts), which polls an ingestion batch's status.
export const GET_CSCS_INJECT_STATUS = async (batchRef: string): Promise<CscsInjectStatus> => {
  try {
    const res = await api.get<CscsInjectStatus>(`/cscs-ingestion/status/${batchRef}`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

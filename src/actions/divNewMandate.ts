// "use server";
import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const GET_LOADED_MANDATE_QUEUES = async ({
  queryKey,
}: {
  queryKey: [string, string, string, number, number];
}) => {
  const registerId = queryKey[1];
  const dividendNumber = queryKey[2];
  const page = queryKey[3];
  const size = queryKey[4];

  try {
    const res = await api.get(`/dividend/mandate-payments/queue`, {
      params: {
        registerId,
        dividendNumber,
        page,
        size,
      },
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

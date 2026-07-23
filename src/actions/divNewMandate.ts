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

export const LOAD_ACCOUNT = async () => {
  try {
    const res = await api.post(`/dividend/mandate-payments/load`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const SUBMIT_MANDATE_PAYMENTS = async ({
  ids,
  totalAmount,
  authorisedBy,
}: {
  ids: string[];
  totalAmount: number;
  authorisedBy: string;
}) => {
  try {
    const res = await api.post(`/dividend/mandate-payments/submit`, {
      ids,
      totalAmount,
      authorisedBy,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_PENDING_MANDATE_PAYMENTS = async ({
  queryKey,
}: {
  queryKey: [string, string, string, number, number];
}) => {
  const registerId = queryKey[1];
  const dividendNumber = queryKey[2];
  const page = queryKey[3];
  const size = queryKey[4];

  try {
    const res = await api.get(`/dividend/mandate-payments/pending`, {
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

export const GET_PENDING_ICU_MANDATE_PAYMENTS = async ({
  queryKey,
}: {
  queryKey: [string, string, string, number, number];
}) => {
  const registerId = queryKey[1];
  const dividendNumber = queryKey[2];
  const page = queryKey[3];
  const size = queryKey[4];

  try {
    const res = await api.get(`/dividend/mandate-payments/icu`, {
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

export const APPROVE_MANDATE_PAYMENTS = async ({
  id,
  comment,
  authorisedBy,
}: {
  id: string;
  comment: string;
  authorisedBy: string;
}) => {
  try {
    const res = await api.post(`/dividend/mandate-payments/${id}/approve`, {
      comment,
      authorisedBy,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const REJECT_MANDATE_PAYMENTS = async ({
  id,
  comment,
  authorisedBy,
}: {
  id: string;
  comment: string;
  authorisedBy: string;
}) => {
  try {
    const res = await api.post(`/dividend/mandate-payments/${id}/reject`, {
      comment,
      authorisedBy,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const BATCH_APPROVE_MANDATE_PAYMENTS = async ({
  ids,
  comment,
  authorisedBy,
}: {
  ids: string[];
  comment: string;
  authorisedBy: string;
}) => {
  try {
    const res = await api.post(`/dividend/mandate-payments/batch/approve`, {
      ids,
      comment,
      authorisedBy,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const BATCH_REJECT_MANDATE_PAYMENTS = async ({
  ids,
  comment,
  authorisedBy,
}: {
  ids: string[];
  comment: string;
  authorisedBy: string;
}) => {
  try {
    const res = await api.post(`/dividend/mandate-payments/batch/reject`, {
      ids,
      comment,
      authorisedBy,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

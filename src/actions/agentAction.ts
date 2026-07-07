// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export interface Agent {
  name: string;
  type: string;
  code: string;
  cscsMemberCode: string;
  address: string;
  status: string;
  id: string;
}

export const GET_AGENTS = async (params?: {
  type?: "BANK" | "STOCKBROKER" | "COLLECTING_AGENT";
  page?: number;
  size?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE"
  sortDirection?: "asc" | "desc"
}) => {
  try {
    const res = await api.get(`/agents`, {
      params
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_AGENTS_STATS = async () => {
  try {
    const res = await api.get(`/agents/stats`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const CREATE_AGENT = async (data: {
  name: string;
  type: string;
  code: string;
  cscsMemberCode?: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
}) => {
  try {
    const res = await api.post(`/agents`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const UPDATE_AGENT = async (
  id: string,
  data: {
    name: string;
    type: string;
    code: string;
    cscsMemberCode?: string;
    address: string;
    status: "ACTIVE" | "INACTIVE";
  },
) => {
  try {
    const res = await api.put(`/agents/${id}`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
export const DELETE_AGENT = async (id: string) => {
  try {
    const res = await api.delete(`/agents/${id}`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

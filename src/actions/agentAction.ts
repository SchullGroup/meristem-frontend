// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const GET_AGENTS = async () => {
  try {
    const res = await api.get(`/agents`);
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
  status: "Active" | "Inactive";
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
    status: "Active" | "Inactive";
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

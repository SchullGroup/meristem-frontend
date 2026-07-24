import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

type IpoStatus = "DRAFT" | "OPEN" | "CLOSED" | "ALLOTTED" | "CONCLUDED";

interface GetOffersParams {
  status?: IpoStatus;
  registerId?: string;
  search?: string;
  page?: number;
  size?: number;
}

export const CREATE_NEW_OFFER = async (data: {
  name: string;
  registerId: string;
  offerPrice: number;
  totalUnits: number;
  minUnits: number;
  multiples: number;
  openingDate: string;
  closingDate: string;
  secApprovalDate: string;
  receivingBanks: { bankName: string; accountNumber: string }[];
  circularUrl: string;
  narration: string;
  createdBy: string;
}) => {
  try {
    const res = await api.post(`/offers/ipo`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const EDIT_OFFER = async (
  id: string | number,
  data: {
    name: string;
    registerId: string;
    offerPrice: number;
    totalUnits: number;
    minUnits: number;
    multiples: number;
    openingDate: string;
    closingDate: string;
    secApprovalDate: string;
    receivingBanks: { bankName: string; accountNumber: string }[];
    circularUrl: string;
    narration: string;
  },
) => {
  try {
    const res = await api.put(`/offers/ipo/${id}`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_IPO_OFFERS = async (params?: GetOffersParams) => {
  try {
    const res = await api.get("/offers/ipo", {
      params,
    });

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const MOVE_TO_REGISTER = async (
  id: string | number,
  data: {
    openedBy: string;
  },
) => {
  try {
    const res = await api.post(`/offers/ipo/${id}/open`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Right Offer Setup

export const CREATE_RIGHT_OFFER = async (data: {
  name: string;
  registerId: string;
  ratioNumerator: number;
  ratioDenominator: number;
  pricePerShare: number;
  qualificationDate: string;
  openingDate: string;
  closingDate: string;
  secApprovalDate: string;
  eventId: string;
  tradedRightsSymbol: string;
  receivingBanks: { bankName: string; accountNumber: string }[];
  circularUrl: string;
  narration: string;
  createdBy: string;
}) => {
  try {
    const res = await api.post(`/offers/rights-issue/setup`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_RIGHT_OFFERS = async (params?: GetOffersParams) => {
  try {
    const res = await api.get("/offers/rights-issue/setup", {
      params,
    });

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const EDIT_RIGHT_OFFER = async (
  id: string | number,
  data: {
    name: string;
    registerId: string;
    ratioNumerator: number;
    ratioDenominator: number;
    pricePerShare: number;
    qualificationDate: string;
    openingDate: string;
    closingDate: string;
    secApprovalDate: string;
    eventId: string;
    tradedRightsSymbol: string;
    receivingBanks: { bankName: string; accountNumber: string }[];
    circularUrl: string;
    narration: string;
  },
) => {
  try {
    const res = await api.put(`/offers/rights-issue/setup/${id}`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const MOVE_RIGHT_TO_REGISTER = async (
  id: string | number,
  data: { openedBy: string },
) => {
  try {
    const res = await api.post(`/offers/rights-issue/setup/${id}/open`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_A_SINGLE_RIGHT_OFFERS = async (id: string | number) => {
  try {
    const res = await api.get(`/offers/rights-issue/setup/${id}`);

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

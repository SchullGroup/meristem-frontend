import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

type IpoStatus = "DRAFT" | "OPEN" | "CLOSED" | "ALLOTTED" | "CONCLUDED";

interface GetIpoOffersParams {
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

export const GET_IPO_OFFERS = async (params?: GetIpoOffersParams) => {
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

// export const MOVE_TO_REGISTER = async (id:, data: {
//   name: string;
//   description: string;
//   permissionNames: string[];
// }) => {
//   try {
//     const res = await api.post(`/offers/ipo/${id}/open`, data);
//     return res.data;
//   } catch (error) {
//     const err = error as ErrorLike;
//     throw new Error(returnErrorMessage(err));
//   }
// };

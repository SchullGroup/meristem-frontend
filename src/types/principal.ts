export type PrincipalStatus = "Active" | "Inactive";

export interface Principal {
  principalId: string;
  principalName: string;
  billingCategory: string;
  industrySector: string;
  dateListedOnNgx: string;
  registeredAddress: string;
  officialEmail: string;
  phoneNumber: string;
  tin: string;
  rcNumber: string;
  sector: string;
  companySecretary: string;
  companySecretaryPhone: string;
  shareHoldersAtSetUp: number;
  numberOfRegisters?: number;
  status: PrincipalStatus | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrincipalPayload {
  principalName: string;
  billingCategory: string;
  industrySector?: string;
  dateListedOnNgx?: string;
  registeredAddress?: string;
  officialEmail?: string;
  phoneNumber?: string;
  tin?: string;
  rcNumber?: string;
  sector?: string;
  companySecretary?: string;
  companySecretaryPhone?: string;
  shareHoldersAtSetUp?: number;
  status?: PrincipalStatus | string;
}

export type UpdatePrincipalPayload = Partial<CreatePrincipalPayload>;

export interface UpdatePrincipalStatusPayload {
  status: PrincipalStatus | string;
}

export interface GetPrincipalsParams {
  status?: string;
  billingCategory?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface PrincipalStats {
  totalPrincipals: number;
  activePrincipals: number;
  inactivePrincipals: number;
  billingBreakdown: Record<string, number>;
}

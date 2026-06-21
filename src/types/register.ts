export type RegisterStatus = "ACTIVE" | "INACTIVE" | "TRANSACTION_DISABLED";

export type RegisterType = "Ordinary" | "Preference" | "Fund" | "Bond" | "Etf";

export interface Register {
  id: number;
  registerId: string;
  registerName: string;
  registerType: RegisterType | string;
  symbol: string;
  shareholderSizeAtSetup: number;
  currentShareholdersSize: number;
  stockInIssueAtSetup: number;
  currentStockInIssue: number;
  nominalValue: number;
  status: RegisterStatus;
  principalId: string;
  principalName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegisterPayload {
  principalId: string;
  registerName: string;
  registerType: RegisterType | string;
  symbol: string;
  shareholderSizeAtSetup: number;
  currentShareholdersSize: number;
  stockInIssueAtSetup: number;
  currentStockInIssue: number;
  nominalValue: number;
  status: RegisterStatus | string;
}

export type UpdateRegisterPayload = Partial<CreateRegisterPayload>;

export interface UpdateRegisterStatusPayload {
  status: RegisterStatus | string;
}

export interface GetRegistersParams {
  principalId?: string;
  registerType?: string;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface RegisterStats {
  totalRegisters: number;
  activeRegisters: number;
  transactionDisabledRegisters: number;
  inactiveRegisters: number;
  totalStockInIssue: number;
  typeBreakdown: Record<string, number>;
}

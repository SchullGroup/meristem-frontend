import { z } from "zod";

export const registerSchema = z.object({
  registerName: z.string().min(2, "Register name is required"),
  principalId: z.string().min(1, "Principal is required"),
  registerType: z.string(),
  symbol: z.string().min(1, "Exchange symbol is required"),
  nominalValue: z.coerce.number<number>().min(0, "Cannot be negative"),
  stockInIssueAtSetup: z.coerce.number<number>().min(0, "Cannot be negative"),
  currentStockInIssue: z.coerce.number<number>().min(0, "Cannot be negative"),
  shareholderSizeAtSetup: z.coerce
    .number<number>()
    .min(0, "Cannot be negative"),
  currentShareholdersSize: z.coerce
    .number<number>()
    .min(0, "Cannot be negative"),
  status: z.enum(["ACTIVE", "INACTIVE", "TRANSACTION_DISABLED"]),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

import { z } from "zod";

export const registerSchema = z.object({
  registerName: z.string().min(2, "Register name is required"),
  principalId: z.string().min(1, "Principal is required"),
  registerType: z.string(),
  symbol: z.string().min(1, "Exchange symbol is required"),
  nominalValue: z.coerce.number<number>().min(1, "Must be at least 1"),
  stockInIssueAtSetup: z.coerce.number<number>().min(1, "Must be at least 1"),
  currentStockInIssue: z.coerce.number<number>().min(1, "Must be at least 1"),
  shareholderSizeAtSetup: z.coerce
    .number<number>()
    .min(1, "Must be at least 1"),
  status: z.enum(["ACTIVE", "INACTIVE", "TRANSACTION_DISABLED"]),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

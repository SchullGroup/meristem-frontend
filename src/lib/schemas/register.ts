import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Register name is required"),
  principalId: z.string().min(1, "Principal is required"),
  registerType: z.enum(["ORDINARY", "PREFERENCE", "BOND", "FUND"], {
    message: "Register type is required",
  }),
  symbol: z.string().min(1, "Exchange symbol is required"),
  nominalValue: z.coerce.number().min(0, "Cannot be negative"),
  stockAtSetup: z.coerce.number().min(0, "Cannot be negative"),
  shareholdersAtSetup: z.coerce.number().min(0, "Cannot be negative"),
  allowFraction: z.boolean(),
  decimalPlaces: z.coerce.number().refine(val => [0, 2, 4].includes(val), "Must be 0, 2, or 4"),
  closedEnded: z.boolean(),
  status: z.enum(["ACTIVE", "INACTIVE", "TRANSACTION_DISABLED"]),
}).refine(data => {
  if (!data.allowFraction && data.decimalPlaces !== 0) {
    return false;
  }
  return true;
}, {
  message: "Decimal places must be 0 if fractions are not allowed",
  path: ["decimalPlaces"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
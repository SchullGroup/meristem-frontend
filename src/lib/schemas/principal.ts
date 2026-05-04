import { z } from "zod";

export const principalSchema = z.object({
  name: z.string().min(2, "Principal name is required"),
  billingCategory: z.enum(["A", "B", "C"], {
    message: "Billing category is required",
  }),
  sector: z.string().min(1, "Sector is required"),
  dateListed: z.date().optional(),
  companySecretary: z.string().optional(),
  companySecretaryPhone: z.string().optional(),
  address: z.string().min(5, "Registered address is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  tin: z.string().optional(),
  rcNumber: z.string().optional(),
  shareholdersAtSetup: z.coerce.number().min(0, "Cannot be negative"),
});

export type PrincipalFormValues = z.infer<typeof principalSchema>;
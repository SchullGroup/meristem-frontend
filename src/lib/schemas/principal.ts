import { z } from "zod";

export const principalSchema = z.object({
  principalName: z.string().min(2, "Principal name is required"),
  billingCategory: z.string().min(1, "Billing category is required"),
  industrySector: z.string().min(1, "Industry sector is required"),
  dateListedOnNgx: z.date(),
  registeredAddress: z.string().min(5, "Registered address is required"),
  sector: z.string().min(1, "Sector is required"),
  officialEmail: z.email("Invalid email address"),
  phoneNumber: z.string().min(5, "Phone number is required"),
  tin: z.string()
    .min(8, "Tax identification number must be at least 8 characters")
    .max(12, "Tax identification number must not be more than 12 characters"),
  rcNumber: z.string().min(1, "Registration number is required"),
  companySecretary: z.string().min(1, "Company secretary is required"),
  companySecretaryPhone: z
    .string()
    .min(5, "Company secretary phone is required"),
  // shareHoldersAtSetUp: z.coerce
  //   .number<number>()
  //   .min(1, "Shareholders at set up is required"),
  status: z.enum(["ACTIVE", "INACTIVE"], {
    error: "Please select a status"
  })
});

export type PrincipalFormValues = z.infer<typeof principalSchema>;

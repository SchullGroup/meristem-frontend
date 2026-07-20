import { z } from "zod";

// ── Constants (configurable, confirm with business team before changing) ──

export const MAX_FILE_SIZE_BYTES = 20000000; // 20 MB

export const ID_TYPE_OPTIONS = [
  "National ID",
  "International Passport",
  "Driver's License",
  "Voter's Card",
] as const;

export const NIN_REGEX = /^\d{11}$/;
export const BVN_REGEX = /^\d{11}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[\d\s()\-]{10,15}$/;

// ── Document entry ──

export const docEntrySchema = z.object({
  name: z.string(),
  url: z.string(),
});

// ── Administrator (per-card) ──

export const administratorSchema = z.object({
  isExecutor: z.boolean(),
  adminName: z.string().min(1, "Administrator / Executor Name is required"),
  email: z
    .string()
    .min(1, "Email Address is required")
    .regex(EMAIL_REGEX, "Email Address is invalid"),
  phone: z
    .string()
    .min(1, "Phone Number is required")
    .regex(PHONE_REGEX, "Phone Number is invalid"),
  altPhone: z.string().optional(),
  bvn: z
    .string()
    .min(1, "BVN is required")
    .regex(BVN_REGEX, "BVN must be 11 digits"),
  nin: z
    .string()
    .min(1, "NIN is required")
    .regex(NIN_REGEX, "NIN must be 11 digits"),
  idType: z.string().min(1, "ID Type is required"),
  relationship: z.string().optional(),
  adminAddress: z.string().min(1, "Admin Address is required"),
  adminCity: z.string().min(1, "Admin City is required"),
  adminState: z.string().min(1, "Admin State is required"),
  memo: z.string().optional(),
  documents: z.array(docEntrySchema).optional(),
});

// ── Probate details ──

export const probateSchema = z.object({
  probateCourt: z.string().min(1, "Probate Court is required"),
  probateNumber: z.string().min(1, "Probate Number is required"),
  probatePage: z.string().min(1, "Probate Page is required"),
  probateDate: z.date({ error: "Probate Date is required" }),
  lodgementDate: z.date({ error: "Lodgement Date is required" }),
  probateDocs: z.array(docEntrySchema),
});

// ── Full form (validation-only, not tied to react-hook-form state) ──

export const admonFormSchema = z.object({
  selectedAccountIds: z
    .array(z.string())
    .min(1, "Please select at least one deceased account"),
  probate: probateSchema,
  administrators: z
    .array(administratorSchema)
    .min(1, "At least one administrator is required"),
  changeNameToEstate: z.boolean(),
});

export type AdmonFormValues = z.infer<typeof admonFormSchema>;
export type AdministratorFormValues = z.infer<typeof administratorSchema>;
export type ProbateFormValues = z.infer<typeof probateSchema>;

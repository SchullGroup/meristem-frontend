"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { User } from "@/lib/types";
import { CREATE_USER, UPDATE_USER } from "@/actions/userAction";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";

const DEPARTMENTS = [
  "IT",
  "Operations",
  "Internal Control",
  "Audit",
  "Customer Service",
  "Management",
  "Finance",
];

const userSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(5, "Phone is required"),
  department: z.string().min(1, "Department is required"),
  role: z.string().min(1, "Primary role is required"),
  secondaryRole: z.string().optional(),
  certificateTransactionLimit: z.coerce.number().min(0),
  dividendTransactionLimit: z.coerce.number().min(0),
  status: z.enum(["Active", "Inactive"]),
  firstTimeLogin: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: User | null;
}

export function UserForm({
  open,
  onOpenChange,
  mode,
  initialData,
}: UserFormProps) {
  const queryClient = useQueryClient();
  const { users } = useStore();

  const { data: roles } = useRoles();
  const roleNames = roles?.map((r: { name: string }) => r.name);

  const addUserMutation = useMutation({
    mutationFn: CREATE_USER,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: UPDATE_USER,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
  });

  const form = useForm<UserFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userSchema) as any,
    defaultValues: initialData
      ? {
          firstName: initialData.firstName,
          lastName: initialData.lastName,
          email: initialData.email,
          phone: initialData.phone ?? "",
          department: initialData.department ?? "",
          role: initialData.roles[0],
          secondaryRole: initialData.roles[1] || "",
          certificateTransactionLimit:
            initialData.certificateTransactionLimit ?? 0,
          dividendTransactionLimit: initialData.dividendTransactionLimit ?? 0,
          status: initialData.status ?? "Active",
          firstTimeLogin: false,
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          department: "",
          role: "",
          secondaryRole: "",
          certificateTransactionLimit: 0,
          dividendTransactionLimit: 0,
          status: "Active",
          firstTimeLogin: true,
        },
  });

  const onSubmit = (values: UserFormValues) => {
    // Basic dup check
    if (
      mode === "create" &&
      users.some((u) => u.email.toLowerCase() === values.email.toLowerCase())
    ) {
      form.setError("email", { message: "Email already exists" });
      return;
    }

    if (mode === "create") {
      addUserMutation.mutate(values);
    } else if (initialData) {
      updateUserMutation.mutate({
        id: initialData.id,
        userData: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          department: values.department,
          roles: [values.role],
          secondaryRole: values.secondaryRole
            ? values.secondaryRole
            : undefined,
          certificateTransactionLimit: values.certificateTransactionLimit,
          dividendTransactionLimit: values.dividendTransactionLimit,
          status: values.status,
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Add New User"
              : `Edit User — ${initialData?.firstName} ${initialData?.lastName}`}
          </DialogTitle>
          <DialogDescription>
            Manage system access and authorization limits.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[70vh]">
              {/* SECTION 1: Personal & Contact */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Personal & Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="mrpsl-label">
                          First Name *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="mrpsl-input h-11" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="mrpsl-label">
                          Last Name *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="mrpsl-input h-11" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="mrpsl-label">
                          Email Address *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            className="mrpsl-input h-11"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="mrpsl-label">
                          Phone Number *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="mrpsl-input h-11" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="mrpsl-label">
                          Department *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="mrpsl-input h-11">
                              <SelectValue placeholder="Select dept" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="bg-border" />

              {/* SECTION 2: Role & Authorization */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Role & Authorization Limits
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="mrpsl-label">
                          Primary Role *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="mrpsl-input h-11">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roleNames?.map((r: string) => (
                              <SelectItem key={r} value={r}>
                                {r.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secondaryRole"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="mrpsl-label">
                          Secondary Role (Leave Cover)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="mrpsl-input h-11">
                              <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {roleNames?.map((r: string) => (
                              <SelectItem key={r} value={r}>
                                {r.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  {/* <FormField
                    control={form.control}
                    name="certificateTransactionLimit"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="mrpsl-label">
                          Certificate Approval Limit (₦) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="mrpsl-input h-11 font-mono"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive mt-1" />
                      </FormItem>
                    )}
                  /> */}
                  {/* <FormField
                    control={form.control}
                    name="dividendTransactionLimit"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="mrpsl-label">
                          Dividend Approval Limit (₦) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="mrpsl-input h-11 font-mono"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive mt-1" />
                      </FormItem>
                    )}
                  /> */}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* SECTION 3: Account Status */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Account Status
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-8"
                          >
                            <div className="flex items-center space-x-2.5">
                              <RadioGroupItem
                                value="Active"
                                id="u-active"
                                className="h-5 w-5"
                              />
                              <label
                                htmlFor="u-active"
                                className="text-sm font-medium text-green-700"
                              >
                                Active
                              </label>
                            </div>
                            <div className="flex items-center space-x-2.5">
                              <RadioGroupItem
                                value="Inactive"
                                id="u-inactive"
                                className="h-5 w-5"
                              />
                              <label
                                htmlFor="u-inactive"
                                className="text-sm font-medium text-muted-foreground"
                              >
                                Inactive
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {mode === "create" && (
                    <FormField
                      control={form.control}
                      name="firstTimeLogin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/5 col-span-2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-bold uppercase tracking-tight text-foreground/70">
                              Security Policy
                            </FormLabel>
                            <p className="text-[11px] text-muted-foreground">
                              Force password reset on first login
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="text-sm font-bold px-8 h-12 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-sm font-bold px-10 h-12 rounded-xl cursor-pointer"
                disabled={addUserMutation.isPending}
              >
                {mode === "create" ? "Create User" : "Save Changes"}
                {addUserMutation.isPending && (
                  <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

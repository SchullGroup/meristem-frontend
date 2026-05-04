"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { User, UserRole } from "@/lib/types";

const ROLES: UserRole[] = [
  "SYSTEM_ADMIN", "OPS_MANAGER", "DIV_INITIATOR", "DIV_AUTHORIZER", 
  "CERT_INITIATOR", "CERT_AUTHORIZER", "ICU", "HEAD_OPS", "ACCOUNTS", 
  "IT", "MANAGEMENT", "AUDIT_REVIEWER", "ENQUIRY_ONLY"
];

const DEPARTMENTS = ["IT", "Operations", "Internal Control", "Audit", "Customer Service", "Management", "Finance"];

const userSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(5, "Phone is required"),
  department: z.string().min(1, "Department is required"),
  role: z.string().min(1, "Primary role is required"),
  secondaryRole: z.string().optional(),
  certLimit: z.coerce.number().min(0),
  divLimit: z.coerce.number().min(0),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  firstTimeLogin: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: User | null;
}

export function UserForm({ open, onOpenChange, mode, initialData }: UserFormProps) {
  const { users, addUser, updateUser } = useStore();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: initialData ? {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      email: initialData.email,
      phone: initialData.phone,
      department: initialData.department,
      role: initialData.role,
      secondaryRole: initialData.secondaryRole || "",
      certLimit: initialData.certLimit,
      divLimit: initialData.divLimit,
      status: initialData.status,
      firstTimeLogin: false,
    } : {
      firstName: "", lastName: "", email: "", phone: "", department: "",
      role: "", secondaryRole: "", certLimit: 0, divLimit: 0, status: "ACTIVE", firstTimeLogin: true,
    },
  });

  const onSubmit = (values: UserFormValues) => {
    // Basic dup check
    if (mode === "create" && users.some(u => u.email.toLowerCase() === values.email.toLowerCase())) {
      form.setError("email", { message: "Email already exists" });
      return;
    }

    if (mode === "create") {
      const newId = `USR-${String(users.length + 1).padStart(4, '0')}`;
      addUser({
        id: newId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        department: values.department,
        role: values.role as UserRole,
        secondaryRole: values.secondaryRole ? (values.secondaryRole as UserRole) : undefined,
        certLimit: values.certLimit,
        divLimit: values.divLimit,
        status: values.status,
        twoFAEnabled: false,
      });
    } else if (initialData) {
      updateUser(initialData.id, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        department: values.department,
        role: values.role as UserRole,
        secondaryRole: values.secondaryRole ? (values.secondaryRole as UserRole) : undefined,
        certLimit: values.certLimit,
        divLimit: values.divLimit,
        status: values.status,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New User" : `Edit User — ${initialData?.firstName} ${initialData?.lastName}`}</DialogTitle>
          <DialogDescription>Manage system access and authorization limits.</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[70vh]">
              {/* SECTION 1: Personal & Contact */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Personal & Contact Information</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="mrpsl-label">First Name *</FormLabel>
                      <FormControl><Input {...field} className="mrpsl-input h-11" /></FormControl>
                      <FormMessage className="text-[10px] text-destructive mt-1" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="mrpsl-label">Last Name *</FormLabel>
                      <FormControl><Input {...field} className="mrpsl-input h-11" /></FormControl>
                      <FormMessage className="text-[10px] text-destructive mt-1" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="mrpsl-label">Email Address *</FormLabel>
                      <FormControl><Input type="email" {...field} className="mrpsl-input h-11" /></FormControl>
                      <FormMessage className="text-[10px] text-destructive mt-1" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="mrpsl-label">Phone Number *</FormLabel>
                      <FormControl><Input {...field} className="mrpsl-input h-11" /></FormControl>
                      <FormMessage className="text-[10px] text-destructive mt-1" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="mrpsl-label">Department *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="mrpsl-input h-11"><SelectValue placeholder="Select dept" /></SelectTrigger></FormControl>
                        <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] text-destructive mt-1" />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator className="bg-border" />

              {/* SECTION 2: Role & Authorization */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Role & Authorization Limits</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="mrpsl-label">Primary Role *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="mrpsl-input h-11"><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                        <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] text-destructive mt-1" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="secondaryRole" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="mrpsl-label">Secondary Role (Leave Cover)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="mrpsl-input h-11"><SelectValue placeholder="Optional" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="NONE">None</SelectItem>
                          {ROLES.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="certLimit" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="mrpsl-label">Certificate Approval Limit (₦) *</FormLabel>
                      <FormControl><Input type="number" {...field} className="mrpsl-input h-11 font-mono" /></FormControl>
                      <FormMessage className="text-[10px] text-destructive mt-1" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="divLimit" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="mrpsl-label">Dividend Approval Limit (₦) *</FormLabel>
                      <FormControl><Input type="number" {...field} className="mrpsl-input h-11 font-mono" /></FormControl>
                      <FormMessage className="text-[10px] text-destructive mt-1" />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator className="bg-border" />

              {/* SECTION 3: Account Status */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Account Status</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                          <div className="flex items-center space-x-2.5"><RadioGroupItem value="ACTIVE" id="u-active" className="h-5 w-5" /><label htmlFor="u-active" className="text-sm font-medium text-green-700">Active</label></div>
                          <div className="flex items-center space-x-2.5"><RadioGroupItem value="INACTIVE" id="u-inactive" className="h-5 w-5" /><label htmlFor="u-inactive" className="text-sm font-medium text-muted-foreground">Inactive</label></div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )} />
                  {mode === "create" && (
                    <FormField control={form.control} name="firstTimeLogin" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/5 col-span-2">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-bold uppercase tracking-tight text-foreground/70">Security Policy</FormLabel>
                          <p className="text-[11px] text-muted-foreground">Force password reset on first login</p>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" className="text-sm font-bold px-8 h-12" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="text-sm font-bold px-10 h-12 rounded-xl">
                {mode === "create" ? "Create User" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
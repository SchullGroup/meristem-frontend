"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { principalSchema, PrincipalFormValues } from "@/lib/schemas/principal";
import { useStore } from "@/lib/store";
import { Principal } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";

interface PrincipalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: Principal | null;
}

export function PrincipalForm({ open, onOpenChange, mode, initialData }: PrincipalFormProps) {
  const { principals, addPrincipal, updatePrincipal, logAudit } = useStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<PrincipalFormValues | null>(null);

  const form = useForm<PrincipalFormValues>({
    resolver: zodResolver(principalSchema) as any,
    defaultValues: initialData ? {
      name: initialData.name,
      billingCategory: initialData.billingCategory,
      sector: initialData.sector,
      dateListed: initialData.dateListed ? new Date(initialData.dateListed) : undefined,
      companySecretary: initialData.companySecretary || "",
      companySecretaryPhone: initialData.companySecretaryPhone || "",
      address: initialData.address,
      email: initialData.email,
      phone: initialData.phone,
      tin: initialData.tin || "",
      rcNumber: initialData.rcNumber || "",
      shareholdersAtSetup: initialData.shareholdersAtSetup,
    } : {
      name: "",
      sector: "",
      address: "",
      email: "",
      phone: "",
      companySecretary: "",
      companySecretaryPhone: "",
      tin: "",
      rcNumber: "",
      shareholdersAtSetup: 0,
    },
  });

  const onSubmit = (values: PrincipalFormValues) => {
    // Duplicate name check (case-insensitive)
    const isDuplicate = principals.some(
      p => p.name.toLowerCase() === values.name.toLowerCase() && p.id !== initialData?.id
    );
    
    if (isDuplicate) {
      form.setError("name", { type: "manual", message: "A principal with this name already exists." });
      return;
    }

    setPendingValues(values);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingValues) return;

    if (mode === "create") {
      const newId = `PRIN-${String(principals.length + 1).padStart(4, '0')}`;
      const newPrincipal: Principal = {
        ...pendingValues,
        id: newId,
        dateListed: pendingValues.dateListed?.toISOString(),
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      };
      addPrincipal(newPrincipal);
      logAudit({
        action: "PRINCIPAL_CREATED",
        entityType: "Principal",
        entityId: newId,
        before: null,
        after: newPrincipal,
        actor: "Current User",
        actorId: "usr",
        role: "ADMIN"
      });
      toast.success(`Principal ${pendingValues.name} has been created successfully.`);
    } else if (mode === "edit" && initialData) {
      const updates = {
        ...pendingValues,
        dateListed: pendingValues.dateListed?.toISOString()
      };
      updatePrincipal(initialData.id, updates);
      logAudit({
        action: "PRINCIPAL_UPDATED",
        entityType: "Principal",
        entityId: initialData.id,
        before: initialData,
        after: { ...initialData, ...updates },
        actor: "Current User",
        actorId: "usr",
        role: "ADMIN"
      });
      toast.success(`Principal ${pendingValues.name} has been updated successfully.`);
    }

    setConfirmOpen(false);
    onOpenChange(false);
    form.reset();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Add New Principal" : `Edit Principal — ${initialData?.name}`}</DialogTitle>
            <DialogDescription>
              All fields marked * are required. Principal ID is system-generated.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
              <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[70vh]">
                {/* SECTION 1: Identity & Categorization */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Identity & Categorization</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">Principal Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Dangote Cement PLC" className="mrpsl-input h-11" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billingCategory"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">Billing Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="mrpsl-input h-11">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A">Category A</SelectItem>
                              <SelectItem value="B">Category B</SelectItem>
                              <SelectItem value="C">Category C</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sector"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">Industry Sector *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="mrpsl-input h-11">
                                <SelectValue placeholder="Select sector" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Banking", "Insurance", "Consumer Goods", "Oil & Gas", "Healthcare", "Manufacturing", "Telecommunications", "Technology", "Other"].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateListed"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel className="mrpsl-label">Date Listed on NGX</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`mrpsl-input h-11 pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* SECTION 2: Contact & Registration */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Contact & Registration Details</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="space-y-2 col-span-2">
                          <FormLabel className="mrpsl-label">Registered Address *</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} className="focus-visible:ring-primary rounded-xl" />
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
                          <FormLabel className="mrpsl-label">Official Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} className="mrpsl-input h-11" />
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
                          <FormLabel className="mrpsl-label">Phone Number *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+234..." {...field} className="mrpsl-input h-11" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tin"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">TIN (Tax ID)</FormLabel>
                          <FormControl>
                            <Input placeholder="Tax Identification Number" {...field} className="mrpsl-input h-11" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rcNumber"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">RC Number</FormLabel>
                          <FormControl>
                            <Input placeholder="CAC Registration Number" {...field} className="mrpsl-input h-11" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* SECTION 3: Governance & Setup */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Governance & Setup Parameters</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="companySecretary"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">Company Secretary</FormLabel>
                          <FormControl>
                            <Input {...field} className="mrpsl-input h-11" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companySecretaryPhone"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">Secretary Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} className="mrpsl-input h-11" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shareholdersAtSetup"
                      render={({ field }) => (
                        <FormItem className="space-y-2 col-span-2">
                          <FormLabel className="mrpsl-label">Shareholders at Setup *</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} className="mrpsl-input h-11 font-mono" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" className="text-sm font-bold px-8 h-12" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" className="text-sm font-bold px-10 h-12 rounded-xl">
                  {mode === "create" ? "Create Principal" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              You are about to {mode} {pendingValues?.name} as a principal. This action will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
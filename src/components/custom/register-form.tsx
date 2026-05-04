"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/lib/schemas/register";
import { useStore } from "@/lib/store";
import { Register } from "@/lib/types";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { InfoIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface RegisterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: Register | null;
}

export function RegisterForm({ open, onOpenChange, mode, initialData }: RegisterFormProps) {
  const { registers, principals, addRegister, updateRegister, logAudit } = useStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<RegisterFormValues | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: initialData ? {
      name: initialData.name,
      principalId: initialData.principalId,
      registerType: initialData.registerType,
      symbol: initialData.symbol,
      nominalValue: initialData.nominalValue,
      stockAtSetup: initialData.stockAtSetup,
      shareholdersAtSetup: initialData.shareholdersAtSetup,
      allowFraction: initialData.allowFraction,
      decimalPlaces: initialData.decimalPlaces,
      closedEnded: initialData.closedEnded,
      status: initialData.status,
    } : {
      name: "",
      principalId: "",
      registerType: "ORDINARY",
      symbol: "",
      nominalValue: 0.5,
      stockAtSetup: 0,
      shareholdersAtSetup: 0,
      allowFraction: false,
      decimalPlaces: 0,
      closedEnded: true,
      status: "ACTIVE",
    },
  });

  const allowFraction = form.watch("allowFraction");
  const registerType = form.watch("registerType");
  const status = form.watch("status");

  useEffect(() => {
    if (!allowFraction) {
      form.setValue("decimalPlaces", 0);
    }
  }, [allowFraction, form]);

  const activePrincipals = principals.filter(p => p.status === "ACTIVE");

  const onSubmit = (values: RegisterFormValues) => {
    const isDuplicate = registers.some(
      r => r.name.toLowerCase() === values.name.toLowerCase() && r.id !== initialData?.id
    );
    
    if (isDuplicate) {
      form.setError("name", { type: "manual", message: "A register with this name already exists." });
      return;
    }

    setPendingValues(values);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingValues) return;

    if (mode === "create") {
      const newId = `REG-${String(registers.length + 1).padStart(4, '0')}`;
      const newRegister: Register = {
        ...pendingValues,
        id: newId,
        decimalPlaces: pendingValues.decimalPlaces as 0 | 2 | 4,
        stockToday: pendingValues.stockAtSetup,
        shareholdersToday: pendingValues.shareholdersAtSetup,
        createdAt: new Date().toISOString()
      };
      addRegister(newRegister);
      logAudit({
        action: "REGISTER_CREATED",
        entityType: "Register",
        entityId: newId,
        before: null,
        after: newRegister,
        actor: "Current User",
        actorId: "usr",
        role: "ADMIN"
      });
      toast.success(`Register ${pendingValues.name} has been created successfully.`);
    } else if (mode === "edit" && initialData) {
      const updates = { ...pendingValues, decimalPlaces: pendingValues.decimalPlaces as 0 | 2 | 4 };
      updateRegister(initialData.id, updates);
      logAudit({
        action: "REGISTER_UPDATED",
        entityType: "Register",
        entityId: initialData.id,
        before: initialData,
        after: { ...initialData, ...updates },
        actor: "Current User",
        actorId: "usr",
        role: "ADMIN"
      });
      toast.success(`Register ${pendingValues.name} has been updated successfully.`);
    }

    setConfirmOpen(false);
    onOpenChange(false);
    form.reset();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Add New Register" : `Edit Register — ${initialData?.name}`}</DialogTitle>
            <DialogDescription>
              All fields marked * are required. Register ID is system-generated.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
              <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[70vh]">
                {/* SECTION 1: Register Identity */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Register Identity</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">Register Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Ordinary Shares" className="mrpsl-input h-11" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registerType"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">Register Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="mrpsl-input h-11">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ORDINARY">Ordinary</SelectItem>
                              <SelectItem value="PREFERENCE">Preference</SelectItem>
                              <SelectItem value="BOND">Bond</SelectItem>
                              <SelectItem value="FUND">Fund</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem className="space-y-2 col-span-2">
                          <FormLabel className="mrpsl-label">Ticker Symbol</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. ZENITH" className="mrpsl-input h-11 uppercase" onChange={e => field.onChange(e.target.value.toUpperCase())} />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* SECTION 2: Capital Structure */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Capital Structure & Parameters</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="stockAtSetup"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">Stock in Issue at Setup *</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} className="mrpsl-input h-11 font-mono" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nominalValue"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">Nominal Value (₦) *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} className="mrpsl-input h-11 font-mono" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allowFraction"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 col-span-2 bg-muted/5">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-bold uppercase tracking-tight text-foreground/70">Allow Fraction</FormLabel>
                            <p className="text-[11px] text-muted-foreground">Support partial shares</p>
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
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* SECTION 3: Status */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Operating Status</h3>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row gap-8"
                          >
                            <FormItem className="flex items-center space-x-2.5 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="ACTIVE" className="h-5 w-5" />
                              </FormControl>
                              <FormLabel className="font-medium text-sm text-green-700">Active</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2.5 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="INACTIVE" className="h-5 w-5" />
                              </FormControl>
                              <FormLabel className="font-medium text-sm text-muted-foreground">Inactive</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2.5 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="TRANSACTION_DISABLED" className="h-5 w-5" />
                              </FormControl>
                              <FormLabel className="font-medium text-sm text-red-600">Transaction Disabled</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" className="text-sm font-bold px-8 h-12" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" className="text-sm font-bold px-10 h-12 rounded-xl">
                  {mode === "create" ? "Create Register" : "Save Changes"}
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
              {pendingValues?.status === "TRANSACTION_DISABLED" && mode === "edit" && initialData?.status === "ACTIVE" 
                ? "Setting this register to Transaction Disabled will block all dividend declarations, certificate operations, and KYC updates. Are you sure?"
                : `You are about to ${mode} register ${pendingValues?.name}. This action will be recorded in the audit log.`
              }
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
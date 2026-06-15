"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/lib/schemas/register";
import { Register } from "@/types/register";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCreateRegister, useUpdateRegister } from "@/hooks/useRegisters";
import { Loader2 } from "lucide-react";
import { useGetPrincipals } from "@/hooks/usePrincipal";

interface RegisterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: Register | null;
}

export function RegisterForm({
  open,
  onOpenChange,
  mode,
  initialData,
}: RegisterFormProps) {
  const { data, isLoading } = useGetPrincipals({ size: 100 });

  const createRegister = useCreateRegister();
  const updateRegister = useUpdateRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: initialData
      ? {
          registerName: initialData.registerName,
          principalId: initialData.principalId,
          registerType: initialData.registerType,
          symbol: initialData.symbol,
          nominalValue: initialData.nominalValue,
          stockInIssueAtSetup: initialData.stockInIssueAtSetup,
          shareholderSizeAtSetup: initialData.shareholderSizeAtSetup,
          currentStockInIssue: initialData.currentStockInIssue,
          currentShareholdersSize: initialData.currentShareholdersSize,
          status: initialData.status ?? "ACTIVE",
        }
      : {
          registerName: "",
          principalId: "",
          registerType: "ORDINARY",
          symbol: "",
          nominalValue: Number(""),
          stockInIssueAtSetup: Number(""),
          shareholderSizeAtSetup: Number(""),
          currentStockInIssue: Number(""),
          currentShareholdersSize: Number(""),
          status: "ACTIVE",
        },
  });

  const onSubmit = (values: RegisterFormValues) => {
    if (!values) return;

    const payload = {
      ...values,
    };

    if (mode === "create") {
      createRegister.mutate(payload, {
        onSuccess: () => {
          toast.success(
            `Register ${payload.registerName} has been created successfully.`,
          );
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    } else if (mode === "edit" && initialData) {
      updateRegister.mutate(
        {
          registerId: initialData.registerId,
          payload,
        },
        {
          onSuccess: () => {
            toast.success(
              `Register ${values.registerName} has been updated successfully.`,
            );
            onOpenChange(false);
            form.reset();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        },
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? "Add New Register"
                : `Edit Register — ${initialData?.registerName}`}
            </DialogTitle>
            <DialogDescription>
              All fields marked * are required. Register ID is system-generated.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col h-full"
            >
              <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[70vh]">
                {/* SECTION 1: Register Identity */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Register Identity
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="registerName"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Register Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. Ordinary Shares"
                              className="mrpsl-input h-11"
                            />
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
                          <FormLabel className="mrpsl-label">
                            Register Type *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mrpsl-input h-11">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ORDINARY">Ordinary</SelectItem>
                              <SelectItem value="PREFERENCE">
                                Preference
                              </SelectItem>
                              <SelectItem value="BOND">Bond</SelectItem>
                              <SelectItem value="FUND">Fund</SelectItem>
                              <SelectItem value="ETF">Etf</SelectItem>
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
                          <FormLabel className="mrpsl-label">
                            Ticker Symbol
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. ZENITH"
                              className="mrpsl-input h-11 uppercase"
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                              }
                            />
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
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Capital Structure & Parameters
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="nominalValue"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Nominal Value (₦) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              step="0.01"
                              {...field}
                              className="mrpsl-input h-11 font-mono"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="principalId"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Principal *
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              const selectedPrincipal = data?.content.find(
                                (p) => p.principalId === value,
                              );
                              if (selectedPrincipal) {
                                form.setValue(
                                  "shareholderSizeAtSetup",
                                  selectedPrincipal.shareHoldersAtSetUp,
                                );
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mrpsl-input h-11">
                                <SelectValue placeholder="Select Principal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoading ? (
                                <div className="flex items-center justify-center py-10">
                                  <Loader2 className="animate-spin text-muted-foreground" />
                                </div>
                              ) : (
                                data?.content.map((p) => (
                                  <SelectItem
                                    key={p.principalId}
                                    value={p.principalId}
                                  >
                                    {p.principalName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stockInIssueAtSetup"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Stock in Issue at Setup *
                          </FormLabel>
                          <FormControl>
                            <Input
                              min={0}
                              {...field}
                              className="mrpsl-input h-11 font-mono"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentStockInIssue"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Current Stock in Issue *
                          </FormLabel>
                          <FormControl>
                            <Input
                              min={0}
                              {...field}
                              className="mrpsl-input h-11 font-mono"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shareholderSizeAtSetup"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Number of Shareholders at Setup *
                          </FormLabel>
                          <FormControl>
                            <Input
                              min={0}
                              {...field}
                              className="mrpsl-input h-11 font-mono"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentShareholdersSize"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Current Number of Shareholders *
                          </FormLabel>
                          <FormControl>
                            <Input
                              min={0}
                              {...field}
                              className="mrpsl-input h-11 font-mono"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* SECTION 3: Status */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Operating Status
                  </h3>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-row gap-8"
                          >
                            <FormItem className="flex items-center space-x-2.5 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="ACTIVE"
                                  className="h-5 w-5"
                                />
                              </FormControl>
                              <FormLabel className="font-medium text-sm text-green-700">
                                Active
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2.5 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="INACTIVE"
                                  className="h-5 w-5"
                                />
                              </FormControl>
                              <FormLabel className="font-medium text-sm text-muted-foreground">
                                Inactive
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2.5 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="TRANSACTION_DISABLED"
                                  className="h-5 w-5"
                                />
                              </FormControl>
                              <FormLabel className="font-medium text-sm text-red-600">
                                Transaction Disabled
                              </FormLabel>
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
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm font-bold px-8 h-12"
                  onClick={() => {
                    onOpenChange(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-sm font-bold px-10 h-12 rounded-xl"
                >
                  {" "}
                  {createRegister.isPending || updateRegister.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : mode === "create" ? (
                    "Create Register"
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>7078-8700-09870987645487679877777878777677676666656565
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
      </Dialog> */}
    </>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { principalSchema, PrincipalFormValues } from "@/lib/schemas/principal";
import { Principal } from "@/types/principal";
import { useCreatePrincipal, useUpdatePrincipal } from "@/hooks/usePrincipal";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";

interface PrincipalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: Principal | null;
}

export function PrincipalForm({
  open,
  onOpenChange,
  mode,
  initialData,
}: PrincipalFormProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<PrincipalFormValues | null>(null);

  const { mutate: createPrincipal, isPending: isCreating } =
    useCreatePrincipal();
  const { mutate: updatePrincipal, isPending: isUpdating } =
    useUpdatePrincipal();

  const form = useForm<PrincipalFormValues>({
    resolver: zodResolver(principalSchema) as any,
    defaultValues: {
      principalName: "",
      billingCategory: "A",
      industrySector: "",
      registeredAddress: "",
      officialEmail: "",
      phoneNumber: "",
      companySecretary: "",
      companySecretaryPhone: "",
      tin: "",
      rcNumber: "",
      sector: "",
      shareHoldersAtSetUp: 0,
    },
  });

  // Reset form when initialData changes or mode changes
  useEffect(() => {
    if (initialData && mode === "edit") {
      form.reset({
        principalName: initialData.principalName,
        billingCategory: initialData.billingCategory as "A" | "B" | "C",
        industrySector: initialData.industrySector,
        dateListedOnNgx: initialData.dateListedOnNgx
          ? new Date(initialData.dateListedOnNgx)
          : undefined,
        companySecretary: initialData.companySecretary || "",
        companySecretaryPhone: initialData.companySecretaryPhone || "",
        registeredAddress: initialData.registeredAddress,
        officialEmail: initialData.officialEmail,
        phoneNumber: initialData.phoneNumber,
        tin: initialData.tin || "",
        rcNumber: initialData.rcNumber || "",
        sector: initialData.sector || "",
        shareHoldersAtSetUp: initialData.shareHoldersAtSetUp,
      });
    } else {
      form.reset({
        principalName: "",
        billingCategory: "A",
        industrySector: "",
        registeredAddress: "",
        officialEmail: "",
        phoneNumber: "",
        companySecretary: "",
        companySecretaryPhone: "",
        tin: "",
        rcNumber: "",
        sector: "",
        shareHoldersAtSetUp: 0,
      });
    }
  }, [initialData, mode, form]);

  const onSubmit = (values: PrincipalFormValues) => {
    setPendingValues(values);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingValues) return;

    const payload = {
      ...pendingValues,
      dateListedOnNgx: pendingValues.dateListedOnNgx?.toISOString() || "",
      status: initialData?.status || "Active",
      tin: pendingValues.tin,
      sector: pendingValues.industrySector, // Syncing sector with industrySector for consistency
    };

    if (mode === "create") {
      createPrincipal(payload, {
        onSuccess: () => {
          toast.success(
            `Principal ${pendingValues.principalName} has been created successfully.`,
          );
          setConfirmOpen(false);
          onOpenChange(false);
          form.reset();
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.responseMessage || "Failed to create principal",
          );
        },
      });
    } else if (mode === "edit" && initialData) {
      updatePrincipal(
        { principalId: initialData.principalId, payload },
        {
          onSuccess: () => {
            toast.success(
              `Principal ${pendingValues.principalName} has been updated successfully.`,
            );
            setConfirmOpen(false);
            onOpenChange(false);
            form.reset();
          },
          onError: (err: any) => {
            toast.error(
              err.response?.data?.responseMessage ||
                "Failed to update principal",
            );
          },
        },
      );
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? "Add New Principal"
                : `Edit Principal — ${initialData?.principalName}`}
            </DialogTitle>
            <DialogDescription>
              All fields marked * are required. Principal ID is
              system-generated.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col h-full"
            >
              <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[70vh]">
                {/* SECTION 1: Identity & Categorization */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Identity & Categorization
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="principalName"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Principal Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. Dangote Cement PLC"
                              className="mrpsl-input h-11"
                            />
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
                          <FormLabel className="mrpsl-label">
                            Billing Category *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
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
                      name="industrySector"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Industry Sector *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mrpsl-input h-11">
                                <SelectValue placeholder="Select sector" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[
                                "Banking",
                                "Insurance",
                                "Consumer Goods",
                                "Oil & Gas",
                                "Healthcare",
                                "Manufacturing",
                                "Telecommunications",
                                "Technology",
                                "Other",
                              ].map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
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
                      name="dateListedOnNgx"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel className="mrpsl-label">
                            Date Listed on NGX
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`mrpsl-input h-11 pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
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
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Contact & Registration Details
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="registeredAddress"
                      render={({ field }) => (
                        <FormItem className="space-y-2 col-span-2">
                          <FormLabel className="mrpsl-label">
                            Registered Address *
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              className="focus-visible:ring-primary rounded-xl"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="officialEmail"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Official Email *
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
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Phone Number *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+234..."
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
                      name="tin"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            TIN (Tax ID)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Tax Identification Number"
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
                      name="rcNumber"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            RC Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="CAC Registration Number"
                              {...field}
                              className="mrpsl-input h-11"
                            />
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
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Governance & Setup Parameters
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="companySecretary"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Company Secretary
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
                      name="companySecretaryPhone"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Secretary Phone
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
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
                      name="shareHoldersAtSetUp"
                      render={({ field }) => (
                        <FormItem className="space-y-2 col-span-2">
                          <FormLabel className="mrpsl-label">
                            Shareholders at Setup *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
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
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm font-bold px-8 h-12"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-sm font-bold px-10 h-12 rounded-xl"
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
              You are about to {mode}{" "}
              <span className="font-semibold">
                {pendingValues?.principalName}
              </span>{" "}
              as a principal. This action will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

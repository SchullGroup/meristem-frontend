"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  PenLine,
  FileText,
  Power,
  History,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { GET_AGENTS } from "@/actions/agentAction";

// Mock store for agents
const MOCK_AGENTS = [
  {
    id: "AGT-01",
    name: "CSCS PLC",
    type: "STOCKBROKER",
    code: "CSC",
    cscsCode: "M0000",
    address: "Lagos",
    status: "ACTIVE",
  },
  {
    id: "AGT-02",
    name: "Zenith Bank",
    type: "BANK",
    code: "ZEN",
    cscsCode: "",
    address: "Lagos",
    status: "ACTIVE",
  },
];

const agentSchema = z.object({
  name: z.string().min(2, "Name required"),
  address: z.string().min(5, "Address required"),
  type: z.string().min(1, "Type required"),
  code: z.string().min(2, "Code required"),
  cscsCode: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export default function AgentsPage() {
  const { agentTypes } = useStore();
  const activeTypes = agentTypes.filter((t) => t.active);

  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof agentSchema>>({
    resolver: zodResolver(agentSchema),
    defaultValues: { type: "BANK", status: "ACTIVE" },
  });

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: GET_AGENTS,
  });

  console.log(agents);

  const onSubmit = () => {
    toast.success("Agent created successfully.");
    setOpen(false);
    form.reset();
  };

  const typeWatch = form.watch("type");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage external parties (Banks, Stockbrokers)
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Agent
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Total</div>
          <div className="text-2xl font-bold font-mono mt-1">142</div>
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Banks</div>
          <div className="text-2xl font-bold font-mono mt-1 text-blue-600">
            22
          </div>
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Stockbrokers</div>
          <div className="text-2xl font-bold font-mono mt-1 text-green-600">
            118
          </div>
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Collecting Agents</div>
          <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
            2
          </div>
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Inactive</div>
          <div className="text-2xl font-bold font-mono mt-1 text-muted-foreground">
            5
          </div>
        </Card>
      </div>
      <Card className="mrpsl-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-4 py-3">AGENT</th>
              <th className="px-4 py-3">TYPE</th>
              <th className="px-4 py-3">CODE</th>
              <th className="px-4 py-3">CSCS MEMBER CODE</th>
              <th className="px-4 py-3">ADDRESS</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="px-4 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_AGENTS.map((a) => (
              <tr key={a.id} className="mrpsl-table-row">
                <td className="px-4 py-3 font-semibold">{a.name}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={`border-0 text-xs ${a.type === "BANK" ? "bg-blue-100 text-blue-800" : a.type === "STOCKBROKER" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                  >
                    {a.type
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono">{a.code}</td>
                <td className="px-4 py-3 font-mono">{a.cscsCode || "N/A"}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.address}</td>
                <td className="px-4 py-3">
                  <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                    {a.status
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          toast.info("Signatories panel coming soon")
                        }
                      >
                        <PenLine className="mr-2 h-4 w-4" /> Manage Signatories
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toast.info("Mandates panel coming soon")}
                      >
                        <FileText className="mr-2 h-4 w-4" /> View Mandates
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          toast.success(
                            `${a.name} has been ${a.status === "ACTIVE" ? "deactivated" : "activated"}`,
                          )
                        }
                      >
                        <Power className="mr-2 h-4 w-4" />{" "}
                        {a.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toast.info("Audit log coming soon")}
                      >
                        <History className="mr-2 h-4 w-4" /> View Audit Log
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Agent</DialogTitle>
            <DialogDescription>
              Register a new external party (Bank, Stockbroker, or Collecting
              Agent).
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col h-full"
            >
              <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[70vh]">
                {/* SECTION 1: Agent Identity */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Agent Identity & Type
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2 col-span-2">
                          <FormLabel className="mrpsl-label">
                            Agent Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. CSCS PLC"
                              className="mrpsl-input h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="mrpsl-label">
                            Agent Type *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mrpsl-input h-11">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activeTypes.map((t) => (
                                <SelectItem key={t.id} value={t.code}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4 col-span-1">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="mrpsl-label">
                              Internal Code *
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g. CSC"
                                className="mrpsl-input h-11 font-mono uppercase"
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-destructive mt-1" />
                          </FormItem>
                        )}
                      />
                      {typeWatch === "STOCKBROKER" && (
                        <FormField
                          control={form.control}
                          name="cscsCode"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="mrpsl-label">
                                CSCS Code *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g. M0000"
                                  className="mrpsl-input h-11 font-mono uppercase"
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-destructive mt-1" />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* SECTION 2: Contact & Status */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Location & Status
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="space-y-2 col-span-2">
                          <FormLabel className="mrpsl-label">
                            Primary Address *
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              className="focus-visible:ring-primary rounded-xl"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-destructive mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="mrpsl-label">
                            Operational Status
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex gap-8"
                            >
                              <div className="flex items-center space-x-2.5">
                                <RadioGroupItem
                                  value="ACTIVE"
                                  id="a-active"
                                  className="h-5 w-5"
                                />
                                <label
                                  htmlFor="a-active"
                                  className="text-sm font-medium text-green-700"
                                >
                                  Active
                                </label>
                              </div>
                              <div className="flex items-center space-x-2.5">
                                <RadioGroupItem
                                  value="INACTIVE"
                                  id="a-in"
                                  className="h-5 w-5"
                                />
                                <label
                                  htmlFor="a-in"
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
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm font-bold px-8 h-12"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-sm font-bold px-10 h-12 rounded-xl"
                >
                  Save Agent
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

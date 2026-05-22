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
  Loader2,
  Trash,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CREATE_AGENT,
  GET_AGENTS,
  GET_AGENTS_STATS,
  UPDATE_AGENT,
  DELETE_AGENT,
} from "@/actions/agentAction";

const agentSchema = z.object({
  name: z.string().min(2, "Name required"),
  address: z.string().min(5, "Address required"),
  type: z.string().min(1, "Type required"),
  code: z.string().min(2, "Code required"),
  cscsMemberCode: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export default function AgentsPage() {
  const queryClient = useQueryClient();
  const { agentTypes } = useStore();
  const activeTypes = agentTypes.filter((t) => t.active);

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const form = useForm<z.infer<typeof agentSchema>>({
    resolver: zodResolver(agentSchema),
    defaultValues: { type: "BANK", status: "ACTIVE" },
  });

  const { data: agents, isLoading: isAgentsLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: GET_AGENTS,
  });
  const agentList = agents?.data?.content;

  const { data: agentStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["agents-stats"],
    queryFn: GET_AGENTS_STATS,
  });
  const stats = agentStats?.data;

  const createAgentMutation = useMutation({
    mutationFn: CREATE_AGENT,
    onSuccess: (data) => {
      toast.success(data?.message || `Agent created successfully.`);
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agents-stats"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create agent.");
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: (data: z.infer<typeof agentSchema>) =>
      UPDATE_AGENT(selectedAgentId!, data),
    onSuccess: (data) => {
      toast.success(data?.message || `Agent updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agents-stats"] });
      form.reset();
      setOpen(false);
      setIsEditing(false);
      setSelectedAgentId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update agent.");
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id: string) => DELETE_AGENT(id),
    onSuccess: (data) => {
      toast.success(data?.message || `Agent deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agents-stats"] });
      setDeleteOpen(false);
      setAgentToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete agent.");
    },
  });

  const onSubmit = (data: z.infer<typeof agentSchema>) => {
    if (
      data.type.trim() === "" ||
      data.name.trim() === "" ||
      data.address.trim() === "" ||
      data.code.trim() === ""
    ) {
      toast.error("All fields are required");
      return;
    }

    if (isEditing) {
      updateAgentMutation.mutate(data);
    } else {
      createAgentMutation.mutate(data);
    }
  };

  const handleEdit = (agent: {
    id: string;
    name: string;
    type: string;
    code: string;
    cscsMemberCode?: string;
    address: string;
    status: string;
  }) => {
    setIsEditing(true);
    setSelectedAgentId(agent.id);
    form.reset({
      name: agent.name,
      type: agent.type,
      code: agent.code,
      cscsMemberCode: agent.cscsMemberCode || "",
      address: agent.address,
      status: agent.status as "ACTIVE" | "INACTIVE",
    });
    setOpen(true);
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setSelectedAgentId(null);
    form.reset({
      name: "",
      type: "BANK",
      code: "",
      cscsMemberCode: "",
      address: "",
      status: "ACTIVE",
    });
    setOpen(true);
  };

  const typeWatch = useWatch({
    control: form.control,
    name: "type",
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage external parties (Banks, Stockbrokers)
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Agent
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Total</div>
          {isStatsLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-1">
              {stats?.totalAgents || 0}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Banks</div>
          {isStatsLoading ? (
            <Skeleton className="h-8 w-12 mt-1" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-1 text-blue-600">
              {stats?.typeBreakdown?.BANK || 0}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Stockbrokers</div>
          {isStatsLoading ? (
            <Skeleton className="h-8 w-12 mt-1" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-1 text-green-600">
              {stats?.typeBreakdown?.STOCKBROKER || 0}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Collecting Agents</div>
          {isStatsLoading ? (
            <Skeleton className="h-8 w-12 mt-1" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
              {stats?.typeBreakdown?.COLLECTING_AGENT || 0}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Inactive</div>
          {isStatsLoading ? (
            <Skeleton className="h-8 w-12 mt-1" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-1 text-muted-foreground">
              {stats?.inactiveAgents || 0}
            </div>
          )}
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
            {isAgentsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className="mrpsl-table-row border-b border-border/40"
                >
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-48" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                  </td>
                </tr>
              ))
            ) : agentList?.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No agents found.
                </td>
              </tr>
            ) : (
              agentList?.map(
                (a: {
                  name: string;
                  type: string;
                  code: string;
                  cscsMemberCode: string;
                  address: string;
                  status: string;
                  id: string;
                }) => (
                  <tr key={a.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-semibold">{a.name}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`border-0 text-xs ${a.type === "BANK" ? "bg-blue-100 text-blue-800" : a.type === "STOCKBROKER" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                      >
                        {a.type
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono">{a.code}</td>
                    <td className="px-4 py-3 font-mono">
                      {a.cscsMemberCode || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.address}
                    </td>
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
                        <DropdownMenuContent
                          align="center"
                          className="mrpsl-card w-fit"
                        >
                          <DropdownMenuItem onClick={() => handleEdit(a)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Agent
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info("Signatories panel coming soon")
                            }
                          >
                            <PenLine className="mr-2 h-4 w-4" /> Manage
                            Signatories
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info("Mandates panel coming soon")
                            }
                          >
                            <FileText className="mr-2 h-4 w-4" /> View Mandates
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setAgentToDelete({ id: a.id, name: a.name });
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete Agent
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              toast.success(
                                `${a.name} has been ${a.status === "Active" ? "deactivated" : "activated"}`,
                              )
                            }
                          >
                            <Power className="mr-2 h-4 w-4" />{" "}
                            {a.status === "Active" ? "Deactivate" : "Activate"}
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
                ),
              )
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Agent" : "Add Agent"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of this external party."
                : "Register a new external party (Bank, Stockbroker, or Collecting Agent)."}
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
                          name="cscsMemberCode"
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
                  className="text-sm font-bold px-10 h-12 rounded-xl cursor-pointer"
                >
                  {isEditing ? "Update Agent" : "Save Agent"}
                  {(createAgentMutation.isPending ||
                    updateAgentMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Trash className="h-6 w-6 text-muted-foreground" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Delete Agent
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                This will permanently remove{" "}
                <span className="font-semibold text-foreground">
                  &quot;{agentToDelete?.name}&quot;
                </span>{" "}
                from your agent list. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="flex  flex-col-reverse sm:flex-row gap-2 px-6 py-4 bg-muted/20 border-t border-border/50">
            <Button
              variant="ghost"
              className="flex-1 h-12 cursor-pointer"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteAgentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="text-sm font-bold h-12 rounded-xl cursor-pointer flex-1 shadow-lg shadow-primary/20 bg-primary text-primary-foreground"
              onClick={() => {
                if (agentToDelete?.id) {
                  deleteAgentMutation.mutate(agentToDelete.id);
                }
              }}
              disabled={deleteAgentMutation.isPending}
            >
              Delete
              {deleteAgentMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

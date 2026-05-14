"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { UserForm } from "@/components/custom/user-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  MoreHorizontal,
  KeyRound,
  History,
  Pencil,
  Power,
  ShieldCheck,
  UserX2,
  UserCog,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { User } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DELETE_USER,
  GET_USERS,
  REMOVE_USER_ROLE,
  TOGGLE_USER,
  TOGGLE_USER_2FA,
} from "@/actions/userAction";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/hooks/useRoles";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { users, setUsers } = useStore();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const data = await GET_USERS();
      if (data?.isSuccessful && data?.data) {
        setUsers(data.data);
        return data.data;
      }
      throw new Error(data?.responseMessage || "Failed to fetch users");
    },
  });

  const { data: roles } = useRoles();

  const handleToggleUserMutation = useMutation({
    mutationFn: TOGGLE_USER,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User toggled successfully");
    },
    onError: () => {
      toast.error("Failed to toggle user");
    },
  });

  const handle2FAToggleUserMutation = useMutation({
    mutationFn: TOGGLE_USER_2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User 2FA toggled successfully");
    },
    onError: () => {
      toast.error("Failed to toggle user 2FA");
    },
  });

  const handleRemoveUserRoleMutation = useMutation({
    mutationFn: REMOVE_USER_ROLE,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User role removed successfully");
    },
    onError: () => {
      toast.error("Failed to toggle user 2FA");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: DELETE_USER,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  const handleToggleUser = (id: string) => {
    handleToggleUserMutation.mutate(id);
  };

  const handleToggle2FAUser = (id: string) => {
    handle2FAToggleUserMutation.mutate(id);
  };

  const handleRemoveUserRole = ({
    id,
    roleName,
  }: {
    id: string;
    roleName: string | undefined;
  }) => {
    if (!roleName) {
      return;
    }
    handleRemoveUserRoleMutation.mutate({ id, roleName });
  };

  const handleDeleteClick = (u: User) => {
    setUserToDelete(u);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate({ id: userToDelete.id });
    }
  };

  const filteredUsers = (users || []).filter((u) => {
    const firstName = u.firstName || "";
    const lastName = u.lastName || "";
    const email = u.email || "";

    const matchesSearch =
      firstName.toLowerCase().includes(search.toLowerCase()) ||
      lastName.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "All" || u?.roles?.includes(roleFilter);
    const matchesDept = deptFilter === "All" || u.department === deptFilter;
    const matchesStatus =
      statusFilter === "All" ||
      u.status?.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  const activeCount = users.filter(
    (u) => u.status?.toUpperCase() === "ACTIVE",
  ).length;
  const pending2FA = users.filter((u) => !u.enabled && !u.enabled).length;
  const inactiveCount = users.filter(
    (u) => u.status?.toUpperCase() === "IN_ACTIVE",
  ).length;

  const handleEdit = (u: User) => {
    setSelectedUser(u);
    setFormMode("edit");
    setFormOpen(true);
  };

  const getInitials = (f: string, l: string) =>
    `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase();

  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>

        <Card className="mrpsl-card">
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const uniqueDepartments = [
    ...new Set(
      users
        ?.filter((item) => item && item.department)
        ?.map((item) => item.department),
    ),
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system users, roles, and authorization limits
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setFormMode("create");
            setFormOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Total Users</div>
          <div className="text-2xl font-bold font-mono mt-1">
            {users.length}
          </div>
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Active</div>
          <div className="text-2xl font-bold font-mono mt-1 text-green-600">
            {activeCount}
          </div>
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Pending 2FA</div>
          <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
            {pending2FA}
          </div>
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Inactive</div>
          <div className="text-2xl font-bold font-mono mt-1 text-muted-foreground">
            {inactiveCount}
          </div>
        </Card>
      </div>

      <div className="flex gap-2 items-center">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 mrpsl-input"
        />
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v || "")}
        >
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Roles</SelectItem>
            {roles?.map((role: { id: number; name: string }) => (
              <SelectItem key={role.id} value={role.name}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={deptFilter}
          onValueChange={(v) => setDeptFilter(v || "")}
        >
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Departments</SelectItem>
            {uniqueDepartments?.map((department: string) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v || "")}
        >
          <SelectTrigger className="w-36 mrpsl-input">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="IN_ACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">USER</th>
                <th className="px-4 py-3">ROLE(S)</th>
                <th className="px-4 py-3">DEPARTMENT</th>
                <th className="px-4 py-3 text-right">CERT LIMIT</th>
                <th className="px-4 py-3 text-right">DIV LIMIT</th>
                <th className="px-4 py-3">2FA</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">LAST LOGIN</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="mrpsl-table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-xs">
                          {getInitials(u.firstName, u.lastName)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {u?.roles?.length > 0 && (
                        // <Badge variant="outline" className="text-xs">

                        // </Badge>
                        <div>
                          {u?.roles?.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className="text-xs"
                            >
                              {role
                                ?.replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {/* {u.secondaryRole && (
                        <Badge variant="secondary" className="text-xs">
                          {u.secondaryRole
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      )} */}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{u.department}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm">
                    {u.certTransactionLimit || 0}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm">
                    {u.divTransactionLimit || 0}
                  </td>
                  <td className="px-4 py-3">
                    {u.twoFaEnabled ? (
                      <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                        Enabled
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">
                        {/* Pending */}
                        Disabled
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`text-xs border-0 ${u.status?.toUpperCase() === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                    >
                      {u.status?.toUpperCase() === "ACTIVE"
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u?.lastLoginTime}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="mrpsl-card w-fit"
                        align="end"
                      >
                        <DropdownMenuItem onClick={() => handleEdit(u)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.success(
                              `Password reset email sent to ${u.email}`,
                            )
                          }
                        >
                          <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggle2FAUser(u.id)}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" /> Toggle 2FA
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => toast.info("Audit log soon")}
                        >
                          <History className="mr-2 h-4 w-4" /> View Audit Log
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!u?.roles[0] && !u.secondaryRole}
                          onClick={() =>
                            handleRemoveUserRole({
                              id: u.id,
                              roleName: u.roles[0] || u.secondaryRole,
                            })
                          }
                        >
                          <UserCog className="mr-2 h-4 w-4" /> Unassign Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleUser(u.id)}
                        >
                          <Power className="mr-2 h-4 w-4" />{" "}
                          {u.status.toUpperCase() === "ACTIVE"
                            ? "Deactivate"
                            : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => handleDeleteClick(u)}
                        >
                          <UserX2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {formOpen && (
        <UserForm
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          initialData={selectedUser}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-3">
              Are you sure you want to delete{" "}
              <span className="font-bold text-foreground">
                {userToDelete?.firstName} {userToDelete?.lastName}
              </span>
              ? This action cannot be undone and will immediately revoke all
              access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

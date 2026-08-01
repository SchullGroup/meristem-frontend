"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  GET_USER_STATS,
  REMOVE_USER_ROLE,
  TOGGLE_USER,
  TOGGLE_USER_2FA,
} from "@/actions/userAction";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/hooks/useRoles";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 20;
const USER_TABLE_COLUMNS = 9;

export default function UsersPage() {
  const router = useRouter();
  const { currentUser, users, setUsers } = useStore();
  const isSuperAdmin = currentUser?.roles?.includes("SUPER_ADMIN") ?? false;

  useEffect(() => {
    if (currentUser && !isSuperAdmin) {
      toast.error("You do not have permission to access this page.");
      router.replace("/");
    }
  }, [currentUser, isSuperAdmin, router]);

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // Keystrokes are debounced so typing doesn't fire a request per character.
  const debouncedSearch = useDebounce(search, 500);

  const {
    data: usersPage,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "users",
      currentPage,
      pageSize,
      debouncedSearch,
      roleFilter,
      deptFilter,
    ],
    queryFn: async () => {
      const data = await GET_USERS({
        page: currentPage,
        size: pageSize,
        search: debouncedSearch.trim() || undefined,
        role: roleFilter !== "All" ? roleFilter : undefined,
        department: deptFilter !== "All" ? deptFilter : undefined,
      });
      if (data?.isSuccessful && data?.data) {
        // Tolerate either a bare list or a paginated envelope — the whole
        // store is persisted, so a non-array here poisons localStorage.
        const payload = data.data;
        const list: User[] = Array.isArray(payload)
          ? payload
          : (payload.content ?? []);
        setUsers(list);
        return {
          content: list,
          totalElements: Array.isArray(payload)
            ? list.length
            : (payload.totalElements ?? list.length),
          totalPages: Array.isArray(payload) ? 1 : (payload.totalPages ?? 1),
        };
      }
      throw new Error(data?.responseMessage || "Failed to fetch users");
    },
    placeholderData: (prev) => prev,
  });

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["users", "stats"],
    queryFn: async () => {
      const res = await GET_USER_STATS();
      if (res?.isSuccessful && res?.data) {
        return res.data as {
          totalUsers: number;
          activeUsers: number;
          pendingTwoFa: number;
          inactiveUsers: number;
        };
      }
      throw new Error(res?.responseMessage || "Failed to fetch user stats");
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
    roleName: string;
  }) => {
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

  // Guards against a previously persisted non-array value in localStorage.
  const userList: User[] = Array.isArray(users) ? users : [];

  // Search, role and department are applied by the API. Status has no query
  // param yet, so it stays client-side and only narrows the current page.
  const filteredUsers = userList.filter((u) => {
    if (statusFilter === "All") return true;
    // Values arrive as "Active" / "ACTIVE" / "INACTIVE"; the options use
    // "IN_ACTIVE", so compare on letters alone.
    const normalise = (v?: string | null) =>
      (v ?? "").toUpperCase().replace(/[^A-Z]/g, "");
    return normalise(u.status) === normalise(statusFilter);
  });

  // Result-set size for the pagination bar — reflects the active filters.
  const totalRecords = usersPage?.totalElements ?? userList.length;
  const totalPages = usersPage?.totalPages ?? 1;

  const handleEdit = (u: User) => {
    setSelectedUser(u);
    setFormMode("edit");
    setFormOpen(true);
  };

  const getInitials = (f: string, l: string) =>
    `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase();

  if (isLoading && userList.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
      userList
        .filter((item) => item && item.department)
        .map((item) => item.department),
    ),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Users
          </h1>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Total Users</div>
          {statsLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-1">
              {(userStats?.totalUsers ?? 0).toLocaleString()}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Active</div>
          {statsLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-1 text-green-600">
              {(userStats?.activeUsers ?? 0).toLocaleString()}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Pending 2FA</div>
          {statsLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
              {(userStats?.pendingTwoFa ?? 0).toLocaleString()}
            </div>
          )}
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">Inactive</div>
          {statsLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <div className="text-2xl font-bold font-mono mt-1 text-muted-foreground">
              {(userStats?.inactiveUsers ?? 0).toLocaleString()}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 items-center w-1/2">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(0);
          }}
          className="w-full sm:w-64 mrpsl-input"
        />
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v || "All");
            setCurrentPage(0);
          }}
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
          onValueChange={(v) => {
            setDeptFilter(v || "All");
            setCurrentPage(0);
          }}
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
          onValueChange={(v) => setStatusFilter(v || "All")}
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
              {isFetching
                ? // One placeholder row per requested page size, so the table
                  // keeps its height while the next page loads.
                  Array.from({ length: pageSize }).map((_, i) => (
                    <tr key={`user-skeleton-${i}`} className="mrpsl-table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-3 w-44" />
                          </div>
                        </div>
                      </td>
                      {Array.from({ length: USER_TABLE_COLUMNS - 1 }).map(
                        (_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ),
                      )}
                    </tr>
                  ))
                : filteredUsers.map((u) => (
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
                        <div className="flex gap-1 flex-wrap max-w-37.5">
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
                              <KeyRound className="mr-2 h-4 w-4" /> Reset
                              Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggle2FAUser(u.id)}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" /> Toggle
                              2FA
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => toast.info("Audit log soon")}
                            >
                              <History className="mr-2 h-4 w-4" /> View Audit
                              Log
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={u?.roles.length === 0}
                              onClick={() =>
                                handleRemoveUserRole({
                                  id: u.id,
                                  roleName: u.roles[0],
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

        <PaginationBar
          page={currentPage}
          pageSize={pageSize}
          total={totalRecords}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
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

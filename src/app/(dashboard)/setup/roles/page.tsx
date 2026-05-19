"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Lock, Edit2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRoles } from "@/hooks/useRoles";
import { Role } from "@/lib/types";
import {
  CREATE_ROLE,
  UPDATE_PERMISSIONS,
  DELETE_ROLE,
  EDIT_ROLE,
} from "@/actions/rolesAction";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { data: roles, isLoading } = useRoles();
  const [selectedRole, setSelectedRole] = useState(
    !isLoading ? roles?.[0]?.name : "ADMIN",
  );

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [localPermissions, setLocalPermissions] = useState<string[]>([]);

  // Group all unique permissions into modules
  const groupedPermissions = useMemo(() => {
    if (!roles) return {};
    const groups: Record<string, string[]> = {};

    // Collect all unique permissions from all roles
    const allPerms = Array.from(
      new Set<string>(roles.flatMap((r: Role) => r.permissions || [])),
    );

    allPerms.forEach((perm: string) => {
      if (typeof perm !== "string") return;
      const [module, action] = perm.split(":");
      if (module && action) {
        if (!groups[module]) groups[module] = [];
        if (!groups[module].includes(action)) groups[module].push(action);
      }
    });

    return groups;
  }, [roles]);

  const activeRole = roles?.find(
    (r: { name: string }) => r.name === selectedRole,
  );

  useEffect(() => {
    if (activeRole) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalPermissions(activeRole.permissions || []);
    }
  }, [activeRole]);

  const updatePermissionMutation = useMutation({
    mutationFn: ({
      payload,
      roleId,
    }: {
      payload: { permissionNames: string[] };
      roleId: string;
    }) => {
      return UPDATE_PERMISSIONS(payload, roleId);
    },
    onSuccess: () => {
      toast.success(`Permissions updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update permissions.");
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: CREATE_ROLE,
    onSuccess: () => {
      toast.success(`Role created successfully.`);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setCreateOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create role.");
    },
  });

  const editRoleMutation = useMutation({
    mutationFn: EDIT_ROLE,
    onSuccess: () => {
      toast.success(`Role updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setEditOpen(false);
      setEditName("");
      setEditDesc("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role.");
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: () => DELETE_ROLE(activeRole?.id),
    onSuccess: () => {
      toast.success(`Role deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleteOpen(false);
      // Reset selected role to the first one if it exists
      if (roles && roles.length > 0) {
        setSelectedRole(roles[0].name);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete role.");
    },
  });

  const handleUpdatePermission = () => {
    if (!localPermissions || !activeRole?.id) return;

    const payload = {
      permissionNames: localPermissions,
    };

    updatePermissionMutation.mutate({
      payload,
      roleId: activeRole.id,
    });
  };

  const handlePermissionToggle = (permString: string) => {
    setLocalPermissions((prev) =>
      prev.includes(permString)
        ? prev.filter((p) => p !== permString)
        : [...prev, permString],
    );
  };

  const formatLabel = (str: string) =>
    str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const openEditModal = () => {
    setEditName(activeRole.name);
    setEditDesc(activeRole.description);
    setEditOpen(true);
  };

  const handleEditRole = () => {
    if (!editName.trim() || !activeRole?.id) return;
    editRoleMutation.mutate({
      roleId: activeRole.id,
      name: editName,
      description: editDesc,
    });
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    createRoleMutation.mutate({
      name: newRoleName,
      description: newRoleDesc,
      permissionNames: [],
    });
  };

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem-1px)] -m-6">
        {/* LEFT PANEL */}
        <div className="w-64 border-r bg-background overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
            <span className="font-semibold text-sm">Roles</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 py-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <Skeleton className="h-6 w-full rounded" />
                  </div>
                ))
              : roles?.map(
                  (role: {
                    id: number;
                    isBuiltIn: boolean;
                    name: string;
                    userCount: number;
                  }) => {
                    const isActive = role.name === selectedRole;
                    return (
                      <button
                        key={role.name}
                        onClick={() => setSelectedRole(role.name)}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors border-l-2 ${
                          isActive
                            ? "bg-primary/8 text-primary border-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {role.name}
                          </span>
                          {role.name === "ADMIN" && (
                            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <span className="ml-2 shrink-0 min-w-[20px] text-center text-[11px] font-semibold bg-muted text-foreground rounded-full px-1.5 py-0.5">
                          {role?.userCount}
                        </span>
                      </button>
                    );
                  },
                )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 bg-muted/10 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-start">
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-4 w-64 mb-3" />
                    <Skeleton className="h-5 w-32 rounded-md" />
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">{activeRole?.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeRole?.description}
                    </p>
                    <div className="text-xs font-medium text-muted-foreground mt-2 bg-muted px-2 py-1 rounded-md inline-block">
                      {activeRole?.userCount} user
                      {activeRole?.userCount !== 1 ? "s" : ""} assigned to this
                      role
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openEditModal}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Role
                </Button>
                {activeRole?.name !== "ADMIN" &&
                  activeRole?.userCount === 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Role
                    </Button>
                  )}
              </div>
            </div>

            <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Permissions</h3>
                {activeRole?.name === "ADMIN" && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Built-in role — permissions
                    cannot be modified
                  </span>
                )}
              </div>
              <div className="p-4 grid grid-cols-3 gap-8">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    ))
                  : Object.entries(groupedPermissions).map(
                      ([module, actions]: [string, string[]]) => (
                        <div key={module} className="space-y-3">
                          <h4 className="text-xs font-bold tracking-widest text-muted-foreground uppercase border-b border-border/60 pb-1">
                            {module}
                          </h4>
                          <div className="space-y-2">
                            {actions.map((action: string) => (
                              <div
                                key={`${module}-${action}`}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  className="cursor-pointer"
                                  id={`${module}-${action}`}
                                  disabled={activeRole?.name === "ADMIN"}
                                  checked={localPermissions.includes(
                                    `${module}:${action}`,
                                  )}
                                  onCheckedChange={() =>
                                    handlePermissionToggle(
                                      `${module}:${action}`,
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`${module}-${action}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {formatLabel(action)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
              </div>
            </div>

            {activeRole?.name !== "ADMIN" && (
              <div className="flex justify-end">
                <Button
                  className="cursor-pointer"
                  onClick={handleUpdatePermission}
                  disabled={updatePermissionMutation.isPending}
                >
                  Save Permissions
                  {updatePermissionMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the role name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 py-6 space-y-4">
            <div className="space-y-2">
              <label className="mrpsl-label">Role Name *</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Operations Manager"
              />
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Description</label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Brief description of this role's responsibilities"
                className="resize-none"
                rows={3}
              />
            </div>
            {activeRole?.isBuiltIn && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                Built-in roles have restricted edits. Permissions cannot be
                changed.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditRole}
              disabled={!editName?.trim() || editRoleMutation.isPending}
            >
              Save Changes
              {editRoleMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role. Permissions can be configured after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 py-6 space-y-4">
            <div className="space-y-2">
              <label className="mrpsl-label">Role Name *</label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Operations Manager"
              />
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Description</label>
              <Textarea
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Brief description of this role's responsibilities"
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                setNewRoleName("");
                setNewRoleDesc("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleCreateRole}
              disabled={!newRoleName.trim() || createRoleMutation.isPending}
            >
              Create Role
              {createRoleMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Delete Role
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                This will permanently remove the{" "}
                <span className="font-semibold text-foreground">
                  &quot;{activeRole?.name}&quot;
                </span>{" "}
                role. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 px-6 py-4 bg-muted/20 border-t border-border/50">
            <Button
              variant="ghost"
              className="flex-1 cursor-pointer h-12 rounded-xl"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteRoleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 cursor-pointer shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl"
              onClick={() => deleteRoleMutation.mutate()}
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Confirm Deletion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

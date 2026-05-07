"use client";

import { useState } from "react";
import { Plus, Lock, Edit2, Trash2 } from "lucide-react";
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

const PERMISSION_GROUPS = [
  "SETUP",
  "OFFER ADMINISTRATION",
  "CERTIFICATE MANAGEMENT",
  "DIVIDEND MANAGEMENT",
  "ACCOUNT MAINTENANCE",
  "ENQUIRY",
  "REPORTS",
  "AUDIT TRAIL",
  "ADMIN",
];

const PERMISSION_TYPES = ["View", "Create", "Edit", "Approve", "Reverse"];

export default function RolesPage() {
  const { data: roles } = useRoles();
  console.log(roles);
  const [selectedRole, setSelectedRole] = useState("SYSTEM_ADMIN");

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const activeRole = roles?.find(
    (r: { name: string }) => r.name === selectedRole,
  );

  const openEditModal = () => {
    setEditName(activeRole.name);
    setEditDesc(activeRole.description);
    setEditOpen(true);
  };

  const handleEditRole = () => {
    if (!editName.trim()) return;
    toast.success(`Role "${editName}" updated successfully.`);
    setEditOpen(false);
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    toast.success(
      `Role "${newRoleName}" created. Configure permissions below.`,
    );
    setCreateOpen(false);
    setNewRoleName("");
    setNewRoleDesc("");
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
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 py-2">
            {roles.map(
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
                      {role.isBuiltIn && (
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

        {/* RIGHT PANEL */}
        <div className="flex-1 p-6 overflow-y-auto bg-muted/10">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{activeRole?.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeRole?.description}
                </p>
                <div className="text-xs font-medium text-muted-foreground mt-2 bg-muted px-2 py-1 rounded-md inline-block">
                  {activeRole?.userCount} user
                  {activeRole?.userCount !== 1 ? "s" : ""} assigned to this role
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openEditModal}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Role
                </Button>
                {!activeRole?.isBuiltIn && activeRole?.userCount === 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      toast.error("Delete role? This cannot be undone.")
                    }
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Role
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Permissions</h3>
                {activeRole?.isBuiltIn && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Built-in role — permissions
                    cannot be modified
                  </span>
                )}
              </div>
              <div className="p-4 grid grid-cols-3 gap-8">
                {PERMISSION_GROUPS?.map((group) => (
                  <div key={group} className="space-y-3">
                    <h4 className="text-xs font-bold tracking-widest text-muted-foreground uppercase border-b border-border/60 pb-1">
                      {group}
                    </h4>
                    <div className="space-y-2">
                      {PERMISSION_TYPES?.map((perm) => (
                        <div
                          key={`${group}-${perm}`}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`${group}-${perm}`}
                            disabled={activeRole?.isBuiltIn}
                            defaultChecked={
                              activeRole?.id === "SYSTEM_ADMIN" ||
                              (activeRole?.id === "ENQUIRY_ONLY" &&
                                perm === "View")
                            }
                          />
                          <label
                            htmlFor={`${group}-${perm}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {perm}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!activeRole?.isBuiltIn && (
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Permissions saved.")}>
                  Save Permissions
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
            <Button onClick={handleEditRole} disabled={!editName?.trim()}>
              Save Changes
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
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim()}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

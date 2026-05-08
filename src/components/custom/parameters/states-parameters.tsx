"use client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useGetAllStates,
  useCreateState,
  useUpdateState,
  useDeleteState,
} from "@/hooks/useStates";
import {
  Search,
  MapPin,
  Map as MapIcon,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { State, LGA } from "@/types/parameters";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block";

interface StatesParametersProps {
  tab: string;
}

export default function StatesParameters({ tab }: StatesParametersProps) {
  const { data: statesData, isLoading: statesLoading } = useGetAllStates({
    enabled: tab === "states",
  });
  const states = statesData?.content || [];

  const createStateMutation = useCreateState();
  const updateStateMutation = useUpdateState();
  const deleteStateMutation = useDeleteState();

  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [stateSearch, setStateSearch] = useState("");
  const [lgaSearch, setLgaSearch] = useState("");

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingState, setEditingState] = useState<State | null>(null);
  const [newStateName, setNewStateName] = useState("");
  const [newLgaName, setNewLgaName] = useState("");
  const [tempLgas, setTempLgas] = useState<string[]>([]);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"state" | "lga">("state");
  const [stateToDelete, setStateToDelete] = useState<State | null>(null);
  const [lgaToDelete, setLgaToDelete] = useState<LGA | null>(null);

  // LGA Edit dialog state
  const [isLgaDialogOpen, setIsLgaDialogOpen] = useState(false);
  const [editingLga, setEditingLga] = useState<LGA | null>(null);
  const [lgaFormName, setLgaFormName] = useState("");

  // Filtered states based on search
  const filteredStates = useMemo(() => {
    return states.filter((s) =>
      s.name.toLowerCase().includes(stateSearch.toLowerCase()),
    );
  }, [states, stateSearch]);

  // Selected state logic
  const selectedState = useMemo(() => {
    if (selectedStateId !== null) {
      return states.find((s) => s.id === selectedStateId);
    }
    return states[0];
  }, [states, selectedStateId]);

  // Filtered LGAs based on search
  const filteredLGAs = useMemo(() => {
    if (!selectedState?.lgas) return [];
    return selectedState.lgas.filter((lga) =>
      lga.name.toLowerCase().includes(lgaSearch.toLowerCase()),
    );
  }, [selectedState, lgaSearch]);

  const openAddDialog = () => {
    setDialogMode("add");
    setNewStateName("");
    setTempLgas([]);
    setEditingState(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (state: State) => {
    setDialogMode("edit");
    setNewStateName(state.name);
    setTempLgas(state.lgas?.map((l) => l.name) || []);
    setEditingState(state);
    setIsDialogOpen(true);
  };

  const openAddLgaDialog = () => {
    setLgaFormName("");
    setEditingLga(null);
    setIsLgaDialogOpen(true);
  };

  const openEditLgaDialog = (lga: LGA) => {
    setLgaFormName(lga.name);
    setEditingLga(lga);
    setIsLgaDialogOpen(true);
  };

  const addLgaToTemp = () => {
    if (newLgaName.trim() && !tempLgas.includes(newLgaName.trim())) {
      setTempLgas([...tempLgas, newLgaName.trim()]);
      setNewLgaName("");
    }
  };

  const removeLgaFromTemp = (name: string) => {
    setTempLgas(tempLgas.filter((l) => l !== name));
  };

  const handleSaveState = () => {
    if (!newStateName.trim()) {
      toast.error("State name is required");
      return;
    }

    const payload = {
      name: newStateName.trim(),
      lgas: tempLgas,
    };

    if (dialogMode === "add") {
      createStateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("State added successfully");
          setIsDialogOpen(false);
        },
        onError: (err) => toast.error(err.message || "Failed to add state"),
      });
    } else if (editingState) {
      updateStateMutation.mutate(
        { id: editingState.id, payload },
        {
          onSuccess: () => {
            toast.success("State updated successfully");
            setIsDialogOpen(false);
          },
          onError: (err) =>
            toast.error(err.message || "Failed to update state"),
        },
      );
    }
  };

  const handleSaveLga = () => {
    if (!selectedState) return;
    if (!lgaFormName.trim()) {
      toast.error("LGA name is required");
      return;
    }

    let newLgas: string[];
    if (editingLga) {
      // Edit: Replace the old name with the new one
      newLgas = selectedState.lgas.map((l) =>
        l.id === editingLga.id ? lgaFormName.trim() : l.name,
      );
    } else {
      // Add: Append to the list
      if (
        selectedState.lgas.some(
          (l) => l.name.toLowerCase() === lgaFormName.trim().toLowerCase(),
        )
      ) {
        toast.error("LGA name already exists in this state");
        return;
      }
      newLgas = [...selectedState.lgas.map((l) => l.name), lgaFormName.trim()];
    }

    updateStateMutation.mutate(
      {
        id: selectedState.id,
        payload: { name: selectedState.name, lgas: newLgas },
      },
      {
        onSuccess: () => {
          toast.success(
            editingLga ? "LGA updated successfully" : "LGA added successfully",
          );
          setIsLgaDialogOpen(false);
        },
        onError: (err) => toast.error(err.message || "Failed to save LGA"),
      },
    );
  };

  const handleDeleteState = () => {
    if (!stateToDelete) return;
    deleteStateMutation.mutate(stateToDelete.id, {
      onSuccess: () => {
        toast.success("State deleted successfully");
        setIsDeleteDialogOpen(false);
        if (selectedStateId === stateToDelete.id) {
          setSelectedStateId(null);
        }
      },
      onError: (err) => toast.error(err.message || "Failed to delete state"),
    });
  };

  const handleDeleteLga = () => {
    if (!selectedState || !lgaToDelete) return;

    const newLgas = selectedState.lgas
      .filter((l) => l.id !== lgaToDelete.id)
      .map((l) => l.name);

    updateStateMutation.mutate(
      {
        id: selectedState.id,
        payload: { name: selectedState.name, lgas: newLgas },
      },
      {
        onSuccess: () => {
          toast.success("LGA deleted successfully");
          setIsDeleteDialogOpen(false);
          setLgaToDelete(null);
        },
        onError: (err) => toast.error(err.message || "Failed to delete LGA"),
      },
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* States List */}
      <Card className="mrpsl-card overflow-hidden lg:col-span-4 flex flex-col h-[600px]">
        <div className="px-5 py-4 border-b border-border/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MapIcon className="h-4 w-4 text-primary" />
              States
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                {states.length}
              </span>
            </h3>
            <Button size="sm" variant="outline" onClick={openAddDialog}>
              <Plus className="h-3.5 w-3.5" /> Add States
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search states..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="pl-9 h-9 text-xs mrpsl-input"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {statesLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="px-5 py-3">
                <Skeleton className="h-4 w-full rounded" />
              </div>
            ))
          ) : filteredStates.length === 0 ? (
            <div className="px-5 py-10 text-center space-y-2">
              <div className="h-10 w-10 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground">No states found</p>
            </div>
          ) : (
            filteredStates.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group w-full text-left px-5 py-3 text-sm transition-all border-l-2 flex items-center justify-between",
                  selectedState?.id === s.id
                    ? "bg-primary/5 text-primary border-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <button
                  onClick={() => {
                    setSelectedStateId(s.id);
                    setLgaSearch("");
                  }}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      selectedState?.id === s.id
                        ? "bg-primary scale-125"
                        : "bg-muted-foreground/30",
                    )}
                  />
                  <span>{s.name}</span>
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(s);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStateToDelete(s);
                        setDeleteType("state");
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-[10px] tabular-nums font-medium opacity-60">
                    {s.lgas?.length || 0}
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 transition-transform",
                      selectedState?.id === s.id
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-40",
                    )}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* LGAs Grid */}
      <Card className="mrpsl-card overflow-hidden lg:col-span-8 flex flex-col h-[600px]">
        <div className="px-5 py-4 border-b border-border/60 space-y-4 bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                LGAs — {selectedState?.name || "Select a state"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Displaying local government areas within this state
              </p>
            </div>
            {selectedState && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                  {filteredLGAs.length} of {selectedState.lgas?.length || 0}{" "}
                  Areas
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={openAddLgaDialog}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add LGA
                </Button>
              </div>
            )}
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search local government areas..."
              value={lgaSearch}
              onChange={(e) => setLgaSearch(e.target.value)}
              className="pl-9 h-9 text-xs mrpsl-input"
              disabled={!selectedState}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          {!selectedState ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                <MapIcon className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="max-w-[200px] space-y-1">
                <p className="text-sm font-semibold">No State Selected</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select a state from the left panel to view its local
                  government areas.
                </p>
              </div>
            </div>
          ) : filteredLGAs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
              <div className="h-12 w-12 bg-muted/50 rounded-full flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-xs font-medium">No LGAs match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredLGAs.map((lga) => (
                <div
                  key={lga.id}
                  className="group px-4 py-3 border border-border/50 rounded-xl text-xs font-medium text-muted-foreground bg-muted/20 hover:bg-background hover:border-primary/30 hover:text-primary transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20 group-hover:bg-primary/40 transition-colors" />
                    <span className="truncate">{lga.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-6 w-6"
                      onClick={() => openEditLgaDialog(lga)}
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setLgaToDelete(lga);
                        setDeleteType("lga");
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit State Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md ">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add New State" : "Edit State"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add"
                ? "Define a new state and its local government areas."
                : `Update the details for ${editingState?.name}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-4">
            <div className="space-y-1.5">
              <label className={labelClass}>State Name *</label>
              <Input
                placeholder="e.g. Lagos"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                className="mrpsl-input"
              />
            </div>

            <div className="space-y-3">
              <label className={labelClass}>Local Government Areas</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter LGA name..."
                  value={newLgaName}
                  onChange={(e) => setNewLgaName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLgaToTemp()}
                  className="mrpsl-input h-9 text-xs"
                />
                <Button size="sm" onClick={addLgaToTemp}>
                  Add
                </Button>
              </div>

              <div className="border rounded-xl p-3 bg-muted/20 min-h-[100px] max-h-[200px] overflow-y-auto no-scrollbar space-y-2">
                {tempLgas.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-8">
                    No LGAs added yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tempLgas.map((name) => (
                      <div
                        key={name}
                        className="bg-background border border-border/60 rounded-lg px-2 py-1 text-[11px] font-medium flex items-center gap-1.5"
                      >
                        {name}
                        <button
                          onClick={() => removeLgaFromTemp(name)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveState}
              disabled={
                createStateMutation.isPending || updateStateMutation.isPending
              }
            >
              {(createStateMutation.isPending ||
                updateStateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {dialogMode === "add" ? "Create State" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit LGA Dialog */}
      <Dialog open={isLgaDialogOpen} onOpenChange={setIsLgaDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingLga ? "Edit LGA" : "Add LGA"}</DialogTitle>
            <DialogDescription>
              {editingLga
                ? `Update the name for ${editingLga.name}.`
                : `Add a new local government area to ${selectedState?.name}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="space-y-1.5">
              <label className={labelClass}>LGA Name *</label>
              <Input
                placeholder="e.g. Alimosho"
                value={lgaFormName}
                onChange={(e) => setLgaFormName(e.target.value)}
                className="mrpsl-input"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLgaDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveLga}
              disabled={updateStateMutation.isPending}
            >
              {updateStateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingLga ? "Save Changes" : "Add LGA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              {deleteType === "state" ? (
                <>
                  This will permanently delete the state{" "}
                  <span className="font-bold text-foreground">
                    "{stateToDelete?.name}"
                  </span>{" "}
                  and all its associated LGAs.
                </>
              ) : (
                <>
                  This will remove{" "}
                  <span className="font-bold text-foreground">
                    "{lgaToDelete?.name}"
                  </span>{" "}
                  from {selectedState?.name}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setStateToDelete(null);
                setLgaToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={
                deleteType === "state" ? handleDeleteState : handleDeleteLga
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                deleteStateMutation.isPending || updateStateMutation.isPending
              }
            >
              {(deleteStateMutation.isPending ||
                updateStateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete {deleteType === "state" ? "State" : "LGA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

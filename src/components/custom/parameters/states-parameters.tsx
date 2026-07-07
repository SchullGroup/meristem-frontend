"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";
// import { useGetAllStates, useDeleteState } from "@/hooks/useStates";
// import { useDeleteLGA, useGetLGAsByState } from "@/hooks/useLGAs";
// import {
//   Search,
//   MapPin,
//   Map as MapIcon,
//   ChevronRight,
//   Plus,
//   Pencil,
//   Trash2,
// } from "lucide-react";
// import { toast } from "sonner";
// import { State, LGA } from "@/types/parameters";
// import LGADialog from "./lga-parameters-dialog";
// import StateDialog from "./state-parameters-dialog";
// import { ConfirmationDialog } from "../confirmation-dialog";
import { NIGERIA_STATES, getLGAs } from "@/lib/mocks/nigeria-geo";

interface StatesParametersProps {
  tab: string;
}

export default function StatesParameters({ tab }: StatesParametersProps) {
  // const { data: statesData, isLoading: statesLoading } = useGetAllStates({
  //   enabled: tab === "states",
  // });
  // const states = statesData?.content || [];

  // const deleteStateMutation = useDeleteState();

  // const deleteLgaMutation = useDeleteLGA();

  // const [selectedState, setSelectedState] = useState<State | null>(null);
  // const [stateSearch, setStateSearch] = useState("");
  // const [lgaSearch, setLgaSearch] = useState("");

  // const { data: lgasData, isLoading: lgasLoading } = useGetLGAsByState(
  //   selectedState?.id,
  // );

  // // Dialog states
  // const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  // const [editingState, setEditingState] = useState<State | null>(null);

  // // Delete confirmation state
  // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // const [deleteType, setDeleteType] = useState<"state" | "lga">("state");
  // const [stateToDelete, setStateToDelete] = useState<State | null>(null);
  // const [lgaToDelete, setLgaToDelete] = useState<LGA | null>(null);

  // // LGA Edit dialog state
  // const [isLgaDialogOpen, setIsLgaDialogOpen] = useState(false);
  // const [editingLga, setEditingLga] = useState<LGA | null>(null);

  // // Filtered states based on search
  // const filteredStates = useMemo(() => {
  //   return states.filter((s) =>
  //     s.name.toLowerCase().includes(stateSearch.toLowerCase()),
  //   );
  // }, [states, stateSearch]);

  // // Filtered LGAs based on search
  // const filteredLGAs = useMemo(() => {
  //   if (!lgasData) return [];
  //   return lgasData?.filter((lga) =>
  //     lga.name.toLowerCase().includes(lgaSearch.toLowerCase()),
  //   );
  // }, [lgasData, lgaSearch]);

  // const openAddDialog = () => {
  //   setDialogMode("add");
  //   setEditingState(null);
  //   setIsDialogOpen(true);
  // };

  // const openEditDialog = (state: State) => {
  //   setDialogMode("edit");
  //   setEditingState(state);
  //   setIsDialogOpen(true);
  // };

  // const openAddLgaDialog = () => {
  //   setEditingLga(null);
  //   setIsLgaDialogOpen(true);
  // };

  // const openEditLgaDialog = (lga: LGA) => {
  //   setEditingLga(lga);
  //   setIsLgaDialogOpen(true);
  // };

  // const handleDeleteState = () => {
  //   if (!stateToDelete) return;
  //   deleteStateMutation.mutate(stateToDelete.id, {
  //     onSuccess: () => {
  //       toast.success("State deleted successfully");
  //       setIsDeleteDialogOpen(false);
  //       if (selectedState?.id === stateToDelete.id) {
  //         setSelectedState(null);
  //       }
  //     },
  //     onError: (err) => toast.error(err.message || "Failed to delete state"),
  //   });
  // };

  // const handleDeleteLga = () => {
  //   if (!selectedState || !lgaToDelete) return;

  //   deleteLgaMutation.mutate(lgaToDelete.id, {
  //     onSuccess: () => {
  //       toast.success("LGA deleted successfully");
  //       setIsDeleteDialogOpen(false);
  //       setLgaToDelete(null);
  //     },
  //     onError: (err) => toast.error(err.message || "Failed to delete LGA"),
  //   });
  // };

  const [selectedState, setSelectedState] = useState(NIGERIA_STATES[0].name);
  const currentLGAs = getLGAs(selectedState);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h3 className="font-semibold text-sm">
            States{" "}
            <span className="text-muted-foreground font-normal">
              ({NIGERIA_STATES.length})
            </span>
          </h3>
        </div>
        <div className="overflow-y-auto max-h-[520px] no-scrollbar">
          {NIGERIA_STATES.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setSelectedState(s.name)}
              className={cn(
                "w-full text-left px-5 py-2.5 text-sm transition-all border-l-2 flex items-center justify-between",
                selectedState === s.name
                  ? "bg-primary/5 text-primary border-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                i < 3 && "font-medium",
              )}
            >
              <span>{s.name}</span>
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  selectedState === s.name
                    ? "text-primary/60"
                    : "text-muted-foreground/50",
                )}
              >
                {s.lgas.length}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="mrpsl-card overflow-hidden md:col-span-2">
        <div className="px-5 py-4 border-b border-border/60">
          <h3 className="font-semibold text-sm">
            LGAs — {selectedState}
            <span className="text-muted-foreground font-normal ml-2">
              ({currentLGAs.length} local government areas)
            </span>
          </h3>
        </div>
        <div className="p-4 grid grid-cols-3 gap-2 overflow-y-auto max-h-[520px] no-scrollbar">
          {currentLGAs.map((lga) => (
            <div
              key={lga}
              className="px-3 py-2 border border-border/50 rounded-lg text-xs font-medium text-muted-foreground bg-muted/20 text-center"
            >
              {lga}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  //   return (
  //     <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  //       {/* States List */}
  //       <Card className="mrpsl-card overflow-hidden lg:col-span-4 flex flex-col h-[600px]">
  //         <div className="px-5 py-4 border-b border-border/60 space-y-4">
  //           <div className="flex items-center justify-between">
  //             <h3 className="font-semibold text-sm flex items-center gap-2">
  //               <MapIcon className="h-4 w-4 text-primary" />
  //               States
  //               <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
  //                 {states.length}
  //               </span>
  //             </h3>
  //             <Button size="sm" variant="outline" onClick={openAddDialog}>
  //               <Plus className="h-3.5 w-3.5" /> Add States
  //             </Button>
  //           </div>
  //           <div className="relative">
  //             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
  //             <Input
  //               placeholder="Search states..."
  //               value={stateSearch}
  //               onChange={(e) => setStateSearch(e.target.value)}
  //               className="pl-9 h-9 text-xs mrpsl-input"
  //             />
  //           </div>
  //         </div>

  //         <div className="flex-1 overflow-y-auto no-scrollbar py-2">
  //           {statesLoading ? (
  //             Array.from({ length: 12 }).map((_, i) => (
  //               <div key={i} className="px-5 py-3">
  //                 <Skeleton className="h-4 w-full rounded" />
  //               </div>
  //             ))
  //           ) : filteredStates.length === 0 ? (
  //             <div className="px-5 py-10 text-center space-y-2">
  //               <div className="h-10 w-10 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
  //                 <Search className="h-5 w-5 text-muted-foreground/50" />
  //               </div>
  //               <p className="text-xs text-muted-foreground">No states found</p>
  //             </div>
  //           ) : (
  //             filteredStates.map((s) => (
  //               <div
  //                 key={s.id}
  //                 className={cn(
  //                   "group w-full text-left px-5 py-3 text-sm transition-all border-l-2 flex items-center justify-between",
  //                   selectedState?.id === s.id
  //                     ? "bg-primary/5 text-primary border-primary font-semibold"
  //                     : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
  //                 )}
  //               >
  //                 <button
  //                   onClick={() => {
  //                     setSelectedState(s);
  //                     setLgaSearch("");
  //                   }}
  //                   className="flex-1 flex items-center gap-3 text-left"
  //                 >
  //                   <div
  //                     className={cn(
  //                       "h-1.5 w-1.5 rounded-full transition-all",
  //                       selectedState?.id === s.id
  //                         ? "bg-primary scale-125"
  //                         : "bg-muted-foreground/30",
  //                     )}
  //                   />
  //                   <span>{s.name}</span>
  //                 </button>
  //                 <div className="flex items-center gap-2">
  //                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
  //                     <Button
  //                       variant="ghost"
  //                       size="icon-xs"
  //                       onClick={(e) => {
  //                         e.stopPropagation();
  //                         openEditDialog(s);
  //                       }}
  //                     >
  //                       <Pencil className="h-3 w-3" />
  //                     </Button>
  //                     <Button
  //                       variant="ghost"
  //                       size="icon-xs"
  //                       className="text-destructive hover:bg-destructive/10"
  //                       onClick={(e) => {
  //                         e.stopPropagation();
  //                         setStateToDelete(s);
  //                         setDeleteType("state");
  //                         setIsDeleteDialogOpen(true);
  //                       }}
  //                     >
  //                       <Trash2 className="h-3 w-3" />
  //                     </Button>
  //                   </div>
  //                   <span className="text-[10px] tabular-nums font-medium opacity-60">
  //                     {s.lgas?.length || 0}
  //                   </span>
  //                   <ChevronRight
  //                     className={cn(
  //                       "h-3 w-3 transition-transform",
  //                       selectedState?.id === s.id
  //                         ? "translate-x-0 opacity-100"
  //                         : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-40",
  //                     )}
  //                   />
  //                 </div>
  //               </div>
  //             ))
  //           )}
  //         </div>
  //       </Card>

  //       {/* LGAs Grid */}
  //       <Card className="mrpsl-card overflow-hidden lg:col-span-8 flex flex-col h-[600px]">
  //         <div className="px-5 py-4 border-b border-border/60 space-y-4 bg-muted/5">
  //           <div className="flex items-center justify-between">
  //             <div className="space-y-0.5">
  //               <h3 className="font-semibold text-sm flex items-center gap-2">
  //                 <MapPin className="h-4 w-4 text-primary" />
  //                 LGAs — {selectedState?.name || "Select a state"}
  //               </h3>
  //               <p className="text-[11px] text-muted-foreground">
  //                 Displaying local government areas within this state
  //               </p>
  //             </div>
  //             {selectedState && (
  //               <div className="flex items-center gap-2">
  //                 <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold uppercase tracking-wider">
  //                   {filteredLGAs.length} of {lgasData?.length} Areas
  //                 </span>
  //                 <Button
  //                   size="sm"
  //                   variant="outline"
  //                   className="h-8 px-3"
  //                   onClick={openAddLgaDialog}
  //                 >
  //                   <Plus className="h-3.5 w-3.5 mr-1.5" /> Add LGA
  //                 </Button>
  //               </div>
  //             )}
  //           </div>
  //           <div className="relative max-w-sm">
  //             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
  //             <Input
  //               placeholder="Search local government areas..."
  //               value={lgaSearch}
  //               onChange={(e) => setLgaSearch(e.target.value)}
  //               className="pl-9 h-9 text-xs mrpsl-input"
  //               disabled={!selectedState}
  //             />
  //           </div>
  //         </div>

  //         <div className="flex-1 overflow-y-auto no-scrollbar p-6">
  //           {!selectedState ? (
  //             <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
  //               <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
  //                 <MapIcon className="h-8 w-8 text-muted-foreground/40" />
  //               </div>
  //               <div className="max-w-[200px] space-y-1">
  //                 <p className="text-sm font-semibold">No State Selected</p>
  //                 <p className="text-xs text-muted-foreground leading-relaxed">
  //                   Select a state from the left panel to view its local
  //                   government areas.
  //                 </p>
  //               </div>
  //             </div>
  //           ) : lgasLoading ? (
  //             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
  //               {Array.from({ length: 8 }).map((_, i) => (
  //                 <Skeleton key={i} className="h-10 w-full rounded-xl" />
  //               ))}
  //             </div>
  //           ) : filteredLGAs.length === 0 ? (
  //             <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
  //               <div className="h-12 w-12 bg-muted/50 rounded-full flex items-center justify-center">
  //                 <Search className="h-6 w-6 text-muted-foreground/30" />
  //               </div>
  //               <p className="text-xs font-medium">No LGAs match your search</p>
  //             </div>
  //           ) : (
  //             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
  //               {filteredLGAs.map((lga) => (
  //                 <div
  //                   key={lga.id}
  //                   className="group px-4 py-3 border border-border/50 rounded-xl text-xs font-medium text-muted-foreground bg-muted/20 hover:bg-background hover:border-primary/30 hover:text-primary transition-all duration-200 flex items-center justify-between"
  //                 >
  //                   <div className="flex items-center gap-2.5 truncate mr-2">
  //                     <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20 group-hover:bg-primary/40 transition-colors" />
  //                     <span className="truncate">{lga.name}</span>
  //                   </div>
  //                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
  //                     <Button
  //                       variant="ghost"
  //                       size="icon-xs"
  //                       className="h-6 w-6"
  //                       onClick={() => openEditLgaDialog(lga)}
  //                     >
  //                       <Pencil className="h-2.5 w-2.5" />
  //                     </Button>
  //                     <Button
  //                       variant="ghost"
  //                       size="icon-xs"
  //                       className="h-6 w-6 text-destructive hover:bg-destructive/10"
  //                       onClick={() => {
  //                         setLgaToDelete(lga);
  //                         setDeleteType("lga");
  //                         setIsDeleteDialogOpen(true);
  //                       }}
  //                     >
  //                       <Trash2 className="h-2.5 w-2.5" />
  //                     </Button>
  //                   </div>
  //                 </div>
  //               ))}
  //             </div>
  //           )}
  //         </div>
  //       </Card>

  //       {/* Add/Edit State Dialog */}
  //       <StateDialog
  //         open={isDialogOpen}
  //         onOpenChange={setIsDialogOpen}
  //         mode={dialogMode}
  //         initialData={editingState}
  //       />

  //       {/* Add/Edit LGA Dialog */}
  //       <LGADialog
  //         open={isLgaDialogOpen}
  //         onOpenChange={setIsLgaDialogOpen}
  //         mode={dialogMode}
  //         initialData={editingLga}
  //         stateId={selectedState?.id}
  //       />

  //       {/* Delete Confirmation */}
  //       <ConfirmationDialog
  //         confirmLabel="Delete"
  //         open={isDeleteDialogOpen}
  //         onOpenChange={setIsDeleteDialogOpen}
  //         title="Are you absolutely sure?"
  //         description="Are you sure you want to remove this item?"
  //         onConfirm={deleteType === "state" ? handleDeleteState : handleDeleteLga}
  //       />
  //     </div>
  //   );
  //
}

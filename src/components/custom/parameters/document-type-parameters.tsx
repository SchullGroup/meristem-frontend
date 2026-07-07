"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
// import { cn } from "@/lib/utils";
// import {
//   FILE_TYPE_OPTIONS,
//   FILE_TYPE_COLORS,
//   MAX_SIZE_OPTIONS,
// } from "@/lib/mocks/doc-types";
import {
  useGetDocumentTypes,
  useCreateDocumentType,
  useUpdateDocumentType,
  useDeleteDocumentType,
} from "@/hooks/useDocumentTypes";
import { DocumentType, DocumentTypeStatus } from "@/types/parameters";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const REQUIRED_FOR_OPTIONS = [
  "KYC",
  "Demat",
  "Admon",
  "Caution",
  "Transfer",
  "Rights Issue",
  "IPO",
];

const labelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block";

interface DocumentTypeParametersProps {
  tab: string;
  confirmDelete: (label: string, onConfirm: () => void) => void;
}

export default function DocumentTypeParameters({
  tab,
  confirmDelete,
}: DocumentTypeParametersProps) {
  // ── Document Types ------──────────
  const { data: docsData, isLoading: docsLoading } = useGetDocumentTypes({
    enabled: tab === "docs",
  });
  const docs = docsData || [];

  const createDocMutation = useCreateDocumentType();
  const updateDocMutation = useUpdateDocumentType();
  const deleteDocMutation = useDeleteDocumentType();

  // ── Document dialog ------──────────
  const [docOpen, setDocOpen] = useState(false);
  const [docMode, setDocMode] = useState<"add" | "edit">("add");
  const [editDoc, setEditDoc] = useState<DocumentType | null>(null);
  const [docName, setDocName] = useState("");
  const [docStatus, setDocStatus] = useState<DocumentTypeStatus>("ACTIVE");
  const [docReqFor, setDocReqFor] = useState<string[]>([]);
  const [docNote, setDocNote] = useState("");

  const toggleReqFor = (v: string) =>
    setDocReqFor((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const openAddDoc = () => {
    setDocMode("add");
    setEditDoc(null);
    setDocName("");
    setDocReqFor([]);
    setDocStatus("ACTIVE");
    setDocNote("");
    setDocOpen(true);
  };

  const openEditDoc = (x: DocumentType) => {
    setDocMode("edit");
    setEditDoc(x);
    setDocName(x.name);
    setDocReqFor([...x.requiredFor]);
    setDocStatus(x.status as DocumentTypeStatus);
    setDocNote(x.reasonForChange);
    setDocOpen(true);
  };

  const saveDoc = () => {
    if (!docName.trim() || docReqFor.length === 0) return;
    if (docMode === "add") {
      createDocMutation.mutate(
        {
          name: docName.trim(),
          requiredFor: docReqFor,
          status: docStatus as DocumentTypeStatus,
          reasonForChange: docNote || "Added new document type",
        },
        {
          onSuccess: () => {
            toast.success("Document type added.");
            setDocOpen(false);
          },
          onError: (err) =>
            toast.error(err.message || "Failed to add document type"),
        },
      );
    } else if (editDoc) {
      updateDocMutation.mutate(
        {
          code: editDoc.code,
          payload: {
            name: docName.trim(),
            requiredFor: docReqFor,
            status: docStatus as DocumentTypeStatus,
            reasonForChange: docNote || "Updated document type",
          },
        },
        {
          onSuccess: () => {
            toast.success("Document type updated.");
            setDocOpen(false);
          },
          onError: (err) =>
            toast.error(err.message || "Failed to update document type"),
        },
      );
    }
  };

  const deleteDoc = (code: string) => {
    deleteDocMutation.mutate(code, {
      onSuccess: () => toast.success("Document type removed."),
      onError: (err) =>
        toast.error(err.message || "Failed to remove document type"),
    });
  };

  return (
    <>
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Document Types</h3>
          <Button size="sm" variant="outline" onClick={openAddDoc}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Document
          </Button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Document Name</th>
              <th className="px-5 py-3">Required For</th>
              {/* <th className="px-5 py-3">Accepted File Types</th> */}
              {/* <th className="px-5 py-3 text-right">Max Size</th> */}
              <th className="px-5 py-3 text-center">Active</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {docsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="mrpsl-table-row">
                  <td className="px-5 py-3">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-6 w-24" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  {/* <td className="px-5 py-3 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td> */}
                  {/* <td className="px-5 py-3 text-center">
                    <Skeleton className="h-5 w-8 mx-auto" />
                  </td> */}
                  <td className="px-5 py-3 text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </td>
                </tr>
              ))
            ) : docs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-muted-foreground"
                >
                  No document types found.
                </td>
              </tr>
            ) : (
              docs.map((x) => (
                <tr key={x.code} className="mrpsl-table-row">
                  <td className="px-5 py-3 tabular-nums text-xs text-muted-foreground">
                    {x.code}
                  </td>
                  <td className="px-5 py-3 font-semibold">{x.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {x.requiredFor.map((r) => (
                        <Badge
                          key={r}
                          className="bg-gray-100 text-gray-700 border-0 text-xs"
                        >
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Switch
                      checked={x.status === "ACTIVE"}
                      onCheckedChange={(v) => {
                        updateDocMutation.mutate(
                          {
                            code: x.code,
                            payload: {
                              name: x.name,
                              requiredFor: x.requiredFor,
                              status: (v
                                ? "ACTIVE"
                                : "INACTIVE") as DocumentTypeStatus,
                              reasonForChange: v ? "Activated" : "Deactivated",
                            },
                          },
                          {
                            onSuccess: () =>
                              toast.success(
                                `Document type ${v ? "activated" : "deactivated"}.`,
                              ),
                            onError: (err) => toast.error(err.message),
                          },
                        );
                      }}
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDoc(x)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          confirmDelete(x.name, () => deleteDoc(x.code))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {docMode === "add" ? "Add Document Type" : "Edit Document Type"}
            </DialogTitle>
            <DialogDescription>
              {docMode === "add"
                ? "Add a new document required for various processes."
                : `Editing "${editDoc?.name}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-5 h-96 overflow-y-auto">
            <div className="space-y-1.5">
              <label className={labelClass}>Document Name *</label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Utility Bill"
                className="mrpsl-input"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>
                Required For *{" "}
                <span className="text-muted-foreground/60 normal-case font-normal tracking-normal">
                  (select all that apply)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REQUIRED_FOR_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/60 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={docReqFor.includes(opt)}
                      onCheckedChange={() => toggleReqFor(opt)}
                    />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Notes</label>
              <Textarea
                value={docNote}
                onChange={(e) => setDocNote(e.target.value)}
                placeholder="Optional notes about this document type…"
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-3">
              <RadioGroup
                onValueChange={(value) =>
                  setDocStatus(value as DocumentTypeStatus)
                }
                value={docStatus}
                className="flex flex-row gap-8"
              >
                <div className="flex items-center space-x-2.5 space-y-0">
                  <RadioGroupItem value="ACTIVE" className="h-5 w-5" />
                  <label className="font-medium text-sm text-green-700">
                    Active
                  </label>
                </div>
                <div className="flex items-center space-x-2.5 space-y-0">
                  <RadioGroupItem value="INACTIVE" className="h-5 w-5" />
                  <label className="font-medium text-sm text-muted-foreground">
                    Inactive
                  </label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDocOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveDoc}
              disabled={
                !docName.trim() ||
                docReqFor.length === 0 ||
                createDocMutation.isPending ||
                updateDocMutation.isPending
              }
            >
              {(createDocMutation.isPending || updateDocMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {docMode === "add" ? "Add Document" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

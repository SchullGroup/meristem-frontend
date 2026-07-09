"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Paperclip,
  X,
  Loader2,
  Upload,
  CheckCircle2,
  ExternalLink,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GetPDFUrl } from "@/lib/utils/get-file-url";
import { GetImageUrl } from "@/lib/utils/get-image-url";

// ── Types ───────────────────────────────────────────────────────────────────
interface DocEntry {
  id: string;
  name: string;
  file: File | null;
  url: string;
  status: "idle" | "uploading" | "done" | "error";
  errorMsg?: string;
}

export interface EvidenceDrawerProps {
  docs: { name: string; url: string }[];
  onDocsChange: (docs: { name: string; url: string }[]) => void;
  /** When true, the drawer starts open */
  defaultOpen?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function newEntry(): DocEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    file: null,
    url: "",
    status: "idle",
  };
}

// ── Component ───────────────────────────────────────────────────────────────
export function EvidenceDrawer({
  docs,
  onDocsChange,
  defaultOpen = false,
}: EvidenceDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [entries, setEntries] = useState<DocEntry[]>(() =>
    docs.length > 0
      ? docs.map((d) => ({
          id: crypto.randomUUID(),
          name: d.name,
          file: null,
          url: d.url,
          status: "done" as const,
        }))
      : [newEntry()],
  );

  const notify = useCallback(
    (updated: DocEntry[]) => {
      onDocsChange(
        updated
          .filter((e) => e.status === "done" && e.url)
          .map((e) => ({
            name: e.name || e.file?.name || "Evidence",
            url: e.url,
          })),
      );
    },
    [onDocsChange],
  );

  const update = (id: string, patch: Partial<DocEntry>) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
      notify(next);
      return next;
    });
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      notify(next);
      return next.length === 0 ? [newEntry()] : next;
    });
  };

  const addEntry = () => setEntries((prev) => [...prev, newEntry()]);

  const handleFile = async (id: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      update(id, { status: "error", errorMsg: "File too large — max 10 MB" });
      return;
    }
    update(id, { file, status: "uploading", errorMsg: undefined });
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const mimeType = file.type.toLowerCase();
      let res;
      if (mimeType === "application/pdf" || ext === "pdf") {
        res = await GetPDFUrl(file, "kycEvidence");
      } else {
        res = await GetImageUrl(file, "kycEvidence");
      }
      if (res?.type === "success") {
        update(id, { url: res.result as string, status: "done" });
      } else {
        update(id, { status: "error", errorMsg: "Upload failed", file: null });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      update(id, { status: "error", errorMsg: msg, file: null });
    }
  };

  const doneCount = entries.filter((e) => e.status === "done").length;

  return (
    <>
      {/* ── Entry point: collapsed trigger ── */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          className={cn(
            "h-7 text-[12px] gap-1.5 text-muted-foreground hover:text-foreground transition-colors",
            open && "text-primary",
          )}
        >
          <Paperclip className="h-3.5 w-3.5" />
          {doneCount > 0
            ? `${doneCount} evidence file${doneCount > 1 ? "s" : ""} attached`
            : "Attach evidence"}
          {open ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>

        {/* Persistent counter badge (always visible even when collapsed) */}
        {doneCount > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] h-5 px-1.5 font-medium text-muted-foreground border-muted-foreground/30"
          >
            <Paperclip className="h-3 w-3 mr-1" />
            {doneCount} attached
          </Badge>
        )}
      </div>

      {/* ── Collapsible drawer body ── */}
      {open && (
        <Card className="mt-3 p-4 border-dashed bg-muted/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground">
                Evidence for this change
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                Attach documents that support this submission. These will be
                included with the change request for the approver.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {entries.map((entry) => (
              <DocRow
                key={entry.id}
                entry={entry}
                onNameChange={(name) => update(entry.id, { name })}
                onFile={(file) => handleFile(entry.id, file)}
                onRemove={() => removeEntry(entry.id)}
                onClear={() =>
                  update(entry.id, {
                    file: null,
                    url: "",
                    status: "idle",
                    errorMsg: undefined,
                  })
                }
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEntry}
            className="w-full border-dashed text-muted-foreground hover:text-foreground h-8 text-[12px]"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add another file
          </Button>
        </Card>
      )}
    </>
  );
}

// ── Internal row component ──────────────────────────────────────────────────
function DocRow({
  entry,
  onNameChange,
  onFile,
  onRemove,
  onClear,
}: {
  entry: DocEntry;
  onNameChange: (name: string) => void;
  onFile: (file: File) => void;
  onRemove: () => void;
  onClear: () => void;
}) {
  if (entry.status === "done" && entry.file) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50/50 px-3 py-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
        <span className="text-[12px] font-medium text-green-900 truncate flex-1">
          {entry.name || entry.file.name}
        </span>
        <span className="text-[10px] text-green-600/70 shrink-0">
          {(entry.file.size / 1024 / 1024).toFixed(2)} MB
        </span>
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-semibold text-green-700 hover:text-green-900 shrink-0"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
        <button
          type="button"
          onClick={onClear}
          className="text-green-400 hover:text-destructive transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  if (entry.status === "uploading") {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
        <span className="text-[12px] text-primary truncate">
          Uploading {entry.file?.name}…
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="File description (e.g. Marriage certificate)"
        value={entry.name}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-8 text-[13px] mrpsl-input flex-1"
      />
      <input
        id={`evidence-upload-${entry.id}`}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/jpg"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <label
        htmlFor={`evidence-upload-${entry.id}`}
        className={cn(
          "flex items-center gap-1.5 border rounded-lg px-3 py-1.5 cursor-pointer text-[12px] font-medium transition-colors shrink-0",
          entry.status === "error"
            ? "border-destructive/40 text-destructive bg-destructive/5"
            : "border-border hover:border-primary/50 text-muted-foreground hover:text-primary",
        )}
      >
        <Upload className="h-3.5 w-3.5" />
        Upload
      </label>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors p-1 rounded"
        aria-label="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

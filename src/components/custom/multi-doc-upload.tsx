"use client";

import { useRef, useState, useCallback } from "react";
import {
  FileText,
  X,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Plus,
  Upload,
  ImageIcon,
  FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FILE_TYPE_ACCEPT } from "@/lib/mocks/doc-types";
import { GetPDFUrl } from "@/lib/utils/get-file-url";
import { GetImageUrl } from "@/lib/utils/get-image-url";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DocEntry {
  id: string;
  name: string;
  file: File | null;
  url: string;
  status: "idle" | "uploading" | "done" | "error";
  errorMsg?: string;
}

interface MultiDocUploadProps {
  onChange: (docs: { name: string; url: string }[]) => void;
  fileTypes?: string[];
  maxSizeMB?: number;
  folderName?: string;
}

const FILE_TYPES = ["PDF", "JPG", "PNG"];
const ACCEPT = FILE_TYPES.map((t) => FILE_TYPE_ACCEPT[t] ?? "")
  .filter(Boolean)
  .join(",");

function newEntry(): DocEntry {
  return { id: crypto.randomUUID(), name: "", file: null, url: "", status: "idle" };
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

export function MultiDocUpload({
  onChange,
  fileTypes = FILE_TYPES,
  maxSizeMB = 10,
  folderName = "kyc",
}: MultiDocUploadProps) {
  const [entries, setEntries] = useState<DocEntry[]>([newEntry()]);

  const notify = useCallback(
    (updated: DocEntry[]) => {
      onChange(
        updated
          .filter((e) => e.status === "done" && e.url)
          .map((e) => ({ name: e.name || e.file?.name || "Document", url: e.url })),
      );
    },
    [onChange],
  );

  const update = useCallback(
    (id: string, patch: Partial<DocEntry>, updatedList?: DocEntry[]) => {
      setEntries((prev) => {
        const next = (updatedList ?? prev).map((e) =>
          e.id === id ? { ...e, ...patch } : e,
        );
        notify(next);
        return next;
      });
    },
    [notify],
  );

  const handleFile = useCallback(
    async (id: string, file: File, currentEntries: DocEntry[]) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        update(id, { status: "error", errorMsg: `File too large — max ${maxSizeMB} MB` }, currentEntries);
        return;
      }
      update(id, { file, status: "uploading", errorMsg: undefined }, currentEntries);

      try {
        const mimeType = file.type.toLowerCase();
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        let response;

        if (mimeType === "application/pdf" || ext === "pdf") {
          response = await GetPDFUrl(file, folderName);
        } else if (["image/jpeg", "image/png", "image/jpg"].includes(mimeType) || ["jpeg", "png", "jpg"].includes(ext)) {
          response = await GetImageUrl(file, folderName);
        } else {
          update(id, { status: "error", errorMsg: "Unsupported format — use PDF, PNG or JPG", file: null });
          return;
        }

        if (response?.type === "success") {
          update(id, { url: response.result as string, status: "done" });
        } else {
          update(id, { status: "error", errorMsg: (response?.result as string) || "Upload failed", file: null });
        }
      } catch (err: any) {
        update(id, { status: "error", errorMsg: err.message || "Upload failed", file: null });
      }
    },
    [maxSizeMB, folderName, update],
  );

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      notify(next);
      return next;
    });
  };

  const addEntry = () => setEntries((prev) => [...prev, newEntry()]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Supporting Documents
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          PDF, JPG, PNG · Max {maxSizeMB} MB each
        </span>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <DocRow
            key={entry.id}
            entry={entry}
            accept={ACCEPT}
            onNameChange={(name) => update(entry.id, { name })}
            onFile={(file) => handleFile(entry.id, file, entries)}
            onRemove={() => removeEntry(entry.id)}
            onClear={() => update(entry.id, { file: null, url: "", status: "idle", errorMsg: undefined })}
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
        Add another document
      </Button>
    </div>
  );
}

interface DocRowProps {
  entry: DocEntry;
  accept: string;
  onNameChange: (name: string) => void;
  onFile: (file: File) => void;
  onRemove: () => void;
  onClear: () => void;
}

function DocRow({ entry, accept, onNameChange, onFile, onRemove, onClear }: DocRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  if (entry.status === "done" && entry.file) {
    return <DocThumbnail entry={entry} onRemove={onRemove} />;
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden">
      {/* Name row */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <Input
          placeholder="Document name (e.g. ID Card, Bank Statement)"
          value={entry.name}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-8 text-[13px] mrpsl-input flex-1"
        />
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors p-1 rounded"
          aria-label="Remove document slot"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Upload zone */}
      <div className="px-3 pb-3">
        {entry.status === "uploading" ? (
          <div className="flex items-center gap-2.5 px-3 py-2.5 border border-primary/20 bg-primary/5 rounded-lg">
            <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            <p className="text-xs text-primary truncate">Uploading {entry.file?.name}…</p>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) onFile(f);
              }}
              className={cn(
                "border-2 border-dashed rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors group",
                dragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50 hover:bg-primary/5",
                entry.status === "error" && "border-destructive/40 bg-destructive/5",
              )}
            >
              <Upload className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                entry.status === "error" ? "text-destructive" : "text-muted-foreground group-hover:text-primary",
              )} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[12px] font-medium transition-colors",
                  entry.status === "error" ? "text-destructive" : "text-muted-foreground group-hover:text-primary",
                )}>
                  {entry.status === "error" ? entry.errorMsg : "Click or drag to upload"}
                </p>
                {entry.status !== "error" && (
                  <p className="text-[10px] text-muted-foreground/50">PDF, JPG, PNG</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DocThumbnail({ entry, onRemove }: { entry: DocEntry; onRemove: () => void }) {
  const isPdf = entry.file?.type === "application/pdf" || entry.file?.name.endsWith(".pdf");
  const isImg = entry.file ? isImage(entry.file) : false;
  const sizeMB = entry.file ? (entry.file.size / 1024 / 1024).toFixed(2) : null;

  return (
    <div className="flex items-stretch gap-3 rounded-xl border border-green-200 bg-green-50/50 overflow-hidden p-3">
      {/* Thumbnail area */}
      <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-green-200 bg-white flex items-center justify-center">
        {isImg && entry.url ? (
          <img src={entry.url} alt={entry.name} className="w-full h-full object-cover" />
        ) : isPdf ? (
          <div className="w-full h-full bg-red-50 flex items-center justify-center">
            <FileText className="h-5 w-5 text-red-500" />
          </div>
        ) : (
          <div className="w-full h-full bg-blue-50 flex items-center justify-center">
            <FileIcon className="h-5 w-5 text-blue-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <p className="text-[13px] font-semibold text-green-900 truncate">
            {entry.name || entry.file?.name}
          </p>
        </div>
        <p className="text-[11px] text-green-700/70 truncate mt-0.5">{entry.file?.name}</p>
        {sizeMB && (
          <p className="text-[10px] text-green-600/60 mt-0.5">{sizeMB} MB</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end justify-between shrink-0 gap-1.5">
        <button
          type="button"
          onClick={onRemove}
          className="text-green-400 hover:text-red-500 transition-colors p-0.5 rounded"
          aria-label="Remove document"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {entry.url && (
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-semibold text-green-700 hover:text-green-900 transition-colors px-1.5 py-0.5 rounded hover:bg-green-100"
          >
            <ExternalLink className="h-3 w-3" />
            Preview
          </a>
        )}
      </div>
    </div>
  );
}

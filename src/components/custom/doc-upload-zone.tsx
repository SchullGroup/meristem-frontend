"use client";

import { useRef, useState } from "react";
import { FileText, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FILE_TYPE_ACCEPT, FILE_TYPE_COLORS } from "@/lib/mocks/doc-types";

interface DocUploadZoneProps {
  label: string;
  fileTypes: string[];
  maxSizeMB: number;
  required?: boolean;
  compact?: boolean;
  className?: string;
}

export function DocUploadZone({
  label,
  fileTypes,
  maxSizeMB,
  required,
  compact,
  className,
}: DocUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile]   = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const accept = fileTypes
    .map(t => FILE_TYPE_ACCEPT[t] ?? "")
    .filter(Boolean)
    .join(",");

  const handleFile = (f: File) => {
    setError(null);
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large — max ${maxSizeMB} MB`);
      return;
    }
    setFile(f);
  };

  const clear = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}{required && " *"}
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {fileTypes.map(t => (
            <span
              key={t}
              className={cn(
                "text-[10px] font-bold border rounded px-1.5 py-0.5 leading-none",
                FILE_TYPE_COLORS[t] ?? "bg-gray-50 text-gray-600 border-gray-200"
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground/70 ml-auto whitespace-nowrap">
          Max {maxSizeMB} MB
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {/* Upload zone / file preview */}
      {file ? (
        <div className="flex items-center gap-2.5 px-3 py-2.5 border border-green-200 bg-green-50/60 rounded-xl">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-green-800 truncate">{file.name}</p>
            <p className="text-[10px] text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 text-green-500 hover:text-red-500 transition-colors p-0.5 rounded"
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={cn(
            "border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors group",
            compact ? "p-3" : "p-5",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          <FileText className={cn(
            "mx-auto mb-1.5 text-muted-foreground group-hover:text-primary transition-colors",
            compact ? "h-4 w-4" : "h-6 w-6"
          )} />
          <p className={cn(
            "font-medium text-muted-foreground group-hover:text-primary transition-colors",
            compact ? "text-[11px]" : "text-xs"
          )}>
            Click or drag to upload
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            {fileTypes.join(", ")} · Max {maxSizeMB} MB
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

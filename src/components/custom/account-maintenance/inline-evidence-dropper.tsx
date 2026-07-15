"use client";

import { useState, useRef } from "react";
import { Paperclip, X, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GetPDFUrl } from "@/lib/utils/get-file-url";
import { GetImageUrl } from "@/lib/utils/get-image-url";

// ── Types ───────────────────────────────────────────────────────────────────
interface EvidenceEntry {
  id: string;
  name: string;
  file: File | null;
  url: string;
  status: "idle" | "uploading" | "done" | "error";
  errorMsg?: string;
}

export interface DoneEvidence {
  name: string;
  url: string;
}

interface InlineEvidenceDropperProps {
  doneEvidence: DoneEvidence[];
  onDoneEvidenceChange: (evidence: DoneEvidence[]) => void;
}

// ── Component ───────────────────────────────────────────────────────────────
export function InlineEvidenceDropper({
  doneEvidence,
  onDoneEvidenceChange,
}: InlineEvidenceDropperProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<EvidenceEntry[]>(() =>
    doneEvidence.length > 0
      ? doneEvidence.map((d) => ({
          id: crypto.randomUUID(),
          name: d.name,
          file: null,
          url: d.url,
          status: "done" as const,
        }))
      : [],
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const notify = (updated: EvidenceEntry[]) => {
    onDoneEvidenceChange(
      updated
        .filter((e) => e.status === "done" && e.url)
        .map((e) => ({
          name: e.name || e.file?.name || "Evidence",
          url: e.url,
        })),
    );
  };

  const handleFile = async (file: File) => {
    const id = crypto.randomUUID();
    const entry: EvidenceEntry = {
      id,
      name: "",
      file,
      url: "",
      status: "uploading",
    };
    setEntries((prev) => {
      const next = [...prev, entry];
      notify(next);
      return next;
    });

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const mimeType = file.type.toLowerCase();
      let res;
      if (mimeType === "application/pdf" || ext === "pdf") {
        res = await GetPDFUrl(file, "kycEvidence");
      } else {
        res = await GetImageUrl(file, "kycEvidence");
      }
      setEntries((prev) => {
        const next = prev.map((e) =>
          e.id === id
            ? res?.type === "success"
              ? { ...e, url: res.result as string, status: "done" as const }
              : {
                  ...e,
                  status: "error" as const,
                  errorMsg: "Upload failed",
                  file: null,
                }
            : e,
        );
        notify(next);
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setEntries((prev) => {
        const next = prev.map((e) =>
          e.id === id
            ? { ...e, status: "error" as const, errorMsg: msg, file: null }
            : e,
        );
        notify(next);
        return next;
      });
    }
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      notify(next);
      return next;
    });
  };

  const close = () => {
    setOpen(false);
    setEntries([]);
  };

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Paperclip className="h-3.5 w-3.5" />
          Attach evidence
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-dashed border-border/60 bg-muted/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Evidence for this change <span className="text-destructive">*</span>
            </span>
            <button
              type="button"
              onClick={close}
              className="text-muted-foreground/50 hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {entries.map((entry) =>
            entry.status === "uploading" ? (
              <div
                key={entry.id}
                className="flex items-center gap-2 text-[12px] text-muted-foreground"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading {entry.file?.name}…
              </div>
            ) : entry.status === "done" ? (
              <div
                key={entry.id}
                className="flex items-center gap-2 text-[12px] text-green-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex-1 font-medium">
                  {entry.file?.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="text-green-400 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : entry.status === "error" ? (
              <div
                key={entry.id}
                className="flex items-center gap-2 text-[12px] text-destructive"
              >
                <span className="truncate flex-1">{entry.errorMsg}</span>
                <button type="button" onClick={() => removeEntry(entry.id)}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null,
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/jpg"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <label
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex items-center gap-2 border-2 border-dashed rounded-lg px-3 py-2 cursor-pointer transition-colors",
              "border-border/60 hover:border-primary/50 hover:bg-primary/5",
            )}
          >
            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              Click to upload a file (PDF, JPG, PNG)
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

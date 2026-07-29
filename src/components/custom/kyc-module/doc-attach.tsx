"use client";

import { useRef } from "react";
import { Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KycDoc } from "@/types/kyc-module";

/**
 * Lightweight document attach control (mock — captures filename only, no real
 * upload). Used by Standard KYC, NIBSS Single, and NIBSS batch rows.
 */
export function DocAttach({
  docs,
  onChange,
  label = "Attach Document",
}: {
  docs: KycDoc[];
  onChange: (docs: KycDoc[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const added: KycDoc[] = Array.from(files).map((f) => ({
      name: f.name,
      url: "#",
      type: f.type || "application/octet-stream",
    }));
    onChange([...docs, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()}>
        <Paperclip className="h-3.5 w-3.5" /> {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {docs.length > 0 && (
        <div className="space-y-1.5">
          {docs.map((d, i) => (
            <div
              key={`${d.name}-${i}`}
              className="flex items-center gap-2 text-[13px] bg-muted/40 rounded-lg px-3 py-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{d.name}</span>
              <button
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => onChange(docs.filter((_, idx) => idx !== i))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

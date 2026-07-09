"use client";

import { useState, useRef, useCallback } from "react";
import { CloudUpload, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface UploadResult {
  totalRows: number;
  totalValue?: number;
  registerName?: string;
}

interface UploadStagingCardProps {
  label?: string;
  accept?: string;
  description?: string;
  onUpload: (file: File) => Promise<UploadResult>;
}

export function UploadStagingCard({
  label,
  accept = ".csv,.xlsx",
  description,
  onUpload,
}: UploadStagingCardProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setUploading(true);
      setProgress(0);

      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 20, 90));
      }, 180);

      try {
        const res = await onUpload(file);
        clearInterval(interval);
        setProgress(100);
        setResult(res);
      } catch (e: any) {
        clearInterval(interval);
        setError(e?.message ?? "Upload failed. Please check the file format and try again.");
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onReset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (result) {
    return (
      <Card className="mrpsl-card p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Data Staged Successfully</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm text-muted-foreground">
              <span>
                Total Rows:{" "}
                <strong className="text-foreground">{result.totalRows.toLocaleString()}</strong>
              </span>
              {result.totalValue !== undefined && (
                <span>
                  Total Value:{" "}
                  <strong className="text-foreground">
                    ₦{(result.totalValue / 1e9).toFixed(2)}B
                  </strong>
                </span>
              )}
              {result.registerName && (
                <span>
                  Register:{" "}
                  <strong className="text-foreground">{result.registerName}</strong>
                </span>
              )}
              <span className="text-muted-foreground/60 text-xs self-center">
                {selectedFile?.name}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            Upload New File
          </Button>
        </div>
      </Card>
    );
  }

  const acceptLabel = accept
    .split(",")
    .map((ext) => ext.trim().replace(".", "").toUpperCase())
    .join(", ");

  return (
    <Card className="mrpsl-card p-4 space-y-3">
      {label && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      )}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <CloudUpload
          className={cn(
            "h-10 w-10",
            dragging ? "text-primary" : "text-muted-foreground"
          )}
        />
        <div className="text-center">
          <p className="text-sm font-medium">Click or drag file to upload</p>
          <p className="text-xs text-muted-foreground mt-0.5">Supports {acceptLabel}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading {selectedFile?.name}…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
          <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </Card>
  );
}

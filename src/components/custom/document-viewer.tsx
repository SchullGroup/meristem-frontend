"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ImageIcon,
  ExternalLink,
  FileIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";

export interface DocumentEntry {
  name: string;
  url: string;
  uploadedAt?: string;
  uploaderName?: string;
}

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentEntry[];
  uploaderName?: string;
  uploadedAt?: string;
}

function getDocType(url: string): "pdf" | "image" | "unknown" {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".pdf")) return "pdf";
  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp")
  )
    return "image";
  return "unknown";
}

function DocTypeIcon({ url }: { url: string }) {
  const type = getDocType(url);
  if (type === "pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (type === "image") return <ImageIcon className="h-4 w-4 text-blue-500" />;
  return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}

export function DocumentViewer({
  open,
  onOpenChange,
  documents,
  uploaderName,
  uploadedAt,
}: DocumentViewerProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const activeDoc = documents[activeIdx];
  const docType = activeDoc ? getDocType(activeDoc.url) : "unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="border-b px-5 py-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate text-base">
                {activeDoc?.name || "Document Preview"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 space-y-0.5">
                {(activeDoc?.uploaderName || uploaderName) && (
                  <span className="block">
                    Uploaded by{" "}
                    <span className="font-medium text-foreground">
                      {activeDoc?.uploaderName || uploaderName}
                    </span>
                  </span>
                )}
                {(activeDoc?.uploadedAt || uploadedAt) && (
                  <span className="block">
                    {formatDate(activeDoc?.uploadedAt || uploadedAt || "")}
                  </span>
                )}
              </DialogDescription>
            </div>
            {activeDoc && (
              <a
                href={activeDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in new tab
                </Button>
              </a>
            )}
          </div>
        </DialogHeader>

        {/* Document Thumbnails — if multiple docs */}
        {documents.length > 1 && (
          <div className="flex gap-2 px-5 py-3 border-b bg-muted/30 overflow-x-auto shrink-0">
            {documents.map((doc, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                  idx === activeIdx
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-border text-muted-foreground"
                }`}
              >
                <DocTypeIcon url={doc.url} />
                <span className="max-w-25 truncate">{doc.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Navigation arrows */}
        {documents.length > 1 && (
          <div className="flex items-center justify-between px-5 py-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              {activeIdx + 1} / {documents.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setActiveIdx((i) => Math.min(documents.length - 1, i + 1))
              }
              disabled={activeIdx === documents.length - 1}
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-muted/20 p-4">
          {!activeDoc ? (
            <div className="h-full flex items-center justify-center min-h-100">
              <div className="text-center text-muted-foreground">
                <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No documents attached</p>
              </div>
            </div>
          ) : docType === "pdf" ? (
            <iframe
              src={activeDoc.url}
              className="w-full h-full rounded-lg border min-h-125"
              title={activeDoc.name}
            />
          ) : docType === "image" ? (
            <div className="flex items-center justify-center min-h-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeDoc.url}
                alt={activeDoc.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : (
            <div className="min-h-100 flex flex-col items-center justify-center gap-4">
              <FileIcon className="h-16 w-16 text-muted-foreground opacity-30" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Preview not available for this file type
                </p>
                <a
                  href={activeDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex"
                >
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Download / Open
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer badge */}
        {documents.length > 0 && activeDoc && (
          <div className="shrink-0 border-t px-5 py-3 bg-muted/10 flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] gap-1">
              <DocTypeIcon url={activeDoc.url} />
              {docType.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground truncate">
              {activeDoc.name}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Parse the supportingDocUrl field which may be:
 *  - JSON array: [{ name: string, url: string, uploadedAt?: string, uploaderName?: string }]
 *  - a plain URL string (pre-signed S3)
 *  - empty / null
 */
export function parseDocumentUrls(
  supportingDocUrl: string | null | undefined,
  fallbackName = "Document",
): DocumentEntry[] {
  if (!supportingDocUrl) return [];
  try {
    const parsed = JSON.parse(supportingDocUrl);
    if (Array.isArray(parsed)) {
      return parsed.map((d: any, i: number) => ({
        name: d.name || `${fallbackName} ${i + 1}`,
        url: d.url || d,
        uploadedAt: d.uploadedAt,
        uploaderName: d.uploaderName,
      }));
    }
    if (typeof parsed === "object" && parsed.url) {
      return [{ name: parsed.name || fallbackName, url: parsed.url }];
    }
  } catch {
    // Not JSON — treat as a plain URL
    if (supportingDocUrl.startsWith("http")) {
      return [{ name: fallbackName, url: supportingDocUrl }];
    }
  }
  return [];
}

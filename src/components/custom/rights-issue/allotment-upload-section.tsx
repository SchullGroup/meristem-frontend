"use client";

import { useState } from "react";
import { X, FileCheck2, FileX2, AlertCircle, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProcessAllotment } from "@/hooks/useRights";
import { returnErrorMessage, ErrorLike } from "@/utils/errorManager";
import { RightsIssue } from "@/types/rights";
import { downloadCsvTemplate } from "@/lib/utils/csv-template";
import { allottmentTemplateFields } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";
import { openFileInNewWindow } from "@/utils/helperFunctions";

interface AllotmentUploadSectionProps {
  allotReviewing: RightsIssue;
  onSuccess: () => void;
}

export function AllotmentUploadSection({
  allotReviewing,
  onSuccess,
}: AllotmentUploadSectionProps) {
  // Local File States
  const [allotApprovedFile, setAllotApprovedFile] = useState<File | null>(null);
  const [allotDisapprovedFile, setAllotDisapprovedFile] = useState<File | null>(
    null,
  );
  const [allotInvalidFile, setAllotInvalidFile] = useState<File | null>(null);

  // Drag states
  const [isDragApproved, setIsDragApproved] = useState(false);
  const [isDragDisapproved, setIsDragDisapproved] = useState(false);
  const [isDragInvalid, setIsDragInvalid] = useState(false);

  // Mutation
  const processMutation = useProcessAllotment();

  const handleRunAllotment = () => {
    if (!allotApprovedFile || !allotDisapprovedFile || !allotInvalidFile) {
      toast.error(
        "Please upload the Approved, Disapproved, and Invalid lists before processing.",
      );
      return;
    }
    toast.info("Processing allotment files...");

    const formData = new FormData();
    formData.append("approved", allotApprovedFile);
    formData.append("disapproved", allotDisapprovedFile);
    formData.append("invalid", allotInvalidFile);

    processMutation.mutate(
      { id: allotReviewing.id, data: formData },
      {
        onSuccess: () => {
          setAllotApprovedFile(null);
          setAllotDisapprovedFile(null);
          setAllotInvalidFile(null);
          toast.success(
            "Allotment processed. Sticky labels and email dispatch are now available.",
          );
          onSuccess();
        },
        onError: (error) => {
          toast.error(returnErrorMessage(error as ErrorLike));
        },
      },
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Approved */}
        <Card className="mrpsl-card p-6 border-t-4 border-t-green-500">
          <div className="flex justify-center mb-3">
            <FileCheck2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="font-semibold text-foreground text-center">
            Approved List
          </h3>
          <p className="text-[13px] text-muted-foreground mt-1 text-center">
            Shareholders who exercised their rights
          </p>
          <div className="mt-4">
            {allotApprovedFile ? (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                <FileCheck2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-[13px] font-medium text-green-800 flex-1 truncate">
                  {allotApprovedFile?.name}
                </span>
                <button
                  type="button"
                  onClick={() => openFileInNewWindow(allotApprovedFile)}
                  className="rounded-full hover:bg-green-100 p-0.5"
                  title="Preview file"
                >
                  <Eye className="h-3.5 w-3.5 text-green-700" />
                </button>
                <button
                  type="button"
                  onClick={() => setAllotApprovedFile(null)}
                  className="rounded-full hover:bg-green-100 p-0.5"
                >
                  <X className="h-3.5 w-3.5 text-green-700" />
                </button>
              </div>
            ) : (
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 h-20 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors",
                  isDragApproved && "border-primary bg-primary/5 text-primary"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragApproved(true);
                }}
                onDragLeave={() => setIsDragApproved(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragApproved(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    if (file.name.endsWith(".csv")) {
                      setAllotApprovedFile(file);
                    } else {
                      toast.error("Please upload a CSV file");
                    }
                  }
                }}
              >
                Drop CSV here or click to browse
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) =>
                    setAllotApprovedFile(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            )}
            <Button
              onClick={() =>
                downloadCsvTemplate(
                  allottmentTemplateFields,
                  "approved_list.csv",
                )
              }
              variant="link"
              className="text-primary underline text-xs"
            >
              Download Template
            </Button>
          </div>
        </Card>

        {/* Disapproved */}
        <Card className="mrpsl-card p-6 border-t-4 border-t-amber-500">
          <div className="flex justify-center mb-3">
            <FileX2 className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="font-semibold text-foreground text-center">
            Disapproved List
          </h3>
          <p className="text-[13px] text-muted-foreground mt-1 text-center">
            Return money — rejected applications
          </p>
          <div className="mt-4">
            {allotDisapprovedFile ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <FileX2 className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-[13px] font-medium text-amber-800 flex-1 truncate">
                  {allotDisapprovedFile?.name}
                </span>
                <button
                  type="button"
                  onClick={() => openFileInNewWindow(allotDisapprovedFile)}
                  className="rounded-full hover:bg-amber-100 p-0.5"
                  title="Preview file"
                >
                  <Eye className="h-3.5 w-3.5 text-amber-700" />
                </button>
                <button
                  type="button"
                  onClick={() => setAllotDisapprovedFile(null)}
                  className="rounded-full hover:bg-amber-100 p-0.5"
                >
                  <X className="h-3.5 w-3.5 text-amber-700" />
                </button>
              </div>
            ) : (
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 h-20 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors",
                  isDragDisapproved && "border-primary bg-primary/5 text-primary"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragDisapproved(true);
                }}
                onDragLeave={() => setIsDragDisapproved(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragDisapproved(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    if (file.name.endsWith(".csv")) {
                      setAllotDisapprovedFile(file);
                    } else {
                      toast.error("Please upload a CSV file");
                    }
                  }
                }}
              >
                Drop CSV here or click to browse
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) =>
                    setAllotDisapprovedFile(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            )}
            <Button
              onClick={() =>
                downloadCsvTemplate(
                  allottmentTemplateFields,
                  "disapproved_list.csv",
                )
              }
              variant="link"
              className="text-primary underline text-xs"
            >
              Download Template
            </Button>
          </div>
        </Card>

        {/* Invalid */}
        <Card className="mrpsl-card p-6 border-t-4 border-t-red-500">
          <div className="flex justify-center mb-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="font-semibold text-foreground text-center">
            Invalid Subscription
          </h3>
          <p className="text-[13px] text-muted-foreground mt-1 text-center">
            Return money — failed or invalid applications
          </p>
          <div className="mt-4">
            {allotInvalidFile ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-[13px] font-medium text-red-800 flex-1 truncate">
                  {allotInvalidFile?.name}
                </span>
                <button
                  type="button"
                  onClick={() => openFileInNewWindow(allotInvalidFile)}
                  className="rounded-full hover:bg-red-100 p-0.5"
                  title="Preview file"
                >
                  <Eye className="h-3.5 w-3.5 text-red-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setAllotInvalidFile(null)}
                  className="rounded-full hover:bg-red-100 p-0.5"
                >
                  <X className="h-3.5 w-3.5 text-red-700" />
                </button>
              </div>
            ) : (
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 h-20 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors",
                  isDragInvalid && "border-primary bg-primary/5 text-primary"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragInvalid(true);
                }}
                onDragLeave={() => setIsDragInvalid(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragInvalid(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    if (file.name.endsWith(".csv")) {
                      setAllotInvalidFile(file);
                    } else {
                      toast.error("Please upload a CSV file");
                    }
                  }
                }}
              >
                Drop CSV here or click to browse
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) =>
                    setAllotInvalidFile(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            )}
            <Button
              onClick={() =>
                downloadCsvTemplate(
                  allottmentTemplateFields,
                  "approved_list.csv",
                )
              }
              variant="link"
              className="text-primary underline text-xs"
            >
              Download Template
            </Button>
          </div>
        </Card>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={
          !allotApprovedFile ||
          !allotDisapprovedFile ||
          !allotInvalidFile ||
          processMutation.isPending
        }
        onClick={handleRunAllotment}
      >
        {processMutation.isPending
          ? "Processing Allotment..."
          : "Process Allotment"}
      </Button>
    </>
  );
}

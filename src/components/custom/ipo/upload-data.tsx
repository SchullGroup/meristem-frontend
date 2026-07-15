"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Eye,
  Info,
  Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import DateInput from "@/components/ui/date-input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUploadBatchIpo } from "@/hooks/useIPO";
import { downloadCsvTemplate } from "@/lib/utils/csv-template";
import { ipoTemplateFields } from "@/lib/utils/constants";
import { IPO } from "@/types/ipo";
import { openFileInNewWindow } from "@/utils/helperFunctions";

interface ActiveOffer {
  id: string;
  name: string;
  register: string;
  offerPrice: number;
  status: string;
}

export default function UploadIPOData({
  tab,
  activeOffer,
}: {
  tab: string;
  activeOffer?: ActiveOffer | null;
}) {
  const [batchDate, setBatchDate] = useState<Date>(new Date());
  const [subscriptionFile, setSubscriptionFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processedBatch, setProcessedBatch] = useState<IPO | null>(null);

  const uploadIpoMutation = useUploadBatchIpo();

  const handleProcess = () => {
    if (!activeOffer) {
      toast.error("Please select an active offer first.");
      return;
    }
    if (!subscriptionFile) {
      toast.error("Please upload a subscription file.");
      return;
    }

    const metadata = JSON.stringify({
      offerId: activeOffer.id,
      offerName: activeOffer.name,
      register: activeOffer.register,
      batchDate: batchDate.toISOString(),
    });

    const form = new FormData();
    form.append("data", new Blob([metadata], { type: "application/json" }));
    form.append("file", subscriptionFile);

    uploadIpoMutation.mutate(form, {
      onSuccess: (data) => {
        toast.success(
          `Batch ${data.batchReference ?? ""} processed with status ${data.status.toLowerCase() ?? "pending"}.`,
        );
        setProcessedBatch(data);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const clearForm = () => {
    setSubscriptionFile(null);
    setProcessedBatch(null);
  };

  return (
    <div className="space-y-6">

      {/* Offer context banner */}
      {activeOffer ? (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-foreground">{activeOffer.name}</span>
            <span className="text-muted-foreground ml-2">
              — {activeOffer.register} · ₦{activeOffer.offerPrice.toFixed(2)} per share
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            {activeOffer.status}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          No offer selected. Use the <strong className="mx-1">Active Offer</strong> selector
          above to choose which offer this upload belongs to.
        </div>
      )}

      {processedBatch ? (
        <Card className="mrpsl-card bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-green-800 mb-5">
              <CheckCircle className="h-6 w-6 shrink-0" />
              <h3 className="font-semibold text-lg">
                Batch {processedBatch.batchReference} is{" "}
                {processedBatch.status.toLowerCase()}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Processed", value: processedBatch.totalAmount, color: "text-foreground" },
                { label: "Approved", value: processedBatch.approvedCount, color: "text-green-700" },
                { label: "Disapproved", value: processedBatch.disapprovedCount, color: "text-amber-600" },
                { label: "Invalid", value: processedBatch.invalidCount, color: "text-red-600" },
              ].map((stat) => (
                <Card key={stat.label} className="bg-white/60 border-green-200 p-4">
                  <div className="mrpsl-section-title text-green-700/70">{stat.label}</div>
                  <div className={cn("text-xl tabular mt-1 font-bold", stat.color)}>
                    {stat.value}
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={clearForm}>Process New Batch</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Batch date */}
          <div className="w-60">
            <DateInput date={batchDate} setDate={setBatchDate} label="Batch Date *" />
          </div>

          {/* Single subscription file upload */}
          <div className="space-y-2">
            <label className="mrpsl-label">Subscription File *</label>
            {subscriptionFile ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <Upload className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">
                  {subscriptionFile.name}
                </span>
                <button
                  onClick={() => openFileInNewWindow(subscriptionFile)}
                  className="rounded-full hover:bg-primary/10 p-1 transition-colors"
                  title="Preview file"
                >
                  <Eye className="h-4 w-4 text-primary" />
                </button>
                <button
                  onClick={() => setSubscriptionFile(null)}
                  className="rounded-full hover:bg-primary/10 p-1 transition-colors"
                >
                  <X className="h-4 w-4 text-primary" />
                </button>
              </div>
            ) : (
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-2 h-40 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors",
                  isDragging && "border-primary bg-primary/5 text-primary",
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    if (file.name.endsWith(".csv")) {
                      setSubscriptionFile(file);
                    } else {
                      toast.error("Please upload a CSV file.");
                    }
                  }
                }}
              >
                <Upload className="h-8 w-8 opacity-40" />
                <span>Drop CSV here or click to browse</span>
                <span className="text-xs opacity-60">Supports .csv files only</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setSubscriptionFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
            <Button
              onClick={() => downloadCsvTemplate(ipoTemplateFields, "subscription_template.csv")}
              variant="link"
              className="text-primary underline text-xs px-0"
            >
              Download Template
            </Button>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleProcess}
            disabled={!activeOffer || uploadIpoMutation.isPending}
          >
            {uploadIpoMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Batch…
              </>
            ) : (
              "Process Batch"
            )}
          </Button>
        </>
      )}
    </div>
  );
}

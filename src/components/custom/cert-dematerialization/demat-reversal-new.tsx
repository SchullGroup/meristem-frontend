"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Edit2,
  Eye,
  Send,
  FileText,
  X,
} from "lucide-react";
import { DematRequest, DEMAT_STOCKBROKERS } from "./demat-types";
import { formatNumber } from "@/lib/utils/format";
import { toast } from "sonner";

interface Props {
  requests: DematRequest[];
}

interface ResponseResults {
  successIds: string[];
  failedIds: string[];
}

export function DematReversal({ requests }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [responseLoaded, setResponseLoaded] = useState(false);
  const [responseResults, setResponseResults] = useState<ResponseResults>({
    successIds: [],
    failedIds: [],
  });
  const [editMode, setEditMode] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  function buildEmailContent(
    results: ResponseResults,
  ): { to: string; subject: string; body: string } {
    const uniqueBrokerIds = Array.from(
      new Set(requests.map((r) => r.stockbrokerId)),
    );
    const brokers = uniqueBrokerIds
      .map((id) => DEMAT_STOCKBROKERS.find((sb) => sb.id === id))
      .filter(Boolean) as typeof DEMAT_STOCKBROKERS;

    const to = brokers.map((b) => b.email).join("; ");

    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const subject = `Dematerialization Lodgment Status Update — ${dateStr}`;

    const brokerName =
      brokers.length === 1 ? brokers[0].firmName : "Valued Stockbroker";

    const successRequests = requests.filter((r) =>
      results.successIds.includes(r.id),
    );
    const failedRequests = requests.filter((r) =>
      results.failedIds.includes(r.id),
    );

    const successList = successRequests.length
      ? successRequests
          .map((r) => `  - ${r.id}: ${r.holderName} (${formatNumber(r.totalUnits)} units)`)
          .join("\n")
      : "  None";

    const failedList = failedRequests.length
      ? failedRequests
          .map(
            (r) =>
              `  - ${r.id}: ${r.holderName} (${formatNumber(r.totalUnits)} units)`,
          )
          .join("\n")
      : "  None";

    const body = `Dear ${brokerName},\n\nWe write to inform you of the status of dematerialization requests submitted to CSCS for lodgment.\n\nSuccessful:\n${successList}\n\nFailed:\n${failedList}\n\nPlease contact us for further assistance regarding any failed requests.\n\nRegards,\nMeristem Registrars`;

    return { to, subject, body };
  }

  function handleProcessResponse() {
    if (!selectedFile) {
      toast.error("Please select a CSCS response file first.");
      return;
    }

    const ids = requests.map((r) => r.id);
    const successIds = ids.slice(0, 3);
    const failedIds = ids.slice(3);

    const results: ResponseResults = { successIds, failedIds };
    setResponseResults(results);
    setResponseLoaded(true);

    const { to, subject, body } = buildEmailContent(results);
    setEmailTo(to);
    setEmailSubject(subject);
    setEmailBody(body);

    toast.success("Response file processed successfully.");
  }

  function handleSendEmail() {
    toast.success("Email notification sent to stockbroker(s).");
    setEditMode(false);
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Upload CSCS Response */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold">Upload CSCS Response File</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload the response file received from CSCS after lodgment.
          </p>
        </div>

        <div
          className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Click to upload CSCS response file
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setSelectedFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg text-sm">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate font-medium">{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <Button onClick={handleProcessResponse} className="gap-2">
          <Upload className="h-4 w-4" />
          Process Response
        </Button>
      </Card>

      {/* Section 2: Lodgment Results */}
      {responseLoaded && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-semibold">Lodgment Results</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Successful */}
            <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Successful
                </span>
                <Badge className="ml-auto bg-green-600 hover:bg-green-600 text-white text-xs">
                  {responseResults.successIds.length}
                </Badge>
              </div>
              <ul className="space-y-2">
                {responseResults.successIds.map((id) => {
                  const req = requests.find((r) => r.id === id);
                  return (
                    <li key={id} className="text-sm">
                      <span className="font-mono font-semibold text-green-800 dark:text-green-300">
                        {id}
                      </span>
                      {req && (
                        <span className="block text-xs text-green-600 dark:text-green-500 mt-0.5">
                          {req.holderName}
                        </span>
                      )}
                    </li>
                  );
                })}
                {responseResults.successIds.length === 0 && (
                  <li className="text-sm text-green-600 dark:text-green-500 italic">
                    None
                  </li>
                )}
              </ul>
            </div>

            {/* Failed */}
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Failed
                </span>
                <Badge className="ml-auto bg-red-600 hover:bg-red-600 text-white text-xs">
                  {responseResults.failedIds.length}
                </Badge>
              </div>
              <ul className="space-y-2">
                {responseResults.failedIds.map((id) => {
                  const req = requests.find((r) => r.id === id);
                  return (
                    <li key={id} className="text-sm">
                      <span className="font-mono font-semibold text-red-800 dark:text-red-300">
                        {id}
                      </span>
                      {req && (
                        <span className="block text-xs text-red-600 dark:text-red-500 mt-0.5">
                          {req.holderName}
                        </span>
                      )}
                      <span className="block text-xs text-red-400 dark:text-red-500 mt-0.5 italic">
                        CSCS reference mismatch
                      </span>
                    </li>
                  );
                })}
                {responseResults.failedIds.length === 0 && (
                  <li className="text-sm text-red-600 dark:text-red-500 italic">
                    None
                  </li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Section 3: Notify Stockbroker */}
      {responseLoaded && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">
                Compose Notification Email
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setEditMode((prev) => !prev)}
            >
              {editMode ? (
                <>
                  <Eye className="h-4 w-4" />
                  Preview
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  To
                </label>
                <Input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Subject
                </label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Body
                </label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={12}
                  className="font-mono text-sm resize-y"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm border border-border rounded-xl p-4 bg-muted/30">
              <div className="flex gap-3 border-b border-border pb-3">
                <span className="font-semibold text-muted-foreground w-16 shrink-0">
                  To:
                </span>
                <span className="break-all">{emailTo}</span>
              </div>
              <div className="flex gap-3 border-b border-border pb-3">
                <span className="font-semibold text-muted-foreground w-16 shrink-0">
                  Subject:
                </span>
                <span>{emailSubject}</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-muted-foreground w-16 shrink-0">
                  Body:
                </span>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {emailBody}
                </pre>
              </div>
            </div>
          )}

          <Button onClick={handleSendEmail} className="gap-2">
            <Send className="h-4 w-4" />
            Send Email
          </Button>
        </Card>
      )}
    </div>
  );
}

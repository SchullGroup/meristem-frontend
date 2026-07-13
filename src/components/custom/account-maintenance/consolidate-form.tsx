"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  useCreateConsolidation,
  useGetAccounts,
} from "@/hooks/useAccountMaintenance";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import { GetPDFUrl } from "@/lib/utils/get-file-url";
import { GetImageUrl } from "@/lib/utils/get-image-url";
import BulkAccountConsolidation from "./bulk-account-consolidation";
import { ShareholderAccount } from "@/types/account-maintenance";

const MAX_SOURCES = 10;
const MAX_DOCS = 3;

interface SourceAccount {
  holderId: string;
  accountNumber: string;
  name: string;
  chn: string;
  units: number;
  registerSymbol: string;
  status: string;
}

interface AttachedDoc {
  id: string;
  file: File;
  url: string;
  status: "uploading" | "done";
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    DORMANT: "bg-gray-100 text-gray-600",
    CAUTIONED: "bg-amber-100 text-amber-800",
    SUSPENDED: "bg-red-100 text-red-700",
  };
  return (
    <Badge
      className={`border-0 text-[11px] shrink-0 ${map[s] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </Badge>
  );
}

// ─── Initials avatar ──────────────────────────────────────────────────────────

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ").filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : (parts[0]?.[0] ?? "?");
  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0 uppercase">
      {letters}
    </div>
  );
}

// ─── Document attachments ─────────────────────────────────────────────────────

function DocAttachments({
  onChange,
}: {
  onChange: (docs: { name: string; url: string }[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<AttachedDoc[]>([]);
  const [previewDoc, setPreviewDoc] = useState<AttachedDoc | null>(null);

  const notify = useCallback(
    (updated: AttachedDoc[]) => {
      onChange(
        updated
          .filter((d) => d.status === "done")
          .map((d) => ({ name: d.file.name, url: d.url })),
      );
    },
    [onChange],
  );

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large — max 10 MB.");
      return;
    }
    const id = crypto.randomUUID();
    setDocs((prev) => {
      const next = [
        ...prev,
        { id, file, url: "", status: "uploading" as const },
      ];
      notify(next);
      return next;
    });

    try {
      const mime = file.type.toLowerCase();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const response =
        mime === "application/pdf" || ext === "pdf"
          ? await GetPDFUrl(file, "consolidation")
          : await GetImageUrl(file, "consolidation");

      if (response?.type === "success") {
        setDocs((prev) => {
          const next = prev.map((d) =>
            d.id === id
              ? {
                  ...d,
                  url: response.result as string,
                  status: "done" as const,
                }
              : d,
          );
          notify(next);
          return next;
        });
      } else {
        toast.error((response?.result as string) || "Upload failed.");
        setDocs((prev) => {
          const next = prev.filter((d) => d.id !== id);
          notify(next);
          return next;
        });
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Upload failed.");
      setDocs((prev) => {
        const next = prev.filter((d) => d.id !== id);
        notify(next);
        return next;
      });
    }
  }

  function removeDoc(id: string) {
    setDocs((prev) => {
      const next = prev.filter((d) => d.id !== id);
      notify(next);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-muted/10"
        >
          {doc.status === "uploading" ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          )}
          <span className="flex-1 truncate text-xs font-mono">
            {doc.file.name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {(doc.file.size / 1024 / 1024).toFixed(1)} MB
          </span>
          {doc.status === "done" && (
            <button
              type="button"
              onClick={() => setPreviewDoc(doc)}
              className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              aria-label="Preview document"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => removeDoc(doc.id)}
            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            aria-label="Remove document"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {/* in-app document preview */}
      <Dialog
        open={!!previewDoc}
        onOpenChange={(open) => {
          if (!open) setPreviewDoc(null);
        }}
      >
        <DialogContent className="max-w-3xl h-[85vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 shrink-0 border-b">
            <DialogTitle className="text-base truncate pr-8">
              {previewDoc?.file.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            {previewDoc &&
              (() => {
                const isImage = previewDoc.file.type.startsWith("image/");
                return isImage ? (
                  <div className="relative w-full h-full bg-muted/20">
                    <Image
                      src={previewDoc.url}
                      alt={previewDoc.file.name}
                      fill
                      unoptimized
                      className="object-contain p-4"
                    />
                  </div>
                ) : (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.file.name}
                    className="w-full h-full border-0"
                  />
                );
              })()}
          </div>
        </DialogContent>
      </Dialog>

      {docs.length < MAX_DOCS ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                handleFile(f);
                e.target.value = "";
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-2 border-2 border-dashed rounded-lg px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span>Attach a document</span>
            <span className="text-xs opacity-60">
              PDF, JPG, PNG · max 10 MB
            </span>
            {docs.length > 0 && (
              <span className="ml-auto text-xs font-medium">
                {docs.length}/{MAX_DOCS}
              </span>
            )}
          </button>
        </>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-1">
          Maximum {MAX_DOCS} documents attached.
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Consolidate({ tab }: { tab: string }) {
  const currentUser = useStore((state) => state.currentUser);
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // source search
  const srcSearchRef = useRef<HTMLDivElement | null>(null);
  const [srcSearch, setSrcSearch] = useState("");
  const [srcOpen, setSrcOpen] = useState(false);
  const debouncedSrc = useDebounce(srcSearch, 500);

  // destination search
  const destSearchRef = useRef<HTMLDivElement | null>(null);
  const [destSearch, setDestSearch] = useState("");
  const [destOpen, setDestOpen] = useState(false);
  const debouncedDest = useDebounce(destSearch, 500);

  const [sourceAccounts, setSourceAccounts] = useState<SourceAccount[]>([]);
  const [destinationAccount, setDestinationAccount] =
    useState<ShareholderAccount | null>(null);
  const [reason, setReason] = useState("");
  const [supportingDocs, setSupportingDocs] = useState<
    { name: string; url: string }[]
  >([]);
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        srcSearchRef.current &&
        !srcSearchRef.current.contains(e.target as Node)
      )
        setSrcOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        destSearchRef.current &&
        !destSearchRef.current.contains(e.target as Node)
      )
        setDestOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: srcResults, isFetching: searchingSrc } = useGetAccounts(
    { q: debouncedSrc.trim(), pageSize: 20 },
    { enabled: debouncedSrc.length > 2 },
  );

  const { data: destResults, isFetching: searchingDest } = useGetAccounts(
    { q: debouncedDest.trim(), pageSize: 20 },
    { enabled: debouncedDest.length > 2 },
  );

  const createConsolidation = useCreateConsolidation();

  const totalHoldings = sourceAccounts.reduce((sum, a) => sum + a.units, 0);
  const combinedTotal = totalHoldings + (destinationAccount?.holdings ?? 0);

  const sourceRegisters = [
    ...new Set(sourceAccounts.map((a) => a.registerSymbol)),
  ];
  const hasRegisterChange =
    sourceRegisters.length > 1 ||
    (!!destinationAccount &&
      sourceRegisters.length > 0 &&
      !sourceRegisters.includes(destinationAccount.registerSymbol));

  const canSubmit =
    sourceAccounts.length >= 2 &&
    !!destinationAccount &&
    reason.trim().length > 0;

  function addAccount(holder: ShareholderAccount) {
    if (holder.id === destinationAccount?.id) {
      toast.error("This account is already selected as the destination.");
      return;
    }
    if (sourceAccounts.some((a) => a.holderId === holder.id)) {
      toast.info("Account already added.");
      return;
    }
    if (sourceAccounts.length >= MAX_SOURCES) {
      toast.error(`Maximum ${MAX_SOURCES} source accounts allowed.`);
      return;
    }
    setSourceAccounts((prev) => [
      ...prev,
      {
        holderId: holder.id,
        accountNumber: holder.accountNumber ?? "",
        name: `${holder.firstName} ${holder.lastName}`,
        chn: holder.chn,
        units: holder.holdings ?? 0,
        registerSymbol: holder.registerSymbol ?? "",
        status: holder.status ?? "",
      },
    ]);
  }

  function removeAccount(id: string) {
    setSourceAccounts((prev) => prev.filter((a) => a.holderId !== id));
  }

  function selectDestination(holder: ShareholderAccount) {
    if (sourceAccounts.some((a) => a.holderId === holder.id)) {
      toast.error(
        "This account is already in the source list. Choose a different destination.",
      );
      return;
    }
    setDestinationAccount(holder);
    setDestSearch("");
    setDestOpen(false);
  }

  function clearDestination() {
    setDestinationAccount(null);
    setDestSearch("");
  }

  function handleSubmitClick() {
    if (!canSubmit) return;
    setConfirmOpen(true);
  }

  function doConfirmedSubmit() {
    if (!destinationAccount || !currentUser?.email) return;
    createConsolidation.mutate(
      {
        sourceAccountIds: sourceAccounts.map((a) => a.holderId),
        destinationAccountId: destinationAccount.id,
        comment: reason,
        initiatedBy: currentUser.email,
        ...(supportingDocs.length > 0 && {
          supportingDocuments: supportingDocs,
        }),
      },
      {
        onSuccess: () => {
          toast.success("Consolidation submitted for authoriser review.");
          setConfirmOpen(false);
          setSourceAccounts([]);
          setDestinationAccount(null);
          setReason("");
          setSupportingDocs([]);
        },
        onError: (err) =>
          toast.error(err.message || "Failed to submit consolidation."),
      },
    );
  }

  const destName = destinationAccount
    ? `${destinationAccount.firstName} ${destinationAccount.lastName}`
    : "";
  const showPreview = sourceAccounts.length >= 2 && !!destinationAccount;

  return (
    <div className="space-y-6">
      {/* mode toggle */}
      <div className="flex gap-4 flex-wrap">
        <div className="border rounded-md flex p-1 bg-muted/20">
          <Button
            variant={mode === "single" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("single")}
          >
            Single
          </Button>
          <Button
            variant={mode === "bulk" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("bulk")}
          >
            Bulk Upload
          </Button>
        </div>
      </div>

      {mode === "single" && (
        <div className="space-y-6">
          {/* ── Row 1: Source | Destination ── */}
          <div className="grid grid-cols-5 gap-6">
            {/* left: source accounts */}
            <div className="col-span-3 space-y-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold text-sm">
                  1. Source Accounts{" "}
                  <span className="text-muted-foreground font-normal">
                    (to be deactivated)
                  </span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  {sourceAccounts.length}/{MAX_SOURCES}
                </span>
              </div>

              <Card className="mrpsl-card p-4 space-y-4 overflow-visible">
                <div ref={srcSearchRef} className="relative">
                  <div className="relative flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        placeholder="Search by name, account number or CHN…"
                        className="pl-9 pr-8 mrpsl-input"
                        value={srcSearch}
                        disabled={sourceAccounts.length >= MAX_SOURCES}
                        onChange={(e) => {
                          setSrcSearch(e.target.value);
                          setSrcOpen(true);
                        }}
                        onFocus={() => setSrcOpen(true)}
                      />
                      {srcSearch.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSrcSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Clear search"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {srcOpen && srcSearch.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg bg-background z-20 overflow-hidden">
                      {searchingSrc ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          Searching…
                        </div>
                      ) : srcResults?.data?.data?.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No accounts found.
                        </div>
                      ) : (
                        <div className="divide-y max-h-64 overflow-y-auto">
                          {srcResults?.data?.data?.map((holder) => {
                            const alreadyAdded = sourceAccounts.some(
                              (a) => a.holderId === holder.id,
                            );
                            const isDestination =
                              destinationAccount?.id === holder.id;
                            const isNonActive =
                              holder.status &&
                              holder.status.toUpperCase() !== "ACTIVE";
                            const blocked = alreadyAdded || isDestination;
                            return (
                              <button
                                key={holder.id}
                                type="button"
                                onClick={() => {
                                  if (!blocked) addAccount(holder);
                                }}
                                disabled={blocked}
                                className={`w-full text-left px-4 py-3 transition-colors ${blocked ? "opacity-50 cursor-default bg-muted/30" : "hover:bg-muted/40 cursor-pointer"}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm truncate">
                                        {holder.firstName} {holder.lastName}
                                      </span>
                                      {isNonActive && (
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      <span className="font-mono text-xs text-muted-foreground">
                                        {holder.accountNumber}
                                      </span>
                                      <span className="font-mono text-xs text-muted-foreground">
                                        {holder.chn}
                                      </span>
                                      {isDestination && (
                                        <span className="text-xs text-muted-foreground italic">
                                          destination account
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {(holder.holdings ?? 0).toLocaleString()}{" "}
                                      units
                                    </span>
                                    <span className="text-primary font-mono text-xs font-semibold">
                                      {holder.registerSymbol}
                                    </span>
                                    <StatusBadge status={holder.status} />
                                    {alreadyAdded && (
                                      <Check className="h-3.5 w-3.5 text-green-600" />
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {sourceAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {sourceAccounts.map((acc) => {
                      const isNonActive = acc.status.toUpperCase() !== "ACTIVE";
                      return (
                        <div
                          key={acc.holderId}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${isNonActive ? "border-amber-200 bg-amber-50/40 dark:bg-amber-900/10" : "bg-muted/10"}`}
                        >
                          <div className="flex-1 min-w-0 grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 gap-y-0.5">
                            <span className="font-mono text-xs text-muted-foreground">
                              {acc.accountNumber}
                            </span>
                            <span className="font-medium truncate">
                              {acc.name}
                            </span>
                            <span className="text-primary font-mono text-xs font-semibold">
                              {acc.registerSymbol}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground col-start-1">
                              {acc.chn}
                            </span>
                            <span className="font-mono text-xs">
                              {acc.units.toLocaleString()} units
                            </span>
                            <StatusBadge status={acc.status} />
                            {isNonActive && (
                              <span className="flex items-center gap-1 text-amber-600 text-xs col-span-4">
                                <AlertTriangle className="h-3 w-3" /> Non-active
                                account — verify before proceeding
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAccount(acc.holderId)}
                            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors ml-1 cursor-pointer"
                            aria-label="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs">
                        {sourceAccounts.length < 2 && (
                          <span className="text-amber-600 font-medium">
                            ⚠ Add at least 2 accounts to consolidate
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold">
                        Total:{" "}
                        <span className="font-mono text-primary">
                          {totalHoldings.toLocaleString()}
                        </span>{" "}
                        units
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Search and add at least 2 source accounts above.
                  </p>
                )}
              </Card>
            </div>

            {/* right: destination */}
            <div className="col-span-2 space-y-4">
              <h3 className="font-semibold text-sm">
                2. Destination Account{" "}
                <span className="text-muted-foreground font-normal">
                  (surviving)
                </span>
              </h3>

              <Card className="mrpsl-card p-4 space-y-4 overflow-visible">
                {destinationAccount ? (
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Initials name={destName} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {destName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">
                              {destinationAccount.accountNumber}
                            </span>
                            <StatusBadge status={destinationAccount.status} />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearDestination}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        aria-label="Clear destination"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                      <div>
                        <p className="text-muted-foreground">CHN</p>
                        <p className="font-mono mt-0.5">
                          {destinationAccount.chn}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Register</p>
                        <p className="text-primary font-semibold font-mono mt-0.5">
                          {destinationAccount.registerSymbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Holdings</p>
                        <p className="font-mono mt-0.5">
                          {(destinationAccount.holdings ?? 0).toLocaleString()}{" "}
                          units
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bank</p>
                        <p className="mt-0.5 truncate">
                          {destinationAccount.bankName || "—"}
                        </p>
                      </div>
                      {destinationAccount.bankAccountNumber && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">
                            Bank Account No.
                          </p>
                          <p className="font-mono mt-0.5">
                            {destinationAccount.bankAccountNumber}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                      <span className="text-xs text-primary font-medium">
                        Surviving account register:{" "}
                        <span className="font-semibold font-mono">
                          {destinationAccount.registerSymbol}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div ref={destSearchRef} className="relative">
                    <div className="relative flex gap-2 items-center">
                      <div className="relative flex-1">
                        <Input
                          type="text"
                          placeholder="Search by name, account number or CHN…"
                          className="pl-9 pr-8 mrpsl-input"
                          value={destSearch}
                          onChange={(e) => {
                            setDestSearch(e.target.value);
                            setDestOpen(true);
                          }}
                          onFocus={() => setDestOpen(true)}
                        />
                        {destSearch.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setDestSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Clear search"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {destOpen && destSearch.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg bg-background z-20 overflow-hidden">
                        {searchingDest ? (
                          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />{" "}
                            Searching…
                          </div>
                        ) : destResults?.data?.data?.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No accounts found.
                          </div>
                        ) : (
                          <div className="divide-y max-h-64 overflow-y-auto">
                            {destResults?.data?.data?.map((holder) => {
                              const isSource = sourceAccounts.some(
                                (a) => a.holderId === holder.id,
                              );
                              const isNonActive =
                                holder.status &&
                                holder.status.toUpperCase() !== "ACTIVE";
                              return (
                                <button
                                  key={holder.id}
                                  type="button"
                                  onClick={() => selectDestination(holder)}
                                  className={`w-full text-left px-4 py-3 transition-colors ${isSource ? "opacity-50 cursor-not-allowed bg-muted/30" : "hover:bg-muted/40 cursor-pointer"}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm truncate">
                                          {holder.firstName} {holder.lastName}
                                        </span>
                                        {isNonActive && (
                                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 mt-0.5">
                                        <span className="font-mono text-xs text-muted-foreground">
                                          {holder.accountNumber}
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground">
                                          {holder.chn}
                                        </span>
                                        {isSource && (
                                          <span className="text-xs text-muted-foreground italic">
                                            already a source
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="font-mono text-xs text-muted-foreground">
                                        {(
                                          holder.holdings ?? 0
                                        ).toLocaleString()}{" "}
                                        units
                                      </span>
                                      <span className="text-primary font-mono text-xs font-semibold">
                                        {holder.registerSymbol}
                                      </span>
                                      <StatusBadge status={holder.status} />
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {destinationAccount && (
                    <motion.div
                      key="reason-docs"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-4"
                    >
                      {/* Reason */}
                      <div className="space-y-2 border-t pt-4">
                        <label className="text-sm font-semibold">
                          Reason for Consolidation{" "}
                          <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                          placeholder="Describe why these accounts are being consolidated…"
                          className="focus-visible:ring-primary resize-none min-h-25"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                        {!reason.trim() && (
                          <p className="text-xs text-muted-foreground">
                            Required before submission.
                          </p>
                        )}
                      </div>

                      {/* Supporting docs */}
                      <div className="space-y-2 border-t pt-4">
                        <div className="flex items-baseline justify-between">
                          <label className="text-sm font-semibold">
                            Supporting Documents
                          </label>
                          <span className="text-xs text-muted-foreground">
                            Optional · up to {MAX_DOCS} files
                          </span>
                        </div>
                        <DocAttachments onChange={setSupportingDocs} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          </div>

          {/* ── Row 3: Merge Preview ── */}
          {showPreview && (
            <Card className="mrpsl-card overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setPreviewExpanded((v) => !v)}
              >
                <span className="font-semibold text-sm">
                  Review before submitting
                </span>
                <motion.span
                  animate={{ rotate: previewExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ display: "flex" }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {previewExpanded && (
                  <motion.div
                    key="preview-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="px-5 pb-5 space-y-4 border-t pt-4">
                      <div className="grid grid-cols-2 gap-5">
                        {/* sources */}
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Source Accounts ({sourceAccounts.length})
                          </p>
                          <div className="divide-y rounded-lg border overflow-hidden">
                            {sourceAccounts.map((acc) => (
                              <div
                                key={acc.holderId}
                                className="flex items-center justify-between px-3 py-2.5 text-xs gap-2 bg-muted/5"
                              >
                                <div className="min-w-0">
                                  <p className="font-medium truncate">
                                    {acc.name}
                                  </p>
                                  <p className="font-mono text-muted-foreground">
                                    {acc.accountNumber}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-primary font-mono font-semibold text-[11px]">
                                    {acc.registerSymbol}
                                  </p>
                                  <p className="font-mono text-muted-foreground">
                                    {acc.units.toLocaleString()} units
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* destination + totals */}
                        <div className="space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Destination Account
                          </p>
                          <div className="rounded-lg border px-3 py-2.5 space-y-1 text-xs bg-primary/5 border-primary/20">
                            <p className="font-semibold">{destName}</p>
                            <p className="font-mono text-muted-foreground">
                              {destinationAccount!.accountNumber}
                            </p>
                            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                              <span className="text-primary font-semibold font-mono">
                                {destinationAccount!.registerSymbol}
                              </span>
                              <span className="text-muted-foreground">
                                {(
                                  destinationAccount!.holdings ?? 0
                                ).toLocaleString()}{" "}
                                units current
                              </span>
                              <StatusBadge
                                status={destinationAccount!.status}
                              />
                            </div>
                          </div>

                          <div className="rounded-lg border px-3 py-2.5 space-y-1 bg-muted/20">
                            <p className="text-xs text-muted-foreground">
                              Combined total holdings after merge
                            </p>
                            <p className="text-xl font-bold font-mono text-primary">
                              {combinedTotal.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Source total ({totalHoldings.toLocaleString()}) +
                              destination (
                              {(
                                destinationAccount!.holdings ?? 0
                              ).toLocaleString()}
                              )
                            </p>
                          </div>

                          {hasRegisterChange && (
                            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold">
                                  Cross-register consolidation
                                </p>
                                <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                                  {sourceRegisters.length > 1
                                    ? `Sources span ${sourceRegisters.join(", ")} — all re-registered under ${destinationAccount!.registerSymbol}.`
                                    : `Sources are in ${sourceRegisters[0]} but destination is in ${destinationAccount!.registerSymbol}.`}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* ── Submit ── */}
          <div className="flex justify-end">
            <Button
              className={`min-w-50 cursor-pointer transition-opacity ${!canSubmit ? "opacity-50" : ""}`}
              aria-disabled={!canSubmit}
              onClick={handleSubmitClick}
            >
              Submit for Approval
            </Button>
          </div>
        </div>
      )}

      {/* ── BULK FLOW ── */}
      {mode === "bulk" && <BulkAccountConsolidation mode="bulk" register="" />}

      {/* ── Confirmation dialog ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Consolidation</DialogTitle>
            <DialogDescription>
              Review the details below before final submission.
            </DialogDescription>

            <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 mt-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive leading-snug">
                <span className="font-semibold">
                  Source accounts will be deactivated.
                </span>{" "}
                This action requires authorisation before taking effect.
              </p>
            </div>
          </DialogHeader>

          <div className="px-8 pb-2 space-y-4 text-sm overflow-y-auto max-h-[55vh]">
            {/* sources */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                {sourceAccounts.length} Source Account
                {sourceAccounts.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-1.5">
                {sourceAccounts.map((acc) => (
                  <div
                    key={acc.holderId}
                    className="flex items-center justify-between text-xs gap-3 rounded-md border px-3 py-2 bg-muted/10"
                  >
                    <div className="min-w-0">
                      <span className="font-medium truncate">{acc.name}</span>
                      <span className="font-mono text-muted-foreground ml-2">
                        {acc.accountNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-primary font-mono text-[11px] font-semibold">
                        {acc.registerSymbol}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {acc.units.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* destination */}
            {destinationAccount && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                  Destination Account
                </p>
                <div className="rounded-md border px-3 py-2.5 space-y-0.5 bg-primary/5 border-primary/20 text-xs">
                  <p className="font-semibold">{destName}</p>
                  <p className="font-mono text-muted-foreground">
                    {destinationAccount.accountNumber}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-primary font-semibold font-mono">
                      {destinationAccount.registerSymbol}
                    </span>
                    <span className="text-muted-foreground">
                      {(destinationAccount.holdings ?? 0).toLocaleString()}{" "}
                      units current
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* combined total */}
            <div className="flex items-center justify-between rounded-md border px-3 py-2.5 bg-muted/20 text-xs">
              <span className="text-muted-foreground">
                Combined holdings after merge
              </span>
              <span className="font-bold font-mono text-primary text-base">
                {combinedTotal.toLocaleString()}
              </span>
            </div>

            {/* reason */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                Reason
              </p>
              <p className="text-xs bg-muted/20 rounded-md px-3 py-2 border leading-relaxed">
                {reason}
              </p>
            </div>

            {/* supporting docs */}
            {supportingDocs.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Supporting Documents ({supportingDocs.length})
                </p>
                <div className="space-y-1">
                  {supportingDocs.map((d, i) => (
                    <p
                      key={i}
                      className="text-xs font-mono text-muted-foreground truncate bg-muted/10 px-3 py-1.5 rounded border"
                    >
                      {d.name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {hasRegisterChange && (
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/10 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  Cross-register consolidation — unified record will be under{" "}
                  <strong>{destinationAccount?.registerSymbol}</strong>.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={doConfirmedSubmit}
              disabled={createConsolidation.isPending}
            >
              {createConsolidation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…
                </>
              ) : (
                "Confirm & Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

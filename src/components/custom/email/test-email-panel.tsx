"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GET_USERS } from "@/actions/userAction";
import { useSendTestEmail } from "@/hooks/useTestEmail";
import type { User } from "@/lib/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 10;
const MAX_SUGGESTIONS = 6;

function staffName(u: User) {
  return `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || u?.email || "—";
}

export function TestEmailPanel({
  recipients,
  onRecipientsChange,
  subject,
  templateLabel,
  disabled,
}: {
  recipients: string[];
  onRecipientsChange: (next: string[]) => void;
  subject: string;
  /** Describes what is being previewed, e.g. "Mandate batch MB-004". */
  templateLabel: string;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const sendTest = useSendTestEmail();

  // Shares the "users" cache with the staff directory page. Failing this call
  // is not fatal — the field still accepts typed addresses.
  const {
    data: staff,
    isLoading: staffLoading,
    isError: staffError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await GET_USERS();
      if (res?.isSuccessful && res?.data) return res.data as User[];
      throw new Error(res?.responseMessage || "Failed to load staff list");
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const chosen = new Set(recipients.map((r) => r.toLowerCase()));
    return (staff ?? [])
      .filter((u) => u?.email && !chosen.has(u.email.toLowerCase()))
      .filter((u) => {
        if (!q) return true;
        const haystack =
          `${u?.firstName ?? ""} ${u?.lastName ?? ""} ${u?.email ?? ""} ${u?.department ?? ""}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [staff, search, recipients]);

  function addEmail(raw: string) {
    const email = raw.trim().replace(/[,;]+$/, "");
    if (!email) return;

    if (!EMAIL_PATTERN.test(email)) {
      toast.error(`"${email}" is not a valid email address.`);
      return;
    }
    if (recipients.some((r) => r.toLowerCase() === email.toLowerCase())) {
      setSearch("");
      return;
    }
    if (recipients.length >= MAX_RECIPIENTS) {
      toast.error(`You can add up to ${MAX_RECIPIENTS} test recipients.`);
      return;
    }

    onRecipientsChange([...recipients, email]);
    setSearch("");
  }

  function removeEmail(email: string) {
    onRecipientsChange(recipients.filter((r) => r !== email));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      // Enter with a single visible match picks that person; otherwise treat
      // whatever was typed as a literal address.
      if (!EMAIL_PATTERN.test(search.trim()) && suggestions.length === 1) {
        addEmail(suggestions[0].email);
        return;
      }
      addEmail(search);
      return;
    }
    if (e.key === "Backspace" && search === "" && recipients.length > 0) {
      removeEmail(recipients[recipients.length - 1]);
    }
  }

  function handleSendTest() {
    if (recipients.length === 0) {
      toast.error("Add at least one test recipient.");
      return;
    }
    sendTest.mutate(
      { recipients, subject, templateLabel },
      {
        onSuccess: () =>
          toast.success(
            `Test email sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`,
          ),
        onError: (err) =>
          toast.error(err?.message || "Failed to send test email."),
      },
    );
  }

  const showSuggestions = focused || search.trim() !== "";

  return (
    <div className="border border-border/60 rounded-lg bg-muted/20 p-4 space-y-3">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Send a test first{" "}
          <span className="text-[12px] normal-case font-normal">
            (optional)
          </span>
        </p>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Email this exact template to colleagues for review before it goes out
          to shareholders. Test sends do not touch shareholder records.
        </p>
      </div>

      {recipients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipients.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-2.5 py-1 text-[13px]"
            >
              {email}
              <button
                type="button"
                onClick={() => removeEmail(email)}
                disabled={disabled || sendTest.isPending}
                aria-label={`Remove ${email}`}
                className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled || sendTest.isPending}
          placeholder={
            staffError
              ? "Type an email address and press Enter…"
              : "Search staff by name, email or department — or type any address"
          }
          className="h-9 text-[13px] pl-8"
        />

        {showSuggestions && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-md overflow-hidden">
            {staffLoading ? (
              <div className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading staff…
              </div>
            ) : staffError ? (
              <div className="px-3 py-2.5 text-[13px] text-muted-foreground">
                Staff directory unavailable — type an address and press Enter.
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-3 py-2.5 text-[13px] text-muted-foreground">
                {EMAIL_PATTERN.test(search.trim())
                  ? "Press Enter to add this address."
                  : "No matching staff."}
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto divide-y">
                {suggestions.map((u) => (
                  <button
                    key={u.id ?? u.email}
                    type="button"
                    // Keeps the input from blurring before the click lands.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addEmail(u.email)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-[13px] font-medium">
                      {staffName(u)}
                    </div>
                    <div className="text-[12px] text-muted-foreground">
                      {u.email}
                      {u?.department ? ` · ${u.department}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-muted-foreground">
          {recipients.length > 0
            ? `${recipients.length} of ${MAX_RECIPIENTS} test recipients`
            : "No test recipients added"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSendTest}
          disabled={disabled || sendTest.isPending || recipients.length === 0}
          className="gap-2 text-[13px]"
        >
          {sendTest.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending test…
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" /> Send Test Email
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

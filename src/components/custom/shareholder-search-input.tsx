"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X, Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Shareholder } from "@/types/enquiry";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getShareholders } from "@/actions/enquiryActions";

interface Props {
  /** If provided, suggestions are restricted to this register symbol */
  registerSymbol?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Called when the user selects a suggestion */
  onSelect: (shareholder: Shareholder) => void;
  /** Optionally sync the raw text value for table-level filtering */
  onQueryChange?: (q: string) => void;
  value?: string;
}

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-green-500",
  DORMANT: "bg-gray-400",
  CAUTIONED: "bg-amber-500",
  SUSPENDED: "bg-red-500",
};

export function ShareholderSearchInput({
  registerSymbol,
  placeholder = "Search by surname, account no or CHN…",
  className,
  inputClassName,
  onSelect,
  onQueryChange,
  value,
}: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value !== undefined) setQuery(value);
  }, [value]);

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const { data: suggestionsData, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["shareholderSuggestions", debouncedQuery, registerSymbol],
    queryFn: () =>
      getShareholders({
        q: debouncedQuery,
        registerSymbol: registerSymbol || undefined,
        size: 10,
      }),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 5000,
  });

  const suggestions = suggestionsData?.content || [];
  const isDebouncing = query !== debouncedQuery;
  const showLoading = isLoadingSuggestions || isDebouncing;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIdx(-1);
  }, [suggestions]);

  // Reposition portal dropdown whenever it opens or window resizes/scrolls
  useEffect(() => {
    function updatePos() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    if (open) {
      updatePos();
      window.addEventListener("scroll", updatePos, true);
      window.addEventListener("resize", updatePos);
    }
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setQuery(v);
      setOpen(true);
      onQueryChange?.(v);
    },
    [onQueryChange],
  );

  const handleSelect = useCallback(
    (s: Shareholder) => {
      onSelect(s);
      setQuery("");
      setOpen(false);
      onQueryChange?.("");
    },
    [onSelect, onQueryChange],
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setOpen(false);
    onQueryChange?.("");
    inputRef.current?.focus();
  }, [onQueryChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || suggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeIdx >= 0) {
        e.preventDefault();
        handleSelect(suggestions[activeIdx]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [open, suggestions, activeIdx, handleSelect],
  );

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          className={cn("pl-8 mrpsl-input", query && "pr-8", inputClassName)}
          placeholder={placeholder}
          style={{ paddingLeft: "2.25rem" }}
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {query && (
          <button
            tabIndex={-1}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              handleClear();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showDropdown &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={dropdownStyle}
            className="rounded-xl border border-border bg-popover shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
          >
            {showLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Searching...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <ul className="max-h-72 overflow-y-auto py-1">
                {suggestions.map((s, idx) => {
                  const isActive = idx === activeIdx;
                  return (
                    <li key={s.id}>
                      <button
                        className={cn(
                          "w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors",
                          isActive ? "bg-accent" : "hover:bg-accent/60",
                        )}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(s);
                        }}
                      >
                        <div className="relative h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <div className="text-[11px] font-bold text-primary select-none">
                            {s.firstName?.[0] || ""}
                            {s.lastName?.[0] || ""}
                          </div>
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 h-2 w-2 rounded-full ring-1 ring-popover",
                              STATUS_DOT[s.status],
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {s.lastName}, {s.firstName}
                            {s.otherNames ? ` ${s.otherNames}` : ""}
                          </div>
                          <div className="text-[12px] text-muted-foreground font-mono truncate">
                            {s.accountNumber}
                            <span className="mx-1.5 opacity-40">·</span>
                            {s.chn}
                          </div>
                        </div>
                        {s.registerSymbol && (
                          <span className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {s.registerSymbol}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-5 text-center text-sm">
                <p className="font-medium text-foreground">No match found</p>
                <p className="text-muted-foreground mt-0.5 text-[12px]">
                  Try surname, full account no, or CHN
                </p>
              </div>
            )}
            {!showLoading && suggestions.length === 10 && (
              <div className="border-t px-3 py-1.5 text-[11px] text-muted-foreground text-center">
                Showing top 10 — refine your search for more specific results
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

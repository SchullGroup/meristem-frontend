"use client";

import { useRef, useState } from "react";
import { Plus, X, Search, SlidersHorizontal, Eraser } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ShareholderSearchCriteria,
  ShareholderSearchField,
  ShareholderSearchOperator,
  ShareholderSearchRule,
} from "@/types/enquiry";

// Field catalogue — drives the "smart" defaults (default operator + numeric input) per field.
type FieldType = "text" | "id";
const FIELDS: {
  value: ShareholderSearchField;
  label: string;
  type: FieldType;
  numeric?: boolean;
}[] = [
  { value: "name", label: "Name", type: "text" },
  { value: "bvn", label: "BVN", type: "id", numeric: true },
  { value: "nin", label: "NIN", type: "id", numeric: true },
  { value: "address", label: "Address", type: "text" },
  { value: "chn", label: "CHN", type: "id" },
  { value: "accountNo", label: "Registrar Account No", type: "id" },
  { value: "cscsAccountNo", label: "CSCS Account No", type: "id", numeric: true },
  { value: "state", label: "State", type: "text" },
  { value: "phone", label: "Phone", type: "id", numeric: true },
  { value: "email", label: "Email", type: "text" },
];

const OP_LABEL: Record<ShareholderSearchOperator, string> = {
  contains: "contains",
  equals: "equals",
  startsWith: "starts with",
};

// Text fields default to a fuzzy "contains"; identifiers default to exact "equals".
const OPERATORS_BY_TYPE: Record<FieldType, ShareholderSearchOperator[]> = {
  text: ["contains", "equals", "startsWith"],
  id: ["equals", "startsWith", "contains"],
};

function fieldMeta(field: ShareholderSearchField) {
  return FIELDS.find((f) => f.value === field) ?? FIELDS[0];
}
function defaultOperator(field: ShareholderSearchField): ShareholderSearchOperator {
  return OPERATORS_BY_TYPE[fieldMeta(field).type][0];
}

interface DraftRule extends ShareholderSearchRule {
  key: number;
}

export interface QueryBuilderScope {
  registerSymbol: string;
  status: string;
}

const STATUSES = ["ACTIVE", "DORMANT", "CAUTIONED", "SUSPENDED"] as const;
const REG_ANY = "__ANY__";
const STATUS_ANY = "__ANY__";

export function ShareholderQueryBuilder({
  registers,
  onSearch,
  onClear,
  loading = false,
}: {
  registers: { symbol: string; registerName: string }[];
  onSearch: (criteria: Omit<ShareholderSearchCriteria, "page" | "size" | "sort">) => void;
  onClear: () => void;
  loading?: boolean;
}) {
  // Monotonic key source for stable row keys. Only ever mutated inside event handlers
  // (never during render), and the initial rule uses a literal key so the ref stays untouched.
  const keyRef = useRef(0);
  const makeRule = (): DraftRule => {
    keyRef.current += 1;
    return { key: keyRef.current, field: "name", operator: "contains", value: "" };
  };
  const firstRule = (): DraftRule => ({
    key: 0,
    field: "name",
    operator: "contains",
    value: "",
  });

  const [combinator, setCombinator] = useState<"AND" | "OR">("AND");
  const [rules, setRules] = useState<DraftRule[]>(() => [firstRule()]);
  const [registerSymbol, setRegisterSymbol] = useState("");
  const [status, setStatus] = useState("");

  function updateRule(key: number, patch: Partial<DraftRule>) {
    setRules((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        // Smart: when the field changes, snap the operator to that field's default.
        if (patch.field && patch.field !== r.field) {
          next.operator = defaultOperator(patch.field);
        }
        return next;
      }),
    );
  }

  function addRule() {
    setRules((prev) => [...prev, makeRule()]);
  }

  function removeRule(key: number) {
    setRules((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.key !== key)));
  }

  const activeRules = rules.filter((r) => r.value.trim() !== "");
  const canSearch = activeRules.length > 0 || registerSymbol !== "" || status !== "";

  function handleSearch() {
    if (!canSearch) return;
    onSearch({
      combinator,
      rules: activeRules.map(({ field, operator, value }) => ({
        field,
        operator,
        value: value.trim(),
      })),
      registerSymbol: registerSymbol || undefined,
      status: status || undefined,
    });
  }

  function handleClear() {
    keyRef.current = 0;
    setRules([firstRule()]);
    setCombinator("AND");
    setRegisterSymbol("");
    setStatus("");
    onClear();
  }

  return (
    <Card className="mrpsl-card p-4 space-y-3">
      {/* Header + combinator */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Advanced Search
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-muted-foreground">Match</span>
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setCombinator("AND")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                combinator === "AND"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ALL (AND)
            </button>
            <button
              type="button"
              onClick={() => setCombinator("OR")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                combinator === "OR"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ANY (OR)
            </button>
          </div>
        </div>
      </div>

      {/* Condition rows */}
      <div className="space-y-2">
        {rules.map((rule, idx) => {
          const meta = fieldMeta(rule.field);
          const ops = OPERATORS_BY_TYPE[meta.type];
          return (
            <div key={rule.key} className="flex items-center gap-2 flex-wrap">
              <span className="w-10 shrink-0 text-[12px] font-semibold uppercase text-muted-foreground">
                {idx === 0 ? "Where" : combinator}
              </span>

              <Select
                value={rule.field}
                onValueChange={(v) => updateRule(rule.key, { field: v as ShareholderSearchField })}
              >
                <SelectTrigger className="w-48 mrpsl-input h-9 text-[13px]">
                  <SelectValue>
                    {(v) => FIELDS.find((f) => f.value === v)?.label ?? String(v ?? "")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={rule.operator}
                onValueChange={(v) => updateRule(rule.key, { operator: v as ShareholderSearchOperator })}
              >
                <SelectTrigger className="w-32 mrpsl-input h-9 text-[13px]">
                  <SelectValue>
                    {(v) => (v ? OP_LABEL[v as ShareholderSearchOperator] ?? String(v) : "")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ops.map((op) => (
                    <SelectItem key={op} value={op}>
                      {OP_LABEL[op]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={rule.value}
                inputMode={meta.numeric ? "numeric" : undefined}
                onChange={(e) => updateRule(rule.key, { value: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={`Enter ${meta.label.toLowerCase()}…`}
                className="flex-1 min-w-40 h-9 text-[13px]"
              />

              <button
                type="button"
                onClick={() => removeRule(rule.key)}
                disabled={rules.length === 1}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Remove condition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addRule}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
      >
        <Plus className="h-4 w-4" /> Add condition
      </button>

      {/* Scope + actions */}
      <div className="flex items-end gap-2.5 flex-wrap pt-3 border-t border-border/50">
        <div className="flex flex-col gap-1">
          <label className="mrpsl-label">Register</label>
          <Select
            value={registerSymbol || REG_ANY}
            onValueChange={(v) => setRegisterSymbol(!v || v === REG_ANY ? "" : v)}
          >
            <SelectTrigger className="w-52 mrpsl-input h-9 text-[13px]">
              <SelectValue>
                {(v) => (v && v !== REG_ANY ? String(v) : "All Registers")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={REG_ANY}>All Registers</SelectItem>
              {registers.map((r) => (
                <SelectItem key={r.symbol} value={r.symbol}>
                  <span className="font-semibold">{r.symbol}</span> — {r.registerName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="mrpsl-label">Status</label>
          <Select
            value={status || STATUS_ANY}
            onValueChange={(v) => setStatus(!v || v === STATUS_ANY ? "" : v)}
          >
            <SelectTrigger className="w-40 mrpsl-input h-9 text-[13px]">
              <SelectValue>
                {(v) =>
                  v && v !== STATUS_ANY
                    ? String(v).charAt(0) + String(v).slice(1).toLowerCase()
                    : "All Statuses"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_ANY}>All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 h-9" onClick={handleClear}>
            <Eraser className="h-4 w-4" /> Clear
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-9"
            onClick={handleSearch}
            disabled={!canSearch || loading}
          >
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
      </div>
    </Card>
  );
}

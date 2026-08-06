"use client";

import { useRef, useState } from "react";
import { Plus, X, Search, SlidersHorizontal, Eraser, ShieldAlert } from "lucide-react";
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
  CertificateSearchCriteria,
  CertificateSearchField,
  CertificateSearchOperator,
  CertificateSearchRule,
} from "@/types/enquiry";

// Only index-friendly fields/operators are offered — the certificates table is ~56M rows with no
// substring indexes, so there is deliberately no "contains" operator anywhere here.
type FieldType = "text" | "units";
const FIELDS: { value: CertificateSearchField; label: string; type: FieldType; numeric?: boolean }[] = [
  { value: "certNumber", label: "Certificate No", type: "text" },
  { value: "accountNumber", label: "Account No", type: "text" },
  { value: "transferNumber", label: "Transfer No", type: "text" },
  { value: "units", label: "Units", type: "units", numeric: true },
];

const OPS_BY_TYPE: Record<FieldType, { value: CertificateSearchOperator; label: string }[]> = {
  text: [
    { value: "equals", label: "equals" },
    { value: "startsWith", label: "starts with" },
  ],
  units: [
    { value: "equals", label: "= (exactly)" },
    { value: "gte", label: "≥ (at least)" },
    { value: "lte", label: "≤ (at most)" },
  ],
};

// An exact "equals" on one of these fields anchors an un-scoped search (mirrors the backend guard).
const ANCHOR_FIELDS = new Set<CertificateSearchField>([
  "certNumber",
  "accountNumber",
  "transferNumber",
]);

const REG_ANY = "__ANY__";

function fieldMeta(field: CertificateSearchField) {
  return FIELDS.find((f) => f.value === field) ?? FIELDS[0];
}
function defaultOperator(field: CertificateSearchField): CertificateSearchOperator {
  return OPS_BY_TYPE[fieldMeta(field).type][0].value;
}

interface DraftRule extends CertificateSearchRule {
  key: number;
}

export function CertificateQueryBuilder({
  registers,
  onSearch,
  onClear,
  loading = false,
  initial,
}: {
  registers: { symbol: string; registerName: string }[];
  onSearch: (criteria: Omit<CertificateSearchCriteria, "page" | "size" | "sort">) => void;
  onClear: () => void;
  loading?: boolean;
  /** Optional seed for the rule set + register scope (e.g. deep-linked from another page). */
  initial?: { registerSymbol?: string; rules?: CertificateSearchRule[] };
}) {
  const seeded: DraftRule[] = (initial?.rules ?? []).map((r, i) => ({ key: i, ...r }));
  const keyRef = useRef(seeded.length > 0 ? seeded.length - 1 : 0);
  const makeRule = (): DraftRule => {
    keyRef.current += 1;
    return { key: keyRef.current, field: "certNumber", operator: "equals", value: "" };
  };
  const firstRule = (): DraftRule => ({ key: 0, field: "certNumber", operator: "equals", value: "" });

  const [combinator, setCombinator] = useState<"AND" | "OR">("AND");
  const [rules, setRules] = useState<DraftRule[]>(() => (seeded.length > 0 ? seeded : [firstRule()]));
  const [registerSymbol, setRegisterSymbol] = useState(initial?.registerSymbol ?? "");

  function updateRule(key: number, patch: Partial<DraftRule>) {
    setRules((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        // When the field changes, snap the operator to that field type's default.
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

  // Anchor guard (mirrors EnquiryCertificateService.isAnchored): a search must touch a bounded
  // slice — either a register scope, or (AND mode only) an exact-equals on an identifier field.
  const hasExactId =
    combinator === "AND" &&
    activeRules.some((r) => ANCHOR_FIELDS.has(r.field) && r.operator === "equals");
  const anchored = registerSymbol !== "" || hasExactId;
  const canSearch = anchored;

  function handleSearch() {
    if (!canSearch) return;
    onSearch({
      combinator,
      rules: activeRules.map(({ field, operator, value }) => ({ field, operator, value: value.trim() })),
      registerSymbol: registerSymbol || undefined,
    });
  }
  function handleClear() {
    keyRef.current = 0;
    setRules([firstRule()]);
    setCombinator("AND");
    setRegisterSymbol("");
    onClear();
  }

  return (
    <Card className="mrpsl-card p-4 space-y-3">
      {/* Header + combinator */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Certificate Search
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
          const ops = OPS_BY_TYPE[meta.type];
          return (
            <div key={rule.key} className="flex items-center gap-2 flex-wrap">
              <span className="w-10 shrink-0 text-[12px] font-semibold uppercase text-muted-foreground">
                {idx === 0 ? "Where" : combinator}
              </span>

              <Select
                value={rule.field}
                onValueChange={(v) => v && updateRule(rule.key, { field: v as CertificateSearchField })}
              >
                <SelectTrigger className="w-44 mrpsl-input h-9 text-[13px]">
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
                onValueChange={(v) => v && updateRule(rule.key, { operator: v as CertificateSearchOperator })}
              >
                <SelectTrigger className="w-36 mrpsl-input h-9 text-[13px]">
                  <SelectValue>
                    {(v) => ops.find((o) => o.value === v)?.label ?? String(v ?? "")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ops.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
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
            <SelectTrigger className="w-56 mrpsl-input h-9 text-[13px]">
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

      {/* Anchor-guard hint — explains why Search is disabled and how to make the query safe */}
      {!anchored && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Pick a <span className="font-semibold">Register</span>, or add an{" "}
            <span className="font-semibold">equals</span> condition on a certificate, account or
            transfer number, before searching. This keeps the search from scanning the entire
            certificate store. (ANY/OR searches must be scoped to a register.)
          </span>
        </div>
      )}
    </Card>
  );
}

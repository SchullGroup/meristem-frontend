"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Coins, Map, AlertTriangle, Files, Plus, Pencil, Trash2, TriangleAlert, ChevronsUpDown, Check, HardDrive, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { FILE_TYPE_OPTIONS, FILE_TYPE_COLORS, MAX_SIZE_OPTIONS, INIT_DOC_TYPES } from "@/lib/mocks/doc-types";
import { NIGERIA_STATES, getLGAs } from "@/lib/mocks/nigeria-geo";
import { useStore } from "@/lib/store";
import { AgentType } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────
type Currency   = { name: string; code: string; symbol: string };
type Caution    = { c: string; r: string; s: string; active: boolean };
type DocType    = { c: string; n: string; r: string[]; fileTypes: string[]; maxSizeMB: number; active: boolean };

// ── World currencies (popular, EUR-first) ────────────────────────
const WORLD_CURRENCIES: Currency[] = [
  { name: "Euro",                      code: "EUR", symbol: "€"    },
  { name: "US Dollar",                 code: "USD", symbol: "$"    },
  { name: "British Pound",             code: "GBP", symbol: "£"    },
  { name: "Nigerian Naira",            code: "NGN", symbol: "₦"   },
  { name: "Japanese Yen",              code: "JPY", symbol: "¥"    },
  { name: "Swiss Franc",               code: "CHF", symbol: "Fr"   },
  { name: "Canadian Dollar",           code: "CAD", symbol: "CA$"  },
  { name: "Australian Dollar",         code: "AUD", symbol: "A$"   },
  { name: "Chinese Yuan",              code: "CNY", symbol: "¥"    },
  { name: "Indian Rupee",              code: "INR", symbol: "₹"   },
  { name: "South Korean Won",          code: "KRW", symbol: "₩"   },
  { name: "Swedish Krona",             code: "SEK", symbol: "kr"   },
  { name: "Norwegian Krone",           code: "NOK", symbol: "kr"   },
  { name: "Danish Krone",              code: "DKK", symbol: "kr"   },
  { name: "New Zealand Dollar",        code: "NZD", symbol: "NZ$"  },
  { name: "Singapore Dollar",          code: "SGD", symbol: "S$"   },
  { name: "Hong Kong Dollar",          code: "HKD", symbol: "HK$"  },
  { name: "Mexican Peso",              code: "MXN", symbol: "MX$"  },
  { name: "Brazilian Real",            code: "BRL", symbol: "R$"   },
  { name: "South African Rand",        code: "ZAR", symbol: "R"    },
  { name: "UAE Dirham",                code: "AED", symbol: "د.إ"  },
  { name: "Saudi Riyal",               code: "SAR", symbol: "﷼"   },
  { name: "Turkish Lira",              code: "TRY", symbol: "₺"   },
  { name: "Thai Baht",                 code: "THB", symbol: "฿"    },
  { name: "Indonesian Rupiah",         code: "IDR", symbol: "Rp"   },
  { name: "Malaysian Ringgit",         code: "MYR", symbol: "RM"   },
  { name: "Philippine Peso",           code: "PHP", symbol: "₱"   },
  { name: "Pakistani Rupee",           code: "PKR", symbol: "₨"   },
  { name: "Egyptian Pound",            code: "EGP", symbol: "E£"   },
  { name: "Russian Ruble",             code: "RUB", symbol: "₽"   },
  { name: "Polish Złoty",              code: "PLN", symbol: "zł"   },
  { name: "Czech Koruna",              code: "CZK", symbol: "Kč"   },
  { name: "Hungarian Forint",          code: "HUF", symbol: "Ft"   },
  { name: "Ghanaian Cedi",             code: "GHS", symbol: "₵"   },
  { name: "Kenyan Shilling",           code: "KES", symbol: "KSh"  },
  { name: "Tanzanian Shilling",        code: "TZS", symbol: "TSh"  },
  { name: "Ugandan Shilling",          code: "UGX", symbol: "USh"  },
  { name: "Moroccan Dirham",           code: "MAD", symbol: "MAD"  },
  { name: "West African CFA Franc",    code: "XOF", symbol: "CFA"  },
  { name: "Central African CFA Franc", code: "XAF", symbol: "FCFA" },
  { name: "Qatari Riyal",              code: "QAR", symbol: "QR"   },
  { name: "Kuwaiti Dinar",             code: "KWD", symbol: "KD"   },
  { name: "Bahraini Dinar",            code: "BHD", symbol: "BD"   },
];

// ── Seed data ────────────────────────────────────────────────────
const INIT_CURRENCIES: Currency[] = [
  { name: "Nigerian Naira", code: "NGN", symbol: "₦" },
  { name: "US Dollar",      code: "USD", symbol: "$" },
  { name: "British Pound",  code: "GBP", symbol: "£" },
];


const INIT_CAUTIONS: Caution[] = [
  { c: "CAUT-1", r: "Legal Hold",       s: "High",   active: true  },
  { c: "CAUT-2", r: "Court Order",      s: "High",   active: true  },
  { c: "CAUT-3", r: "Suspected Fraud",  s: "High",   active: true  },
  { c: "CAUT-4", r: "Regulatory Flag",  s: "Medium", active: true  },
  { c: "CAUT-5", r: "Deceased Account", s: "Low",    active: false },
];

const INIT_DOCS: DocType[] = INIT_DOC_TYPES.map(d => ({
  c: d.code, n: d.name, r: d.requiredFor, fileTypes: d.fileTypes, maxSizeMB: d.maxSizeMB, active: d.active,
}));

const REQUIRED_FOR_OPTIONS = ["KYC", "Demat", "Admon", "Caution", "Transfer", "Rights Issue", "IPO"];
const SEVERITY_OPTIONS = ["High", "Medium", "Low"];

const severityColor: Record<string, string> = {
  High:   "border-red-200   bg-red-50   text-red-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low:    "border-blue-200  bg-blue-50  text-blue-700",
};

// ── Helpers ──────────────────────────────────────────────────────
const nextCode = (prefix: string, items: { c: string }[]) => {
  const nums = items.map(i => parseInt(i.c.split("-")[1])).filter(Boolean);
  return `${prefix}-${Math.max(0, ...nums) + 1}`;
};

const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block";

// ── Searchable combobox ──────────────────────────────────────────
function CurrencyCombobox({
  value,
  onChange,
  exclude,
}: {
  value: Currency | null;
  onChange: (c: Currency) => void;
  exclude: string[];
}) {
  const [open, setOpen] = useState(false);
  const available = WORLD_CURRENCIES.filter(c => !exclude.includes(c.code) || c.code === value?.code);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between mrpsl-input h-11 font-normal"
        >
          {value ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold">{value.code}</span>
              {value.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Select currency…</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Type to search currencies…" className="h-9" />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {available.map(c => (
                <CommandItem
                  key={c.code}
                  value={`${c.code} ${c.name}`}
                  onSelect={() => { onChange(c); setOpen(false); }}
                  className="flex items-center gap-3"
                >
                  <Check className={cn("h-4 w-4 shrink-0", value?.code === c.code ? "opacity-100 text-primary" : "opacity-0")} />
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold w-12 text-center shrink-0">{c.code}</span>
                  <span className="flex-1 text-sm">{c.name}</span>
                  <span className="text-sm font-medium text-muted-foreground w-8 text-right shrink-0">{c.symbol}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Searchable select (generic) ───────────────────────────────────
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between mrpsl-input h-11 font-normal"
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Type to filter…" className="h-9" />
          <CommandList>
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {options.map(opt => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => { onChange(opt); setOpen(false); }}
                  className="flex items-center gap-2"
                >
                  <Check className={cn("h-4 w-4 shrink-0", value === opt ? "opacity-100 text-primary" : "opacity-0")} />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function ParametersPage() {
  const [activeTab, setActiveTab] = useState("currency");
  const [selectedState, setSelectedState] = useState(NIGERIA_STATES[0].name);
  const currentLGAs = getLGAs(selectedState);

  const { agentTypes, addAgentType, updateAgentType, removeAgentType } = useStore();

  const [currencies, setCurrencies] = useState<Currency[]>(INIT_CURRENCIES);
  const [cautions,   setCautions]   = useState<Caution[]>(INIT_CAUTIONS);
  const [docs,       setDocs]       = useState<DocType[]>(INIT_DOCS);

  // ── Currency dialog ──────────────────────────────────────────
  const [currOpen,   setCurrOpen]   = useState(false);
  const [currMode,   setCurrMode]   = useState<"add" | "edit">("add");
  const [editCurr,   setEditCurr]   = useState<Currency | null>(null);
  const [pickedCurr, setPickedCurr] = useState<Currency | null>(null);
  const [currNote,   setCurrNote]   = useState("");

  const openAddCurrency = () => {
    setCurrMode("add"); setEditCurr(null); setPickedCurr(null); setCurrNote("");
    setCurrOpen(true);
  };
  const openEditCurrency = (c: Currency) => {
    setCurrMode("edit"); setEditCurr(c);
    setPickedCurr(WORLD_CURRENCIES.find(w => w.code === c.code) ?? c);
    setCurrNote("");
    setCurrOpen(true);
  };
  const saveCurrency = () => {
    if (!pickedCurr) return;
    if (currMode === "add") {
      setCurrencies(p => [...p, pickedCurr]);
      toast.success("Currency added.");
    } else {
      setCurrencies(p => p.map(c => c.code === editCurr?.code ? pickedCurr : c));
      toast.success("Currency updated.");
    }
    setCurrOpen(false);
  };
  const deleteCurrency = (code: string) => {
    setCurrencies(p => p.filter(c => c.code !== code));
    toast.success("Currency removed.");
  };

  // ── Caution dialog ───────────────────────────────────────────
  const [cautOpen, setCautOpen] = useState(false);
  const [cautMode, setCautMode] = useState<"add" | "edit">("add");
  const [editCaut, setEditCaut] = useState<Caution | null>(null);
  const [cautR,    setCautR]    = useState("");
  const [cautS,    setCautS]    = useState("Medium");
  const [cautNote, setCautNote] = useState("");

  const openAddCaution = () => {
    setCautMode("add"); setEditCaut(null); setCautR(""); setCautS("Medium"); setCautNote("");
    setCautOpen(true);
  };
  const openEditCaution = (x: Caution) => {
    setCautMode("edit"); setEditCaut(x); setCautR(x.r); setCautS(x.s); setCautNote("");
    setCautOpen(true);
  };
  const saveCaution = () => {
    if (!cautR.trim()) return;
    if (cautMode === "add") {
      setCautions(p => [...p, { c: nextCode("CAUT", p), r: cautR.trim(), s: cautS, active: true }]);
      toast.success("Caution reason added.");
    } else {
      setCautions(p => p.map(x => x.c === editCaut?.c ? { ...x, r: cautR.trim(), s: cautS } : x));
      toast.success("Caution reason updated.");
    }
    setCautOpen(false);
  };
  const deleteCaution = (code: string) => {
    setCautions(p => p.filter(x => x.c !== code));
    toast.success("Caution reason removed.");
  };

  // ── Document dialog ──────────────────────────────────────────
  const [docOpen,      setDocOpen]      = useState(false);
  const [docMode,      setDocMode]      = useState<"add" | "edit">("add");
  const [editDoc,      setEditDoc]      = useState<DocType | null>(null);
  const [docName,      setDocName]      = useState("");
  const [docReqFor,    setDocReqFor]    = useState<string[]>([]);
  const [docFileTypes, setDocFileTypes] = useState<string[]>(["PDF"]);
  const [docMaxSize,   setDocMaxSize]   = useState<number>(5);
  const [docNote,      setDocNote]      = useState("");

  const toggleReqFor    = (v: string) => setDocReqFor(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const toggleFileType  = (v: string) => setDocFileTypes(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const openAddDoc = () => {
    setDocMode("add"); setEditDoc(null); setDocName(""); setDocReqFor([]);
    setDocFileTypes(["PDF"]); setDocMaxSize(5); setDocNote("");
    setDocOpen(true);
  };
  const openEditDoc = (x: DocType) => {
    setDocMode("edit"); setEditDoc(x); setDocName(x.n); setDocReqFor([...x.r]);
    setDocFileTypes([...x.fileTypes]); setDocMaxSize(x.maxSizeMB); setDocNote("");
    setDocOpen(true);
  };
  const saveDoc = () => {
    if (!docName.trim() || docReqFor.length === 0 || docFileTypes.length === 0) return;
    if (docMode === "add") {
      setDocs(p => [...p, { c: nextCode("DOC", p), n: docName.trim(), r: docReqFor, fileTypes: docFileTypes, maxSizeMB: docMaxSize, active: true }]);
      toast.success("Document type added.");
    } else {
      setDocs(p => p.map(x => x.c === editDoc?.c ? { ...x, n: docName.trim(), r: docReqFor, fileTypes: docFileTypes, maxSizeMB: docMaxSize } : x));
      toast.success("Document type updated.");
    }
    setDocOpen(false);
  };
  const deleteDoc = (code: string) => {
    setDocs(p => p.filter(x => x.c !== code));
    toast.success("Document type removed.");
  };

  // ── Agent type dialog ────────────────────────────────────────
  const [atOpen,   setAtOpen]   = useState(false);
  const [atMode,   setAtMode]   = useState<"add" | "edit">("add");
  const [editAt,   setEditAt]   = useState<AgentType | null>(null);
  const [atLabel,  setAtLabel]  = useState("");
  const [atNote,   setAtNote]   = useState("");

  const toCode = (label: string) =>
    label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  const openAddAt = () => {
    setAtMode("add"); setEditAt(null); setAtLabel(""); setAtNote("");
    setAtOpen(true);
  };
  const openEditAt = (t: AgentType) => {
    setAtMode("edit"); setEditAt(t); setAtLabel(t.label); setAtNote("");
    setAtOpen(true);
  };
  const saveAt = () => {
    if (!atLabel.trim()) return;
    if (atMode === "add") {
      const newId = `AT-${Date.now()}`;
      addAgentType({ id: newId, code: toCode(atLabel), label: atLabel.trim(), builtIn: false, active: true });
      toast.success("Agent type added.");
    } else if (editAt) {
      updateAgentType(editAt.id, { label: atLabel.trim(), code: toCode(atLabel) });
      toast.success("Agent type updated.");
    }
    setAtOpen(false);
  };

  // ── Delete confirmation ──────────────────────────────────────
  const [delOpen,   setDelOpen]   = useState(false);
  const [delTarget, setDelTarget] = useState<{ label: string; onConfirm: () => void } | null>(null);
  const confirmDelete = (label: string, onConfirm: () => void) => {
    setDelTarget({ label, onConfirm });
    setDelOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Other Parameters</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system-wide lookup values and document definitions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v || "")} className="w-full !flex !flex-col">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="currency" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">
            <Coins className="h-3.5 w-3.5 mr-1.5" /> Currencies
          </TabsTrigger>
          <TabsTrigger value="states" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">
            <Map className="h-3.5 w-3.5 mr-1.5" /> States &amp; LGAs
          </TabsTrigger>
          <TabsTrigger value="caution" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Caution Reasons
          </TabsTrigger>
          <TabsTrigger value="docs" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">
            <Files className="h-3.5 w-3.5 mr-1.5" /> Document Types
          </TabsTrigger>
          <TabsTrigger value="agenttypes" className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all">
            <Users className="h-3.5 w-3.5 mr-1.5" /> Agent Types
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">

          {/* ── Currencies ───────────────────────────────────── */}
          <TabsContent value="currency">
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Currencies</h3>
                <Button size="sm" variant="outline" onClick={openAddCurrency}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Currency
                </Button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Symbol</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currencies.map(cur => (
                    <tr key={cur.code} className="mrpsl-table-row">
                      <td className="px-5 py-3 font-medium">{cur.name}</td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-bold">{cur.code}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="h-8 w-10 rounded-lg border border-border/60 flex items-center justify-center font-bold text-sm bg-muted/30">
                          {cur.symbol}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={() => openEditCurrency(cur)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => confirmDelete(cur.name, () => deleteCurrency(cur.code))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* ── States & LGAs ────────────────────────────────── */}
          <TabsContent value="states">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card className="mrpsl-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border/60">
                  <h3 className="font-semibold text-sm">States <span className="text-muted-foreground font-normal">({NIGERIA_STATES.length})</span></h3>
                </div>
                <div className="overflow-y-auto max-h-[520px] no-scrollbar">
                  {NIGERIA_STATES.map((s, i) => (
                    <button
                      key={s.name}
                      onClick={() => setSelectedState(s.name)}
                      className={cn(
                        "w-full text-left px-5 py-2.5 text-sm transition-all border-l-2 flex items-center justify-between",
                        selectedState === s.name
                          ? "bg-primary/5 text-primary border-primary font-semibold"
                          : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                        i < 3 && "font-medium"
                      )}
                    >
                      <span>{s.name}</span>
                      <span className={cn("text-[10px] tabular-nums", selectedState === s.name ? "text-primary/60" : "text-muted-foreground/50")}>
                        {s.lgas.length}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="mrpsl-card overflow-hidden md:col-span-2">
                <div className="px-5 py-4 border-b border-border/60">
                  <h3 className="font-semibold text-sm">
                    LGAs — {selectedState}
                    <span className="text-muted-foreground font-normal ml-2">({currentLGAs.length} local government areas)</span>
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2 overflow-y-auto max-h-[520px] no-scrollbar">
                  {currentLGAs.map(lga => (
                    <div
                      key={lga}
                      className="px-3 py-2 border border-border/50 rounded-lg text-xs font-medium text-muted-foreground bg-muted/20 text-center"
                    >
                      {lga}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ── Caution Reasons ──────────────────────────────── */}
          <TabsContent value="caution">
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Caution Reasons</h3>
                <Button size="sm" variant="outline" onClick={openAddCaution}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Reason
                </Button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Severity</th>
                    <th className="px-5 py-3 text-center">Active</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {cautions.map(x => (
                    <tr key={x.c} className="mrpsl-table-row">
                      <td className="px-5 py-3 tabular-nums text-xs text-muted-foreground">{x.c}</td>
                      <td className="px-5 py-3 font-semibold">{x.r}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={cn("font-semibold uppercase tracking-wide text-xs px-2.5 py-0.5", severityColor[x.s])}>
                          {x.s}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Switch
                          checked={x.active}
                          onCheckedChange={v => setCautions(p => p.map(c => c.c === x.c ? { ...c, active: v } : c))}
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={() => openEditCaution(x)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => confirmDelete(x.r, () => deleteCaution(x.c))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* ── Document Types ────────────────────────────────── */}
          <TabsContent value="docs">
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Document Types</h3>
                <Button size="sm" variant="outline" onClick={openAddDoc}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Document
                </Button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Document Name</th>
                    <th className="px-5 py-3">Required For</th>
                    <th className="px-5 py-3">Accepted File Types</th>
                    <th className="px-5 py-3 text-right">Max Size</th>
                    <th className="px-5 py-3 text-center">Active</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {docs.map(x => (
                    <tr key={x.c} className="mrpsl-table-row">
                      <td className="px-5 py-3 tabular-nums text-xs text-muted-foreground">{x.c}</td>
                      <td className="px-5 py-3 font-semibold">{x.n}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {x.r.map(r => (
                            <Badge key={r} className="bg-gray-100 text-gray-700 border-0 text-xs">{r}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {x.fileTypes.map(t => (
                            <span key={t} className={cn("text-[10px] font-bold border rounded px-1.5 py-0.5 leading-none", FILE_TYPE_COLORS[t] ?? "bg-gray-50 text-gray-600 border-gray-200")}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                          <HardDrive className="h-3 w-3" />
                          {x.maxSizeMB} MB
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Switch
                          checked={x.active}
                          onCheckedChange={v => setDocs(p => p.map(d => d.c === x.c ? { ...d, active: v } : d))}
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={() => openEditDoc(x)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => confirmDelete(x.n, () => deleteDoc(x.c))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* ── Agent Types ───────────────────────────────────── */}
          <TabsContent value="agenttypes">
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Agent Types</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">These types appear in the Agent setup dropdown and in all agent-related forms.</p>
                </div>
                <Button size="sm" variant="outline" onClick={openAddAt}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Type
                </Button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-5 py-3">Label</th>
                    <th className="px-5 py-3">System Code</th>
                    <th className="px-5 py-3 text-center">Built-in</th>
                    <th className="px-5 py-3 text-center">Active</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {agentTypes.map(t => (
                    <tr key={t.id} className="mrpsl-table-row">
                      <td className="px-5 py-3 font-semibold">{t.label}</td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{t.code}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {t.builtIn
                          ? <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">System</Badge>
                          : <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">Custom</Badge>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Switch
                          checked={t.active}
                          disabled={t.builtIn}
                          onCheckedChange={v => updateAgentType(t.id, { active: v })}
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost" size="icon-sm"
                            className="text-muted-foreground hover:text-foreground"
                            disabled={t.builtIn}
                            onClick={() => openEditAt(t)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={t.builtIn}
                            onClick={() => confirmDelete(t.label, () => removeAgentType(t.id))}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* ════════ DIALOGS ════════ */}

      {/* Add / Edit Currency */}
      <Dialog open={currOpen} onOpenChange={setCurrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currMode === "add" ? "Add Currency" : "Edit Currency"}</DialogTitle>
            <DialogDescription>
              {currMode === "add" ? "Select a currency to enable in the system." : `Updating ${editCurr?.name}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Currency *</label>
              <CurrencyCombobox
                value={pickedCurr}
                onChange={setPickedCurr}
                exclude={currMode === "add" ? currencies.map(c => c.code) : []}
              />
            </div>

            {pickedCurr && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>ISO Code</label>
                  <div className="h-11 px-3 rounded-lg border border-border/60 bg-muted/40 flex items-center gap-2">
                    <span className="font-mono font-bold text-sm tracking-widest">{pickedCurr.code}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto uppercase tracking-wider">read-only</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Symbol</label>
                  <div className="h-11 px-3 rounded-lg border border-border/60 bg-muted/40 flex items-center gap-2">
                    <span className="font-bold text-base">{pickedCurr.symbol}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto uppercase tracking-wider">read-only</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className={labelClass}>Notes</label>
              <Textarea value={currNote} onChange={e => setCurrNote(e.target.value)} placeholder="Optional notes about this currency…" rows={3} className="resize-none text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCurrOpen(false)}>Cancel</Button>
            <Button onClick={saveCurrency} disabled={!pickedCurr}>
              {currMode === "add" ? "Add Currency" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Caution Reason */}
      <Dialog open={cautOpen} onOpenChange={setCautOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{cautMode === "add" ? "Add Caution Reason" : "Edit Caution Reason"}</DialogTitle>
            <DialogDescription>
              {cautMode === "add" ? "Define a new reason for placing an account on caution." : `Editing "${editCaut?.r}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Caution Description *</label>
              <Input value={cautR} onChange={e => setCautR(e.target.value)} placeholder="e.g. Estate Dispute" className="mrpsl-input" />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Severity *</label>
              <SearchableSelect
                options={SEVERITY_OPTIONS}
                value={cautS}
                onChange={setCautS}
                placeholder="Select severity…"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Notes</label>
              <Textarea value={cautNote} onChange={e => setCautNote(e.target.value)} placeholder="Optional notes about this caution reason…" rows={3} className="resize-none text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCautOpen(false)}>Cancel</Button>
            <Button onClick={saveCaution} disabled={!cautR.trim()}>
              {cautMode === "add" ? "Add Reason" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Document Type */}
      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{docMode === "add" ? "Add Document Type" : "Edit Document Type"}</DialogTitle>
            <DialogDescription>
              {docMode === "add" ? "Define a new accepted document type for the system." : `Editing "${editDoc?.n}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Document Name *</label>
              <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Utility Bill" className="mrpsl-input" />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Required For * <span className="text-muted-foreground/60 normal-case font-normal tracking-normal">(select all that apply)</span></label>
              <div className="grid grid-cols-2 gap-2">
                {REQUIRED_FOR_OPTIONS.map(opt => (
                  <label key={opt} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/60 hover:bg-muted/30 cursor-pointer transition-colors">
                    <Checkbox checked={docReqFor.includes(opt)} onCheckedChange={() => toggleReqFor(opt)} />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Accepted File Types * <span className="text-muted-foreground/60 normal-case font-normal tracking-normal">(select all that apply)</span></label>
              <div className="grid grid-cols-3 gap-2">
                {FILE_TYPE_OPTIONS.map(ft => (
                  <label
                    key={ft}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors",
                      docFileTypes.includes(ft)
                        ? cn("border-2", FILE_TYPE_COLORS[ft])
                        : "border-border/60 hover:bg-muted/30"
                    )}
                  >
                    <Checkbox checked={docFileTypes.includes(ft)} onCheckedChange={() => toggleFileType(ft)} />
                    <span className={cn("text-sm font-bold", docFileTypes.includes(ft) ? "" : "text-foreground")}>{ft}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Maximum File Size *</label>
              <div className="flex gap-2">
                {MAX_SIZE_OPTIONS.map(mb => (
                  <button
                    key={mb}
                    type="button"
                    onClick={() => setDocMaxSize(mb)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors",
                      docMaxSize === mb
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    )}
                  >
                    {mb} MB
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Notes</label>
              <Textarea
                value={docNote}
                onChange={e => setDocNote(e.target.value)}
                placeholder="Optional notes about this document type…"
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDocOpen(false)}>Cancel</Button>
            <Button onClick={saveDoc} disabled={!docName.trim() || docReqFor.length === 0 || docFileTypes.length === 0}>
              {docMode === "add" ? "Add Document" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Agent Type */}
      <Dialog open={atOpen} onOpenChange={setAtOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{atMode === "add" ? "Add Agent Type" : "Edit Agent Type"}</DialogTitle>
            <DialogDescription>
              {atMode === "add" ? "Create a new agent type that will appear in all agent dropdowns." : `Editing "${editAt?.label}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Type Label *</label>
              <Input value={atLabel} onChange={e => setAtLabel(e.target.value)} placeholder="e.g. Custodian Bank" className="mrpsl-input" autoFocus />
            </div>
            {atLabel.trim() && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
                <span>System code:</span>
                <span className="font-mono font-bold text-foreground">{toCode(atLabel)}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className={labelClass}>Notes</label>
              <Textarea value={atNote} onChange={e => setAtNote(e.target.value)} placeholder="Optional notes…" rows={2} className="resize-none text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAtOpen(false)}>Cancel</Button>
            <Button onClick={saveAt} disabled={!atLabel.trim()}>
              {atMode === "add" ? "Add Type" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-destructive" />
              Confirm Removal
            </DialogTitle>
            <DialogDescription>
              Remove <strong>{delTarget?.label}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setDelOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { delTarget?.onConfirm(); setDelOpen(false); }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

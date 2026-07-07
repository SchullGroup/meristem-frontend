"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type WorldCurrency = { name: string; code: string; symbol: string };

// ── World currencies (popular, EUR-first) ────────────────────────
export const WORLD_CURRENCIES: WorldCurrency[] = [
  { name: "Euro", code: "EUR", symbol: "€" },
  { name: "US Dollar", code: "USD", symbol: "$" },
  { name: "British Pound", code: "GBP", symbol: "£" },
  { name: "Nigerian Naira", code: "NGN", symbol: "₦" },
  { name: "Japanese Yen", code: "JPY", symbol: "¥" },
  { name: "Swiss Franc", code: "CHF", symbol: "Fr" },
  { name: "Canadian Dollar", code: "CAD", symbol: "CA$" },
  { name: "Australian Dollar", code: "AUD", symbol: "A$" },
  { name: "Chinese Yuan", code: "CNY", symbol: "¥" },
  { name: "Indian Rupee", code: "INR", symbol: "₹" },
  { name: "South Korean Won", code: "KRW", symbol: "₩" },
  { name: "Swedish Krona", code: "SEK", symbol: "kr" },
  { name: "Norwegian Krone", code: "NOK", symbol: "kr" },
  { name: "Danish Krone", code: "DKK", symbol: "kr" },
  { name: "New Zealand Dollar", code: "NZD", symbol: "NZ$" },
  { name: "Singapore Dollar", code: "SGD", symbol: "S$" },
  { name: "Hong Kong Dollar", code: "HKD", symbol: "HK$" },
  { name: "Mexican Peso", code: "MXN", symbol: "MX$" },
  { name: "Brazilian Real", code: "BRL", symbol: "R$" },
  { name: "South African Rand", code: "ZAR", symbol: "R" },
  { name: "UAE Dirham", code: "AED", symbol: "د.إ" },
  { name: "Saudi Riyal", code: "SAR", symbol: "﷼" },
  { name: "Turkish Lira", code: "TRY", symbol: "₺" },
  { name: "Thai Baht", code: "THB", symbol: "฿" },
  { name: "Indonesian Rupiah", code: "IDR", symbol: "Rp" },
  { name: "Malaysian Ringgit", code: "MYR", symbol: "RM" },
  { name: "Philippine Peso", code: "PHP", symbol: "₱" },
  { name: "Pakistani Rupee", code: "PKR", symbol: "₨" },
  { name: "Egyptian Pound", code: "EGP", symbol: "E£" },
  { name: "Russian Ruble", code: "RUB", symbol: "₽" },
  { name: "Polish Złoty", code: "PLN", symbol: "zł" },
  { name: "Czech Koruna", code: "CZK", symbol: "Kč" },
  { name: "Hungarian Forint", code: "HUF", symbol: "Ft" },
  { name: "Ghanaian Cedi", code: "GHS", symbol: "₵" },
  { name: "Kenyan Shilling", code: "KES", symbol: "KSh" },
  { name: "Tanzanian Shilling", code: "TZS", symbol: "TSh" },
  { name: "Ugandan Shilling", code: "UGX", symbol: "USh" },
  { name: "Moroccan Dirham", code: "MAD", symbol: "MAD" },
  { name: "West African CFA Franc", code: "XOF", symbol: "CFA" },
  { name: "Central African CFA Franc", code: "XAF", symbol: "FCFA" },
  { name: "Qatari Riyal", code: "QAR", symbol: "QR" },
  { name: "Kuwaiti Dinar", code: "KWD", symbol: "KD" },
  { name: "Bahraini Dinar", code: "BHD", symbol: "BD" },
];

interface CurrencyComboboxProps {
  value: WorldCurrency | null;
  onChange: (c: WorldCurrency) => void;
  exclude?: string[];
  placeholder?: string;
  className?: string;
}

export function CurrencyCombobox({
  value,
  onChange,
  exclude = [],
  placeholder = "Select currency…",
  className,
}: CurrencyComboboxProps) {
  const [open, setOpen] = useState(false);
  const available = WORLD_CURRENCIES.filter(
    (c) => !exclude.includes(c.code) || c.code === value?.code,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between mrpsl-input h-11 font-normal",
            className,
          )}
        >
          {value ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold">
                {value.code}
              </span>
              {value.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Type to search currencies…"
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {available.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.code} ${c.name}`}
                  onSelect={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value?.code === c.code
                        ? "opacity-100 text-primary"
                        : "opacity-0",
                    )}
                  />
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold w-12 text-center shrink-0">
                    {c.code}
                  </span>
                  <span className="flex-1 text-sm">{c.name}</span>
                  <span className="text-sm font-medium text-muted-foreground w-8 text-right shrink-0">
                    {c.symbol}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import countries from "world-countries";
import { apiRequest } from "@/lib/api-client";

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Process countries data
interface CountryData {
  code: string;
  name: string;
  flag: string;
  cca2: string;
}

const getCountriesData = (): CountryData[] => {
  // Return all countries with phone codes, don't deduplicate
  // Multiple countries can share the same calling code (e.g., +1 for US, Canada, etc.)
  return countries
    .filter((country) => country.idd && country.idd.root)
    .map((country) => {
      // Determine the complete calling code
      // Some countries have complete codes in root (e.g., "+1", "+91")
      // Others need root + suffix (e.g., "+8" + "80" = "+880" for Bangladesh)
      let callingCode = country.idd.root;

      // If root is incomplete (ends with single digit like "+8", "+4"), combine with first suffix
      // Complete codes are usually "+1", "+7", or multi-digit like "+91", "+86"
      const rootDigits = country.idd.root.replace("+", "");
      const isIncomplete = rootDigits.length === 1 && country.idd.suffixes && country.idd.suffixes.length > 0;

      // Special case: "+1" is complete (US, Canada use area codes as suffixes)
      // Other single-digit roots like "+8", "+4" need suffixes
      if (isIncomplete && country.idd.root !== "+1" && country.idd.root !== "+7") {
        callingCode = country.idd.root + country.idd.suffixes[0];
      }

      return {
        code: callingCode,
        name: country.name.common,
        flag: getFlagEmoji(country.cca2),
        cca2: country.cca2,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

interface CountryCodeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  defaultCountryCode?: string; // ISO country code (e.g., "BD", "US")
  autoDetect?: boolean; // Auto-detect user's country
}

export function CountryCodeSelect({ value, onValueChange, defaultCountryCode, autoDetect = false }: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);

  // Memoize countries data to avoid recalculating on every render
  const countriesData = useMemo(() => getCountriesData(), []);

  // Auto-detect or use defaultCountryCode
  useEffect(() => {
    // Skip if value is already set (and not empty) or countries data not ready
    if ((value && value.trim() !== "") || countriesData.length === 0) return;

    const detectCountry = async () => {
      let countryCodeToUse: string | null = null;

      // Priority 1: Use defaultCountryCode if provided
      if (defaultCountryCode) {
        countryCodeToUse = defaultCountryCode.toUpperCase();
      }
      // Priority 2: Auto-detect if enabled
      else if (autoDetect) {
        try {
          const data = await apiRequest<any>("GET", "/geolocation");
          if (data.countryCode) {
            countryCodeToUse = data.countryCode.toUpperCase();
          }
        } catch (error) {
          console.error("Failed to detect country:", error);
        }
      }

      // Find and set the country
      if (countryCodeToUse) {
        const country = countriesData.find((c) => c.cca2 === countryCodeToUse);
        if (country) {
          setHasAutoDetected(true);
          onValueChange(country.code);
        }
      }
    };

    detectCountry();
  }, [value, countriesData, defaultCountryCode, autoDetect, onValueChange]);

  const selectedCountry = countriesData.find((c) => c.code === value) ||
    countriesData[0] || { code: "+1", name: "United States", flag: "🇺🇸", cca2: "US" };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' aria-expanded={open} className='w-full sm:w-[140px] justify-between text-sm'>
          <span className='flex items-center gap-1.5 sm:gap-2 truncate'>
            <span className='text-base sm:text-lg shrink-0'>{selectedCountry.flag}</span>
            <span className='truncate'>{selectedCountry.code}</span>
          </span>
          <ChevronsUpDown className='ml-1 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[calc(100vw-2rem)] sm:w-[300px] md:w-[350px] p-0' align='start' sideOffset={4}>
        <Command
          filter={(value, search) => {
            if (!search || search.trim() === "") return 1;
            const searchLower = search.toLowerCase();
            // value format: "Country Name +123"
            const parts = value.split(" ");
            const countryCode = parts.pop() || "";
            const countryName = parts.join(" ").toLowerCase();
            return countryName.includes(searchLower) || countryCode.toLowerCase().includes(searchLower) ? 1 : 0;
          }}
        >
          <CommandInput placeholder='Search country or code...' className='h-9 sm:h-10' />
          <CommandList className='max-h-[200px] sm:max-h-[230px] overflow-y-auto'>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countriesData.map((country) => (
                <CommandItem
                  key={`${country.cca2}-${country.code}`}
                  value={`${country.name} ${country.code}`}
                  onSelect={() => {
                    onValueChange(country.code);
                    setOpen(false);
                  }}
                  className='cursor-pointer py-2 sm:py-2.5'
                >
                  <Check className={cn("mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0", value === country.code ? "opacity-100" : "opacity-0")} />
                  <span className='mr-2 text-base sm:text-lg shrink-0'>{country.flag}</span>
                  <span className='mr-2 flex-1 text-sm sm:text-base truncate'>{country.name}</span>
                  <span className='text-muted-foreground text-xs sm:text-sm shrink-0'>{country.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useBrandConfig } from "./brand-config-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";

export function PaymentTab() {
    const { config, updateConfig, currencyOpen, setCurrencyOpen, availableCurrencies } = useBrandConfig();

    return (
        <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
            <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Payment & Currency</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>Configure how prices and payments are presented</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                    <Label htmlFor='currencyIso' className='text-xs sm:text-sm font-semibold'>
                        Currency
                    </Label>
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                id='currencyIso'
                                variant='outline'
                                role='combobox'
                                aria-expanded={currencyOpen}
                                className='w-full justify-between'
                            >
                                {config.currency?.iso
                                    ? `${availableCurrencies.find((c) => c.code === config.currency?.iso)?.code || config.currency.iso} - ${availableCurrencies.find((c) => c.code === config.currency?.iso)?.name || "Currency"
                                    } (${availableCurrencies.find((c) => c.code === config.currency?.iso)?.symbol || "$"})`
                                    : "Select currency..."}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-full p-0' align='start'>
                            <Command
                                filter={(value, search) => {
                                    if (!search || search.trim() === "") return 1;
                                    const searchLower = search.toLowerCase();
                                    const parts = value.split(" - ");
                                    const codeAndName = parts[0]?.toLowerCase() || "";
                                    const nameAndSymbol = parts[1]?.toLowerCase() || "";
                                    return codeAndName.includes(searchLower) || nameAndSymbol.includes(searchLower) ? 1 : 0;
                                }}
                            >
                                <CommandInput placeholder='Search currency...' />
                                <CommandList className='max-h-[300px] overflow-y-auto'>
                                    <CommandEmpty>No currency found.</CommandEmpty>
                                    <CommandGroup>
                                        {availableCurrencies.map((currency) => (
                                            <CommandItem
                                                key={currency.code}
                                                value={`${currency.code} - ${currency.name} (${currency.symbol})`}
                                                onSelect={() => {
                                                    updateConfig(["currency", "iso"], currency.code);
                                                    setCurrencyOpen(false);
                                                }}
                                                className='cursor-pointer'
                                            >
                                                <Check
                                                    className={cn("mr-2 h-4 w-4", config.currency?.iso === currency.code ? "opacity-100" : "opacity-0")}
                                                />
                                                <span className='mr-2 font-medium'>{currency.code}</span>
                                                <span className='mr-2 flex-1'>{currency.name}</span>
                                                <span className='text-muted-foreground'>({currency.symbol})</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <p className='text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg'>
                        The selected currency symbol will be displayed throughout your store for all prices.
                    </p>
                </div>

                {/* Preview */}
                <div className='space-y-4'>
                    <Label className='text-sm font-semibold'>Price Display Preview</Label>
                    <div className='rounded-xl border-2 bg-gradient-to-br from-muted/50 to-muted/30 p-6 space-y-4'>
                        <div className='text-sm font-medium text-muted-foreground'>Price display examples:</div>
                        <div className='space-y-3'>
                            <div className='text-3xl font-bold'>{config.currency?.iso ? getCurrencySymbol(config.currency.iso) : "$"}100.00</div>
                            <div className='text-xl text-muted-foreground line-through'>
                                {config.currency?.iso ? getCurrencySymbol(config.currency.iso) : "$"}120.00
                            </div>
                            <div className='text-base'>{config.currency?.iso ? getCurrencySymbol(config.currency.iso) : "$"}50.99</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

"use client";

import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CheckCircle2, ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Order } from "@/lib/types";

interface PathaoCity {
  city_id: number;
  city_name: string;
}

interface PathaoZone {
  zone_id: number;
  zone_name: string;
}

interface PathaoArea {
  area_id: number;
  area_name: string;
  home_delivery_available: boolean;
  pickup_available: boolean;
}

// Form values type matching the schema with z.coerce.number()
type DeliveryFormValues = {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  city: string;
  zone?: string;
  area: string;
  amountToCollect: unknown;
  itemWeight: unknown;
  specialInstruction?: string;
};

interface DeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<DeliveryFormValues, any, DeliveryFormValues>;
  order: Order;
  sendingCourier: boolean;
  onSubmit: (values: DeliveryFormValues) => void;
}

export function DeliveryDialog({ open, onOpenChange, form, order, sendingCourier, onSubmit }: DeliveryDialogProps) {
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [zonePopoverOpen, setZonePopoverOpen] = useState(false);
  const [areaPopoverOpen, setAreaPopoverOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [zoneSearch, setZoneSearch] = useState("");
  const [areaSearch, setAreaSearch] = useState("");

  // Pathao data
  const [cities, setCities] = useState<PathaoCity[]>([]);
  const [zones, setZones] = useState<PathaoZone[]>([]);
  const [areas, setAreas] = useState<PathaoArea[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  const selectedCity = form.watch("city");
  const selectedZone = form.watch("zone");

  // Fetch cities on mount
  useEffect(() => {
    if (open && cities.length === 0 && !loadingCities) {
      fetchCities();
    }
  }, [open]);

  // Fetch zones when city is selected
  useEffect(() => {
    if (selectedCity && selectedCity !== "") {
      const city = cities.find((c) => c.city_name === selectedCity);
      if (city) {
        fetchZones(city.city_id);
      } else {
        setZones([]);
        setAreas([]);
        form.setValue("zone", "");
        form.setValue("area", "");
      }
    } else {
      setZones([]);
      setAreas([]);
      form.setValue("zone", "");
      form.setValue("area", "");
    }
  }, [selectedCity, cities]);

  // Fetch areas when zone is selected
  useEffect(() => {
    if (selectedZone && selectedZone !== "") {
      const zone = zones.find((z) => z.zone_name === selectedZone);
      if (zone) {
        fetchAreas(zone.zone_id);
      } else {
        setAreas([]);
        form.setValue("area", "");
      }
    } else {
      setAreas([]);
      form.setValue("area", "");
    }
  }, [selectedZone, zones]);

  const fetchCities = async () => {
    setLoadingCities(true);
    try {
      const res = await fetch("/api/pathao/cities");
      if (!res.ok) {
        throw new Error("Failed to fetch cities");
      }
      const data = await res.json();
      setCities(data.cities || []);
    } catch (error: any) {
      console.error("Failed to fetch Pathao cities:", error);
      toast.error("Failed to load cities. Please try again.");
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchZones = async (cityId: number) => {
    setLoadingZones(true);
    try {
      const res = await fetch(`/api/pathao/zones?city_id=${cityId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch zones");
      }
      const data = await res.json();
      setZones(data.zones || []);
    } catch (error: any) {
      console.error("Failed to fetch Pathao zones:", error);
      toast.error("Failed to load zones. Please try again.");
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchAreas = async (zoneId: number) => {
    setLoadingAreas(true);
    try {
      const res = await fetch(`/api/pathao/areas?zone_id=${zoneId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch areas");
      }
      const data = await res.json();
      setAreas(data.areas || []);
    } catch (error: any) {
      console.error("Failed to fetch Pathao areas:", error);
      toast.error("Failed to load areas. Please try again.");
    } finally {
      setLoadingAreas(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[75vh] md:max-h-[80vh] overflow-y-auto'>
        <DialogHeader className='pb-3'>
          <DialogTitle className='text-lg'>Send Delivery</DialogTitle>
          <DialogDescription className='text-sm'>Fill in the delivery details for this order.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
              <FormField
                control={form.control}
                name='recipientName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Recipient Name</FormLabel>
                    <FormControl>
                      <Input {...field} className='!h-9' />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='recipientPhone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} className='!h-9' />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='recipientAddress'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm'>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} className='min-h-[60px]' />
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-2.5'>
              {/* City select with search */}
              <FormField
                control={form.control}
                name='city'
                render={({ field }) => {
                  const search = citySearch.trim().toLowerCase();
                  const filteredCities = search ? cities.filter((c) => c.city_name.toLowerCase().includes(search)) : cities;
                  const selectedCity = cities.find((c) => c.city_name === field.value);

                  return (
                    <FormItem className='flex flex-col'>
                      <FormLabel className='text-sm'>City</FormLabel>
                      <Popover
                        open={cityPopoverOpen}
                        onOpenChange={(open) => {
                          setCityPopoverOpen(open);
                          if (!open) setCitySearch("");
                        }}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              role='combobox'
                              className={cn("justify-between w-full h-9 text-sm", !field.value && "text-muted-foreground")}
                              disabled={loadingCities}
                            >
                              <span className='truncate'>
                                {loadingCities ? (
                                  <>
                                    <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin inline' />
                                    Loading...
                                  </>
                                ) : selectedCity ? (
                                  selectedCity.city_name
                                ) : (
                                  "Select City"
                                )}
                              </span>
                              <ChevronsUpDown className='ml-2 h-3.5 w-3.5 shrink-0 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='p-0 w-[--radix-popover-trigger-width] min-w-[200px] flex flex-col max-h-[300px]'>
                          <Command className='flex flex-col h-full'>
                            <CommandInput placeholder='Search city...' value={citySearch} onValueChange={setCitySearch} className='!h-9' />
                            <div className='flex-1 min-h-0 overflow-hidden'>
                              <CommandList className='h-full max-h-48 overflow-y-scroll'>
                                <CommandEmpty className='py-2 text-xs'>No city found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredCities.map((city) => (
                                    <CommandItem
                                      key={city.city_id}
                                      value={city.city_name}
                                      onSelect={() => {
                                        field.onChange(city.city_name);
                                        form.setValue("zone", "");
                                        form.setValue("area", "");
                                        setCityPopoverOpen(false);
                                        setCitySearch("");
                                      }}
                                      className='text-sm'
                                    >
                                      <Check
                                        className={cn("mr-2 h-3.5 w-3.5", city.city_name === field.value ? "opacity-100" : "opacity-0")}
                                      />
                                      {city.city_name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </div>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  );
                }}
              />

              {/* Zone select with search, depends on city */}
              <FormField
                control={form.control}
                name='zone'
                render={({ field }) => {
                  const search = zoneSearch.trim().toLowerCase();
                  const filteredZones = search ? zones.filter((z) => z.zone_name.toLowerCase().includes(search)) : zones;
                  const selectedZone = zones.find((z) => z.zone_name === field.value);

                  return (
                    <FormItem className='flex flex-col'>
                      <FormLabel className='text-sm'>Zone</FormLabel>
                      <Popover
                        open={zonePopoverOpen}
                        onOpenChange={(open) => {
                          setZonePopoverOpen(open);
                          if (!open) setZoneSearch("");
                        }}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              role='combobox'
                              className={cn("justify-between w-full h-9 text-sm", !field.value && "text-muted-foreground")}
                              disabled={!selectedCity || loadingZones}
                            >
                              <span className='truncate'>
                                {loadingZones ? (
                                  <>
                                    <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin inline' />
                                    Loading...
                                  </>
                                ) : !selectedCity ? (
                                  "Select city"
                                ) : selectedZone ? (
                                  selectedZone.zone_name
                                ) : (
                                  "Select Zone"
                                )}
                              </span>
                              <ChevronsUpDown className='ml-2 h-3.5 w-3.5 shrink-0 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='p-0 w-[--radix-popover-trigger-width] min-w-[200px] flex flex-col max-h-[300px]'>
                          <Command className='flex flex-col h-full'>
                            <CommandInput placeholder='Search zone...' value={zoneSearch} onValueChange={setZoneSearch} className='!h-9' />
                            <div className='flex-1 min-h-0 overflow-hidden'>
                              <CommandList className='h-full max-h-48 overflow-y-scroll'>
                                <CommandEmpty className='py-2 text-xs'>No zone found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredZones.map((zone) => (
                                    <CommandItem
                                      key={zone.zone_id}
                                      value={zone.zone_name}
                                      onSelect={() => {
                                        field.onChange(zone.zone_name);
                                        form.setValue("area", "");
                                        setZonePopoverOpen(false);
                                        setZoneSearch("");
                                      }}
                                      className='text-sm'
                                    >
                                      <Check
                                        className={cn("mr-2 h-3.5 w-3.5", zone.zone_name === field.value ? "opacity-100" : "opacity-0")}
                                      />
                                      {zone.zone_name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </div>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  );
                }}
              />

              {/* Area select with search, depends on zone */}
              <FormField
                control={form.control}
                name='area'
                render={({ field }) => {
                  const search = areaSearch.trim().toLowerCase();
                  const filteredAreas = search ? areas.filter((a) => a.area_name.toLowerCase().includes(search)) : areas;
                  const selectedArea = areas.find((a) => a.area_name === field.value);

                  return (
                    <FormItem className='flex flex-col'>
                      <FormLabel className='text-sm'>Area</FormLabel>
                      <Popover
                        open={areaPopoverOpen}
                        onOpenChange={(open) => {
                          setAreaPopoverOpen(open);
                          if (!open) setAreaSearch("");
                        }}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              role='combobox'
                              className={cn("justify-between w-full h-9 text-sm", !field.value && "text-muted-foreground")}
                              disabled={!selectedZone || loadingAreas}
                            >
                              <span className='truncate'>
                                {loadingAreas ? (
                                  <>
                                    <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin inline' />
                                    Loading...
                                  </>
                                ) : !selectedZone ? (
                                  "Select zone"
                                ) : selectedArea ? (
                                  selectedArea.area_name
                                ) : (
                                  "Select Area"
                                )}
                              </span>
                              <ChevronsUpDown className='ml-2 h-3.5 w-3.5 shrink-0 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='p-0 w-[--radix-popover-trigger-width] min-w-[200px] flex flex-col max-h-[300px]'>
                          <Command className='flex flex-col h-full'>
                            <CommandInput placeholder='Search area...' value={areaSearch} onValueChange={setAreaSearch} className='!h-9' />
                            <div className='flex-1 min-h-0 overflow-hidden'>
                              <CommandList className='h-full max-h-48 overflow-y-scroll'>
                                <CommandEmpty className='py-2 text-xs'>No area found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredAreas.map((area) => (
                                    <CommandItem
                                      key={area.area_id}
                                      value={area.area_name}
                                      onSelect={() => {
                                        field.onChange(area.area_name);
                                        setAreaPopoverOpen(false);
                                        setAreaSearch("");
                                      }}
                                      className='text-sm'
                                    >
                                      <Check
                                        className={cn("mr-2 h-3.5 w-3.5", area.area_name === field.value ? "opacity-100" : "opacity-0")}
                                      />
                                      {area.area_name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </div>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
              <FormField
                control={form.control}
                name='amountToCollect'
                render={({ field }) => {
                  const isPaid = order.paymentStatus === "completed";
                  if (isPaid) {
                    return (
                      <FormItem>
                        <FormLabel className='text-sm'>Amount to Collect</FormLabel>
                        <div className='px-2.5 h-9 rounded-md border bg-emerald-50 dark:bg-emerald-900/20 flex items-center gap-2'>
                          <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0' />
                          <p className='text-xs font-medium text-emerald-700 dark:text-emerald-300'>Payment completed</p>
                        </div>
                        {/* keep form value in sync as 0 so API always gets 0 */}
                        <input type='hidden' {...field} value={0} />
                        <FormMessage className='text-xs' />
                      </FormItem>
                    );
                  }

                  return (
                    <FormItem>
                      <FormLabel className='text-sm'>Amount to Collect</FormLabel>
                      <FormControl>
                        <Input type='number' {...field} value={field.value as number | string | undefined} className='!h-9' />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name='itemWeight'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Item Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.1' {...field} value={field.value as number | string | undefined} className='!h-9' />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='specialInstruction'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm'>Special Instruction (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} className='min-h-[60px]' />
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />

            <DialogFooter className='pt-2 gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={sendingCourier} className='!h-9'>
                Cancel
              </Button>
              <Button type='submit' disabled={sendingCourier} className='!h-9'>
                {sendingCourier ? "Creating..." : "Create Delivery"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

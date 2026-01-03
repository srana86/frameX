"use client";

import { useState } from "react";
import type { DeliveryServiceConfig, WeightBasedCharge, SpecificDeliveryCharge } from "@/types/delivery-config-types";
import { defaultDeliveryServiceConfig } from "@/types/delivery-config-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Loader2, Plus, X, Truck, Package, MapPin, DollarSign, Settings2, CheckCircle2 } from "lucide-react";
import { useCurrencySymbol } from "@/hooks/use-currency";

interface DeliveryServiceClientProps {
  initialConfig: DeliveryServiceConfig;
}

export function DeliveryServiceClient({ initialConfig }: DeliveryServiceClientProps) {
  const currencySymbol = useCurrencySymbol();
  const [config, setConfig] = useState<DeliveryServiceConfig>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [weightInput, setWeightInput] = useState("");
  const [chargeInput, setChargeInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [specificChargeInput, setSpecificChargeInput] = useState("");

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/delivery-config");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      const newConfig = data || defaultDeliveryServiceConfig;
      setConfig(newConfig);
    } catch (error) {
      toast.error("Failed to load delivery config");
      setConfig(defaultDeliveryServiceConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/delivery-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save config");
      }
      toast.success("Delivery charges updated successfully!");
      await loadConfig();
    } catch (error: any) {
      toast.error(error.message || "Failed to save delivery configuration");
    } finally {
      setSaving(false);
    }
  };

  const addWeightBasedCharge = () => {
    const weight = parseFloat(weightInput);
    const charge = parseFloat(chargeInput);

    if (isNaN(weight) || weight < 0) {
      toast.error("Please enter a valid weight (0 or greater)");
      return;
    }
    if (isNaN(charge) || charge < 0) {
      toast.error("Please enter a valid charge (0 or greater)");
      return;
    }

    setConfig({
      ...config,
      weightBasedCharges: [...config.weightBasedCharges, { weight, extraCharge: charge }],
    });

    setWeightInput("");
    setChargeInput("");
  };

  const removeWeightBasedCharge = (index: number) => {
    setConfig({
      ...config,
      weightBasedCharges: config.weightBasedCharges.filter((_, i) => i !== index),
    });
  };

  const addSpecificDeliveryCharge = () => {
    const location = locationInput.trim();
    const charge = parseFloat(specificChargeInput);

    if (!location) {
      toast.error("Please enter a location");
      return;
    }
    if (isNaN(charge) || charge < 0) {
      toast.error("Please enter a valid charge (0 or greater)");
      return;
    }

    setConfig({
      ...config,
      specificDeliveryCharges: [...config.specificDeliveryCharges, { location, charge }],
    });

    setLocationInput("");
    setSpecificChargeInput("");
  };

  const removeSpecificDeliveryCharge = (index: number) => {
    setConfig({
      ...config,
      specificDeliveryCharges: config.specificDeliveryCharges.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Spinner className='h-8 w-8' />
      </div>
    );
  }

  const getDeliveryOptionLabel = (option: string) => {
    if (option === "zones") return "Zones";
    if (option === "districts") return "Districts";
    if (option === "upazila") return "Upazila/P.S";
    return option;
  };

  return (
    <Card className='border shadow-lg overflow-hidden pt-0 gap-0'>
      <CardHeader className='bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b py-3 sm:py-4 px-3 sm:px-6'>
        <div className='flex items-center gap-2 sm:gap-3'>
          <div className='p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0'>
            <Settings2 className='h-4 w-4 sm:h-5 sm:w-5 text-primary' />
          </div>
          <div className='min-w-0 flex-1'>
            <CardTitle className='text-base sm:text-lg md:text-xl font-bold truncate'>Delivery Service Configuration</CardTitle>
            <p className='text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1'>
              Manage default charges and delivery settings
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-3 sm:p-4 md:p-5 lg:p-6 space-y-3 sm:space-y-4'>
        {/* Default Delivery Charge */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
          <div className='space-y-2 p-3 sm:p-4 rounded-lg border bg-muted/30'>
            <div className='flex items-center gap-2 mb-2'>
              <DollarSign className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0' />
              <Label htmlFor='default-delivery-charge' className='text-xs sm:text-sm font-semibold'>
                Default Delivery Charge
              </Label>
            </div>
            <div className='relative'>
              <span className='absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm'>
                {currencySymbol}
              </span>
              <Input
                id='default-delivery-charge'
                type='number'
                min='0'
                step='0.01'
                placeholder='0.00'
                value={config.defaultDeliveryCharge || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    defaultDeliveryCharge: parseFloat(e.target.value) || 0,
                  })
                }
                className='pl-7 sm:pl-8 h-9 sm:h-10 text-sm'
              />
            </div>
            <p className='text-xs text-muted-foreground'>Applied to all areas by default</p>
          </div>

          {/* Delivery Option */}
          <div className='space-y-3 p-3 sm:p-4 rounded-lg border bg-muted/30'>
            <div className='flex items-center gap-2 mb-3'>
              <MapPin className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0' />
              <Label className='text-xs sm:text-sm font-semibold'>Delivery Option</Label>
            </div>
            <div className='relative p-1 rounded-lg bg-muted/50 border border-border/50'>
              <ToggleGroup
                type='single'
                value={config.deliveryOption}
                onValueChange={(value) => {
                  if (value) {
                    setConfig({ ...config, deliveryOption: value as any });
                  }
                }}
                className='flex flex-wrap sm:flex-nowrap gap-1 w-full'
              >
                <ToggleGroupItem
                  value='zones'
                  className='flex-1 sm:flex-none min-w-0 sm:min-w-[90px] text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-md transition-all duration-200 data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-muted/80 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:shadow-primary/20 data-[state=on]:font-semibold'
                >
                  Zones
                </ToggleGroupItem>
                <ToggleGroupItem
                  value='districts'
                  className='flex-1 sm:flex-none min-w-0 sm:min-w-[90px] text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-md transition-all duration-200 data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-muted/80 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:shadow-primary/20 data-[state=on]:font-semibold'
                >
                  Districts
                </ToggleGroupItem>
                <ToggleGroupItem
                  value='upazila'
                  className='flex-1 sm:flex-none min-w-0 sm:min-w-[100px] text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-md transition-all duration-200 data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-muted/80 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:shadow-primary/20 data-[state=on]:font-semibold'
                >
                  Upazila/P.S
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        {/* Toggle Options */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border bg-muted/30'>
            <div className='space-y-0.5 flex-1 min-w-0'>
              <Label htmlFor='enable-cod' className='text-xs sm:text-sm font-semibold block'>
                Enable COD
              </Label>
              <p className='text-xs text-muted-foreground'>Cash on delivery for default areas</p>
            </div>
            <div className='flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end'>
              <Badge variant={config.enableCODForDefault ? "default" : "secondary"} className='text-xs shrink-0'>
                {config.enableCODForDefault ? "ON" : "OFF"}
              </Badge>
              <Switch
                id='enable-cod'
                checked={config.enableCODForDefault}
                onCheckedChange={(checked) => setConfig({ ...config, enableCODForDefault: checked })}
                className='data-[state=checked]:bg-primary shrink-0'
              />
            </div>
          </div>

          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border bg-muted/30'>
            <div className='space-y-0.5 flex-1 min-w-0'>
              <Label htmlFor='delivery-not-refundable' className='text-xs sm:text-sm font-semibold block'>
                Non-Refundable
              </Label>
              <p className='text-xs text-muted-foreground'>Delivery charge not refundable on returns</p>
            </div>
            <div className='flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end'>
              <Badge variant={config.deliveryChargeNotRefundable ? "default" : "secondary"} className='text-xs shrink-0'>
                {config.deliveryChargeNotRefundable ? "ON" : "OFF"}
              </Badge>
              <Switch
                id='delivery-not-refundable'
                checked={config.deliveryChargeNotRefundable}
                onCheckedChange={(checked) => setConfig({ ...config, deliveryChargeNotRefundable: checked })}
                className='data-[state=checked]:bg-primary shrink-0'
              />
            </div>
          </div>
        </div>

        {/* Weight-Based Extra Charges */}
        <div className='space-y-3 p-4 rounded-lg border bg-muted/30'>
          <div className='flex items-center gap-2'>
            <Package className='h-4 w-4 text-primary' />
            <Label className='text-sm font-semibold'>Weight-Based Extra Charges</Label>
          </div>
          <div className='flex flex-col sm:flex-row gap-2'>
            <Input
              type='number'
              min='0'
              step='0.1'
              placeholder='Weight (kg)'
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className='flex-1 h-9'
            />
            <Input
              type='number'
              min='0'
              step='0.01'
              placeholder='Extra Charge'
              value={chargeInput}
              onChange={(e) => setChargeInput(e.target.value)}
              className='flex-1 h-9'
            />
            <Button type='button' variant='outline' onClick={addWeightBasedCharge} className='h-9 shrink-0'>
              <Plus className='h-4 w-4 mr-1' />
              Add
            </Button>
          </div>
          {config.weightBasedCharges.length > 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3'>
              {config.weightBasedCharges.map((item, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-2.5 border rounded-md bg-background hover:bg-muted/50 transition-colors'
                >
                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                    <Package className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                    <span className='text-xs font-medium truncate'>
                      {item.weight} kg ={" "}
                      <span className='text-primary font-semibold'>
                        {currencySymbol}
                        {item.extraCharge}
                      </span>
                    </span>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => removeWeightBasedCharge(index)}
                    className='h-7 w-7 p-0 shrink-0'
                  >
                    <X className='h-3.5 w-3.5' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Specific Delivery Charges */}
        <div className='space-y-3 p-4 rounded-lg border bg-muted/30'>
          <div className='flex items-center gap-2'>
            <MapPin className='h-4 w-4 text-primary' />
            <Label className='text-sm font-semibold'>Specific Delivery Charges</Label>
          </div>
          <div className='flex flex-col sm:flex-row gap-2'>
            <Input
              type='text'
              placeholder={`${getDeliveryOptionLabel(config.deliveryOption)}/District`}
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className='flex-1 h-9'
            />
            <Input
              type='number'
              min='0'
              step='0.01'
              placeholder='Charge'
              value={specificChargeInput}
              onChange={(e) => setSpecificChargeInput(e.target.value)}
              className='flex-1 sm:max-w-[120px] h-9'
            />
            <Button type='button' variant='outline' onClick={addSpecificDeliveryCharge} className='h-9 shrink-0'>
              <Plus className='h-4 w-4 mr-1' />
              Add
            </Button>
          </div>
          {config.specificDeliveryCharges.length > 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3'>
              {config.specificDeliveryCharges.map((item, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-2.5 border rounded-md bg-background hover:bg-muted/50 transition-colors'
                >
                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                    <MapPin className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                    <span className='text-xs font-medium truncate'>
                      {item.location}:{" "}
                      <span className='text-primary font-semibold'>
                        {currencySymbol}
                        {item.charge}
                      </span>
                    </span>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => removeSpecificDeliveryCharge(index)}
                    className='h-7 w-7 p-0 shrink-0'
                  >
                    <X className='h-3.5 w-3.5' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className='flex justify-end pt-2 border-t'>
          <Button onClick={handleSave} disabled={saving} size='sm' className='min-w-[140px]'>
            {saving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Save className='mr-2 h-4 w-4' />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

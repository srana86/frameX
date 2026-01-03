"use client";

import { useState } from "react";
import Image from "next/image";
import type { CourierServicesConfig, CourierService } from "@/types/delivery-config-types";
import { defaultCourierServicesConfig } from "@/types/delivery-config-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ChevronDown, Eye, EyeOff, Save, Package2, CheckCircle2 } from "lucide-react";

interface CourierServicesClientProps {
  initialConfig: CourierServicesConfig;
}

// Courier service field definitions
const courierServiceFields: Record<string, Array<{ key: string; label: string; type: "text" | "password"; required?: boolean }>> = {
  pathao: [
    { key: "storeId", label: "Store ID", type: "text", required: true },
    { key: "clientId", label: "Client ID", type: "text", required: true },
    { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    { key: "password", label: "Password", type: "password", required: true },
    { key: "username", label: "Username", type: "text", required: true },
  ],
  steadfast: [
    { key: "apiKey", label: "API Key", type: "password", required: true },
    { key: "secretKey", label: "Secret Key", type: "password", required: true },
  ],
  redx: [{ key: "apiKey", label: "API key", type: "password", required: true }],
  paperfly: [
    { key: "username", label: "Username", type: "text", required: true },
    { key: "password", label: "Password", type: "password", required: true },
  ],
};

const getCourierImage = (serviceId: string) => {
  return `/courier-service/${serviceId}.png`;
};

export function CourierServicesClient({ initialConfig }: CourierServicesClientProps) {
  const [config, setConfig] = useState<CourierServicesConfig>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({});
  const [openServices, setOpenServices] = useState<Record<string, boolean>>({});
  const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    config.services.forEach((service: CourierService) => {
      initial[service.id] = service.credentials || {};
    });
    return initial;
  });

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/delivery-config?type=courier");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      const newConfig = data || defaultCourierServicesConfig;
      setConfig(newConfig);
      const newCredentials: Record<string, Record<string, string>> = {};
      newConfig.services.forEach((service: CourierService) => {
        newCredentials[service.id] = service.credentials || {};
      });
      setCredentials(newCredentials);
    } catch (error) {
      toast.error("Failed to load courier services config");
      setConfig(defaultCourierServicesConfig);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = async (serviceId: string, enabled: boolean) => {
    setToggleLoading((prev) => ({ ...prev, [serviceId]: true }));

    const updatedServices = config.services.map((service) => (service.id === serviceId ? { ...service, enabled } : service));

    const updatedConfig = {
      ...config,
      services: updatedServices,
    };

    setConfig(updatedConfig);

    try {
      const res = await fetch("/api/delivery-config?type=courier", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save config");
      }

      toast.success(`${enabled ? "Enabled" : "Disabled"} ${updatedServices.find((s) => s.id === serviceId)?.name} successfully!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update courier service");
      setConfig(config);
    } finally {
      setToggleLoading((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  const saveCredentials = async (serviceId: string) => {
    const service = config.services.find((s) => s.id === serviceId);
    if (!service) return;

    const serviceFields = courierServiceFields[serviceId] || [];
    const serviceCredentials = credentials[serviceId] || {};

    const missingFields = serviceFields.filter((field) => field.required && !serviceCredentials[field.key]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.map((f) => f.label).join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const updatedServices = config.services.map((s) => (s.id === serviceId ? { ...s, credentials: serviceCredentials } : s));

      const updatedConfig = {
        ...config,
        services: updatedServices,
      };

      const res = await fetch("/api/delivery-config?type=courier", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save credentials");
      }

      toast.success(`${service.name} credentials saved successfully!`);
      await loadConfig();
    } catch (error: any) {
      toast.error(error.message || "Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const updateCredential = (serviceId: string, key: string, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [key]: value,
      },
    }));
  };

  const togglePasswordVisibility = (fieldId: string) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const toggleServiceCollapse = (serviceId: string) => {
    setOpenServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Spinner className='h-8 w-8' />
      </div>
    );
  }

  const enabledCount = config.services.filter((s) => s.enabled).length;

  return (
    <Card className='border shadow-lg overflow-hidden pt-0 gap-0'>
      <CardHeader className='bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b py-4'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-lg bg-primary/10'>
            <Package2 className='h-5 w-5 text-primary' />
          </div>
          <div className='flex-1'>
            <CardTitle className='text-xl font-bold'>Courier Services</CardTitle>
            <p className='text-xs text-muted-foreground mt-1'>
              {enabledCount} of {config.services.length} active
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-4 space-y-3'>
        {config.services.map((service) => {
          const serviceFields = courierServiceFields[service.id] || [];
          const isOpen = openServices[service.id] || false;
          const serviceCredentials = credentials[service.id] || {};
          const imagePath = getCourierImage(service.id);
          const isToggleLoading = toggleLoading[service.id] || false;

          return (
            <Collapsible key={service.id} open={isOpen} onOpenChange={() => toggleServiceCollapse(service.id)}>
              <div className='border rounded-lg overflow-hidden hover:border-primary/30 transition-colors'>
                {/* Service Header */}
                <CollapsibleTrigger asChild>
                  <div className='p-3 cursor-pointer hover:bg-muted/50 transition-colors'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        <div className='relative h-6 w-20 shrink-0'>
                          <Image src={imagePath} alt={service.name} fill className='object-contain object-left' sizes='80px' />
                        </div>
                        {service.enabled && (
                          <Badge variant='default' className='text-xs shrink-0'>
                            <CheckCircle2 className='h-3 w-3 mr-1' />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className='flex items-center gap-2 shrink-0'>
                        <div onClick={(e) => e.stopPropagation()}>
                          <div className='relative'>
                            {isToggleLoading && (
                              <div className='absolute inset-0 flex items-center justify-center bg-background/80 rounded'>
                                <Loader2 className='h-3 w-3 animate-spin text-primary' />
                              </div>
                            )}
                            <Switch
                              checked={service.enabled}
                              onCheckedChange={(checked) => toggleService(service.id, checked)}
                              disabled={isToggleLoading || saving}
                              className={`data-[state=checked]:bg-primary ${isToggleLoading ? "opacity-50" : ""}`}
                            />
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Configuration Form */}
                <CollapsibleContent className='data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden'>
                  <Separator />
                  <div className='p-4 space-y-3 bg-muted/20'>
                    <div className='space-y-3'>
                      {serviceFields.map((field) => {
                        const fieldId = `${service.id}-${field.key}`;
                        const isPassword = field.type === "password";
                        const showPassword = passwordVisibility[fieldId] || false;

                        return (
                          <div key={field.key} className='space-y-1.5'>
                            <Label htmlFor={fieldId} className='text-xs font-medium'>
                              {field.label}
                              {field.required && <span className='text-destructive ml-1'>*</span>}
                            </Label>
                            <div className='relative'>
                              <Input
                                id={fieldId}
                                type={isPassword && !showPassword ? "password" : "text"}
                                placeholder={`Enter ${field.label}`}
                                value={serviceCredentials[field.key] || ""}
                                onChange={(e) => updateCredential(service.id, field.key, e.target.value)}
                                className='h-9 text-sm pr-9'
                              />
                              {isPassword && (
                                <button
                                  type='button'
                                  onClick={() => togglePasswordVisibility(fieldId)}
                                  className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                                >
                                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className='flex justify-end pt-2 border-t'>
                      <Button onClick={() => saveCredentials(service.id)} disabled={saving} size='sm' className='min-w-[100px]'>
                        {saving ? (
                          <>
                            <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                            Saving
                          </>
                        ) : (
                          <>
                            <Save className='mr-2 h-3 w-3' />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}

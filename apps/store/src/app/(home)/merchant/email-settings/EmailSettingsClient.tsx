"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type {
  EmailProviderConfig,
  EmailProviderSettings,
  EmailProviderType,
  PostmarkProviderConfig,
  SendGridProviderConfig,
  SesProviderConfig,
  SmtpProviderConfig,
} from "@/lib/email-types";
import { toast } from "sonner";
import { Loader2, Plug, Save, Send } from "lucide-react";
import { apiRequest } from "@/lib/api-client";

type ProviderForm = EmailProviderConfig;

const providerLabels: Record<EmailProviderType, string> = {
  smtp: "SMTP",
  ses: "Amazon SES",
  sendgrid: "SendGrid",
  postmark: "Postmark",
};

const providerDefaults: Record<EmailProviderType, Partial<EmailProviderConfig>> = {
  smtp: { host: "", port: 587, secure: false, name: "SMTP", enabled: true, provider: "smtp" } as Partial<SmtpProviderConfig>,
  ses: { region: "", name: "Amazon SES", enabled: true, provider: "ses" } as Partial<SesProviderConfig>,
  sendgrid: { apiKey: "", name: "SendGrid", enabled: true, provider: "sendgrid" } as Partial<SendGridProviderConfig>,
  postmark: { serverToken: "", name: "Postmark", enabled: true, provider: "postmark" } as Partial<PostmarkProviderConfig>,
};

export function EmailSettingsClient() {
  const [providers, setProviders] = useState<ProviderForm[]>([]);
  const [defaultProviderId, setDefaultProviderId] = useState<string | undefined>();
  const [fallbackProviderId, setFallbackProviderId] = useState<string | undefined>();
  const [newProviderType, setNewProviderType] = useState<EmailProviderType>("smtp");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testEmailInput, setTestEmailInput] = useState<Record<string, string>>({});

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<EmailProviderSettings>("GET", "/merchant/email-settings");
      setProviders(data.providers || []);
      setDefaultProviderId(data.defaultProviderId || data.providers?.[0]?.id);
      setFallbackProviderId(data.fallbackProviderId || undefined);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load email settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const upsertProvider = (id: string, patch: Partial<ProviderForm>) => {
    setProviders((prev) => prev.map((provider) => (provider.id === id ? ({ ...provider, ...patch } as ProviderForm) : provider)));
  };

  const addProvider = () => {
    const id = `provider_${newProviderType}_${Date.now()}`;
    const config: ProviderForm = {
      id,
      provider: newProviderType,
      name: providerLabels[newProviderType],
      enabled: true,
      ...providerDefaults[newProviderType],
      fromEmail: "",
      fromName: "",
      replyTo: "",
    } as ProviderForm;

    setProviders((prev) => [...prev, config]);
    if (!defaultProviderId) setDefaultProviderId(id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: EmailProviderSettings = {
        id: "email_providers_default",
        providers,
        defaultProviderId: defaultProviderId || providers[0]?.id,
        fallbackProviderId: fallbackProviderId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await apiRequest<EmailProviderSettings>("PUT", "/merchant/email-settings", payload);
      setProviders(saved.providers || []);
      setDefaultProviderId(saved.defaultProviderId || saved.providers?.[0]?.id);
      setFallbackProviderId(saved.fallbackProviderId || undefined);
      toast.success("Email settings saved");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save email settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) {
        toast.error("Provider not found");
        return;
      }

      // First test the connection
      const connectionData = await apiRequest<any>("POST", "/merchant/email-settings", { action: "test", providerId });

      if (!connectionData.ok) {
        throw new Error(connectionData.result?.error || "Connection test failed");
      }

      // If connection test passes, send a test email
      const testEmail = testEmailInput[providerId] || provider.fromEmail;
      if (!testEmail) {
        toast.error("Please enter a test email address in the 'From email' field or provide one below");
        return;
      }

      const emailData = await apiRequest<any>("POST", "/merchant/email-settings", { action: "send-test", providerId, to: testEmail });

      if (!emailData.ok) {
        const errorMsg = emailData?.result?.error || emailData?.error || "Failed to send test email";
        throw new Error(errorMsg);
      }

      toast.success(emailData.message || `Test email sent to ${testEmail}`);
    } catch (error: any) {
      console.error("Test error:", error);
      toast.error(error?.message || "Failed to test provider");
    } finally {
      setTestingId(null);
    }
  };

  const providerOptions = useMemo(() => providers.map((p) => ({ id: p.id, label: p.name || providerLabels[p.provider] })), [providers]);

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Plug className='w-4 h-4 text-muted-foreground' />
              Providers
            </CardTitle>
            <p className='text-sm text-muted-foreground'>Configure and choose which provider to use for sending.</p>
          </div>
          <div className='flex items-center gap-2'>
            <Select value={newProviderType} onValueChange={(v) => setNewProviderType(v as EmailProviderType)}>
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='Select provider' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='smtp'>SMTP</SelectItem>
                <SelectItem value='ses'>Amazon SES</SelectItem>
                <SelectItem value='sendgrid'>SendGrid</SelectItem>
                <SelectItem value='postmark'>Postmark</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline' onClick={addProvider}>
              Add provider
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {loading ? (
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Loader2 className='w-4 h-4 animate-spin' />
              Loading email settings...
            </div>
          ) : providers.length === 0 ? (
            <div className='text-sm text-muted-foreground'>No providers configured yet. Add one to get started.</div>
          ) : (
            <div className='space-y-4'>
              {providers.map((provider) => (
                <div key={provider.id} className='border rounded-lg p-4 space-y-3'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                    <div className='flex items-center gap-2'>
                      <Badge>{providerLabels[provider.provider]}</Badge>
                      <Input
                        className='w-52'
                        value={provider.name || ""}
                        onChange={(e) => upsertProvider(provider.id, { name: e.target.value })}
                        placeholder='Provider name'
                      />
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-2'>
                        <Switch
                          checked={provider.enabled !== false}
                          onCheckedChange={(checked) => upsertProvider(provider.id, { enabled: checked })}
                        />
                        <span className='text-sm'>{provider.enabled !== false ? "Enabled" : "Disabled"}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Input
                          type='email'
                          placeholder='Test email'
                          className='w-40'
                          value={testEmailInput[provider.id] || ""}
                          onChange={(e) => setTestEmailInput((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                        />
                        <Button variant='outline' size='sm' onClick={() => handleTest(provider.id)} disabled={testingId === provider.id}>
                          {testingId === provider.id ? (
                            <Loader2 className='w-4 h-4 animate-spin mr-2' />
                          ) : (
                            <Send className='w-4 h-4 mr-2' />
                          )}
                          Test
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {provider.provider === "smtp" && (
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                      <Field label='Host'>
                        <Input value={provider.host || ""} onChange={(e) => upsertProvider(provider.id, { host: e.target.value })} />
                      </Field>
                      <Field label='Port'>
                        <Input
                          type='number'
                          value={provider.port?.toString() || ""}
                          onChange={(e) => upsertProvider(provider.id, { port: Number(e.target.value) || 0 })}
                        />
                      </Field>
                      <Field label='Secure (SSL)'>
                        <div className='flex items-center gap-2 h-10 px-3 border rounded-md'>
                          <Switch
                            checked={!!provider.secure}
                            onCheckedChange={(checked) => upsertProvider(provider.id, { secure: checked })}
                          />
                          <span className='text-sm'>{provider.secure ? "Enabled" : "Disabled"}</span>
                        </div>
                      </Field>
                      <Field label='Username'>
                        <Input
                          value={provider.username || ""}
                          onChange={(e) => upsertProvider(provider.id, { username: e.target.value })}
                        />
                      </Field>
                      <Field label='Password'>
                        <Input
                          type='password'
                          placeholder='Leave blank to keep existing'
                          value={(provider as any).password || ""}
                          onChange={(e) => upsertProvider(provider.id, { password: e.target.value })}
                        />
                      </Field>
                    </div>
                  )}

                  {provider.provider === "ses" && (
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                      <Field label='Region'>
                        <Input value={provider.region || ""} onChange={(e) => upsertProvider(provider.id, { region: e.target.value })} />
                      </Field>
                      <Field label='Access Key ID'>
                        <Input
                          placeholder='Leave blank to keep existing'
                          value={(provider as any).accessKeyId || ""}
                          onChange={(e) => upsertProvider(provider.id, { accessKeyId: e.target.value })}
                        />
                      </Field>
                      <Field label='Secret Access Key'>
                        <Input
                          type='password'
                          placeholder='Leave blank to keep existing'
                          value={(provider as any).secretAccessKey || ""}
                          onChange={(e) => upsertProvider(provider.id, { secretAccessKey: e.target.value })}
                        />
                      </Field>
                    </div>
                  )}

                  {provider.provider === "sendgrid" && (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <Field label='API Key'>
                        <Input
                          type='password'
                          placeholder='Leave blank to keep existing'
                          value={(provider as any).apiKey || ""}
                          onChange={(e) => upsertProvider(provider.id, { apiKey: e.target.value })}
                        />
                      </Field>
                    </div>
                  )}

                  {provider.provider === "postmark" && (
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                      <Field label='Server Token'>
                        <Input
                          type='password'
                          placeholder='Leave blank to keep existing'
                          value={(provider as any).serverToken || ""}
                          onChange={(e) => upsertProvider(provider.id, { serverToken: e.target.value })}
                        />
                      </Field>
                      <Field label='Message Stream (optional)'>
                        <Input
                          placeholder='outbound'
                          value={(provider as any).messageStream || ""}
                          onChange={(e) => upsertProvider(provider.id, { messageStream: e.target.value })}
                        />
                      </Field>
                    </div>
                  )}

                  <Separator />

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                    <Field label='From name'>
                      <Input value={provider.fromName || ""} onChange={(e) => upsertProvider(provider.id, { fromName: e.target.value })} />
                    </Field>
                    <Field label='From email'>
                      <Input
                        value={provider.fromEmail || ""}
                        onChange={(e) => upsertProvider(provider.id, { fromEmail: e.target.value })}
                      />
                    </Field>
                    <Field label='Reply-to'>
                      <Input value={provider.replyTo || ""} onChange={(e) => upsertProvider(provider.id, { replyTo: e.target.value })} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Routing</CardTitle>
          <p className='text-sm text-muted-foreground'>Choose which provider is used by default and optionally a fallback.</p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Default provider</Label>
              <Select value={defaultProviderId || ""} onValueChange={(v) => setDefaultProviderId(v || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select default' />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Fallback provider</Label>
              <Select value={fallbackProviderId || "none"} onValueChange={(v) => setFallbackProviderId(v === "none" ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder='Optional fallback' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>None</SelectItem>
                  {providerOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || loading || providers.length === 0}>
            {saving ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : <Save className='w-4 h-4 mr-2' />}
            Save settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditorRef } from "react-email-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmailTemplate, EmailEvent, emailEvents, defaultEmailTemplates } from "@/lib/email-types";
import { toast } from "sonner";
import { Loader2, Play, Save, Send, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api-client";

// Lazy load the email editor only when needed (it's a heavy component)
const EmailEditor = dynamic(() => import("react-email-editor"), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center h-full text-muted-foreground'>
      <Loader2 className='w-5 h-5 animate-spin mr-2' />
      Loading editor...
    </div>
  ),
});

type TemplateMap = Partial<Record<EmailEvent, EmailTemplate>>;

const DEFAULT_EVENT: EmailEvent = "order_confirmation";

export function EmailTemplatesClient() {
  const editorRef = useRef<EditorRef>(null);
  const [templates, setTemplates] = useState<TemplateMap>({});
  const [selectedEvent, setSelectedEvent] = useState<EmailEvent>(DEFAULT_EVENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [editorLoaded, setEditorLoaded] = useState(false); // Track if editor should be loaded

  const currentTemplate = useMemo(() => templates[selectedEvent], [templates, selectedEvent]);
  const availableVariables = useMemo(() => defaultEmailTemplates[selectedEvent]?.variables || [], [selectedEvent]);

  const [form, setForm] = useState({
    subject: "",
    fromName: "",
    fromEmail: "",
    replyTo: "",
    previewText: "",
    testRecipient: "",
    enabled: true,
  });

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any>("GET", "/merchant/email-templates");
      const list: EmailTemplate[] = data.templates || [];
      const map: TemplateMap = {};
      list.forEach((tpl) => {
        map[tpl.event] = tpl;
      });
      setTemplates(map);
      if (list.length && !selectedEvent) {
        setSelectedEvent(list[0].event);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []); // Remove selectedEvent dependency to prevent unnecessary reloads

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!currentTemplate) return;
    setForm({
      subject: currentTemplate.subject || defaultEmailTemplates[selectedEvent].subject,
      fromName: currentTemplate.fromName || "",
      fromEmail: currentTemplate.fromEmail || "",
      replyTo: currentTemplate.replyTo || "",
      previewText: currentTemplate.previewText || "",
      testRecipient: currentTemplate.testRecipient || currentTemplate.fromEmail || "",
      enabled: currentTemplate.enabled !== false,
    });
  }, [currentTemplate, selectedEvent]);

  useEffect(() => {
    // Only load design if editor is ready and we have a design to load
    if (editorReady && currentTemplate?.design && editorRef.current?.editor) {
      // Debounce design loading to avoid rapid updates
      const timeoutId = setTimeout(() => {
        try {
          editorRef.current?.editor?.loadDesign(currentTemplate.design as any);
        } catch (error) {
          console.error("Failed to load design:", error);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [editorReady, currentTemplate?.design]); // Only depend on design, not entire template

  const exportCurrentDesign = useCallback(
    () =>
      new Promise<{ html: string; design: any }>((resolve) => {
        if (editorReady && editorRef.current?.editor) {
          editorRef.current.editor.exportHtml((data) => resolve({ html: data.html, design: data.design }));
        } else {
          resolve({ html: currentTemplate?.html || "", design: currentTemplate?.design || null });
        }
      }),
    [editorReady, currentTemplate]
  );

  const handleSave = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const { html, design } = await exportCurrentDesign();
      const payload = {
        ...currentTemplate,
        event: selectedEvent,
        subject: form.subject,
        fromName: form.fromName,
        fromEmail: form.fromEmail,
        replyTo: form.replyTo,
        previewText: form.previewText,
        enabled: form.enabled,
        testRecipient: form.testRecipient,
        html,
        design,
      };

      const updated = await apiRequest<EmailTemplate>("PUT", "/merchant/email-templates", payload);
      setTemplates((prev) => ({ ...prev, [selectedEvent]: updated }));
      toast.success("Template saved");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!form.testRecipient) {
      toast.error("Add a test recipient email first");
      return;
    }
    setSendingTest(true);
    try {
      const { html, design } = await exportCurrentDesign();
      const data = await apiRequest<any>("POST", "/merchant/email-templates", {
        action: "test",
        event: selectedEvent,
        to: form.testRecipient,
        variables: Object.fromEntries(availableVariables.map((v) => [v, `{{${v}}}`])),
        html,
        design,
      });

      if (!data.ok) {
        const errorMsg = data?.result?.error || data?.error || "Failed to send test email";
        throw new Error(errorMsg);
      }

      toast.success(data?.message || `Test email sent to ${form.testRecipient}`);
    } catch (error: any) {
      console.error("Test email error:", error);
      toast.error(error?.message || "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  const eventList = useMemo(() => emailEvents.map((event) => ({ event, ...defaultEmailTemplates[event] })), []);

  const renderStatus = (tpl?: EmailTemplate) => {
    const enabled = tpl?.enabled !== false;
    return (
      <Badge variant={enabled ? "default" : "secondary"} className='text-[11px]'>
        {enabled ? "Enabled" : "Disabled"}
      </Badge>
    );
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6'>
      <Card className='lg:col-span-1 h-full'>
        <CardHeader>
          <CardTitle className='text-base'>Events</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <ScrollArea className='h-[70vh]'>
            <div className='divide-y'>
              {eventList.map((item) => {
                const tpl = templates[item.event];
                const isActive = item.event === selectedEvent;
                return (
                  <button
                    key={item.event}
                    onClick={() => {
                      setSelectedEvent(item.event);
                      setEditorReady(false);
                      setEditorLoaded(true); // Load editor when user selects a template
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-muted transition ${isActive ? "bg-muted/70" : ""}`}
                  >
                    <div className='flex items-center justify-between'>
                      <p className='font-semibold text-sm'>{item.name}</p>
                      {renderStatus(tpl)}
                    </div>
                    <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>{item.description}</p>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className='lg:col-span-3 space-y-4'>
        <Card>
          <CardHeader className='pb-4'>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle className='text-lg'>{defaultEmailTemplates[selectedEvent]?.name}</CardTitle>
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' onClick={handleTestSend} disabled={sendingTest || loading}>
                  {sendingTest ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : <Send className='w-4 h-4 mr-2' />}
                  Send test
                </Button>
                <Button onClick={handleSave} disabled={saving || loading}>
                  {saving ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : <Save className='w-4 h-4 mr-2' />}
                  Save template
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder='Subject line'
                />
              </div>
              <div className='space-y-2'>
                <Label>Preview text</Label>
                <Input
                  value={form.previewText}
                  onChange={(e) => setForm((prev) => ({ ...prev, previewText: e.target.value }))}
                  placeholder='Optional preview text'
                />
              </div>
              <div className='space-y-2'>
                <Label>From name</Label>
                <Input
                  value={form.fromName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fromName: e.target.value }))}
                  placeholder='Store name'
                />
              </div>
              <div className='space-y-2'>
                <Label>From email</Label>
                <Input
                  value={form.fromEmail}
                  onChange={(e) => setForm((prev) => ({ ...prev, fromEmail: e.target.value }))}
                  placeholder='noreply@yourstore.com'
                />
              </div>
              <div className='space-y-2'>
                <Label>Reply-to</Label>
                <Input
                  value={form.replyTo}
                  onChange={(e) => setForm((prev) => ({ ...prev, replyTo: e.target.value }))}
                  placeholder='support@yourstore.com'
                />
              </div>
              <div className='space-y-2'>
                <Label>Test recipient</Label>
                <Input
                  value={form.testRecipient}
                  onChange={(e) => setForm((prev) => ({ ...prev, testRecipient: e.target.value }))}
                  placeholder='you@example.com'
                />
              </div>
            </div>

            <div className='flex items-center justify-between gap-3 border rounded-lg px-3 py-2.5'>
              <div className='space-y-1'>
                <p className='text-sm font-medium'>Template status</p>
                <p className='text-xs text-muted-foreground'>Disable to pause sending this email for the selected event.</p>
              </div>
              <div className='flex items-center gap-2'>
                <Switch checked={form.enabled} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))} />
                <span className='text-sm font-medium'>{form.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>

            <div className='border rounded-lg p-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-semibold'>Available variables</p>
                <p className='text-xs text-muted-foreground'>Use as {"{{variable}}"} in your template</p>
              </div>
              <div className='flex flex-wrap gap-2'>
                {availableVariables.map((v) => (
                  <span key={v} className='text-xs px-2 py-1 rounded-full bg-muted text-foreground border'>
                    {`{{${v}}}`}
                  </span>
                ))}
                {availableVariables.length === 0 && (
                  <span className='text-xs text-muted-foreground'>No variables defined for this event.</span>
                )}
              </div>
            </div>

            <Separator />

            <div className='border rounded-lg overflow-hidden'>
              <div className='flex items-center justify-between px-4 py-2 border-b bg-muted/40'>
                <div className='flex items-center gap-2'>
                  <Play className='w-4 h-4 text-muted-foreground' />
                  <span className='text-sm font-medium'>Template designer</span>
                </div>
                {!editorReady && <Badge variant='secondary'>Loading editor...</Badge>}
              </div>
              <div className='h-[600px]'>
                {loading ? (
                  <div className='flex items-center justify-center h-full text-muted-foreground'>
                    <Loader2 className='w-5 h-5 animate-spin mr-2' />
                    Loading templates...
                  </div>
                ) : !editorLoaded ? (
                  <div className='flex items-center justify-center h-full text-muted-foreground'>
                    <p className='text-sm'>Select a template event to start editing</p>
                  </div>
                ) : (
                  <EmailEditor
                    ref={editorRef}
                    onReady={(unlayer) => {
                      setEditorReady(true);
                      if (currentTemplate?.design) {
                        unlayer.loadDesign(currentTemplate.design as any);
                      }
                    }}
                    minHeight='560px'
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <CheckCircle2 className='w-4 h-4' />
          Templates are saved per event. Use “Send test” to validate styling and sender before going live.
        </div>
      </div>
    </div>
  );
}

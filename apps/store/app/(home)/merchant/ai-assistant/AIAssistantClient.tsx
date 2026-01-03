"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bot,
  Send,
  Sparkles,
  User,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  ShoppingBag,
  BarChart3,
  AlertCircle,
  Trash2,
  MessageSquare,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Clock,
  Boxes,
  Truck,
  XCircle,
  Wallet,
  PieChart,
  CreditCard,
  Percent,
  ChevronDown,
  ChevronUp,
  Calculator,
} from "lucide-react";
import { useCurrencySymbol } from "@/hooks/use-currency";
import type { AIAssistantData } from "@/lib/ai-types";
import { apiRequest } from "@/lib/api-client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Props {
  brandName: string;
}

interface StoreAlert {
  type: "urgent" | "warning" | "opportunity" | "success";
  title: string;
  metric?: string;
}

const quickActions = [
  { label: "Analyze Sales", icon: TrendingUp, prompt: "Analyze my sales performance for the last 30 days." },
  { label: "Inventory Check", icon: Package, prompt: "Which products are low on stock?" },
  { label: "Marketing Ideas", icon: Sparkles, prompt: "Give me 3 marketing ideas to boost sales." },
  { label: "Customer Insights", icon: Users, prompt: "Tell me about my customer retention rate." },
];

function generateAlerts(data: AIAssistantData): StoreAlert[] {
  const alerts: StoreAlert[] = [];

  // Urgent: Out of stock
  if (data.products.outOfStockCount > 0) {
    alerts.push({
      type: "urgent",
      title: `${data.products.outOfStockCount} products get out of stock`,
    });
  }

  // Warning: Low stock
  if (data.products.lowStockCount > 0) {
    alerts.push({
      type: "warning",
      title: `${data.products.lowStockCount} products are running low`,
    });
  }

  // Warning: High pending orders
  const pendingRate = data.orders.total > 0 ? (data.orders.pending / data.orders.total) * 100 : 0;
  if (pendingRate > 20) {
    alerts.push({
      type: "warning",
      title: `High pending orders (${Math.round(pendingRate)}%)`,
    });
  }

  // Opportunity: High growth
  if (data.revenue.growth > 15) {
    alerts.push({
      type: "opportunity",
      title: `Revenue up ${data.revenue.growth}% this month!`,
    });
  }

  // Opportunity: High cart abandonment (proxy via conversion if available, or just general tip)
  // For now, simplify.

  // Success: High orders today
  if (data.orders.todayCount > 5) { // Arbitrary threshold
    alerts.push({
      type: "success",
      title: `${data.orders.todayCount} orders received today`,
    });
  }

  return alerts;
}

export function AIAssistantClient({ brandName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [storeData, setStoreData] = useState<AIAssistantData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currencySymbol = useCurrencySymbol();
  const [showAllStats, setShowAllStats] = useState(false);
  const [alerts, setAlerts] = useState<StoreAlert[]>([]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Load store data on mount
  const loadStoreData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);
    try {
      const result = await apiRequest<{ data: AIAssistantData }>("GET", "/ai-assistant/data");
      // Assuming apiRequest returns { success: true, data: ... } or just raw data depending on implementation
      // Based on controller: sendResponse emits { success: true, statusCode, message, data }
      // apiRequest usually returns the response body directly if T is correct?
      // Let's assume result is the response body.
      const responseBody = result as any;
      const data = responseBody.data || responseBody;

      if (data) {
        setStoreData(data);
        setAlerts(generateAlerts(data));
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (error: any) {
      console.error("Error loading store data:", error);
      setDataError(error.message || "Failed to load store data");
      toast.error("Failed to load store data");
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Send message
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || !storeData) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await apiRequest<{ response: string }>("POST", "/ai-assistant/chat", {
        message: messageText.trim(),
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        data: storeData,
      });

      const responseBody = result as any;
      const aiResponse = responseBody.data?.response || responseBody.response;

      if (aiResponse) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("Invalid response from AI");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.slice(0, -1)); // Remove failed message
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    toast.success("Chat cleared");
  };

  // Format message content with markdown-like styling (compact)
  const formatMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, partIndex) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const code = part.slice(3, -3).replace(/^[a-z]*\n/, "");
        return (
          <pre key={partIndex} className='bg-muted/50 dark:bg-muted/20 p-2 rounded-md overflow-x-auto text-[10px] my-1 border'>
            <code>{code}</code>
          </pre>
        );
      }
      return (
        <span key={partIndex}>
          {part.split("\n").map((line, lineIndex) => {
            if (line.startsWith("### ")) return <h4 key={lineIndex} className='font-semibold text-xs mt-2 mb-0.5'>{line.slice(4)}</h4>;
            if (line.startsWith("## ")) return <h3 key={lineIndex} className='font-semibold text-xs mt-2 mb-0.5'>{line.slice(3)}</h3>;
            if (line.startsWith("# ")) return <h2 key={lineIndex} className='font-bold text-xs mt-2 mb-0.5'>{line.slice(2)}</h2>;
            if (line.startsWith("- ") || line.startsWith("* ")) return <div key={lineIndex} className='flex items-start gap-1 ml-1 my-0'><span className='text-primary text-[10px]'>•</span><span className='flex-1' dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} /></div>;
            const numberedMatch = line.match(/^(\d+)\.\s/);
            if (numberedMatch) return <div key={lineIndex} className='flex items-start gap-1 ml-1 my-0'><span className='text-primary font-medium text-[10px] min-w-4'>{numberedMatch[1]}.</span><span className='flex-1' dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(numberedMatch[0].length)) }} /></div>;
            if (line.startsWith("→ ") || line.startsWith("-> ")) return <div key={lineIndex} className='flex items-start gap-1 ml-2 my-0 text-primary'><span>→</span><span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} /></div>;
            if (line.trim()) return <p key={lineIndex} className='my-0.5' dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />;
            return null;
          })}
        </span>
      );
    });
  };

  const formatInlineMarkdown = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
  };

  const getAlertIcon = (type: StoreAlert["type"]) => {
    switch (type) {
      case "urgent": return <AlertCircle className='h-4 w-4' />;
      case "warning": return <AlertTriangle className='h-4 w-4' />;
      case "opportunity": return <Lightbulb className='h-4 w-4' />;
      case "success": return <CheckCircle className='h-4 w-4' />;
    }
  };

  const getAlertColors = (type: StoreAlert["type"]) => {
    switch (type) {
      case "urgent": return "border-red-500/50 bg-red-500/5 text-red-700 dark:text-red-400";
      case "warning": return "border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-400";
      case "opportunity": return "border-blue-500/50 bg-blue-500/5 text-blue-700 dark:text-blue-400";
      case "success": return "border-emerald-500/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400";
    }
  };

  return (
    <div className='w-full max-w-full flex flex-col h-screen lg:h-[calc(100vh-6rem)]'>
      {/* Mobile: Full Screen Messenger Style */}
      <div className='lg:hidden flex flex-col h-screen w-full bg-background overflow-hidden'>
        <div className='flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-sm shrink-0 safe-area-top'>
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            <div className='w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-md'>
              <Bot className='h-5 w-5 text-primary-foreground' />
            </div>
            <div className='flex-1 min-w-0'>
              <h1 className='text-base font-semibold text-foreground'>AI Business Advisor</h1>
              <p className='text-xs text-muted-foreground truncate'>{brandName}</p>
            </div>
          </div>
          <div className='flex items-center gap-1 shrink-0'>
            <Button variant='ghost' size='icon' onClick={loadStoreData} disabled={isDataLoading} className='h-10 w-10 rounded-full'>
              {isDataLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <RefreshCw className='h-4 w-4' />}
            </Button>
            {messages.length > 0 && (
              <Button variant='ghost' size='icon' onClick={clearChat} className='h-10 w-10 rounded-full'>
                <Trash2 className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>

        {isDataLoading ? (
          <div className='flex-1 flex items-center justify-center p-6'>
            <div className='text-center'>
              <Loader2 className='h-8 w-8 animate-spin text-primary mx-auto mb-3' />
              <p className='text-sm text-muted-foreground'>Loading your store data...</p>
            </div>
          </div>
        ) : dataError ? (
          <div className='flex-1 flex items-center justify-center p-6'>
            <div className='text-center'>
              <AlertCircle className='h-8 w-8 text-destructive mx-auto mb-3' />
              <p className='text-sm text-destructive mb-2'>Failed to load data</p>
              <Button variant='outline' size='sm' onClick={loadStoreData}>
                <RefreshCw className='h-4 w-4 mr-2' />
                Retry
              </Button>
            </div>
          </div>
        ) : storeData ? (
          <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
            <div className='flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/10 px-4 py-4'>
              {messages.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-full text-center px-4'>
                  <div className='w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-5 shadow-lg'>
                    <Bot className='h-10 w-10 text-primary-foreground' />
                  </div>
                  <h2 className='text-xl font-bold mb-2'>AI Business Advisor</h2>
                  <p className='text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed'>
                    I've analyzed your store data. Ask me anything about your business performance!
                  </p>
                  <div className='space-y-3 w-full max-w-sm'>
                    <Button
                      variant='default'
                      className='w-full justify-start h-auto py-4 px-5 text-base shadow-md'
                      onClick={() => sendMessage("What are the top 3 things I should focus on today?")}
                    >
                      <Target className='h-5 w-5 mr-3' />
                      What should I do today?
                    </Button>
                    {quickActions.slice(0, 4).map((action) => (
                      <Button
                        key={action.label}
                        variant='outline'
                        className='w-full justify-start h-auto py-3.5 px-5 text-sm border-2'
                        onClick={() => sendMessage(action.prompt)}
                      >
                        <action.icon className='h-4 w-4 mr-3' />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='space-y-4 pb-4'>
                  {messages.map((message, index) => (
                    <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      {message.role === "assistant" && (
                        <div className='w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-md'>
                          <Bot className='h-5 w-5 text-primary-foreground' />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-md"
                          : "bg-background border-2 rounded-tl-md"
                          }`}
                      >
                        <div
                          className={`text-sm leading-relaxed ${message.role === "user" ? "" : "prose prose-sm dark:prose-invert max-w-none"
                            }`}
                        >
                          {message.role === "user" ? message.content : formatMessageContent(message.content)}
                        </div>
                        <div
                          className={`text-[10px] mt-2 opacity-70 ${message.role === "user" ? "text-primary-foreground/80" : "text-muted-foreground"
                            }`}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      {message.role === "user" && (
                        <div className='w-9 h-9 rounded-full bg-muted flex items-center justify-center border-2 shrink-0'>
                          <User className='h-5 w-5 text-muted-foreground' />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className='flex gap-3 justify-start'>
                      <div className='w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-md'>
                        <Bot className='h-5 w-5 text-primary-foreground' />
                      </div>
                      <div className='bg-background border-2 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm'>
                        <div className='flex items-center gap-2'>
                          <Loader2 className='h-4 w-4 animate-spin text-primary' />
                          <span className='text-sm text-muted-foreground'>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className='border-t bg-background/95 backdrop-blur-sm px-4 py-3 shrink-0 safe-area-bottom'>
              <form onSubmit={handleSubmit} className='flex items-end gap-3'>
                <div className='flex-1 rounded-full border-2 bg-muted/50 focus-within:border-primary transition-colors'>
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder='Type a message...'
                    disabled={isLoading}
                    className='min-h-[44px] max-h-[120px] resize-none text-sm flex-1 border-0 bg-transparent rounded-full px-4 py-2.5 focus-visible:ring-0 focus-visible:ring-offset-0'
                    rows={1}
                  />
                </div>
                <Button
                  type='submit'
                  size='icon'
                  disabled={!input.trim() || isLoading}
                  className='h-11 w-11 shrink-0 rounded-full shadow-md disabled:opacity-50'
                >
                  {isLoading ? <Loader2 className='h-5 w-5 animate-spin' /> : <Send className='h-5 w-5' />}
                </Button>
              </form>
            </div>
          </div>
        ) : null}
      </div>

      {/* Desktop: Original Layout */}
      <div className='hidden lg:flex flex-col h-full'>
        <div className='shrink-0 space-y-2 sm:space-y-3 p-2 sm:p-4 pb-2 sm:pb-3'>
          <div className='flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10'>
            <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1'>
              <div className='p-1.5 sm:p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow shrink-0'>
                <Bot className='h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary-foreground' />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-sm sm:text-base md:text-lg font-bold text-foreground flex items-center gap-1 sm:gap-2'>
                  <span className='truncate'>AI Business Advisor</span>
                  <Badge variant='secondary' className='text-[9px] sm:text-[10px] font-medium px-1 sm:px-1.5 py-0 shrink-0'>
                    Gemini
                  </Badge>
                </h1>
                <p className='text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate'>{brandName}</p>
              </div>
            </div>
            <div className='flex items-center gap-1 sm:gap-1.5 shrink-0'>
              <Button
                variant='outline'
                size='sm'
                onClick={loadStoreData}
                disabled={isDataLoading}
                className='h-6 sm:h-7 px-1.5 sm:px-2 text-[9px] sm:text-[10px]'
              >
                {isDataLoading ? <Loader2 className='h-3 w-3 animate-spin' /> : <RefreshCw className='h-3 w-3' />}
                <span className='hidden sm:inline ml-1'>Refresh</span>
              </Button>
              {messages.length > 0 && (
                <Button variant='outline' size='sm' onClick={clearChat} className='h-6 sm:h-7 px-1.5 sm:px-2 text-[9px] sm:text-[10px]'>
                  <Trash2 className='h-3 w-3' />
                </Button>
              )}
            </div>
          </div>
        </div>

        {isDataLoading && (
          <Card className='border-dashed mx-4'>
            <CardContent className='p-3 sm:p-4 md:p-6'>
              <div className='flex items-center gap-2 sm:gap-4'>
                <Loader2 className='h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary shrink-0' />
                <div className='min-w-0 flex-1'>
                  <p className='font-medium text-sm sm:text-base'>Analyzing your store data...</p>
                  <p className='text-xs sm:text-sm text-muted-foreground'>Preparing personalized insights for you</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {dataError && !isDataLoading && (
          <Card className='border-destructive mx-4'>
            <CardContent className='p-3 sm:p-4 md:p-6'>
              <div className='flex items-center gap-2 sm:gap-4'>
                <AlertCircle className='h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0' />
                <div className='min-w-0 flex-1'>
                  <p className='font-medium text-sm sm:text-base text-destructive'>Failed to load store data</p>
                  <p className='text-xs sm:text-sm text-muted-foreground truncate'>{dataError}</p>
                </div>
                <Button variant='outline' size='sm' onClick={loadStoreData} className='ml-auto shrink-0 h-8 sm:h-9'>
                  <RefreshCw className='h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2' />
                  <span className='hidden sm:inline'>Retry</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {storeData && !isDataLoading && (
          <>
            <Card className='flex-shrink-0 mx-4'>
              <CardHeader className='py-1.5 sm:py-2 px-2 sm:px-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5'>
                    <PieChart className='h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary' />
                    <span className='hidden sm:inline'>Store Analytics</span>
                    <span className='sm:hidden'>Analytics</span>
                  </CardTitle>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowAllStats(!showAllStats)}
                    className='h-5 sm:h-6 px-1.5 sm:px-2 gap-0.5 sm:gap-1 text-[9px] sm:text-[10px]'
                  >
                    {showAllStats ? "Less" : "More"}
                    {showAllStats ? (
                      <ChevronUp className='h-2.5 w-2.5 sm:h-3 sm:w-3' />
                    ) : (
                      <ChevronDown className='h-2.5 w-2.5 sm:h-3 sm:w-3' />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='px-2 sm:px-3 pb-2 sm:pb-3 pt-0'>
                <div className='overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0'>
                  <div className='grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 sm:gap-2 min-w-max sm:min-w-0'>
                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Revenue</span>
                      <span className='text-[10px] sm:text-xs font-bold truncate'>
                        {currencySymbol}
                        {storeData.revenue.total.toLocaleString()}
                      </span>
                    </div>

                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Today</span>
                      <span className='text-[10px] sm:text-xs font-bold truncate'>
                        {currencySymbol}
                        {storeData.revenue.today.toLocaleString()}
                      </span>
                    </div>

                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Month</span>
                      <span className='text-[10px] sm:text-xs font-bold truncate'>
                        {currencySymbol}
                        {storeData.revenue.thisMonth.toLocaleString()}
                      </span>
                    </div>

                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Growth</span>
                      <span
                        className={`text-[10px] sm:text-xs font-bold ${storeData.revenue.growth >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {storeData.revenue.growth >= 0 ? "+" : ""}
                        {storeData.revenue.growth}%
                      </span>
                    </div>

                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Orders</span>
                      <span className='text-[10px] sm:text-xs font-bold'>{storeData.orders.total}</span>
                    </div>

                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Customers</span>
                      <span className='text-[10px] sm:text-xs font-bold'>{storeData.customers.total}</span>
                    </div>

                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Profit</span>
                      <span
                        className={`text-[10px] sm:text-xs font-bold truncate ${storeData.profit.netProfit >= 0 ? "" : "text-red-600"}`}
                      >
                        {currencySymbol}
                        {storeData.profit.netProfit.toLocaleString()}
                      </span>
                    </div>

                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Margin</span>
                      <span className={`text-[10px] sm:text-xs font-bold ${storeData.profit.profitMargin >= 0 ? "" : "text-red-600"}`}>
                        {storeData.profit.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {showAllStats && (
                  <div className='space-y-2 sm:space-y-3 pt-2 sm:pt-3 mt-2 border-t'>
                    <div className='flex flex-wrap gap-1 sm:gap-1.5'>
                      {/* Detailed badges */}
                      <Badge variant='outline' className='text-[9px] sm:text-[10px] bg-amber-50 dark:bg-amber-900/20 border-amber-300 text-amber-700 dark:text-amber-400 px-1.5 sm:px-2 py-0.5'>
                        Pending: {storeData.orders.pending}
                      </Badge>
                      <Badge variant='outline' className='text-[9px] sm:text-[10px] bg-blue-50 dark:bg-blue-900/20 border-blue-300 text-blue-700 dark:text-blue-400 px-1.5 sm:px-2 py-0.5'>
                        Processing: {storeData.orders.processing}
                      </Badge>
                      {/* ... more badges if needed ... */}
                      <Badge variant='outline' className='text-[9px] sm:text-[10px] bg-red-50 dark:bg-red-900/20 border-red-300 text-red-700 dark:text-red-400 px-1.5 sm:px-2 py-0.5'>
                        Cancelled: {storeData.orders.cancelled}
                      </Badge>
                    </div>

                    <div className='overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0'>
                      <div className='grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-1.5 min-w-max sm:min-w-0'>
                        {/* Additional metrics */}
                        <div className='p-1 sm:p-1.5 rounded-md bg-muted/30 border text-center min-w-[70px] sm:min-w-0'>
                          <span className='text-[7px] sm:text-[8px] text-muted-foreground block'>Low Stock</span>
                          <span className='text-[9px] sm:text-[10px] font-semibold text-amber-700'>{storeData.products.lowStockCount}</span>
                        </div>
                        <div className='p-1 sm:p-1.5 rounded-md bg-muted/30 border text-center min-w-[70px] sm:min-w-0'>
                          <span className='text-[7px] sm:text-[8px] text-muted-foreground block'>Out Stock</span>
                          <span className='text-[9px] sm:text-[10px] font-semibold text-red-700'>{storeData.products.outOfStockCount}</span>
                        </div>
                      </div>
                    </div>

                    {storeData.topProducts.length > 0 && (
                      <div>
                        <span className='text-[8px] sm:text-[9px] text-muted-foreground font-medium'>Top Products:</span>
                        <div className='flex flex-wrap gap-1 sm:gap-1.5 mt-1'>
                          {storeData.topProducts.slice(0, 3).map((p, i) => (
                            <Badge key={i} variant='secondary' className='text-[8px] sm:text-[9px] px-1.5 py-0.5'>
                              {p.name.slice(0, 20)}: {p.totalSold} sold
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {storeData && !isDataLoading && (
          <div className='flex-1 min-h-0 flex flex-col px-2 sm:px-4 pb-2 sm:pb-4 overflow-hidden'>
            <div className='flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-4 gap-2 sm:gap-3 overflow-hidden'>
              <div className='hidden lg:flex lg:col-span-1 flex-col min-h-0 max-h-full overflow-hidden'>
                <ScrollArea className='flex-1 h-full'>
                  <div className='space-y-2 sm:space-y-3 pr-2'>
                    {alerts.length > 0 && (
                      <Card>
                        <CardHeader className='py-2 px-3'>
                          <CardTitle className='text-xs font-semibold flex items-center gap-1.5'>
                            <Target className='h-3.5 w-3.5 text-primary' />
                            Alerts
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='px-3 pb-3 pt-0 space-y-1.5'>
                          {alerts.map((alert, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded-md border ${getAlertColors(
                                alert.type
                              )} cursor-pointer hover:opacity-80 transition-opacity`}
                              onClick={() => sendMessage(`${alert.title} - what should I do?`)}
                            >
                              <div className='flex items-center gap-1.5'>
                                {getAlertIcon(alert.type)}
                                <p className='text-[10px] font-medium truncate flex-1'>{alert.title}</p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader className='py-2 px-3'>
                        <CardTitle className='text-xs font-semibold flex items-center gap-1.5'>
                          <Zap className='h-3.5 w-3.5 text-primary' />
                          Quick Ask
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='px-3 pb-3 pt-0 grid grid-cols-2 lg:grid-cols-1 gap-1.5'>
                        {quickActions.map((action) => (
                          <Button
                            key={action.label}
                            variant='outline'
                            size='sm'
                            className='justify-start text-[10px] h-7 px-2 hover:bg-primary/5'
                            onClick={() => sendMessage(action.prompt)}
                            disabled={isLoading}
                          >
                            <action.icon className='h-3 w-3 mr-1.5 shrink-0 text-primary' />
                            <span className='truncate'>{action.label}</span>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>

              <Card className='lg:col-span-3 flex flex-col min-h-0 border-0 shadow-none lg:border lg:shadow-sm'>
                <CardContent className='flex-1 p-0 flex flex-col min-h-0'>
                  <ScrollArea className='flex-1 p-3 sm:p-4'>
                    {messages.length === 0 ? (
                      <div className='h-full flex flex-col items-center justify-center text-center p-4 space-y-4 text-muted-foreground'>
                        <div className='p-3 sm:p-4 rounded-full bg-primary/10'>
                          <Bot className='h-6 w-6 sm:h-8 sm:w-8 text-primary' />
                        </div>
                        <div className='max-w-[280px] sm:max-w-sm'>
                          <p className='text-xs sm:text-sm font-medium text-foreground mb-1'>
                            How can I help you today?
                          </p>
                          <p className='text-[10px] sm:text-xs'>
                            I can analyze your store's performance, suggest improvements, or help with business decisions.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className='space-y-3 sm:space-y-4'>
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {message.role === "assistant" && (
                              <div className='p-1.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5'>
                                <Bot className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary' />
                              </div>
                            )}
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm ${message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}
                            >
                              <div className={`prose prose-xs dark:prose-invert max-w-none ${message.role === "user" ? "text-primary-foreground" : ""}`}>
                                {message.role === "user" ? (
                                  message.content
                                ) : (
                                  formatMessageContent(message.content)
                                )}
                              </div>
                              <div className={`text-[9px] sm:text-[10px] mt-1 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            {message.role === "user" && (
                              <div className='p-1.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5'>
                                <User className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground' />
                              </div>
                            )}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                        {isLoading && (
                          <div className='flex gap-2 sm:gap-3 justify-start'>
                            <div className='p-1.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5'>
                              <Bot className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary' />
                            </div>
                            <div className='bg-muted rounded-lg px-3 py-2 flex items-center gap-2'>
                              <Loader2 className='h-3 w-3 animate-spin' />
                              <span className='text-xs text-muted-foreground'>Analyzing...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                  <div className='p-2 sm:p-3 border-t bg-background'>
                    <form onSubmit={handleSubmit} className='flex gap-2'>
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder='Ask about sales, products, or customers...'
                        className='min-h-[36px] sm:min-h-[40px] max-h-[100px] flex-1 resize-none'
                        rows={1}
                        disabled={isLoading}
                      />
                      <Button type='submit' size='icon' disabled={!input.trim() || isLoading} className='h-9 w-9 sm:h-10 sm:w-10 shrink-0'>
                        {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

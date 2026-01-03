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
import type { AIAssistantData } from "@/app/api/ai-assistant/data/route";

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
  description: string;
  action?: string;
}

const quickActions = [
  {
    label: "What should I do today?",
    prompt: "Based on my current store data, what are the top 3 things I should focus on today to improve my business?",
    icon: Target,
  },
  {
    label: "How's my store health?",
    prompt: "Give me a comprehensive health check of my store. What's working well and what needs immediate attention?",
    icon: BarChart3,
  },
  { label: "Revenue Analysis", prompt: "Analyze my revenue trends and give me actionable suggestions to increase sales", icon: DollarSign },
  { label: "Order Fulfillment", prompt: "What's the status of my orders? Are there any bottlenecks I should address?", icon: Package },
  {
    label: "Customer Insights",
    prompt: "Tell me about my customer base. How can I improve retention and get more repeat customers?",
    icon: Users,
  },
  {
    label: "Inventory Advice",
    prompt: "Analyze my inventory and tell me what products I should restock and what might be overstocked",
    icon: Boxes,
  },
  { label: "Top Performers", prompt: "Which products are my best sellers? How can I capitalize on their success?", icon: ShoppingBag },
  { label: "Growth Strategy", prompt: "Based on all my data, create a 7-day action plan to grow my business", icon: TrendingUp },
];

// Generate proactive alerts based on store data
function generateAlerts(data: AIAssistantData): StoreAlert[] {
  const alerts: StoreAlert[] = [];

  // Critical: Out of stock
  if (data.products.outOfStockCount > 0) {
    alerts.push({
      type: "urgent",
      title: `${data.products.outOfStockCount} Products Out of Stock`,
      description: "You're losing sales! Customers can't buy these products.",
      action: "Restock immediately",
    });
  }

  // Critical: High pending orders
  if (data.orders.pending > 10) {
    alerts.push({
      type: "urgent",
      title: `${data.orders.pending} Pending Orders`,
      description: "Orders waiting too long increases cancellation risk.",
      action: "Process orders now",
    });
  }

  // Warning: Low stock
  if (data.products.lowStockCount > 5) {
    alerts.push({
      type: "warning",
      title: `${data.products.lowStockCount} Products Running Low`,
      description: "Plan restocking to avoid stockouts.",
      action: "Review inventory",
    });
  }

  // Warning: High cancellation
  const cancellationRate = data.orders.total > 0 ? (data.orders.cancelled / data.orders.total) * 100 : 0;
  if (cancellationRate > 10) {
    alerts.push({
      type: "warning",
      title: `High Cancellation Rate (${cancellationRate.toFixed(1)}%)`,
      description: "Investigate why customers are cancelling.",
      action: "Analyze reasons",
    });
  }

  // Warning: Revenue decline
  if (data.revenue.growth < -10) {
    alerts.push({
      type: "warning",
      title: `Revenue Down ${Math.abs(data.revenue.growth)}%`,
      description: "Sales are declining compared to last month.",
      action: "Run promotions",
    });
  }

  // Opportunity: No orders today
  if (data.orders.todayCount === 0 && data.orders.total > 30) {
    alerts.push({
      type: "opportunity",
      title: "No Orders Today Yet",
      description: "Consider running a flash sale or social media campaign.",
      action: "Create promotion",
    });
  }

  // Opportunity: High COD ratio
  const codRatio =
    data.payments.codOrders + data.payments.onlineOrders > 0
      ? (data.payments.codOrders / (data.payments.codOrders + data.payments.onlineOrders)) * 100
      : 0;
  if (codRatio > 80 && data.orders.total > 20) {
    alerts.push({
      type: "opportunity",
      title: "High COD Orders",
      description: "Promote online payments to improve cash flow.",
      action: "Add payment discount",
    });
  }

  // Success: Good growth
  if (data.revenue.growth > 20) {
    alerts.push({
      type: "success",
      title: `Revenue Up ${data.revenue.growth}%`,
      description: "Excellent growth! Keep the momentum going.",
    });
  }

  // Success: Good retention
  if (data.customers.retentionRate > 40) {
    alerts.push({
      type: "success",
      title: `${data.customers.retentionRate}% Customer Retention`,
      description: "Your customers love coming back!",
    });
  }

  return alerts.slice(0, 4); // Limit to 4 alerts
}

export function AIAssistantClient({ brandName }: Props) {
  const currencySymbol = useCurrencySymbol();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [storeData, setStoreData] = useState<AIAssistantData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<StoreAlert[]>([]);
  const [showAllStats, setShowAllStats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load store data on mount
  const loadStoreData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);
    try {
      const response = await fetch("/api/ai-assistant/data");
      if (!response.ok) {
        throw new Error("Failed to load store data");
      }
      const result = await response.json();
      if (result.success && result.data) {
        setStoreData(result.data);
        setAlerts(generateAlerts(result.data));
      } else {
        throw new Error(result.error || "Failed to load store data");
      }
    } catch (error: any) {
      console.error("Error loading store data:", error);
      setDataError(error.message || "Failed to load store data");
      toast.error("Failed to load store data", {
        description: "Please try refreshing the page",
      });
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const response = await fetch("/api/ai-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText.trim(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          data: storeData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get AI response");
      }

      if (result.success && result.response) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: result.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || "Invalid response from AI");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);

      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
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
    // Split by code blocks first
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
            // Headers - compact
            if (line.startsWith("### ")) {
              return (
                <h4 key={lineIndex} className='font-semibold text-xs mt-2 mb-0.5'>
                  {line.slice(4)}
                </h4>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <h3 key={lineIndex} className='font-semibold text-xs mt-2 mb-0.5'>
                  {line.slice(3)}
                </h3>
              );
            }
            if (line.startsWith("# ")) {
              return (
                <h2 key={lineIndex} className='font-bold text-xs mt-2 mb-0.5'>
                  {line.slice(2)}
                </h2>
              );
            }

            // Bullet points - compact
            if (line.startsWith("- ") || line.startsWith("* ")) {
              return (
                <div key={lineIndex} className='flex items-start gap-1 ml-1 my-0'>
                  <span className='text-primary text-[10px]'>•</span>
                  <span className='flex-1' dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} />
                </div>
              );
            }

            // Numbered lists - compact
            const numberedMatch = line.match(/^(\d+)\.\s/);
            if (numberedMatch) {
              return (
                <div key={lineIndex} className='flex items-start gap-1 ml-1 my-0'>
                  <span className='text-primary font-medium text-[10px] min-w-4'>{numberedMatch[1]}.</span>
                  <span
                    className='flex-1'
                    dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(numberedMatch[0].length)) }}
                  />
                </div>
              );
            }

            // Arrow action items - compact
            if (line.startsWith("→ ") || line.startsWith("-> ")) {
              return (
                <div key={lineIndex} className='flex items-start gap-1 ml-2 my-0 text-primary'>
                  <span>→</span>
                  <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} />
                </div>
              );
            }

            // Regular text
            if (line.trim()) {
              return <p key={lineIndex} className='my-0.5' dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />;
            }

            // Skip empty lines (don't add breaks)
            return null;
          })}
        </span>
      );
    });
  };

  // Format inline markdown (bold, italic, code)
  const formatInlineMarkdown = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
  };

  // Get alert icon
  const getAlertIcon = (type: StoreAlert["type"]) => {
    switch (type) {
      case "urgent":
        return <AlertCircle className='h-4 w-4' />;
      case "warning":
        return <AlertTriangle className='h-4 w-4' />;
      case "opportunity":
        return <Lightbulb className='h-4 w-4' />;
      case "success":
        return <CheckCircle className='h-4 w-4' />;
    }
  };

  // Get alert colors
  const getAlertColors = (type: StoreAlert["type"]) => {
    switch (type) {
      case "urgent":
        return "border-red-500/50 bg-red-500/5 text-red-700 dark:text-red-400";
      case "warning":
        return "border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-400";
      case "opportunity":
        return "border-blue-500/50 bg-blue-500/5 text-blue-700 dark:text-blue-400";
      case "success":
        return "border-emerald-500/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400";
    }
  };

  return (
    <div className='w-full max-w-full flex flex-col h-screen lg:h-[calc(100vh-6rem)]'>
      {/* Mobile: Full Screen Messenger Style */}
      <div className='lg:hidden flex flex-col h-screen w-full bg-background overflow-hidden'>
        {/* Messenger-style Header */}
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

        {/* Mobile Chat Area - Full Screen */}
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
            {/* Messages Area - Messenger Style */}
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
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-md"
                            : "bg-background border-2 rounded-tl-md"
                        }`}
                      >
                        <div
                          className={`text-sm leading-relaxed ${
                            message.role === "user" ? "" : "prose prose-sm dark:prose-invert max-w-none"
                          }`}
                        >
                          {message.role === "user" ? message.content : formatMessageContent(message.content)}
                        </div>
                        <div
                          className={`text-[10px] mt-2 opacity-70 ${
                            message.role === "user" ? "text-primary-foreground/80" : "text-muted-foreground"
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

            {/* Input Area - Messenger Style Fixed at Bottom */}
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
          {/* Header - Desktop */}
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

        {/* Data Loading State - Mobile Responsive */}
        {isDataLoading && (
          <Card className='border-dashed'>
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

        {/* Data Error State - Mobile Responsive */}
        {dataError && !isDataLoading && (
          <Card className='border-destructive'>
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

        {/* Main Content */}
        {storeData && !isDataLoading && (
          <>
            {/* Compact Stats Dashboard - Mobile Responsive */}
            <Card className='flex-shrink-0'>
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
                {/* Primary Stats Row - Horizontal Scroll on Mobile */}
                <div className='overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0'>
                  <div className='grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 sm:gap-2 min-w-max sm:min-w-0'>
                    {/* Total Revenue */}
                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Revenue</span>
                      <span className='text-[10px] sm:text-xs font-bold truncate'>
                        {currencySymbol}
                        {storeData.revenue.total.toLocaleString()}
                      </span>
                    </div>

                    {/* Today's Revenue */}
                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Today</span>
                      <span className='text-[10px] sm:text-xs font-bold truncate'>
                        {currencySymbol}
                        {storeData.revenue.today.toLocaleString()}
                      </span>
                    </div>

                    {/* This Month */}
                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Month</span>
                      <span className='text-[10px] sm:text-xs font-bold truncate'>
                        {currencySymbol}
                        {storeData.revenue.thisMonth.toLocaleString()}
                      </span>
                    </div>

                    {/* Growth */}
                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Growth</span>
                      <span
                        className={`text-[10px] sm:text-xs font-bold ${storeData.revenue.growth >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {storeData.revenue.growth >= 0 ? "+" : ""}
                        {storeData.revenue.growth}%
                      </span>
                    </div>

                    {/* Total Orders */}
                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Orders</span>
                      <span className='text-[10px] sm:text-xs font-bold'>{storeData.orders.total}</span>
                    </div>

                    {/* Customers */}
                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Customers</span>
                      <span className='text-[10px] sm:text-xs font-bold'>{storeData.customers.total}</span>
                    </div>

                    {/* Net Profit */}
                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Profit</span>
                      <span
                        className={`text-[10px] sm:text-xs font-bold truncate ${storeData.profit.netProfit >= 0 ? "" : "text-red-600"}`}
                      >
                        {currencySymbol}
                        {storeData.profit.netProfit.toLocaleString()}
                      </span>
                    </div>

                    {/* Profit Margin */}
                    <div className='flex flex-col p-1.5 sm:p-2 rounded-md border bg-card min-w-[70px] sm:min-w-0'>
                      <span className='text-[8px] sm:text-[9px] text-muted-foreground'>Margin</span>
                      <span className={`text-[10px] sm:text-xs font-bold ${storeData.profit.profitMargin >= 0 ? "" : "text-red-600"}`}>
                        {storeData.profit.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Stats - Mobile Responsive */}
                {showAllStats && (
                  <div className='space-y-2 sm:space-y-3 pt-2 sm:pt-3 mt-2 border-t'>
                    {/* Order Status - Inline */}
                    <div className='flex flex-wrap gap-1 sm:gap-1.5'>
                      <Badge
                        variant='outline'
                        className='text-[9px] sm:text-[10px] bg-amber-50 dark:bg-amber-900/20 border-amber-300 text-amber-700 dark:text-amber-400 px-1.5 sm:px-2 py-0.5'
                      >
                        Pending: {storeData.orders.pending}
                      </Badge>
                      <Badge
                        variant='outline'
                        className='text-[9px] sm:text-[10px] bg-blue-50 dark:bg-blue-900/20 border-blue-300 text-blue-700 dark:text-blue-400 px-1.5 sm:px-2 py-0.5'
                      >
                        Processing: {storeData.orders.processing}
                      </Badge>
                      <Badge
                        variant='outline'
                        className='text-[9px] sm:text-[10px] bg-purple-50 dark:bg-purple-900/20 border-purple-300 text-purple-700 dark:text-purple-400 px-1.5 sm:px-2 py-0.5'
                      >
                        Packed: {storeData.orders.packed}
                      </Badge>
                      <Badge
                        variant='outline'
                        className='text-[9px] sm:text-[10px] bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 text-indigo-700 dark:text-indigo-400 px-1.5 sm:px-2 py-0.5'
                      >
                        Shipped: {storeData.orders.shipped}
                      </Badge>
                      <Badge
                        variant='outline'
                        className='text-[9px] sm:text-[10px] bg-green-50 dark:bg-green-900/20 border-green-300 text-green-700 dark:text-green-400 px-1.5 sm:px-2 py-0.5'
                      >
                        Delivered: {storeData.orders.delivered}
                      </Badge>
                      <Badge
                        variant='outline'
                        className='text-[9px] sm:text-[10px] bg-red-50 dark:bg-red-900/20 border-red-300 text-red-700 dark:text-red-400 px-1.5 sm:px-2 py-0.5'
                      >
                        Cancelled: {storeData.orders.cancelled}
                      </Badge>
                    </div>

                    {/* Revenue & Inventory Grid - Mobile Scrollable */}
                    <div className='overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0'>
                      <div className='grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-1.5 min-w-max sm:min-w-0'>
                        <div className='p-1 sm:p-1.5 rounded-md bg-muted/30 border text-center min-w-[70px] sm:min-w-0'>
                          <span className='text-[7px] sm:text-[8px] text-muted-foreground block'>7 Days</span>
                          <span className='text-[9px] sm:text-[10px] font-semibold'>
                            {currencySymbol}
                            {storeData.revenue.last7Days.toLocaleString()}
                          </span>
                        </div>
                        <div className='p-1 sm:p-1.5 rounded-md bg-muted/30 border text-center min-w-[70px] sm:min-w-0'>
                          <span className='text-[7px] sm:text-[8px] text-muted-foreground block'>30 Days</span>
                          <span className='text-[9px] sm:text-[10px] font-semibold'>
                            {currencySymbol}
                            {storeData.revenue.last30Days.toLocaleString()}
                          </span>
                        </div>
                        <div className='p-1 sm:p-1.5 rounded-md bg-muted/30 border text-center min-w-[70px] sm:min-w-0'>
                          <span className='text-[7px] sm:text-[8px] text-muted-foreground block'>AOV</span>
                          <span className='text-[9px] sm:text-[10px] font-semibold'>
                            {currencySymbol}
                            {storeData.revenue.avgOrderValue.toLocaleString()}
                          </span>
                        </div>
                        <div className='p-1 sm:p-1.5 rounded-md bg-muted/30 border text-center min-w-[70px] sm:min-w-0'>
                          <span className='text-[7px] sm:text-[8px] text-muted-foreground block'>Products</span>
                          <span className='text-[9px] sm:text-[10px] font-semibold'>{storeData.products.total}</span>
                        </div>
                        <div className='p-1 sm:p-1.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-center min-w-[70px] sm:min-w-0'>
                          <span className='text-[7px] sm:text-[8px] text-amber-600 block'>Low Stock</span>
                          <span className='text-[9px] sm:text-[10px] font-semibold text-amber-700'>{storeData.products.lowStockCount}</span>
                        </div>
                        <div className='p-1 sm:p-1.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 text-center min-w-[70px] sm:min-w-0'>
                          <span className='text-[7px] sm:text-[8px] text-red-600 block'>Out</span>
                          <span className='text-[9px] sm:text-[10px] font-semibold text-red-700'>{storeData.products.outOfStockCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Products - Mobile Responsive */}
                    {storeData.topProducts.length > 0 && (
                      <div>
                        <span className='text-[8px] sm:text-[9px] text-muted-foreground font-medium'>Top Products:</span>
                        <div className='flex flex-wrap gap-1 sm:gap-1.5 mt-1'>
                          {storeData.topProducts.slice(0, 3).map((p, i) => (
                            <Badge key={i} variant='secondary' className='text-[8px] sm:text-[9px] px-1.5 py-0.5'>
                              <span className='hidden sm:inline'>
                                {p.name.slice(0, 15)}
                                {p.name.length > 15 ? "..." : ""}: {p.totalSold} sold
                              </span>
                              <span className='sm:hidden'>
                                {p.name.slice(0, 10)}
                                {p.name.length > 10 ? "..." : ""}: {p.totalSold}
                              </span>
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

        {/* Chat Area with Sidebar - Mobile Responsive */}
        {storeData && !isDataLoading && (
          <div className='flex-1 min-h-0 flex flex-col px-2 sm:px-4 pb-2 sm:pb-4 overflow-hidden'>
            <div className='flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-4 gap-2 sm:gap-3 overflow-hidden'>
              {/* Quick Actions & Alerts Sidebar - Hidden on mobile, shown on desktop */}
              <div className='hidden lg:flex lg:col-span-1 flex-col min-h-0 max-h-full overflow-hidden'>
                <ScrollArea className='flex-1 h-full'>
                  <div className='space-y-2 sm:space-y-3 pr-2'>
                    {/* Proactive Alerts */}
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

                    {/* Quick Actions */}
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

              {/* Mobile Quick Actions Bar - Shown only on mobile */}
              <div className='lg:hidden flex flex-wrap gap-1.5 mb-2'>
                {alerts.slice(0, 2).map((alert, index) => (
                  <Button
                    key={index}
                    variant='outline'
                    size='sm'
                    onClick={() => sendMessage(`${alert.title} - what should I do?`)}
                    className='text-[9px] h-6 px-2 flex-1 min-w-[120px]'
                  >
                    {getAlertIcon(alert.type)}
                    <span className='ml-1 truncate'>{alert.title}</span>
                  </Button>
                ))}
                {quickActions.slice(0, 2).map((action) => (
                  <Button
                    key={action.label}
                    variant='outline'
                    size='sm'
                    onClick={() => sendMessage(action.prompt)}
                    className='text-[9px] h-6 px-2 flex-1 min-w-[120px]'
                  >
                    <action.icon className='h-3 w-3 mr-1 shrink-0' />
                    <span className='truncate'>{action.label}</span>
                  </Button>
                ))}
              </div>

              {/* Chat Area - Full width on mobile */}
              <div className='flex-1 lg:col-span-3 flex flex-col min-h-0 max-h-full overflow-hidden'>
                <Card className='flex flex-col h-full min-h-0 max-h-full overflow-hidden'>
                  <CardHeader className='py-1.5 sm:py-2 px-2 sm:px-3 border-b shrink-0'>
                    <CardTitle className='text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2'>
                      <MessageSquare className='h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary' />
                      Chat
                      {messages.length > 0 && (
                        <Badge variant='secondary' className='text-[9px] sm:text-[10px] ml-1 px-1 sm:px-1.5 py-0'>
                          {messages.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>

                  {/* Messages - Scrollable */}
                  <ScrollArea className='flex-1 min-h-0 overflow-y-auto'>
                    <div className='p-2 sm:p-3 min-h-full'>
                      {messages.length === 0 ? (
                        <div className='flex flex-col items-center justify-center min-h-[250px] sm:min-h-[300px] text-center py-4'>
                          <div className='p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 mb-2 sm:mb-3'>
                            <Bot className='h-6 w-6 sm:h-8 sm:w-8 text-primary' />
                          </div>
                          <h3 className='font-semibold text-xs sm:text-sm mb-1'>AI Business Advisor</h3>
                          <p className='text-[10px] sm:text-xs text-muted-foreground max-w-sm mb-2 sm:mb-3 px-2'>
                            Ask me anything about your store performance!
                          </p>

                          {/* Featured Question */}
                          <Button
                            variant='default'
                            size='sm'
                            onClick={() => sendMessage("What are the top 3 things I should focus on today?")}
                            className='mb-2 sm:mb-3 gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8'
                          >
                            <Target className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
                            What should I do today?
                          </Button>

                          <div className='flex flex-wrap justify-center gap-1 sm:gap-1.5 px-2'>
                            {quickActions.slice(1, 4).map((action) => (
                              <Button
                                key={action.label}
                                variant='outline'
                                size='sm'
                                onClick={() => sendMessage(action.prompt)}
                                className='text-[9px] sm:text-[10px] h-6 sm:h-7 px-2'
                              >
                                <action.icon className='h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1' />
                                <span className='hidden xs:inline'>{action.label}</span>
                                <span className='xs:hidden'>{action.label.split(" ")[0]}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className='space-y-1.5 sm:space-y-2'>
                          {messages.map((message, index) => (
                            <div
                              key={index}
                              className={`flex gap-1.5 sm:gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              {message.role === "assistant" && (
                                <div className='shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center'>
                                  <Bot className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground' />
                                </div>
                              )}
                              <div
                                className={`max-w-[85%] sm:max-w-[88%] rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 ${
                                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 dark:bg-muted/20 border"
                                }`}
                              >
                                <div
                                  className={`text-[10px] sm:text-xs leading-relaxed ${
                                    message.role === "user" ? "" : "prose prose-xs dark:prose-invert max-w-none"
                                  }`}
                                >
                                  {message.role === "user" ? message.content : formatMessageContent(message.content)}
                                </div>
                              </div>
                              {message.role === "user" && (
                                <div className='shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center border'>
                                  <User className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground' />
                                </div>
                              )}
                            </div>
                          ))}
                          {isLoading && (
                            <div className='flex gap-1.5 sm:gap-2 justify-start'>
                              <div className='shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center'>
                                <Bot className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground' />
                              </div>
                              <div className='bg-muted/50 dark:bg-muted/20 border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2'>
                                <div className='flex items-center gap-1 sm:gap-1.5'>
                                  <Loader2 className='h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin text-primary' />
                                  <span className='text-[10px] sm:text-xs text-muted-foreground'>Thinking...</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input - Mobile Optimized */}
                  <div className='p-1.5 sm:p-2 border-t shrink-0 bg-background'>
                    <form onSubmit={handleSubmit} className='flex gap-1 sm:gap-1.5'>
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder='Ask anything...'
                        disabled={isLoading}
                        className='min-h-[40px] sm:min-h-[36px] max-h-[100px] sm:max-h-[80px] resize-none text-[11px] sm:text-xs'
                        rows={1}
                      />
                      <Button type='submit' size='icon' disabled={!input.trim() || isLoading} className='shrink-0 h-10 w-10 sm:h-9 sm:w-9'>
                        {isLoading ? (
                          <Loader2 className='h-4 w-4 sm:h-3.5 sm:w-3.5 animate-spin' />
                        ) : (
                          <Send className='h-4 w-4 sm:h-3.5 sm:w-3.5' />
                        )}
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

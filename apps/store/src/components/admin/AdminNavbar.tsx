"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CheckCheck,
  Clock,
  Package,
  ShoppingBag,
  DollarSign,
  Truck,
  User,
  CreditCard,
  Menu,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { BrandConfig } from "@/lib/brand-config";
import { useNotificationsSocket } from "@/hooks/use-notifications-socket";
import { CommandPalette } from "./CommandPalette";
import { Search } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/api-client";

import { useAuth } from "@/hooks/use-auth";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  link?: string | null;
}

interface AdminNavbarProps {
  brandConfig: BrandConfig;
}

export default function AdminNavbar({ brandConfig }: AdminNavbarProps) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || null;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Handle new notification from socket
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
    // Show toast notification
    toast.info(notification.title, {
      description: notification.message,
    });
  }, []);

  // Use socket for real-time notifications
  useNotificationsSocket(userId, handleNewNotification);

  // Fetch notifications (optimized - only fetch 15 for dropdown)
  const fetchNotifications = async (limit: number = 15) => {
    if (!isAuthenticated) return;
    try {
      const data = await apiRequest<any>("GET", `/notifications?limit=${limit}&page=1`);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      // Silently fail - notifications are optional
    }
  };

  // Fetch notifications when authenticated (optimized - faster polling)
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(15);
      // Poll for new notifications every 10 seconds (faster)
      const interval = setInterval(() => fetchNotifications(15), 10000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Fetch notifications when dropdown opens (optimized)
  useEffect(() => {
    if (dropdownOpen && isAuthenticated) {
      fetchNotifications(15);
    }
  }, [dropdownOpen, isAuthenticated]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await apiRequest<any>("PATCH", "/notifications", { notificationId });
      // Update local state
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest<any>("PATCH", "/notifications", { markAllAsRead: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className='flex items-center gap-4 flex-1'>
        {/* Menu icon for mobile */}
        <Button
          variant='ghost'
          size='icon'
          className='h-9 w-9 md:hidden hover:bg-primary/10 hover:text-primary transition-colors'
          onClick={toggleSidebar}
        >
          <Menu className='w-5 h-5' />
          <span className='sr-only'>Toggle Sidebar</span>
        </Button>

        <div className='ml-auto flex items-center gap-2'>
          {/* Command Palette Trigger */}
          <Button
            variant='ghost'
            size='icon'
            className='h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors'
            onClick={() => setCommandPaletteOpen(true)}
            title='Command Palette (⌘K)'
          >
            <Search className='w-4 h-4' />
          </Button>
          <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
          {isAuthenticated && (
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-9 w-9 relative hover:bg-primary/10 hover:text-primary transition-colors'>
                  <Bell className={`w-4 h-4 transition-transform ${unreadCount > 0 ? "animate-pulse" : ""}`} />
                  {unreadCount > 0 && (
                    <Badge className='absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-primary text-white text-xs font-semibold px-1.5 flex items-center justify-center shadow-lg ring-2 ring-background'>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-[calc(100vw-2rem)] sm:w-80 max-w-[90vw] p-0 shadow-lg border'>
                {/* Header */}
                <div className='flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b bg-muted/30'>
                  <div className='flex items-center gap-2 sm:gap-2.5'>
                    <div className='p-1 sm:p-1.5 rounded-lg bg-primary/10'>
                      <Bell className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary' />
                    </div>
                    <div>
                      <p className='text-xs sm:text-sm font-semibold text-foreground'>Notifications</p>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={markAllAsRead}
                      className='text-[10px] sm:text-xs h-6 sm:h-7 px-1.5 sm:px-2 hover:bg-primary/10 hover:text-primary'
                    >
                      <CheckCheck className='w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5' />
                      <span className='hidden sm:inline'>Mark all read</span>
                      <span className='sm:hidden'>Read all</span>
                    </Button>
                  )}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "unread" | "all")} className='w-full'>
                  <div className='border-b px-3 sm:px-4'>
                    <TabsList className='w-full grid grid-cols-2 h-8 sm:h-9 bg-transparent'>
                      <TabsTrigger
                        value='unread'
                        className='text-[10px] sm:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative group px-2 sm:px-3'
                      >
                        <span className='flex items-center'>
                          Unread
                          {unreadCount > 0 && (
                            <Badge className='ml-1 sm:ml-1.5 h-3.5 sm:h-4 min-w-3.5 sm:min-w-4 rounded-full text-[9px] sm:text-[10px] px-1 sm:px-1.5 font-semibold group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white bg-primary/20 text-primary'>
                              {unreadCount}
                            </Badge>
                          )}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value='all'
                        className='text-[10px] sm:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground group px-2 sm:px-3'
                      >
                        <span className='flex items-center'>
                          All
                          <Badge
                            variant='secondary'
                            className='ml-1 sm:ml-1.5 h-3.5 sm:h-4 min-w-3.5 sm:min-w-4 rounded-full text-[9px] sm:text-[10px] px-1 sm:px-1.5 font-semibold group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white'
                          >
                            {notifications.length}
                          </Badge>
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Unread Tab */}
                  <TabsContent value='unread' className='m-0'>
                    <ScrollArea className='h-[280px] sm:h-[320px] md:h-[360px] overflow-y-auto'>
                      {notifications.filter((n) => !n.read).length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-8 sm:py-12 px-3 sm:px-4'>
                          <div className='p-2.5 sm:p-3 rounded-full bg-primary/10 mb-2.5 sm:mb-3'>
                            <CheckCircle2 className='w-5 h-5 sm:w-6 sm:h-6 text-primary opacity-70' />
                          </div>
                          <p className='text-xs sm:text-sm font-medium text-foreground mb-1'>All caught up!</p>
                          <p className='text-[10px] sm:text-xs text-muted-foreground text-center max-w-[180px] sm:max-w-[200px]'>
                            You don't have any unread notifications.
                          </p>
                        </div>
                      ) : (
                        <div className='px-2'>
                          {notifications
                            .filter((n) => !n.read)
                            .map((notification, index, array) => {
                              const getNotificationIcon = () => {
                                const titleLower = notification.title.toLowerCase();
                                const messageLower = notification.message.toLowerCase();

                                // Determine icon based on notification content
                                if (titleLower.includes("order") || messageLower.includes("order")) {
                                  return <ShoppingBag className='w-3.5 h-3.5 text-blue-600 dark:text-blue-400' />;
                                } else if (titleLower.includes("payment") || messageLower.includes("payment")) {
                                  return <CreditCard className='w-3.5 h-3.5 text-green-600 dark:text-green-400' />;
                                } else if (
                                  titleLower.includes("shipping") ||
                                  messageLower.includes("shipping") ||
                                  titleLower.includes("delivery")
                                ) {
                                  return <Truck className='w-3.5 h-3.5 text-purple-600 dark:text-purple-400' />;
                                } else if (titleLower.includes("customer") || messageLower.includes("customer")) {
                                  return <User className='w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400' />;
                                } else if (
                                  titleLower.includes("revenue") ||
                                  messageLower.includes("revenue") ||
                                  messageLower.includes("$")
                                ) {
                                  return <DollarSign className='w-3.5 h-3.5 text-green-600 dark:text-green-400' />;
                                } else if (notification.type === "success") {
                                  return <CheckCircle2 className='w-3.5 h-3.5 text-green-600 dark:text-green-400' />;
                                } else if (notification.type === "warning") {
                                  return <AlertCircle className='w-3.5 h-3.5 text-amber-600 dark:text-amber-400' />;
                                } else if (notification.type === "error") {
                                  return <XCircle className='w-3.5 h-3.5 text-red-600 dark:text-red-400' />;
                                } else {
                                  return <Package className='w-3.5 h-3.5 text-blue-600 dark:text-blue-400' />;
                                }
                              };

                              return (
                                <DropdownMenuItem
                                  key={notification.id}
                                  className='cursor-pointer p-0 focus:bg-transparent rounded-none'
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    markAsRead(notification.id);
                                    if (notification.link) {
                                      router.push(notification.link);
                                      setDropdownOpen(false);
                                    }
                                  }}
                                >
                                  <div
                                    className={`w-full mx-0.5 sm:mx-1 my-1 sm:my-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-gray-100/50 transition-all duration-200 bg-primary/10 hover:bg-primary/15`}
                                  >
                                    <div className='flex items-start gap-2 sm:gap-2.5'>
                                      {/* Icon */}
                                      <div className='mt-0.5 p-0.5 sm:p-1 rounded-md bg-background/80 shrink-0'>
                                        {getNotificationIcon()}
                                      </div>

                                      {/* Content */}
                                      <div className='flex-1 min-w-0'>
                                        <div className='flex items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-0.5 sm:mb-1'>
                                          <div className='flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0'>
                                            <p className='text-xs sm:text-sm font-semibold text-foreground leading-tight line-clamp-1'>
                                              {notification.title}
                                            </p>
                                            <div className='w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse' />
                                          </div>
                                          <div className='flex items-center gap-0.5 sm:gap-1 shrink-0'>
                                            <Clock className='w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground/60' />
                                            <p className='text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap'>
                                              {formatDate(notification.createdAt)}
                                            </p>
                                          </div>
                                        </div>
                                        <p className='text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-snug'>
                                          {notification.message}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                              );
                            })}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* All Tab */}
                  <TabsContent value='all' className='m-0'>
                    <ScrollArea className='h-[280px] sm:h-[320px] md:h-[360px] overflow-y-auto'>
                      {notifications.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-8 sm:py-12 px-3 sm:px-4'>
                          <div className='p-2.5 sm:p-3 rounded-full bg-muted/50 mb-2.5 sm:mb-3'>
                            <Bell className='w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground opacity-50' />
                          </div>
                          <p className='text-xs sm:text-sm font-medium text-foreground mb-1'>No notifications</p>
                          <p className='text-[10px] sm:text-xs text-muted-foreground text-center max-w-[180px] sm:max-w-[200px]'>
                            You don't have any notifications at this time.
                          </p>
                        </div>
                      ) : (
                        <div className='px-2'>
                          {notifications.map((notification, index) => {
                            const getNotificationIcon = () => {
                              const titleLower = notification.title.toLowerCase();
                              const messageLower = notification.message.toLowerCase();

                              // Determine icon based on notification content
                              if (titleLower.includes("order") || messageLower.includes("order")) {
                                return <ShoppingBag className='w-3.5 h-3.5 text-blue-600 dark:text-blue-400' />;
                              } else if (titleLower.includes("payment") || messageLower.includes("payment")) {
                                return <CreditCard className='w-3.5 h-3.5 text-green-600 dark:text-green-400' />;
                              } else if (
                                titleLower.includes("shipping") ||
                                messageLower.includes("shipping") ||
                                titleLower.includes("delivery")
                              ) {
                                return <Truck className='w-3.5 h-3.5 text-purple-600 dark:text-purple-400' />;
                              } else if (titleLower.includes("customer") || messageLower.includes("customer")) {
                                return <User className='w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400' />;
                              } else if (titleLower.includes("revenue") || messageLower.includes("revenue") || messageLower.includes("$")) {
                                return <DollarSign className='w-3.5 h-3.5 text-green-600 dark:text-green-400' />;
                              } else if (notification.type === "success") {
                                return <CheckCircle2 className='w-3.5 h-3.5 text-green-600 dark:text-green-400' />;
                              } else if (notification.type === "warning") {
                                return <AlertCircle className='w-3.5 h-3.5 text-amber-600 dark:text-amber-400' />;
                              } else if (notification.type === "error") {
                                return <XCircle className='w-3.5 h-3.5 text-red-600 dark:text-red-400' />;
                              } else {
                                return <Package className='w-3.5 h-3.5 text-blue-600 dark:text-blue-400' />;
                              }
                            };

                            return (
                              <DropdownMenuItem
                                key={notification.id}
                                className='cursor-pointer p-0 focus:bg-transparent rounded-none'
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (!notification.read) {
                                    markAsRead(notification.id);
                                  }
                                  if (notification.link) {
                                    router.push(notification.link);
                                    setDropdownOpen(false);
                                  }
                                }}
                              >
                                <div
                                  className={`w-full mx-0.5 sm:mx-1 my-1 sm:my-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-gray-100/50 transition-all duration-200 ${!notification.read ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50"
                                    }`}
                                >
                                  <div className='flex items-start gap-2 sm:gap-2.5'>
                                    {/* Icon */}
                                    <div
                                      className={`mt-0.5 p-0.5 sm:p-1 rounded-md shrink-0 ${!notification.read ? "bg-background/80" : "bg-muted/50"
                                        }`}
                                    >
                                      {getNotificationIcon()}
                                    </div>

                                    {/* Content */}
                                    <div className='flex-1 min-w-0'>
                                      <div className='flex items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-0.5 sm:mb-1'>
                                        <div className='flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0'>
                                          <p
                                            className={`text-xs sm:text-sm font-semibold leading-tight line-clamp-1 ${!notification.read ? "text-foreground" : "text-muted-foreground"
                                              }`}
                                          >
                                            {notification.title}
                                          </p>
                                          {!notification.read && (
                                            <div className='w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse' />
                                          )}
                                        </div>
                                        <div className='flex items-center gap-0.5 sm:gap-1 shrink-0'>
                                          <Clock className='w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground/60' />
                                          <p className='text-[9px] sm:text-[10px] mt-[1px] text-muted-foreground whitespace-nowrap'>
                                            {formatDate(notification.createdAt)}
                                          </p>
                                        </div>
                                      </div>
                                      <p className='text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-snug'>
                                        {notification.message}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>

                {/* Footer - View All Link */}
                {notifications.length > 0 && (
                  <div className='border-t px-3 sm:px-4 py-2 sm:py-2.5 bg-muted/20'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full text-[10px] sm:text-xs text-muted-foreground hover:text-foreground justify-center h-7 sm:h-8'
                      onClick={() => {
                        router.push("/merchant/notifications");
                        setDropdownOpen(false);
                      }}
                    >
                      <span className='hidden sm:inline'>View all notifications</span>
                      <span className='sm:hidden'>View all</span>
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </>
  );
}

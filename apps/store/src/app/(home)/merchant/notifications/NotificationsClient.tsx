"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useNotificationsSocket } from "@/hooks/use-notifications-socket";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  link?: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

import { useAuth } from "@/hooks/use-auth";

export function NotificationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || null;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Handle new notification from socket
  const handleNewNotification = useCallback(
    (notification: Notification) => {
      if (activeTab === "unread" || !activeTab) {
        setNotifications((prev) => [notification, ...prev]);
      }
      setUnreadCount((prev) => prev + 1);
    },
    [activeTab]
  );

  // Use socket for real-time notifications
  useNotificationsSocket(userId, handleNewNotification);

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(
    async (page: number = 1, limit: number = 20, filter: "all" | "unread" = "all") => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const readFilter = filter === "unread" ? "&unreadOnly=true" : "";
        const data: any = await apiRequest("GET", `/notifications?page=${page}&limit=${limit}${readFilter}`);
        setNotifications(data.data?.notifications || data.notifications || []);
        setUnreadCount(data.data?.unreadCount || data.unreadCount || 0);
        setPagination(data.data?.pagination || data.pagination || pagination);
      } catch (error) {
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  // Load notifications on mount
  useEffect(() => {
    if (isAuthenticated) {
      const page = parseInt(searchParams.get("page") || "1", 10);
      fetchNotifications(page, 20, activeTab);
    }
  }, [isAuthenticated]);

  // Reset to page 1 and reload when tab changes
  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams();
      params.set("page", "1");
      router.replace(`?${params.toString()}`);
      fetchNotifications(1, 20, activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await apiRequest("PATCH", "/notifications", { notificationId });
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (activeTab === "unread") {
        // Remove from list if in unread tab
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId || n.read));
      }
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest("PATCH", "/notifications", { markAllAsRead: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
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

  // Get notification icon
  const getNotificationIcon = (notification: Notification) => {
    const titleLower = notification.title.toLowerCase();
    const messageLower = notification.message.toLowerCase();

    if (titleLower.includes("order") || messageLower.includes("order")) {
      return <ShoppingBag className='w-4 h-4 text-blue-600 dark:text-blue-400' />;
    } else if (titleLower.includes("payment") || messageLower.includes("payment")) {
      return <CreditCard className='w-4 h-4 text-green-600 dark:text-green-400' />;
    } else if (titleLower.includes("shipping") || messageLower.includes("shipping") || titleLower.includes("delivery")) {
      return <Truck className='w-4 h-4 text-purple-600 dark:text-purple-400' />;
    } else if (titleLower.includes("customer") || messageLower.includes("customer")) {
      return <User className='w-4 h-4 text-indigo-600 dark:text-indigo-400' />;
    } else if (titleLower.includes("revenue") || messageLower.includes("revenue") || messageLower.includes("$")) {
      return <DollarSign className='w-4 h-4 text-green-600 dark:text-green-400' />;
    } else if (notification.type === "success") {
      return <CheckCircle2 className='w-4 h-4 text-green-600 dark:text-green-400' />;
    } else if (notification.type === "warning") {
      return <AlertCircle className='w-4 h-4 text-amber-600 dark:text-amber-400' />;
    } else if (notification.type === "error") {
      return <XCircle className='w-4 h-4 text-red-600 dark:text-red-400' />;
    } else {
      return <Package className='w-4 h-4 text-blue-600 dark:text-blue-400' />;
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
    fetchNotifications(newPage, 20, activeTab);
  };

  // Handle tab change
  const handleTabChange = (tab: "unread" | "all") => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    params.set("page", "1");
    router.push(`?${params.toString()}`);
    fetchNotifications(1, 20, tab);
  };

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Header Actions */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4'>
        <div className='flex items-center gap-2 sm:gap-4 w-full sm:w-auto'>
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as "unread" | "all")} className='w-full sm:w-auto'>
            <TabsList className='w-full sm:w-auto grid grid-cols-2'>
              <TabsTrigger value='unread' className='relative text-xs sm:text-sm'>
                Unread
                {unreadCount > 0 && (
                  <Badge className='ml-1.5 sm:ml-2 h-4 sm:h-5 min-w-4 sm:min-w-5 rounded-full bg-primary text-white text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5'>
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value='all' className='text-xs sm:text-sm'>
                All
                <Badge
                  variant='secondary'
                  className='ml-1.5 sm:ml-2 h-4 sm:h-5 min-w-4 sm:min-w-5 rounded-full text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5'
                >
                  {pagination.total}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {unreadCount > 0 && (
          <Button variant='outline' size='sm' onClick={markAllAsRead} className='gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm'>
            <CheckCheck className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
            <span className='hidden sm:inline'>Mark all as read</span>
            <span className='sm:hidden'>Mark all read</span>
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <div className='space-y-3 p-4 sm:p-5'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='flex items-start gap-3'>
                  <Skeleton className='w-8 h-8 sm:w-10 sm:h-10 rounded-lg' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-3.5 sm:h-4 w-3/4' />
                    <Skeleton className='h-3 w-full' />
                    <Skeleton className='h-3 w-1/2' />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 sm:py-16 px-4'>
              <div className='p-3 sm:p-4 rounded-full bg-muted/50 mb-3 sm:mb-4'>
                <Bell className='w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground opacity-50' />
              </div>
              <p className='text-base sm:text-lg font-semibold text-foreground mb-2'>
                {activeTab === "unread" ? "All caught up!" : "No notifications"}
              </p>
              <p className='text-xs sm:text-sm text-muted-foreground text-center max-w-md px-4'>
                {activeTab === "unread" ? "You don't have any unread notifications." : "You don't have any notifications at this time."}
              </p>
            </div>
          ) : (
            <div className='divide-y divide-border/50'>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group mx-2 sm:mx-4 rounded-md border border-gray-100/80 my-1 sm:my-1.5 px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 cursor-pointer ${!notification.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                    }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                    if (notification.link) {
                      router.push(notification.link);
                    }
                  }}
                >
                  <div className='flex items-start gap-3 sm:gap-4'>
                    {/* Icon */}
                    <div
                      className={`mt-0.5 p-2 sm:p-2.5 rounded-lg shrink-0 transition-colors ${!notification.read ? "bg-primary/10 border border-primary/20" : "bg-muted/50 border border-border"
                        }`}
                    >
                      {getNotificationIcon(notification)}
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-3 mb-1.5 sm:mb-2'>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5'>
                            <p
                              className={`text-sm sm:text-base font-semibold leading-tight ${!notification.read ? "text-foreground" : "text-muted-foreground"
                                }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary shrink-0 animate-pulse' />
                            )}
                          </div>
                          <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed mb-1 sm:mb-2'>{notification.message}</p>
                        </div>
                        <div className='flex items-center gap-1 sm:gap-1.5 shrink-0 pt-0 sm:pt-0.5'>
                          <Clock className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/60' />
                          <p className='text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap font-medium'>
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && notifications.length > 0 && pagination.totalPages > 1 && (
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-0'>
          <div className='text-xs sm:text-sm text-muted-foreground text-center sm:text-left'>
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} notifications
          </div>
          <Pagination className='w-full sm:w-auto'>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.page > 1) {
                      handlePageChange(pagination.page - 1);
                    }
                  }}
                  className={pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {/* First page */}
              {pagination.page > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      href='#'
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(1);
                      }}
                      isActive={pagination.page === 1}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {pagination.page > 4 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {/* Page numbers around current page */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href='#'
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                      isActive={pagination.page === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {/* Last page */}
              {pagination.page < pagination.totalPages - 2 && (
                <>
                  {pagination.page < pagination.totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href='#'
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pagination.totalPages);
                      }}
                      isActive={pagination.page === pagination.totalPages}
                    >
                      {pagination.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.hasMore) {
                      handlePageChange(pagination.page + 1);
                    }
                  }}
                  className={!pagination.hasMore ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

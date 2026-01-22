"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  Printer,
  MoreHorizontal,
  Phone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface MobileFloatingNavProps {
  saving: boolean;
  orderId: string;
  prevOrderId?: string | null;
  nextOrderId?: string | null;
  customerPhone?: string;
  onSave: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

export function MobileFloatingNav({
  saving,
  orderId,
  prevOrderId,
  nextOrderId,
  customerPhone,
  onSave,
  onDownload,
  onPrint,
}: MobileFloatingNavProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  // Smart hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      if (scrollDiff > 15 && currentScrollY > 150) {
        setIsVisible(false);
      } else if (scrollDiff < -10 || currentScrollY < 100) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleCall = () => {
    if (customerPhone) {
      window.location.href = `tel:${customerPhone}`;
    }
  };

  return (
    <>
      {/* Floating Action Bar - Positioned above main bottom nav */}
      <nav
        className={cn(
          "fixed left-0 right-0 z-40 sm:hidden",
          "bottom-[96px]", // Position above the main bottom nav (h-24 = 96px)
          "transform transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-[150%] opacity-0"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-3">
          <div
            className={cn(
              "bg-card/95 backdrop-blur-xl",
              "rounded-2xl shadow-lg",
              "border border-border"
            )}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              {/* Order Navigation - Circle Buttons */}
              <div className="flex items-center gap-2">
                <button
                  className={cn(
                    "h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200",
                    prevOrderId 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-700"
                      : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600"
                  )}
                  onClick={() => prevOrderId && router.push(`/tenant/orders/${prevOrderId}`)}
                  disabled={!prevOrderId}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className={cn(
                    "h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200",
                    nextOrderId 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-700"
                      : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600"
                  )}
                  onClick={() => nextOrderId && router.push(`/tenant/orders/${nextOrderId}`)}
                  disabled={!nextOrderId}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Center - Save Button with Circle Design */}
              <button
                onClick={onSave}
                disabled={saving}
                className={cn(
                  "h-12 px-6 rounded-full font-semibold flex items-center gap-2",
                  "bg-primary text-primary-foreground",
                  "shadow-lg shadow-primary/30",
                  "transition-all duration-200 active:scale-95",
                  saving && "opacity-70"
                )}
              >
                {saving ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </>
                )}
              </button>

              {/* Right Actions - Circle Buttons */}
              <div className="flex items-center gap-2">
                {/* Call Button */}
                {customerPhone && (
                  <button
                    onClick={handleCall}
                    className="h-11 w-11 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 active:scale-95 transition-all duration-200"
                  >
                    <Phone className="h-5 w-5" />
                  </button>
                )}

                {/* More Actions */}
                <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
                  <DrawerTrigger asChild>
                    <button
                      className="h-11 w-11 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 active:scale-95 transition-all duration-200"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="border-b pb-4">
                      <div className="flex items-center justify-between">
                        <DrawerTitle>More Actions</DrawerTitle>
                        <DrawerClose asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </DrawerClose>
                      </div>
                    </DrawerHeader>
                    <div className="p-4 space-y-3">
                      <button
                        className="w-full h-14 flex items-center gap-3 px-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors active:scale-[0.99]"
                        onClick={() => {
                          onDownload();
                          setMoreOpen(false);
                        }}
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium">Download PDF Receipt</span>
                      </button>
                      <button
                        className="w-full h-14 flex items-center gap-3 px-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors active:scale-[0.99]"
                        onClick={() => {
                          onPrint();
                          setMoreOpen(false);
                        }}
                      >
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Printer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-medium">Print Receipt</span>
                      </button>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}


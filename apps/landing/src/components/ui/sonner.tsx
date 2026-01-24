"use client";

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme='light'
      className='toaster group'
      icons={{
        success: <CircleCheckIcon className='size-4 text-emerald-600' />,
        info: <InfoIcon className='size-4 text-blue-600' />,
        warning: <TriangleAlertIcon className='size-4 text-amber-600' />,
        error: <OctagonXIcon className='size-4 text-red-600' />,
        loading: <Loader2Icon className='size-4 animate-spin text-slate-600' />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border group-[.toaster]:border-slate-200/80 group-[.toaster]:shadow-xl group-[.toaster]:shadow-slate-900/5 group-[.toaster]:backdrop-blur-md group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:font-medium",
          description: "group-[.toast]:text-slate-600 group-[.toast]:text-sm group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-slate-900 group-[.toast]:text-white group-[.toast]:hover:bg-slate-800 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600 group-[.toast]:hover:bg-slate-200 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",
          success:
            "group-[.toaster]:bg-white group-[.toaster]:text-emerald-950 group-[.toaster]:border-emerald-200/80 group-[.toaster]:shadow-xl group-[.toaster]:shadow-emerald-900/5 group-[.toaster]:backdrop-blur-md",
          error:
            "group-[.toaster]:bg-white group-[.toaster]:text-red-950 group-[.toaster]:border-red-200/80 group-[.toaster]:shadow-xl group-[.toaster]:shadow-red-900/5 group-[.toaster]:backdrop-blur-md",
          warning:
            "group-[.toaster]:bg-white group-[.toaster]:text-amber-950 group-[.toaster]:border-amber-200/80 group-[.toaster]:shadow-xl group-[.toaster]:shadow-amber-900/5 group-[.toaster]:backdrop-blur-md",
          info: "group-[.toaster]:bg-white group-[.toaster]:text-blue-950 group-[.toaster]:border-blue-200/80 group-[.toaster]:shadow-xl group-[.toaster]:shadow-blue-900/5 group-[.toaster]:backdrop-blur-md",
        },
      }}
      style={
        {
          "--normal-bg": "rgb(255, 255, 255)",
          "--normal-text": "rgb(2, 6, 23)",
          "--normal-border": "rgb(226, 232, 240)",
          "--border-radius": "0.75rem",
          "--success-bg": "rgb(255, 255, 255)",
          "--success-text": "rgb(5, 46, 22)",
          "--success-border": "rgb(187, 247, 208)",
          "--error-bg": "rgb(255, 255, 255)",
          "--error-text": "rgb(69, 10, 10)",
          "--error-border": "rgb(254, 202, 202)",
          "--warning-bg": "rgb(255, 255, 255)",
          "--warning-text": "rgb(69, 26, 3)",
          "--warning-border": "rgb(253, 230, 138)",
          "--info-bg": "rgb(255, 255, 255)",
          "--info-text": "rgb(23, 37, 84)",
          "--info-border": "rgb(191, 219, 254)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };

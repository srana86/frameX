import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export type PageHeaderBreadcrumb = {
  label: string;
  href?: string;
};

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  breadcrumbs?: PageHeaderBreadcrumb[];
  align?: "start" | "center";
}

export function PageHeader({ title, description, actions, className, breadcrumbs, align = "start" }: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb.label}-${index}`} className='flex items-center gap-2'>
              {index > 0 ? <span className='text-muted-foreground/70'>/</span> : null}
              {crumb.href && index !== breadcrumbs.length - 1 ? (
                <Link href={crumb.href} className='transition-colors hover:text-foreground hover:underline'>
                  {crumb.label}
                </Link>
              ) : (
                <span className='text-foreground'>{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      ) : null}

      <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", align === "center" && "sm:text-center")}>
        <div className={cn("space-y-2", align === "center" && "sm:flex-1")}>
          <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
          {description ? <p className='text-muted-foreground'>{description}</p> : null}
        </div>
        {actions ? <div className='flex flex-wrap items-center gap-2'>{actions}</div> : null}
      </div>
    </div>
  );
}

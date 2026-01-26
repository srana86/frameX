"use client";

import Link from "next/link";

interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItemType[];
}

export function SiteBreadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label='breadcrumb' className='py-2'>
      <ol className='flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground'>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className='flex items-center'>
              {index > 0 && <span className='mx-1.5 text-muted-foreground/70'>»</span>}
              {isLast || !item.href ? (
                <span className='text-foreground font-medium'>{item.label}</span>
              ) : (
                <Link href={item.href} className='hover:text-foreground transition-colors'>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

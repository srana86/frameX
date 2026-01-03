"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Heart, Truck, Shield, RefreshCw, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { BrandConfig } from "@/lib/brand-config";
import { Logo } from "@/components/site/Logo";

interface EnabledFooterPage {
  slug: string;
  title: string;
  category: string;
}

interface FooterProps {
  brandConfig: BrandConfig;
  enabledPages: EnabledFooterPage[];
}

export function Footer({ brandConfig: config, enabledPages: footerPages }: FooterProps) {
  const currentYear = new Date().getFullYear();

  // Group pages by category
  const pagesByCategory = footerPages.reduce((acc, page) => {
    const category = page.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(page);
    return acc;
  }, {} as Record<string, EnabledFooterPage[]>);

  const categories = Object.keys(pagesByCategory).sort();

  return (
    <footer className='bg-gradient-to-br from-background via-background to-accent/5 border-t border-border/50'>
      {/* Main Footer Content */}
      <div className='mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8'>
        <div
          className={`grid grid-cols-1 gap-8 ${categories.length > 0 ? "lg:grid-cols-4 md:grid-cols-2" : "lg:grid-cols-3 md:grid-cols-2"}`}
        >
          {/* Brand Section */}
          <div className='space-y-4'>
            <Logo className='text-xl' brandConfig={config} />
            <p className='text-sm text-muted-foreground max-w-xs'>{config.footer.description}</p>
            <div className='flex items-center gap-3'>
              {config.social.facebook && (
                <Button variant='ghost' size='sm' className='hover:text-primary' asChild>
                  <Link href={config.social.facebook} target='_blank' rel='noopener noreferrer'>
                    <Facebook className='w-4 h-4' />
                  </Link>
                </Button>
              )}
              {config.social.twitter && (
                <Button variant='ghost' size='sm' className='hover:text-primary' asChild>
                  <Link href={config.social.twitter} target='_blank' rel='noopener noreferrer'>
                    <Twitter className='w-4 h-4' />
                  </Link>
                </Button>
              )}
              {config.social.instagram && (
                <Button variant='ghost' size='sm' className='hover:text-primary' asChild>
                  <Link href={config.social.instagram} target='_blank' rel='noopener noreferrer'>
                    <Instagram className='w-4 h-4' />
                  </Link>
                </Button>
              )}
              {config.social.youtube && (
                <Button variant='ghost' size='sm' className='hover:text-primary' asChild>
                  <Link href={config.social.youtube} target='_blank' rel='noopener noreferrer'>
                    <Youtube className='w-4 h-4' />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold text-foreground'>Quick Links</h3>
            <nav className='flex flex-col space-y-2'>
              <Link href='/' className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                Home
              </Link>
              <Link href='/cart' className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                Shopping Cart
              </Link>
            </nav>
          </div>

          {/* Category-based Pages */}
          {categories.length > 0 ? (
            categories.map((category) => (
              <div key={category} className='space-y-4'>
                <h3 className='text-sm font-semibold text-foreground'>{category}</h3>
                <nav className='flex flex-col space-y-2'>
                  {pagesByCategory[category].map((page) => (
                    <Link
                      key={page.slug}
                      href={`/pages/${page.slug}`}
                      className='text-sm text-muted-foreground hover:text-primary transition-colors'
                    >
                      {page.title}
                    </Link>
                  ))}
                </nav>
              </div>
            ))
          ) : (
            <div className='space-y-4'>
              <h3 className='text-sm font-semibold text-foreground'>Information</h3>
              <nav className='flex flex-col space-y-2'>
                <span className='text-sm text-muted-foreground'>No pages available</span>
              </nav>
            </div>
          )}

          {/* Newsletter */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold text-foreground'>Stay Updated</h3>
            <p className='text-sm text-muted-foreground'>Subscribe to get special offers, free giveaways, and exclusive deals.</p>
            <div className='flex gap-2'>
              <Input placeholder='Enter your email' className='flex-1 h-9 text-sm' />
              <Button size='sm' className='px-4'>
                Subscribe
              </Button>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Mail className='w-3 h-3' />
                <span>{config.contact.email}</span>
              </div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Phone className='w-3 h-3' />
                <span>{config.contact.phone}</span>
              </div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <MapPin className='w-3 h-3' />
                <span>{config.contact.address}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className='my-8' />

        {/* Bottom Section */}
        <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
          <div className='flex items-center gap-4 text-sm text-muted-foreground flex-wrap'>
            <p>
              © {currentYear} {config.brandName}. {config.footer.copyrightText || "All rights reserved."}
            </p>
            {categories.length > 0 && (
              <>
                <Separator orientation='vertical' className='h-4' />
                {categories.map((category, catIndex) => (
                  <span key={category}>
                    {pagesByCategory[category].map((page, pageIndex) => (
                      <span key={page.slug}>
                        <Link href={`/pages/${page.slug}`} className='hover:text-primary transition-colors'>
                          {page.title}
                        </Link>
                        {(pageIndex < pagesByCategory[category].length - 1 || catIndex < categories.length - 1) && (
                          <span className='mx-2'>•</span>
                        )}
                      </span>
                    ))}
                  </span>
                ))}
              </>
            )}
          </div>

          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <span>Made with</span>
            <Heart className='w-4 h-4 text-red-500 animate-pulse' />
            <span>for {config.brandTagline?.toLowerCase() || "our customers"}</span>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className='h-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20' />
    </footer>
  );
}

export default Footer;

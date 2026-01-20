"use client";

import { useState, useRef, useEffect } from "react";
import SectionHeader from "../../../shared/SectionHeader";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "1",
    question: "How much does it cost to start an e-commerce store?",
    answer:
      "Our plans start at just ৳500 per month. We also offer 3-month plans at ৳1,300 and 6-month plans at ৳2,500 for even better value. All plans include the same complete features - product management, order processing, payment gateway integration, tracking, and more.",
  },
  {
    id: "2",
    question: "Do I need technical knowledge to set up my online store?",
    answer:
      "No technical skills required! Our platform is designed for merchants of all levels. You can set up your complete e-commerce store in minutes, add products easily, and start selling right away. We provide step-by-step guidance for everything.",
  },
  {
    id: "3",
    question: "Can I use my own custom domain?",
    answer:
      "Yes! All plans include custom domain support. You can connect your own domain name to your store to build your brand. We provide easy setup instructions to connect your domain quickly.",
  },
  {
    id: "4",
    question: "What features are included in the plans?",
    answer:
      "All plans include everything you need: complete e-commerce store, unlimited products, product and inventory management, order management, payment gateway integration, Facebook Pixel tracking, Instagram & TikTok Conversion API, advanced analytics, custom domain, brand customization (logo, SEO, theme), mobile responsive design, and email support.",
  },
  {
    id: "5",
    question: "How do I accept payments from customers?",
    answer:
      "Payment gateway integration is included in all plans. You can accept payments securely through multiple payment methods. We support popular payment gateways in Bangladesh to make it easy for your customers to pay.",
  },
  {
    id: "6",
    question: "Will my store work on mobile devices?",
    answer:
      "Absolutely! All stores are fully mobile-responsive and optimized for smartphones and tablets. Your customers can browse products, add to cart, and complete purchases seamlessly on any device. This is included in all plans.",
  },
];

export default function FaqContainer() {
  const [openItems, setOpenItems] = useState<string[]>(["1"]); // First item open by default
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Set initial state for open items
  useEffect(() => {
    itemsRef.current.forEach((item, index) => {
      if (!item) return;
      const itemId = faqItems[index]?.id;
      const isOpen = openItems.includes(itemId);
      const contentRef = item.querySelector(".faq-content") as HTMLElement;
      const iconRef = item.querySelector(".faq-icon") as HTMLElement;
      if (contentRef) {
        if (isOpen) {
          gsap.set(contentRef, { height: "auto", opacity: 1 });
        } else {
          gsap.set(contentRef, { height: 0, opacity: 0 });
        }
      }
      if (iconRef) {
        if (isOpen) {
          gsap.set(iconRef, { rotation: 180 });
        } else {
          gsap.set(iconRef, { rotation: 0 });
        }
      }
    });
  }, []);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Clean fade-up for header
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Clean fade-up for FAQ items
      itemsRef.current.forEach((item, index) => {
        if (!item) return;
        gsap.fromTo(
          item,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            delay: index * 0.06,
            scrollTrigger: {
              trigger: item,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  const toggleItem = (id: string) => {
    const itemIndex = faqItems.findIndex((item) => item.id === id);
    const itemRef = itemsRef.current[itemIndex];
    const contentRef = itemRef?.querySelector(".faq-content") as HTMLElement;
    const iconRef = itemRef?.querySelector(".faq-icon") as HTMLElement;
    const isOpen = openItems.includes(id);

    if (isOpen) {
      // Close - animate to height 0 and keep it there
      gsap.to(contentRef, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          // Keep height at 0 when closed, don't set to auto
          gsap.set(contentRef, { height: 0, overflow: "hidden" });
        },
      });
      // Rotate icon back to 0
      if (iconRef) {
        gsap.to(iconRef, {
          rotation: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      }
      setOpenItems((prev) => prev.filter((item) => item !== id));
    } else {
      // Open - animate from 0 to full height
      gsap.set(contentRef, { height: "auto", opacity: 0 });
      const height = contentRef?.offsetHeight || 0;
      gsap.set(contentRef, { height: 0, opacity: 0 });
      gsap.to(contentRef, {
        height: height,
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => {
          // Set to auto after animation so content can grow if needed
          gsap.set(contentRef, { height: "auto" });
        },
      });
      // Rotate icon 180 degrees when opening
      if (iconRef) {
        gsap.to(iconRef, {
          rotation: 180,
          duration: 0.4,
          ease: "power2.out",
        });
      }
      setOpenItems((prev) => [...prev, id]);
    }
  };

  return (
    <section ref={sectionRef} className='w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-white'>
      <div className='max-w-4xl mx-auto px-3'>
        {/* Header */}
        <div ref={headerRef} className='mb-12 sm:mb-16 md:mb-20'>
          <SectionHeader
            title='Frequently Asked Questions'
            subtitle='Find answers to common questions about starting your e-commerce business with our platform.'
          />
        </div>

        {/* FAQ Items */}
        <div className='space-y-4 sm:space-y-5'>
          {faqItems.map((item, index) => {
            const isOpen = openItems.includes(item.id);
            return (
              <div
                key={item.id}
                ref={(el) => {
                  itemsRef.current[index] = el;
                }}
                className={cn(
                  "rounded-lg border overflow-hidden transition-colors duration-300",
                  isOpen ? "bg-white" : "bg-white hover:border-[#2078FF]/50"
                )}
                style={{
                  borderColor: isOpen ? "rgba(32, 120, 255, 0.3)" : "rgba(0, 0, 0, 0.1)",
                  backgroundColor: isOpen ? "rgba(32, 120, 255, 0.05)" : "white",
                }}
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-0 p-4 sm:p-5 text-left cursor-pointer group",
                    isOpen ? "text-gray-900" : "text-gray-800 hover:text-gray-900"
                  )}
                >
                  <h3
                    className={cn("font-semibold text-base sm:text-lg md:text-xl flex-1", isOpen && "text-gray-900")}
                    style={{
                      fontFamily: "var(--font-urbanist), sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {item.question}
                  </h3>
                  <div
                    className={cn(
                      "shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full relative faq-icon transition-colors duration-300",
                      isOpen ? "" : "bg-gray-100 text-gray-600 group-hover:bg-[rgba(32,120,255,0.15)] group-hover:text-[#2078FF]"
                    )}
                    style={{
                      backgroundColor: isOpen ? "rgba(32, 120, 255, 0.15)" : undefined,
                      color: isOpen ? "#2078FF" : undefined,
                    }}
                  >
                    {isOpen ? <Minus className='w-4 h-4 sm:w-5 sm:h-5' /> : <Plus className='w-4 h-4 sm:w-5 sm:h-5' />}
                  </div>
                </button>

                {/* Answer Content */}
                <div className='faq-content overflow-hidden'>
                  <div className='px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 pt-0'>
                    <p
                      className='text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg'
                      style={{
                        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                        fontWeight: 400,
                        lineHeight: "1.6",
                      }}
                    >
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

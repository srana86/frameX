"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Calendar, User, ChevronRight, Mail, Sparkles } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Mock Data
const featuredPost = {
  id: 1,
  title: "The Future of E-Commerce: Trends to Watch in 2026",
  excerpt:
    "Explore the transformative technologies and consumer behaviors shaping the next generation of online retail. From AI-driven personalization to immersive shopping experiences.",
  category: "Trends",
  author: "Sarah Anderson",
  date: "Jan 12, 2026",
  readTime: "8 min read",
  image:
    "https://images.unsplash.com/photo-1661956602116-aa6865609028?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1664&q=80",
  authorAvatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};

const blogPosts = [
  {
    id: 2,
    title: "Scaling Your Store: From 0 to 10k Orders",
    excerpt:
      "A comprehensive guide on infrastructure, logistics, and marketing strategies to handle rapid growth without breaking your operations.",
    category: "Scaling",
    author: "Michael Chen",
    date: "Jan 10, 2026",
    readTime: "12 min read",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2426&q=80",
    authorAvatar:
      "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    id: 3,
    title: "Mastering Conversion Rate Optimization",
    excerpt: "Practical tips and psychological triggers to turn more visitors into paying customers. Learn the art of persuasive design.",
    category: "Marketing",
    author: "Emma Wilson",
    date: "Jan 08, 2026",
    readTime: "6 min read",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
    authorAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    id: 4,
    title: "The Ultimate Guide to Email Marketing",
    excerpt: "Build a loyal customer base with automated email flows. Recover abandoned carts and drive repeat purchases effectively.",
    category: "Marketing",
    author: "James Rodriguez",
    date: "Jan 05, 2026",
    readTime: "9 min read",
    image:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    authorAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    id: 5,
    title: "Dropshipping vs. Inventory: What's Right for You?",
    excerpt: "Comparing the pros and cons of two popular e-commerce business models. Find out which one aligns with your goals and budget.",
    category: "Guide",
    author: "Alex Thompson",
    date: "Jan 03, 2026",
    readTime: "7 min read",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
    authorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    id: 6,
    title: "Optimizing Web Performance for Mobile Shoppers",
    excerpt:
      "Mobile commerce is dominating. Ensure your store loads instantly and provides a seamless checkout experience on small screens.",
    category: "Tech",
    author: "Lisa Pat",
    date: "Jan 01, 2026",
    readTime: "5 min read",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
    authorAvatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
];

const categories = ["View All", "Trends", "Scaling", "Marketing", "Guide", "Tech"];

export default function BlogContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = React.useState("View All");

  const filteredPosts = activeCategory === "View All" ? blogPosts : blogPosts.filter((post) => post.category === activeCategory);

  useGSAP(
    () => {
      // Hero Animation - Only run once on mount
      gsap.from(".blog-hero", {
        scrollTrigger: {
          trigger: ".blog-hero",
          start: "top 85%",
        },
        opacity: 0,
        y: 40,
        duration: 1,
        ease: "power3.out",
      });

      // Grid Animation - Re-run when category changes
      // Kill previous animations on these elements to prevent conflicts
      gsap.killTweensOf(".blog-card");

      gsap.fromTo(
        ".blog-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          overwrite: "auto",
        }
      );

      // Newsletter Animation
      gsap.from(".newsletter-section", {
        scrollTrigger: {
          trigger: ".newsletter-section",
          start: "top 85%",
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
      });
    },
    { scope: containerRef, dependencies: [activeCategory] }
  );

  return (
    <section ref={containerRef} className='w-full bg-[#FAFAFA] pt-32 pb-24'>
      <div className='max-w-7xl mx-auto px-3 md:px-4'>
        {/* Header Section */}
        <div className='text-center mb-16'>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
            Insights & <span className='text-[#0448FD]'>Resources</span>
          </h1>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Expert articles, industry guides, and success stories to help you launch, grow, and scale your e-commerce business.
          </p>

          {/* Categories */}
          <div className='flex flex-wrap justify-center gap-2 mt-8'>
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-[#0448FD] text-white shadow-lg shadow-[#0448FD]/20"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Section - Featured Post */}
        {activeCategory === "View All" && (
          <div className='blog-hero relative rounded-4xl overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-500 group mb-16 border border-gray-100'>
            <div className='grid grid-cols-1 lg:grid-cols-2'>
              <div className='relative h-64 lg:h-auto overflow-hidden'>
                <Image
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  fill
                  className='object-cover group-hover:scale-105 transition-transform duration-700'
                />
                <div className='absolute inset-0 bg-linear-to-t from-black/60 to-transparent lg:hidden' />
              </div>
              <div className='p-8 lg:p-12 flex flex-col justify-center relative bg-white'>
                <div className='flex items-center gap-3 mb-4'>
                  <span className='px-3 py-1 rounded-full bg-[#0448FD]/10 text-[#0448FD] text-xs font-bold uppercase tracking-wider'>
                    Featured
                  </span>
                  <span className='px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider'>
                    {featuredPost.category}
                  </span>
                </div>

                <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-[#0448FD] transition-colors'>
                  <Link href={`/blog/${featuredPost.id}`}>{featuredPost.title}</Link>
                </h2>

                <p className='text-gray-600 mb-6 text-lg leading-relaxed line-clamp-3'>{featuredPost.excerpt}</p>

                <div className='flex items-center justify-between mt-auto pt-6 border-t border-gray-100'>
                  <div className='flex items-center gap-3'>
                    <Image
                      src={featuredPost.authorAvatar}
                      alt={featuredPost.author}
                      width={40}
                      height={40}
                      className='rounded-full border-2 border-white shadow-sm'
                    />
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>{featuredPost.author}</p>
                      <div className='flex items-center gap-2 text-xs text-gray-500'>
                        <span>{featuredPost.date}</span>
                        <span>•</span>
                        <span className='flex items-center gap-1'>
                          <Clock size={12} />
                          {featuredPost.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/blog/${featuredPost.id}`}
                    className='hidden sm:flex items-center gap-2 text-[#0448FD] font-semibold group/link hover:gap-3 transition-all'
                  >
                    Read Article <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blog Grid */}
        <div className='blog-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 min-h-[400px]'>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className='blog-card group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100'
              >
                <div className='relative h-56 overflow-hidden'>
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className='object-cover group-hover:scale-110 transition-transform duration-500'
                  />
                  <div className='absolute top-4 left-4'>
                    <span className='px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold shadow-sm'>
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className='flex-1 p-6 flex flex-col'>
                  <div className='flex items-center gap-2 text-xs text-gray-500 mb-3'>
                    <Calendar size={14} />
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className='text-xl font-bold text-gray-900 mb-3 group-hover:text-[#0448FD] transition-colors line-clamp-2'>
                    {post.title}
                  </h3>

                  <p className='text-gray-600 text-sm mb-4 line-clamp-2 flex-1'>{post.excerpt}</p>

                  <div className='flex items-center gap-2 text-sm font-medium text-gray-900 group/author'>
                    <span className='text-[#0448FD] flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300'>
                      Read now <ChevronRight size={16} />
                    </span>
                    <div className='flex items-center gap-2 ml-auto text-xs text-gray-500 group-hover:opacity-0 transition-opacity duration-300'>
                      <User size={14} />
                      {post.author}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className='col-span-full py-20 text-center text-gray-500 flex flex-col items-center justify-center'>
              <p className='text-xl font-medium mb-2'>No posts found in this category.</p>
              <p className='text-sm'>Try checking back later or browse other categories.</p>
            </div>
          )}
        </div>

        {/* Newsletter CTA */}
        <div className='newsletter-section relative overflow-hidden rounded-[40px] bg-linear-to-br from-[#0448FD] to-[#0038d4] text-white p-8 md:p-16'>
          {/* Background Decor */}
          <div className='absolute top-0 right-0 p-12 opacity-10'>
            <Sparkles size={200} />
          </div>
          <div className='absolute -bottom-10 -left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none' />

          <div className='relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center'>
            <div>
              <h2 className='text-3xl md:text-4xl font-bold mb-4'>Stay ahead of the curve</h2>
              <p className='text-white/80 text-lg mb-8 max-w-md'>
                Join 25,000+ merchants receiving the latest e-commerce insights, trends, and tips directly to their inbox.
              </p>

              <div className='flex flex-col sm:flex-row gap-3 max-w-md md:rounded-xl border-white/20 md:border'>
                <div className='relative flex-1'>
                  <Mail className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
                  <input
                    type='email'
                    placeholder='Enter your email address'
                    className='w-full h-12 pl-12 pr-4 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-none focus:ring-0 border border-white/20 rounded-xl md:border-0'
                  />
                </div>
                <button className='cursor-pointer h-12 px-8 rounded-xl bg-white text-[#0448FD] font-bold hover:bg-gray-50 transition-colors shadow-lg'>
                  Subscribe
                </button>
              </div>
              <p className='text-xs text-white/60 mt-4'>No spam, ever. Unsubscribe at any time.</p>
            </div>

            <div className='hidden lg:flex justify-center'>
              {/* Decorative card stack representation */}
              <div className='relative w-72 h-48 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 rotate-6 transform translate-x-4'>
                <div className='h-4 w-3/4 bg-white/30 rounded-full mb-4'></div>
                <div className='h-3 w-full bg-white/20 rounded-full mb-2'></div>
                <div className='h-3 w-5/6 bg-white/20 rounded-full mb-2'></div>
                <div className='h-3 w-4/6 bg-white/20 rounded-full'></div>

                {/* Floating badge */}
                <div className='absolute -top-6 -right-6 w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center shadow-lg animate-bounce duration-3000'>
                  <span className='text-[#0448FD] font-bold text-xs'>New</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

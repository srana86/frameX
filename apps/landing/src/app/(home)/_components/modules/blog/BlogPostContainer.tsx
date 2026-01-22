"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, User, Share2, Facebook, Twitter, Linkedin, Bookmark } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

// Mock Data (Expanded for single post view)
const getPostById = (id: string) => {
  // Simulating fetching data
  return {
    id,
    title: "The Future of E-Commerce: Trends to Watch in 2026",
    subtitle: "How AI, VR, and hyper-personalization are reshaping the online shopping landscape.",
    category: "Trends",
    author: "Sarah Anderson",
    authorRole: "E-commerce Strategist",
    date: "Jan 12, 2026",
    readTime: "8 min read",
    image:
      "https://images.unsplash.com/photo-1661956602116-aa6865609028?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1664&q=80",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    content: `
      <p class="mb-6 text-lg leading-relaxed text-gray-700">The e-commerce landscape is shifting beneath our feet. As we move further into 2026, the convergence of artificial intelligence, immersive technologies, and shifting consumer expectations is creating a new reality for online retailers. It's no longer just about having a website; it's about creating an experience.</p>
      
      <h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Hyper-Personalization at Scale</h2>
      <p class="mb-6 text-lg leading-relaxed text-gray-700">Gone are the days of "People who bought this also bought that." The new standard is predictive personalization. AI algorithms now analyze thousands of data points—from browsing behavior to weather patterns in the user's location—to curate unique storefronts for every single visitor.</p>
      
      <h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4">2. The Rise of "Phygital" Retail</h2>
      <p class="mb-6 text-lg leading-relaxed text-gray-700">The line between physical and digital shopping is dissolving. Augmented Reality (AR) allows customers to "try on" clothes or visualize furniture in their living room with unprecedented accuracy. Brands are launching virtual showrooms that offer the tactility of in-store shopping with the convenience of e-commerce.</p>
      
      <blockquote class="border-l-4 border-[#0448FD] pl-6 my-10 italic text-xl text-gray-800 bg-gray-50 py-4 rounded-r-xl">
        "The most successful brands of 2026 won't be those with the best products, but those with the most seamless integration into their customers' lives."
      </blockquote>

      <h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Sustainable Logistics</h2>
      <p class="mb-6 text-lg leading-relaxed text-gray-700">Sustainability has moved from a "nice-to-have" to a deal-breaker. Consumers are demanding transparency in the supply chain. We're seeing a massive shift towards carbon-neutral shipping, biodegradable packaging, and circular economy models where recommerce (reselling used goods) is integrated directly into the checkout flow.</p>
      
      <p class="mb-6 text-lg leading-relaxed text-gray-700">Tenants who adapt to these trends aren't just surviving; they're thriving. The tools to implement these strategies are more accessible than ever, thanks to platforms like FrameX making enterprise-grade technology available to everyone.</p>
    `,
  };
};

export default function BlogPostContainer({ params }: { params: { id: string } }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const post = getPostById(params.id);

  useGSAP(
    () => {
      // Fade in content
      gsap.from(".post-content", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.2,
        ease: "power3.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <article ref={containerRef} className='bg-[#FAFAFA] pt-32 pb-24'>
      {/* Scroll Progress Bar (Optional) */}
      <div className='fixed top-0 left-0 h-1 bg-[#0448FD] z-50 w-full transform origin-left scale-x-0' id='scroll-progress' />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Back Link */}
        <div className='mb-8'>
          <Link
            href='/blog'
            className='inline-flex items-center gap-2 text-gray-500 hover:text-[#0448FD] transition-colors font-medium group'
          >
            <ArrowLeft size={20} className='group-hover:-translate-x-1 transition-transform' />
            Back to Blog
          </Link>
        </div>

        {/* Header */}
        <header className='mb-12 text-center md:text-left'>
          <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6'>
            <span className='px-3 py-1 rounded-full bg-[#0448FD]/10 text-[#0448FD] text-sm font-bold uppercase tracking-wider'>
              {post.category}
            </span>
            <span className='flex items-center gap-2 text-gray-500 text-sm'>
              <Calendar size={14} /> {post.date}
            </span>
            <span className='flex items-center gap-2 text-gray-500 text-sm'>
              <Clock size={14} /> {post.readTime}
            </span>
          </div>

          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight'>{post.title}</h1>
          <p className='text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed'>{post.subtitle}</p>

          <div className='flex items-center justify-center md:justify-start gap-4'>
            <Image
              src={post.authorAvatar}
              alt={post.author}
              width={56}
              height={56}
              className='rounded-full border-2 border-white shadow-sm'
            />
            <div className='text-left'>
              <p className='font-bold text-gray-900 text-lg'>{post.author}</p>
              <p className='text-gray-500 text-sm'>{post.authorRole}</p>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className='relative aspect-video rounded-3xl overflow-hidden shadow-2xl mb-16'>
          <Image src={post.image} alt={post.title} fill className='object-cover' priority />
        </div>

        {/* Content & Sidebar Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12'>
          {/* Main Content */}
          <div className='lg:col-span-8 post-content'>
            <div className='prose prose-lg prose-blue max-w-none text-gray-700' dangerouslySetInnerHTML={{ __html: post.content }} />

            {/* Tags (Mock) */}
            <div className='mt-12 pt-8 border-t border-gray-100'>
              <p className='text-sm font-semibold text-gray-900 mb-4'>Tags:</p>
              <div className='flex flex-wrap gap-2'>
                {["E-commerce", "Technology", "Future", "Growth"].map((tag) => (
                  <span
                    key={tag}
                    className='px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 cursor-pointer transition-colors'
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Social Share */}
          <div className='lg:col-span-4 space-y-8'>
            <div className='lg:sticky lg:top-32'>
              {/* Share Card */}
              <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8'>
                <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
                  <Share2 size={18} /> Share this article
                </h3>
                <div className='flex gap-2'>
                  <button className='p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors'>
                    <Twitter size={20} />
                  </button>
                  <button className='p-3 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors'>
                    <Facebook size={20} />
                  </button>
                  <button className='p-3 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors'>
                    <Linkedin size={20} />
                  </button>
                  <button className='p-3 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors ml-auto'>
                    <Bookmark size={20} />
                  </button>
                </div>
              </div>

              {/* Related Post (Mock) */}
              <div className='bg-[#0448FD]/5 rounded-2xl p-6 border border-[#0448FD]/10'>
                <span className='text-xs font-bold text-[#0448FD] uppercase tracking-wider mb-2 block'>Read Next</span>
                <Link href='/blog/2' className='block text-xl font-bold text-gray-900 hover:text-[#0448FD] transition-colors mb-2'>
                  Scaling Your Store: From 0 to 10k Orders
                </Link>
                <div className='flex items-center gap-2 text-sm text-gray-500'>
                  <User size={14} /> Michael Chen
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

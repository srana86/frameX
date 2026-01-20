"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import SectionHeader from "../../../shared/SectionHeader";
import { cn } from "@/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TeamMember {
  id: string;
  name: string;
  description: string;
  role: string;
  image: string;
  overlayColor: string;
}

// IMPORTANT: Add professional team photos to /public/team/ folder
// Recommended: Use professional business headshots (400x500px or similar portrait ratio)
// Fallback URLs are provided but should be replaced with actual team photos
const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Aiden Clarke",
    description: "Helps merchants grow their business",
    role: "Founder & CEO",
    // Add professional photo at: /public/team/aiden-clarke.jpg or team-member-1.jpg
    image:
      "https://media.istockphoto.com/id/1413766112/photo/successful-mature-businessman-looking-at-camera-with-confidence.jpg?s=612x612&w=0&k=20&c=NJSugBzNuZqb7DJ8ZgLfYKb3qPr2EJMvKZ21Sj5Sfq4=",
    overlayColor: "rgba(0, 0, 0, 0.75)",
  },
  {
    id: "2",
    name: "Mia Reynolds",
    description: "Creates beautiful store designs",
    role: "Design Lead",
    // Add professional photo at: /public/team/mia-reynolds.jpg or team-member-2.jpg
    image:
      "https://plus.unsplash.com/premium_photo-1672691612717-954cdfaaa8c5?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmVzc2lvbmFsJTIwd29tYW58ZW58MHx8MHx8fDA%3D",
    overlayColor: "rgba(0, 0, 0, 0.8)",
  },
  {
    id: "3",
    name: "Noah Carter",
    description: "Ensures smooth store experience",
    role: "E-Commerce Specialist",
    // Add professional photo at: /public/team/noah-carter.jpg or team-member-3.jpg
    image: "https://img.freepik.com/free-photo/man-portrait-posing-loft-modern-space_158595-5369.jpg?semt=ais_hybrid&w=740&q=80",
    overlayColor: "rgba(0, 0, 0, 0.75)",
  },
  {
    id: "4",
    name: "Lucas Bennett",
    description: "Builds powerful e-commerce features",
    role: "Technical Lead",
    // Add professional photo at: /public/team/lucas-bennett.jpg or team-member-4.jpg
    image:
      "https://img.freepik.com/premium-photo/happy-portrait-businessman-with-meeting-office-partnership-collaboration-seminar-employee-workshop-corporate-training-with-pride-company-management-sales-planning_590464-365910.jpg?semt=ais_hybrid&w=740&q=80",
    overlayColor: "rgba(0, 0, 0, 0.8)",
  },
];

export default function TeamContainer() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

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
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className='w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-white'>
      <div className=''>
        {/* Header */}
        <div ref={headerRef} className='max-w-7xl mx-auto px-3 mb-12 sm:mb-16 md:mb-20'>
          <SectionHeader
            title='Our Team Dedicated to Your Success'
            subtitle='Meet the passionate team helping thousands of merchants start and grow their e-commerce businesses every day.'
          />
        </div>

        {/* Team Slider Container */}
        <div className='relative overflow-hidden'>
          {/* Mobile/Tablet - Horizontal Slider with side gradients */}
          <div className='lg:hidden relative px-2'>
            {/* Left Gradient - White to Transparent */}
            <div
              className='absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none'
              style={{
                background: "linear-gradient(to right, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)",
              }}
            />

            {/* Right Gradient - Transparent to White */}
            <div
              className='absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none'
              style={{
                background: "linear-gradient(to left, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)",
              }}
            />

            <MobileTeamSlider teamMembers={teamMembers} />
          </div>

          {/* Large Device - Horizontal Auto Infinite Slider */}
          <div className='hidden lg:block relative z-0'>
            <TeamSlider teamMembers={teamMembers} />
          </div>
        </div>
      </div>
    </section>
  );
}

// Mobile Horizontal Slider Component
function MobileTeamSlider({ teamMembers }: { teamMembers: TeamMember[] }) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  // Duplicate team members for infinite scroll effect (scroll 50% = one full set)
  const duplicatedMembers = [...teamMembers, ...teamMembers];

  useGSAP(
    () => {
      if (!sliderRef.current) return;

      animationRef.current = gsap.to(sliderRef.current, {
        x: "-50%",
        duration: 35,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: sliderRef }
  );

  return (
    <div className='lg:hidden relative overflow-x-hidden py-4' style={{ height: "auto" }}>
      <div
        ref={sliderRef}
        className='flex gap-4 sm:gap-6 md:gap-8'
        style={{
          willChange: "transform",
          width: "fit-content",
        }}
      >
        {duplicatedMembers.map((member, index) => (
          <div key={`${member.id}-${index}`} className='shrink-0 w-[calc(100vw-3rem)] sm:w-[calc(50vw-2rem)] max-w-[350px]'>
            <TeamCard member={member} index={index % teamMembers.length} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Horizontal Auto Infinite Slider Component (Desktop)
function TeamSlider({ teamMembers }: { teamMembers: TeamMember[] }) {
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  // Duplicate team members 5 times for 5 cycles (default)
  const duplicatedMembers = [
    ...teamMembers, // 1st cycle
    ...teamMembers, // 2nd cycle
    ...teamMembers, // 3rd cycle (smooth transition)
    ...teamMembers, // 4th cycle
    ...teamMembers, // 5th cycle
  ];

  useGSAP(
    () => {
      if (!sliderRef.current) return;

      animationRef.current = gsap.to(sliderRef.current, {
        x: "-20%",
        duration: 30,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: sliderRef }
  );

  // Pause/resume on hover
  React.useEffect(() => {
    if (animationRef.current) {
      if (isHovered) {
        animationRef.current.pause();
      } else {
        animationRef.current.resume();
      }
    }
  }, [isHovered]);

  return (
    <div className='relative overflow-hidden' onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div ref={sliderRef} className='flex gap-6 md:gap-8' style={{ width: "fit-content", willChange: "transform" }}>
        {duplicatedMembers.map((member, index) => {
          const cycleNumber = Math.floor(index / teamMembers.length) + 1;
          const isThirdCycle = cycleNumber === 3;

          return (
            <div
              key={`${member.id}-${index}`}
              className={cn("shrink-0 w-[250px] sm:w-[300px] h-full", isThirdCycle && "transform scale-105")}
            >
              <TeamCard member={member} index={index % teamMembers.length} isThirdCycle={isThirdCycle} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TeamCardProps {
  member: TeamMember;
  index: number;
  isThirdCycle?: boolean;
}

function TeamCard({ member, index, isThirdCycle = false }: TeamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!cardRef.current) return;

      // Clean fade-up for card
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          delay: index * 0.08,
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: cardRef }
  );

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative w-full aspect-3/4 rounded-2xl overflow-hidden",
        "bg-white border border-gray-100",
        "shadow-sm hover:shadow-xl transition-all duration-500",
        "max-h-[400px] sm:max-h-[450px]",
        isThirdCycle && "ring-2 ring-blue-200/60 shadow-xl"
      )}
    >
      {/* Image Container with Gradient Overlay */}
      <div className='relative w-full h-full bg-linear-to-b from-gray-100 to-gray-200'>
        <Image
          src={member.image}
          alt={member.name}
          fill
          className='object-cover transition-transform duration-700 group-hover:scale-105'
          sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px'
        />

        {/* Gradient Overlay - Subtle top to bottom */}
        <div className='absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent' />

        {/* Professional Content Overlay at Bottom */}
        <div className='absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-7'>
          <div className='space-y-2'>
            {/* Name */}
            <h3
              className='text-white font-bold text-lg sm:text-xl md:text-2xl leading-tight'
              style={{
                fontFamily: "var(--font-nunito-sans), sans-serif",
                fontWeight: 700,
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
            >
              {member.name}
            </h3>

            {/* Role Badge */}
            <div className='inline-flex items-center'>
              <span
                className='text-white/95 text-sm sm:text-base font-medium px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20'
                style={{
                  fontFamily: "var(--font-urbanist), sans-serif",
                  fontWeight: 500,
                  textShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                }}
              >
                {member.role}
              </span>
            </div>

            {/* Description */}
            <p
              className='text-white/90 text-sm sm:text-base leading-relaxed pt-1 max-w-[90%]'
              style={{
                fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                fontWeight: 400,
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.3)",
              }}
            >
              {member.description}
            </p>
          </div>
        </div>
      </div>

      {/* Subtle Border Glow on Hover */}
      <div className='absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200/40 transition-all duration-500 pointer-events-none' />
    </div>
  );
}

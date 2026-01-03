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

const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Aiden Clarke",
    description: "Improves business strategy",
    role: "Founder",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
    overlayColor: "rgba(0, 0, 0, 0.75)",
  },
  {
    id: "2",
    name: "Mia Reynolds",
    description: "Crafts modern visuals",
    role: "Design Lead",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
    overlayColor: "rgba(0, 0, 0, 0.8)",
  },
  {
    id: "3",
    name: "Noah Carter",
    description: "Designs clean user flows",
    role: "UI/UX Designer",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop",
    overlayColor: "rgba(0, 0, 0, 0.75)",
  },
  {
    id: "4",
    name: "Lucas Bennett",
    description: "Builds smooth interfaces",
    role: "Frontend Developer",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop",
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
    <section ref={sectionRef} className='w-full pt-12 sm:pt-16 md:pt-20 lg:pt-24 mb-5 md:pb-10 bg-white'>
      <div className=''>
        {/* Header */}
        <div ref={headerRef} className='max-w-7xl mx-auto px-3 mb-12 sm:mb-16 md:mb-20'>
          <SectionHeader
            title='The People Behind Our Work'
            subtitle='A dedicated team of creators, strategists, and developers working together to deliver smooth, high-quality ecommerce experiences.'
          />
        </div>

        {/* Team Slider Container */}
        <div className='relative overflow-hidden px-2'>
          {/* Mobile/Tablet Grid - Static */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-2 relative z-0'>
            {teamMembers.map((member, index) => (
              <TeamCard key={member.id} member={member} index={index} />
            ))}
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

// Horizontal Auto Infinite Slider Component
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
      <div ref={sliderRef} className='flex gap-5 md:gap-6' style={{ width: "fit-content", willChange: "transform" }}>
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
        "relative w-full aspect-3/4 rounded-lg overflow-hidden bg-blue-500/10 max-h-[342px]",
        isThirdCycle && "shadow-lg ring-2 ring-blue-200/50"
      )}
    >
      {/* Image */}
      <div className='relative w-full h-full'>
        <Image
          src={member.image}
          alt={member.name}
          fill
          className='object-cover'
          sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px'
        />

        {/* Semi-transparent Overlay at Bottom */}
        <div className='absolute bottom-3 left-8 right-8 px-4 py-2 bg-black/30 rounded-md border border-white/30 backdrop-blur-md'>
          <div className='text-white space-y-1'>
            <h3
              className='font-semibold text-base sm:text-lg md:text-xl whitespace-nowrap'
              style={{
                fontFamily: "var(--font-urbanist), sans-serif",
                fontWeight: 600,
              }}
            >
              {member.name}
            </h3>
            <p
              className='text-sm sm:text-base text-white/90 whitespace-nowrap'
              style={{
                fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                fontWeight: 400,
              }}
            >
              {member.description}
            </p>
            <p
              className='text-sm sm:text-base text-white/80 font-medium whitespace-nowrap'
              style={{
                fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                fontWeight: 500,
              }}
            >
              - {member.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  Heart,
  Inbox,
  ListChecks,
  Layers,
  DollarSign,
  Calendar,
  ClipboardList,
  Users,
  TrendingUp,
  Bell,
  Search,
  Menu,
  Clock,
  ShoppingCart,
  BarChart3,
  Settings,
  FileText,
  Contact,
  CreditCard,
} from "lucide-react";

export function DashboardPreview() {
  return (
    <div className='w-full h-full bg-gray-50 flex flex-col overflow-hidden'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2'>
        {/* Logo */}
        <div className='flex items-center gap-1.5 shrink-0'>
          <div className='hidden sm:flex items-center'>
            <Image src='/logo/framex.avif' alt='FrameX' width={100} height={32} className='h-5 sm:h-6 md:h-7 w-auto object-contain' />
          </div>
          <Menu className='w-4 h-4 sm:hidden text-gray-600' />
        </div>

        {/* Search Bar */}
        <div className='flex-1 max-w-xs sm:max-w-md md:max-w-lg'>
          <div className='relative'>
            <Search className='absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400' />
            <input
              type='text'
              placeholder='Search asset, file, user'
              className='w-full pl-6 sm:pl-7 pr-2 sm:pr-3 py-1 sm:py-1.5 text-[10px] sm:text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-gray-50'
            />
          </div>
        </div>

        {/* Right Icons */}
        <div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
          {/* Notification Bell with Badge */}
          <div className='hidden sm:relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 group/bell'>
            <Bell className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 group-hover/bell:text-blue-700 transition-colors' />
            {/* Notification Badge */}
            <div className='absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center border-1.5 border-white shadow-md animate-pulse'>
              <span className='text-[7px] sm:text-[8px] font-bold text-white'>3</span>
            </div>
            {/* Ripple Effect */}
            <div className='absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover/bell:opacity-20 group-hover/bell:animate-ping' />
          </div>
          {/* Profile Avatar */}
          <div className='relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center text-white text-[10px] sm:text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer ring-1.5 ring-blue-200'>
            <span>JD</span>
            {/* Online Status */}
            <div className='absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full border-1.5 border-white'></div>
          </div>
        </div>
      </div>

      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar - Hidden on mobile, shown on larger screens */}
        <div className='hidden sm:flex flex-col w-40 md:w-48 lg:w-52 bg-white border-r border-gray-200 py-2 sm:py-2.5'>
          {/* Main Navigation */}
          <div className='space-y-0.5 px-1.5 sm:px-2'>
            <NavItem icon={LayoutDashboard} label='Dashboard' active />
            <NavItem icon={Package} label='Products' />
            <NavItem icon={Heart} label='Favorites' />
            <NavItem icon={Inbox} label='Inbox' />
            <NavItem icon={ListChecks} label='Order Lists' />
            <NavItem icon={Layers} label='Product Stock' />
            <NavItem icon={ShoppingCart} label='Cart' />
            <NavItem icon={BarChart3} label='Analytics' />
            <NavItem icon={Settings} label='Settings' />
          </div>

          {/* Pages Section */}
          <div className='mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200'>
            <div className='px-1.5 sm:px-2 mb-1'>
              <h3 className='text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider'>Pages</h3>
            </div>
            <div className='space-y-0.5 px-1.5 sm:px-2'>
              <NavItem icon={DollarSign} label='Pricing' />
              <NavItem icon={Calendar} label='Calendar' />
              <NavItem icon={ClipboardList} label='To-Do' />
              <NavItem icon={FileText} label='Invoice' />
              <NavItem icon={Contact} label='Contact' />
              <NavItem icon={CreditCard} label='Payment' />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 overflow-y-hidden bg-gray-50 p-1.5 sm:p-2 md:p-3'>
          {/* Dashboard Title */}
          <h2 className='text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2'>Dashboard</h2>

          {/* Summary Cards */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-1.5 md:gap-2 mb-1.5 sm:mb-2'>
            <StatCard title='Total User' value='40,689' trend='8.5% Up' icon={Users} iconColor='text-purple-600' bgColor='bg-purple-100' />
            <StatCard
              title='Total Sales'
              value='৳89,000'
              trend='2.8% Up'
              icon={TrendingUp}
              iconColor='text-purple-600'
              bgColor='bg-purple-100'
            />
            <StatCard
              title='Total Pending'
              value='12,000'
              trend='10% Up'
              icon={Clock}
              iconColor='text-purple-600'
              bgColor='bg-purple-100'
            />
            <StatCard
              title='Total Orders'
              value='5,234'
              trend='15.2% Up'
              icon={ShoppingCart}
              iconColor='text-purple-600'
              bgColor='bg-purple-100'
            />
          </div>

          {/* Chart Section */}
          <div className='bg-white rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 shadow-sm hover:shadow-lg transition-all duration-500 border border-gray-100 relative overflow-hidden'>
            {/* Decorative background elements */}
            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 via-purple-100/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2' />
            <div className='absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-100/30 to-transparent rounded-full blur-xl translate-y-1/2 -translate-x-1/2' />

            <div className='relative z-10 flex items-center justify-between mb-1.5 sm:mb-2'>
              <div className='flex items-center gap-2'>
                <h3 className='text-xs sm:text-sm md:text-base font-bold text-gray-900'>Revenue Analytics</h3>
                <span className='hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 rounded-full'>
                  <span className='w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse' />
                  <span className='text-[8px] text-emerald-700 font-medium'>Live</span>
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <div className='hidden sm:flex items-center gap-2 mr-2'>
                  <div className='flex items-center gap-1'>
                    <span className='w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600' />
                    <span className='text-[8px] text-gray-500'>Revenue</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <span className='w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-500' />
                    <span className='text-[8px] text-gray-500'>Orders</span>
                  </div>
                </div>
                <div className='flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-[9px] sm:text-[10px] text-gray-600 font-medium hover:from-gray-100 hover:to-gray-200 transition-all duration-300 cursor-pointer shadow-sm'>
                  <span>October</span>
                  <svg className='w-2 h-2 sm:w-2.5 sm:h-2.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className='h-20 sm:h-28 md:h-36 lg:h-[160px] relative rounded-lg w-full'>
              <svg className='w-full h-full' viewBox='0 0 400 100' preserveAspectRatio='none'>
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id='primaryGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
                    <stop offset='0%' stopColor='#3B82F6' stopOpacity='0.25' />
                    <stop offset='100%' stopColor='#3B82F6' stopOpacity='0' />
                  </linearGradient>
                  <linearGradient id='secondaryGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
                    <stop offset='0%' stopColor='#A855F7' stopOpacity='0.12' />
                    <stop offset='100%' stopColor='#A855F7' stopOpacity='0' />
                  </linearGradient>
                  <linearGradient id='lineGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                    <stop offset='0%' stopColor='#2563EB' />
                    <stop offset='100%' stopColor='#60A5FA' />
                  </linearGradient>
                  <linearGradient id='secondaryLineGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                    <stop offset='0%' stopColor='#9333EA' />
                    <stop offset='100%' stopColor='#C084FC' />
                  </linearGradient>
                  <filter id='tooltipShadow'>
                    <feDropShadow dx='0' dy='1' stdDeviation='2' floodOpacity='0.15' />
                  </filter>
                </defs>

                {/* Horizontal grid lines */}
                {[0, 1, 2].map((i) => (
                  <line key={i} x1='0' y1={15 + i * 35} x2='400' y2={15 + i * 35} stroke='#F1F5F9' strokeWidth='0.5' />
                ))}

                {/* Secondary curve (purple/orders) - dramatic ups and downs */}
                {(() => {
                  const pts = [
                    { x: 0, y: 78 },
                    { x: 30, y: 65 },
                    { x: 60, y: 82 },
                    { x: 90, y: 58 },
                    { x: 120, y: 75 },
                    { x: 150, y: 52 },
                    { x: 180, y: 70 },
                    { x: 210, y: 48 },
                    { x: 240, y: 68 },
                    { x: 270, y: 45 },
                    { x: 300, y: 62 },
                    { x: 330, y: 42 },
                    { x: 360, y: 55 },
                    { x: 400, y: 48 },
                  ];
                  // Smooth Catmull-Rom spline with higher tension
                  let d = `M ${pts[0].x},${pts[0].y}`;
                  for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[Math.max(0, i - 1)];
                    const p1 = pts[i];
                    const p2 = pts[i + 1];
                    const p3 = pts[Math.min(pts.length - 1, i + 2)];
                    const tension = 4; // Lower = smoother
                    const cp1x = p1.x + (p2.x - p0.x) / tension;
                    const cp1y = p1.y + (p2.y - p0.y) / tension;
                    const cp2x = p2.x - (p3.x - p1.x) / tension;
                    const cp2y = p2.y - (p3.y - p1.y) / tension;
                    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
                  }
                  const area = d + ` L 400,100 L 0,100 Z`;
                  return (
                    <>
                      <path d={area} fill='url(#secondaryGradient)' />
                      <path
                        d={d}
                        fill='none'
                        stroke='url(#secondaryLineGradient)'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        opacity='0.5'
                      />
                    </>
                  );
                })()}

                {/* Primary curve (blue/revenue) - dramatic ups and downs */}
                {(() => {
                  const pts = [
                    { x: 0, y: 88 },
                    { x: 30, y: 68 },
                    { x: 60, y: 52 },
                    { x: 90, y: 72 },
                    { x: 120, y: 42 },
                    { x: 150, y: 62 },
                    { x: 180, y: 32 },
                    { x: 210, y: 52 },
                    { x: 240, y: 25 },
                    { x: 270, y: 45 },
                    { x: 300, y: 18 },
                    { x: 330, y: 38 },
                    { x: 360, y: 15 },
                    { x: 400, y: 28 },
                  ];
                  // Display points at peaks and valleys
                  const displayPointIndices = [1, 2, 4, 6, 8, 10, 12, 13];

                  // Smooth Catmull-Rom spline with higher tension
                  let d = `M ${pts[0].x},${pts[0].y}`;
                  for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[Math.max(0, i - 1)];
                    const p1 = pts[i];
                    const p2 = pts[i + 1];
                    const p3 = pts[Math.min(pts.length - 1, i + 2)];
                    const tension = 4; // Lower = smoother
                    const cp1x = p1.x + (p2.x - p0.x) / tension;
                    const cp1y = p1.y + (p2.y - p0.y) / tension;
                    const cp2x = p2.x - (p3.x - p1.x) / tension;
                    const cp2y = p2.y - (p3.y - p1.y) / tension;
                    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
                  }
                  const area = d + ` L 400,100 L 0,100 Z`;
                  const highlightIdx = 8;
                  const highlight = pts[highlightIdx];

                  return (
                    <>
                      <path d={area} fill='url(#primaryGradient)' />
                      <path d={d} fill='none' stroke='url(#lineGradient)' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                      {/* Data points - only at key positions */}
                      {displayPointIndices.map((idx) => {
                        const p = pts[idx];
                        return (
                          <g key={idx}>
                            <ellipse cx={p.x} cy={p.y} rx='4' ry='3' fill='white' />
                            <ellipse cx={p.x} cy={p.y} rx='2.5' ry='2' fill='#3B82F6' />
                          </g>
                        );
                      })}
                      {/* Compact tooltip */}
                      <g filter='url(#tooltipShadow)'>
                        <rect x={highlight.x - 18} y={highlight.y - 18} width='36' height='12' rx='3' fill='#111827' />
                        <text x={highlight.x} y={highlight.y - 9.5} textAnchor='middle' fill='white' fontSize='6' fontWeight='700'>
                          ৳64,360
                        </text>
                        <path
                          d={`M ${highlight.x - 3},${highlight.y - 6} L ${highlight.x},${highlight.y - 3} L ${highlight.x + 3},${
                            highlight.y - 6
                          } Z`}
                          fill='#111827'
                        />
                      </g>
                      {/* Highlight point */}
                      <ellipse cx={highlight.x} cy={highlight.y} rx='5' ry='4' fill='white' />
                      <ellipse cx={highlight.x} cy={highlight.y} rx='3' ry='2.5' fill='#2563EB' />
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Bottom stats */}
            <div className='relative z-10 flex items-center justify-between mt-2 pt-2 border-t border-gray-100'>
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-1.5'>
                  <div className='w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center'>
                    <TrendingUp className='w-3 h-3 text-white' />
                  </div>
                  <div>
                    <p className='text-[8px] text-gray-500'>Total Revenue</p>
                    <p className='text-[10px] font-bold text-gray-900'>৳2.4M</p>
                  </div>
                </div>
                <div className='h-6 w-px bg-gray-200' />
                <div className='flex items-center gap-1.5'>
                  <div className='w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center'>
                    <ShoppingCart className='w-3 h-3 text-white' />
                  </div>
                  <div>
                    <p className='text-[8px] text-gray-500'>Orders</p>
                    <p className='text-[10px] font-bold text-gray-900'>12,847</p>
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full'>
                <TrendingUp className='w-2.5 h-2.5 text-emerald-600' />
                <span className='text-[9px] font-semibold text-emerald-700'>+24.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded cursor-pointer transition-colors ${
        active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${active ? "text-blue-600" : "text-gray-500"}`} />
      <span className='text-[9px] sm:text-[12px] font-medium'>{label}</span>
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  iconColor,
  bgColor,
}: {
  title: string;
  value: string;
  trend: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <div className='group relative bg-white rounded sm:rounded-lg p-2 cursor-pointer sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.1 border border-gray-100 hover:border-blue-200 overflow-hidden'>
      {/* Gradient Background on Hover */}
      <div className='absolute inset-0 bg-linear-to-br from-blue-50/0 to-blue-100/0 group-hover:from-blue-50/40 group-hover:to-blue-100/20 transition-all duration-300' />

      <div className='relative z-10 flex items-center justify-between gap-1'>
        <div className='flex-1 min-w-0'>
          <h3 className='text-[8px] sm:text-[9px] text-gray-500 font-medium uppercase tracking-wide mb-0.5'>{title}</h3>
          <p className='text-sm sm:text-base md:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-0.5'>
            {value}
          </p>
          <div className='flex items-center gap-0.5 bg-green-50 px-1 py-0.5 rounded w-fit'>
            <TrendingUp className='w-2 h-2 sm:w-2.5 sm:h-2.5 text-green-600 shrink-0' />
            <span className='text-[8px] sm:text-[9px] text-green-700 font-semibold whitespace-nowrap'>{trend}</span>
          </div>
        </div>
        <div className={`${bgColor} p-1 rounded shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0`}>
          <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${iconColor}`} />
        </div>
      </div>

      {/* Decorative Corner */}
      <div className='absolute top-0 right-0 w-12 h-12 bg-linear-to-br from-blue-100/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
    </div>
  );
}

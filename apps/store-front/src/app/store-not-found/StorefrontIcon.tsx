import * as React from "react";

export function StorefrontIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Store building */}
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-6h6v6" />
            {/* Awning */}
            <path d="M3 7h18" />
            <path d="M6 7v3a2 2 0 0 0 4 0V7" />
            <path d="M10 7v3a2 2 0 0 0 4 0V7" />
            <path d="M14 7v3a2 2 0 0 0 4 0V7" />
            {/* X mark overlay */}
            <circle cx="17" cy="17" r="5" fill="currentColor" stroke="none" opacity="0.15" />
            <path d="M15 15l4 4m0-4l-4 4" strokeWidth={2} />
        </svg>
    );
}

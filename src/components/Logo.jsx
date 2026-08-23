import React from "react";

export default function Logo({ withText = true, className = "" }) {
  return (
    <div className={`flex items-center gap-3 shrink-0 ${className}`}>
      <div className="relative w-9 h-9 rounded-lg bg-primary flex items-center justify-center overflow-hidden shadow-sm">
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
          <path
            d="M4 9 L10 23 L14 13 L18 23 L24 9"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {withText && (
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="font-display text-[17px] font-semibold tracking-tight text-foreground">
            Workday
          </span>
          <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground mt-0.5">
            Advocacia Previdenciária
          </span>
        </div>
      )}
    </div>
  );
}
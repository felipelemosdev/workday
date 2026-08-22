import React from "react";

export default function PageHeader({ title, subtitle, children, meta }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        {meta && <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{meta}</div>}
        <h1 className="font-display text-[28px] sm:text-[32px] font-semibold tracking-tightest text-foreground leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-[14px] text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2.5 shrink-0">{children}</div>}
    </div>
  );
}
"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
  /** When provided, the card becomes a clickable link. */
  href?: string;
}

export function StatCard({ title, value, icon, description, trend, className, href }: StatCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "font-medium",
              trend.direction === "up" && "text-emerald-600",
              trend.direction === "down" && "text-red-600",
              trend.direction === "neutral" && "text-muted-foreground",
            )}
          >
            {trend.value}
          </span>
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          "block rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40 cursor-pointer",
          className,
        )}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md", className)}>
      {inner}
    </div>
  );
}

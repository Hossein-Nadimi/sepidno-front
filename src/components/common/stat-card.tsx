"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/common/count-up";

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
  /** Visual color theme for the card. */
  variant?: "default" | "emerald" | "amber" | "red" | "blue" | "purple";
}

const variantStyles = {
  default: {
    card: "",
    iconBg: "bg-primary/10 text-primary",
  },
  emerald: {
    card: "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/30",
    iconBg: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    card: "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/30",
    iconBg: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
  },
  red: {
    card: "bg-red-50/50 dark:bg-red-950/10 border-red-200/60 dark:border-red-900/30",
    iconBg: "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400",
  },
  blue: {
    card: "bg-blue-50/50 dark:bg-blue-950/10 border-blue-200/60 dark:border-blue-900/30",
    iconBg: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
  },
  purple: {
    card: "bg-purple-50/50 dark:bg-purple-950/10 border-purple-200/60 dark:border-purple-900/30",
    iconBg: "bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
  },
};

export function StatCard({ title, value, icon, description, trend, className, href, variant = "default" }: StatCardProps) {
  const styles = variantStyles[variant];

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">
            {typeof value === "number" ? <CountUp value={value} /> : value}
          </p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className={cn("flex size-11 items-center justify-center rounded-xl", styles.iconBg)}>
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

  const baseClass = cn(
    "rounded-xl border p-5 shadow-sm transition-all",
    styles.card,
    href && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
    !href && "hover:shadow-md",
    className,
  );

  if (href) {
    return (
      <a href={href} className={baseClass}>
        {inner}
      </a>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}

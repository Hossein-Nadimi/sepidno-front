"use client";

import { type LucideIcon, Inbox } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Visual variant for the icon background. */
  variant?: "default" | "emerald" | "amber" | "blue" | "purple";
}

const variantStyles = {
  default: "bg-muted text-muted-foreground",
  emerald: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
  blue: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
  purple: "bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
};

export function EmptyState({
  icon: Icon = Inbox,
  title = "موردی یافت نشد",
  description = "هنوز هیچ داده‌ای برای نمایش وجود ندارد.",
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-20 text-center", className)}>
      <div className={cn("flex size-20 items-center justify-center rounded-2xl", variantStyles[variant])}>
        <Icon className="size-10" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

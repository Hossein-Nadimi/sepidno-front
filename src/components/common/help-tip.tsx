"use client";

import { type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTipProps {
  content: string;
  children?: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * A small help icon with a tooltip. Click/hover to see the help text.
 * Usage: <HelpTip content="این فیلد برای تخفیف کلی سفارش استفاده می‌شود" />
 */
export function HelpTip({ content, children, side = "top" }: HelpTipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help items-center gap-1">
            {children}
            <HelpCircle className="size-3.5 text-muted-foreground hover:text-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

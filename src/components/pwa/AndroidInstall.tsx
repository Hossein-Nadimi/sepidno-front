"use client";

import { Smartphone, Check, X, ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Android install guide — manual instructions only (same approach as iOS).
 *
 * We don't use `beforeinstallprompt` because:
 * 1. It's unreliable across Android browsers
 * 2. It shows a confusing double-prompt (our sheet + Chrome's native prompt)
 * 3. Manual instructions are clearer and more consistent
 *
 * The guide shows step-by-step how to add the app to home screen via
 * Chrome's menu, which gives the same result.
 */
export function AndroidInstall({
  onGotIt,
  onLater,
  onDontShowAgain,
}: {
  onGotIt: () => void;
  onLater: () => void;
  onDontShowAgain: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center">
        <div className="relative flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
          <Smartphone className="size-9 text-white" />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h3 className="text-lg font-bold">📱 نصب اپلیکیشن</h3>
        <p className="text-sm text-muted-foreground leading-6">
          برای نصب اپلیکیشن روی اندروید:
        </p>
      </div>

      {/* Step-by-step instructions */}
      <div className="space-y-3 rounded-xl bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            ۱
          </span>
          <div className="flex-1 pt-0.5">
            <p className="text-sm leading-6">
              روی منوی مرورگر (سه نقطه <span className="inline-block font-bold">⋮</span> در گوشه بالا) بزنید.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            ۲
          </span>
          <div className="flex-1 pt-0.5">
            <p className="text-sm leading-6">
              گزینه «Add to Home screen» یا «Install app» را انتخاب کنید.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            ۳
          </span>
          <div className="flex-1 pt-0.5">
            <p className="text-sm leading-6">
              روی «Install» یا «Add» بزنید تا اپ نصب شود.
            </p>
          </div>
        </div>
      </div>

      {/* Visual hint of the Chrome menu */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="mb-3 text-center text-xs text-muted-foreground">
          محل دکمه منوی کروم:
        </p>
        <div className="relative mx-auto flex max-w-xs items-center justify-between rounded-2xl border-2 border-border bg-background px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft className="size-3" />
          </div>
          <div className="flex items-center gap-3">
            {/* Pulsing three-dots menu button */}
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              <div className="relative flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <span className="text-xl font-bold leading-none">⋮</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-2">
        <Button onClick={onGotIt} className="w-full" size="lg">
          <Check className="size-4" />
          متوجه شدم
        </Button>
        <div className="flex gap-2">
          <Button onClick={onLater} variant="ghost" className="flex-1">
            بعداً
          </Button>
          <Button onClick={onDontShowAgain} variant="ghost" className="flex-1 text-muted-foreground">
            دیگر نمایش نده
          </Button>
        </div>
      </div>
    </div>
  );
}

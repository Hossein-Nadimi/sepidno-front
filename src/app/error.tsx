"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </div>
      <h1 className="text-2xl font-bold">خطایی رخ داد</h1>
      <p className="text-muted-foreground">لطفاً دوباره تلاش کنید</p>
      <Button onClick={reset}>
        <RefreshCw className="size-4 ml-1" />
        تلاش مجدد
      </Button>
    </div>
  );
}

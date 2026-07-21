"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </div>
      <h1 className="text-3xl font-bold">۴۰۴</h1>
      <p className="text-muted-foreground">صفحه مورد نظر یافت نشد</p>
      <Button asChild>
        <Link href="/">بازگشت به داشبورد</Link>
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { PageLoading } from "@/components/common/loading";
import api from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"loading" | "no-sub" | "needs-setup" | "ok">("loading");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check subscription status ONCE after mount
  // Re-check only when user object changes (e.g., after role upgrade)
  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || !accessToken) {
      setStatus("loading");
      return;
    }
    if (user?.role === "super_admin") {
      setStatus("ok");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    api
      .get("/laundry/subscriptions/status")
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data;
        if (!data.hasActiveSubscription) {
          setStatus("no-sub");
        } else if (data.needsBusinessSetup) {
          setStatus("needs-setup");
        } else {
          setStatus("ok");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("no-sub");
      });

    return () => { cancelled = true; };
  }, [mounted, isAuthenticated, accessToken, user]);

  // Redirect based on status
  useEffect(() => {
    if (!mounted || status === "loading") return;

    if (!isAuthenticated || !accessToken) {
      if (!pathname.startsWith("/login")) {
        router.replace("/login");
      }
      return;
    }

    if (user?.role === "super_admin") return;

    if (status === "no-sub") {
      const allowed = ["/subscription", "/sms"];
      if (!allowed.some((p) => pathname.startsWith(p))) {
        router.replace("/subscription");
      }
      return;
    }

    if (status === "needs-setup") {
      if (!pathname.startsWith("/setup-business")) {
        router.replace("/setup-business");
      }
      return;
    }

    // status === "ok" — no redirect needed
  }, [mounted, status, isAuthenticated, accessToken, user, pathname, router]);

  if (!mounted || status === "loading") {
    return <PageLoading />;
  }

  if (!isAuthenticated || !accessToken) {
    return <PageLoading />;
  }

  return <>{children}</>;
}

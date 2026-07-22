"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, MessageSquare, Calendar, Loader2, CheckCircle2, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { subscriptionService, smsService } from "@/services";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/common/stat-card";
import { TableLoading } from "@/components/common/loading";
import { EmptyState } from "@/components/common/empty-state";
import { formatNumber, formatToman, toPersianDigits, cn } from "@/lib/utils";
import { toJalali } from "@/lib/jalali";
import { useState, useEffect } from "react";

type Period = "monthly" | "quarterly" | "semiAnnual" | "annual";

const PERIOD_LABELS: Record<Period, string> = {
  monthly: "ماهانه",
  quarterly: "سه ماهه",
  semiAnnual: "شش ماهه",
  annual: "سالانه",
};

const PERIOD_DAYS: Record<Period, number> = {
  monthly: 30,
  quarterly: 90,
  semiAnnual: 180,
  annual: 365,
};

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Record<string, Period>>({});
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast.success("پرداخت با موفقیت انجام شد. اشتراک شما فعال شد.");
      setStatusMsg("success");
      // Re-fetch user to get updated role/permissions, then redirect
      api.get("/auth/me").then((meRes) => {
        useAuthStore.getState().setUser(meRes.data.data);
        // Now check if business setup is needed
        return api.get("/laundry/subscriptions/status");
      }).then((res) => {
        const data = res.data.data;
        if (data.needsBusinessSetup) {
          router.replace("/setup-business");
        } else {
          router.replace("/dashboard");
        }
      }).catch(() => {
        router.replace("/dashboard");
      });
    } else if (status === "failed") {
      toast.error("پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.");
      setStatusMsg("failed");
      router.replace("/subscription");
    }
  }, [searchParams, router]);

  const { data: subStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => api.get("/laundry/subscriptions/status").then((r) => r.data.data),
  });

  const { data: plans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => subscriptionService.plans.list({ pageSize: 10, isActive: true }),
  });

  const { data: subHistory } = useQuery({
    queryKey: ["subscription-history"],
    queryFn: () => subscriptionService.active.list({ pageSize: 50 }),
    enabled: !isSuperAdmin,
  });

  const trialMutation = useMutation({
    mutationFn: (planId: string) =>
      api.post("/laundry/subscriptions/trial", { planId }).then((r) => r.data),
    onSuccess: async () => {
      toast.success("اشتراک رایگان فعال شد! در حال انتقال...");
      // MUST re-fetch user: backend upgraded role from 'User' to 'BusinessOwner'
      // This triggers AuthGuard to re-check subscription status
      try {
        const meRes = await api.get("/auth/me");
        useAuthStore.getState().setUser(meRes.data.data);
      } catch {}
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      // AuthGuard will now see needs-setup status and allow /setup-business
      router.push("/setup-business");
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ planId, period }: { planId: string; period: Period }) =>
      api.post("/laundry/subscriptions/payment/request", { planId, period }).then((r) => r.data.data),
    onSuccess: (data: { redirectUrl: string }) => {
      window.location.href = data.redirectUrl;
    },
  });

  function handlePlanClick(planId: string, price: number) {
    if (price === 0) {
      trialMutation.mutate(planId);
    } else {
      const period = selectedPeriod[planId] || "monthly";
      paymentMutation.mutate({ planId, period });
    }
  }

  function getPlanPrice(plan: { monthlyPrice: number; quarterlyPrice?: number; semiAnnualPrice?: number; annualPrice?: number; monthlyOriginalPrice?: number; quarterlyOriginalPrice?: number; semiAnnualOriginalPrice?: number; annualOriginalPrice?: number }, period: Period): { price: number; original: number } {
    const priceMap: Record<Period, number> = {
      monthly: plan.monthlyPrice || 0,
      quarterly: plan.quarterlyPrice || (plan.monthlyPrice || 0) * 3,
      semiAnnual: plan.semiAnnualPrice || (plan.monthlyPrice || 0) * 6,
      annual: plan.annualPrice || (plan.monthlyPrice || 0) * 12,
    };
    const originalMap: Record<Period, number> = {
      monthly: plan.monthlyOriginalPrice || 0,
      quarterly: plan.quarterlyOriginalPrice || 0,
      semiAnnual: plan.semiAnnualOriginalPrice || 0,
      annual: plan.annualOriginalPrice || 0,
    };
    return { price: priceMap[period], original: originalMap[period] };
  }

  const hasActiveSub = subStatus?.hasActiveSubscription;

  return (
    <div className="space-y-6">
      <PageHeader title="اشتراک" description="مدیریت اشتراک خشکشویی" />

      {/* Status card */}
      <Card className={hasActiveSub ? "border-emerald-500" : "border-amber-500"}>
        <CardContent className="flex items-center gap-4 p-6">
          {hasActiveSub ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-700">اشتراک فعال</h3>
                <p className="text-sm text-muted-foreground">
                  تاریخ انقضا: {subStatus?.subscription ? toJalali(subStatus.subscription.expireDate) : "—"}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Calendar className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-700">اشتراک فعال نیست</h3>
                <p className="text-sm text-muted-foreground">
                  برای استفاده از خدمات سپیدنو، یکی از طرح‌های زیر را انتخاب کنید.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Subscription stats — below status card, above plans */}
      {!isSuperAdmin && hasActiveSub && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="پیامک باقی‌مانده"
            value={formatNumber(subStatus?.subscription?.smsCredits ? Math.max(0, subStatus.subscription.smsCredits - (subStatus.subscription.smsCreditsUsed || 0)) : subStatus?.subscription?.monthlySmsQuota ? Math.max(0, subStatus.subscription.monthlySmsQuota - (subStatus.subscription.monthlySmsUsed || 0)) : 0)}
            icon={<MessageSquare className="size-5" />}
          />
          <StatCard
            title="تاریخ انقضا"
            value={subStatus?.subscription ? toJalali(subStatus.subscription.expireDate) : "—"}
            icon={<Calendar className="size-5" />}
          />
          <StatCard
            title="پلن فعال"
            value={subStatus?.subscription?.subscriptionPlan ? (typeof subStatus.subscription.subscriptionPlan === "object" ? subStatus.subscription.subscriptionPlan.name : "—") : "—"}
            icon={<CreditCard className="size-5" />}
          />
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-lg font-bold">طرح‌های اشتراک</h2>
        {!plans?.items?.length ? (
          <TableLoading />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.items.map((plan) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const p = plan as any;
              const isComingSoon = p.isComingSoon;
              const period = selectedPeriod[p._id] || "monthly";
              const priceInfo = getPlanPrice(p, period);
              const isHighlight = p.tagline === "محبوب‌ترین" || p.name === "پایه";
              const discountPercent = priceInfo.original > 0 && priceInfo.original !== priceInfo.price
                ? Math.round((1 - priceInfo.price / priceInfo.original) * 100)
                : 0;

              return (
                <Card key={p._id} className={isHighlight ? "border-primary shadow-lg" : isComingSoon ? "opacity-75" : ""}>
                  <CardContent className="p-6">
                    {p.tagline && (
                      <Badge className={`mb-4 w-full justify-center ${isComingSoon ? "bg-amber-500" : ""}`}>
                        {p.tagline}
                      </Badge>
                    )}
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}

                    {/* Period selector */}
                    {p.monthlyPrice > 0 && !isComingSoon && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {(["monthly", "quarterly", "semiAnnual", "annual"] as Period[]).map((per) => (
                          <button
                            key={per}
                            type="button"
                            onClick={() => setSelectedPeriod({ ...selectedPeriod, [p._id]: per })}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                              period === per
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent"
                            )}
                          >
                            {PERIOD_LABELS[per]}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Price with discount */}
                    <div className="mt-4">
                      {isComingSoon ? (
                        <span className="text-2xl font-bold text-muted-foreground">به‌زودی</span>
                      ) : priceInfo.price === 0 ? (
                        <span className="text-3xl font-bold">رایگان</span>
                      ) : (
                        <div className="space-y-1">
                          {priceInfo.original > 0 && priceInfo.original !== priceInfo.price && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground line-through">
                                {toPersianDigits(priceInfo.original.toLocaleString("en-US"))}
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                ٪{toPersianDigits(discountPercent)} تخفیف
                              </Badge>
                            </div>
                          )}
                          <div>
                            <span className="text-3xl font-bold text-primary">
                              {toPersianDigits(priceInfo.price.toLocaleString("en-US"))}
                            </span>
                            <span className="text-sm text-muted-foreground"> تومان</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {PERIOD_LABELS[period]} ({toPersianDigits(PERIOD_DAYS[period])} روز)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Features list — no duplicate SMS */}
                    <ul className="mt-4 space-y-2 text-sm">
                      {(p.features || []).map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="mt-6 w-full"
                      disabled={hasActiveSub || isComingSoon || trialMutation.isPending || paymentMutation.isPending}
                      onClick={() => handlePlanClick(p._id, p.monthlyPrice)}
                    >
                      {isComingSoon ? (
                        "به‌زودی"
                      ) : trialMutation.isPending || paymentMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : hasActiveSub ? (
                        "اشتراک فعال است"
                      ) : p.monthlyPrice === 0 ? (
                        "فعال‌سازی رایگان"
                      ) : (
                        "خرید اشتراک"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscription history */}
      {!isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>تاریخچه اشتراک‌ها</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!subHistory?.items?.length ? (
              <EmptyState title="هنوز اشتراکی خریداری نشده است" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>پلن</TableHead>
                    <TableHead>تاریخ شروع</TableHead>
                    <TableHead>تاریخ انقضا</TableHead>
                    <TableHead className="text-center">وضعیت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subHistory.items.map((sub) => {
                    const plan = typeof sub.subscriptionPlan === "object" ? sub.subscriptionPlan : null;
                    return (
                      <TableRow key={sub._id}>
                        <TableCell label="پلن" className="font-medium">{plan?.name || "—"}</TableCell>
                        <TableCell label="تاریخ شروع" className="text-sm text-muted-foreground">{toJalali(sub.startDate)}</TableCell>
                        <TableCell label="تاریخ انقضا" className="text-sm text-muted-foreground">{toJalali(sub.expireDate)}</TableCell>
                        <TableCell label="وضعیت" className="text-center">
                          <Badge variant={sub.status === "active" ? "default" : sub.status === "expired" ? "secondary" : "outline"}>
                            {sub.status === "active" ? "فعال" : sub.status === "expired" ? "منقضی" : sub.status === "cancelled" ? "لغو شده" : "در انتظار"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

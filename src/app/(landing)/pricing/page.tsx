"use client";

import Link from "next/link";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toPersianDigits, formatToman } from "@/lib/utils";
import { usePublicPlans } from "@/hooks/use-public-plans";
import type { SubscriptionPlan } from "@/types";

const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    _id: "free",
    name: "رایگان",
    description: "۷ روز رایگان — برای تست",
    monthlyPrice: 0,
    
    duration: 7,
    features: ["تمام امکانات", "۵۰ پیامک", "۷ روز رایگان"],
    monthlySmsQuota: 50,
    availableFeatures: ["orders", "customers", "loyalty", "inventory", "reports", "dashboard"], quarterlyPrice: 0, semiAnnualPrice: 0, annualPrice: 0,
    isActive: true,
    sortOrder: 0,
  },
  {
    _id: "basic",
    name: "پایه",
    description: "برای خشکشویی‌های کوچک",
    monthlyPrice: 290000,
    
    duration: 30,
    features: ["تمام امکانات", "۵۰۰ پیامک ماهانه", "پشتیبانی اولویت‌دار"],
    monthlySmsQuota: 500,
    availableFeatures: ["orders", "customers", "loyalty", "inventory", "reports", "dashboard"], quarterlyPrice: 0, semiAnnualPrice: 0, annualPrice: 0,
    isActive: true,
    sortOrder: 1,
  },
  {
    _id: "pro",
    name: "حرفه‌ای",
    description: "برای خشکشویی‌های در حال رشد",
    monthlyPrice: 690000,
    
    duration: 30,
    features: ["تمام امکانات", "۲۰۰۰ پیامک ماهانه", "پشتیبانی اختصاصی"],
    monthlySmsQuota: 2000,
    availableFeatures: ["orders", "customers", "loyalty", "inventory", "reports", "dashboard"], quarterlyPrice: 0, semiAnnualPrice: 0, annualPrice: 0,
    isActive: true,
    sortOrder: 2,
  },
];

export default function PricingPage() {
  const { data: apiPlans, isLoading } = usePublicPlans();
  const plans = apiPlans && apiPlans.length > 0 ? apiPlans : FALLBACK_PLANS;
  const highlightName = "حرفه‌ای";

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">قیمت‌گذاری</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">طرح متناسب با کسب‌وکار شما</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            از طرح رایگان شروع کنید. هر زمان نیاز بود، ارتقا دهید. بدون قرارداد، بدون هزینه پنهان.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {isLoading ? (
            <div className="col-span-3 flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            plans.map((plan) => {
              const isHighlight = plan.name === highlightName;
              return (
                <Card
                  key={plan._id}
                  className={isHighlight ? "border-primary shadow-lg md:-mt-4" : ""}
                >
                  <CardContent className="p-6">
                    {isHighlight && (
                      <Badge className="mb-4 w-full justify-center">محبوب‌ترین</Badge>
                    )}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-6">
                      <span className="text-4xl font-bold">
                        {plan.monthlyPrice === 0 ? "رایگان" : toPersianDigits(plan.monthlyPrice.toLocaleString("en-US"))}
                      </span>
                      {plan.monthlyPrice > 0 && <span className="text-sm text-muted-foreground"> تومان / ماه</span>}
                    </div>
                    {plan.monthlyPrice > 0 && (
                      <div className="mt-3 space-y-1 text-sm">
                        {plan.quarterlyPrice > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>سه ماهه:</span>
                            <span className="font-medium text-foreground">{toPersianDigits(plan.quarterlyPrice.toLocaleString("en-US"))} تومان</span>
                          </div>
                        )}
                        {plan.semiAnnualPrice > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>شش ماهه:</span>
                            <span className="font-medium text-foreground">{toPersianDigits(plan.semiAnnualPrice.toLocaleString("en-US"))} تومان</span>
                          </div>
                        )}
                        {plan.annualPrice > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>سالانه:</span>
                            <span className="font-medium text-foreground">{toPersianDigits(plan.annualPrice.toLocaleString("en-US"))} تومان</span>
                          </div>
                        )}
                      </div>
                    )}
                    <Button asChild className="mt-6 w-full" variant={isHighlight ? "default" : "outline"}>
                      <Link href="/login">شروع کنید</Link>
                    </Button>
                    <div className="mt-6 space-y-3 border-t pt-6">
                      <p className="text-sm font-semibold">شامل:</p>
                      <ul className="space-y-2 text-sm">
                        {(plan.features || []).map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="size-4 text-emerald-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-emerald-500 shrink-0" />
                          پیامک ماهانه: {toPersianDigits(plan.monthlySmsQuota)}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-emerald-500 shrink-0" />
                          مدت اشتراک: {toPersianDigits(plan.duration)} روز
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-emerald-500 shrink-0" />
                          سفارشات نامحدود
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* SMS packages note */}
        <div className="mt-16 rounded-2xl bg-secondary/50 p-8 text-center">
          <h3 className="text-xl font-bold">بسته‌های پیامک اضافی</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            اگر سهمیه پیامک ماهانه شما تمام شد، می‌توانید بسته‌های اضافی خریداری کنید.
            بسته‌های ۵۰۰، ۱۰۰۰ و ۵۰۰۰ پیامک در دسترس هستند.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link href="/login">همین حالا شروع کنید</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

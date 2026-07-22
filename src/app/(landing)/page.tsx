"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  Users,
  Tags,
  Boxes,
  Gift,
  MessageSquare,
  BarChart3,
  CreditCard,
  Loader2,
  Star,
  CheckCircle2,
  Sparkles,
  Zap,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toPersianDigits, formatNumber, formatToman, cn } from "@/lib/utils";
import { usePublicPlans } from "@/hooks/use-public-plans";

const FEATURES = [
  { icon: ShoppingBag, title: "مدیریت سفارشات", desc: "ثبت، پیگیری و چاپ قبض سفارشات با چک‌لیست آسیب‌ها" },
  { icon: CalendarDays, title: "تقویم سفارشات", desc: "نمای ماهانه از ظرفیت روزهای پیش‌رو و تعداد سفارشات هر روز" },
  { icon: Users, title: "مدیریت مشتریان", desc: "پروفایل کامل مشتریان و تاریخچه خرید" },
  { icon: Tags, title: "قیمت‌گذاری هوشمند", desc: "ماتریس قیمت بر اساس نوع لباس و خدمت" },
  { icon: Boxes, title: "مدیریت انبار", desc: "کنترل موجودی و حرکت‌های انبار" },
  { icon: Gift, title: "سیستم وفاداری", desc: "کش‌بک خودکار و اعتبار مشتریان" },
  { icon: MessageSquare, title: "پیامک خودکار", desc: "اطلاع‌رسانی خودکار به مشتریان" },
  { icon: BarChart3, title: "گزارش‌گیری پیشرفته", desc: "تحلیل کامل عملکرد کسب‌وکار" },
  { icon: CreditCard, title: "اشتراک منعطف", desc: "طرح‌های متنوع برای هر اندازه کسب‌وکار" },
];

const STATS = [
  { value: "۵۰۰+", label: "خشکشویی فعال" },
  { value: "۲ میلیون+", label: "سفارش مدیریت شده" },
  { value: "۹۸٪", label: "رضایت مشتریان" },
  { value: "۲۴/۷", label: "پشتیبانی" },
];

const REVIEWS = [
  { name: "علی محمدی", role: "مدیر خشکشویی پاک", text: "از وقتی از این سامانه استفاده می‌کنم، سرعت کارم دو برابر شده و مشتریانم خیلی راضی‌تر هستند.", rating: 5 },
  { name: "مریم حسینی", role: "صاحب لباسشویی نگین", text: "گزارش‌های دقیق و سیستم پیامک خودکار واقعاً عالی است. دیگر هیچ سفارشی فراموش نمی‌شود.", rating: 5 },
  { name: "رضا کریمی", role: "مدیر خشکشویی شهر", text: "پشتیبانی فوق‌العاده و امکانات کامل. قیمت‌گذاری و مدیریت انبار بسیار کارامد است.", rating: 5 },
];

const FALLBACK_PLANS = [
  { _id: "free", name: "رایگان", tagline: "شروع رایگان", description: "۱۴ روز رایگان — برای آشنایی با سامانه", features: ["مدیریت سفارشات", "تقویم سفارشات", "مدیریت مشتریان", "مدیریت انبار", "مدیریت هزینه‌ها", "گزارشات خشکشویی", "سرویس پیامکی سفارشات", "سیستم وفاداری مشتری", "۵۰ اعتبار پیامکی"], monthlySmsQuota: 50, isActive: true, isComingSoon: false, sortOrder: 0, duration: 14, monthlyOriginalPrice: 0, quarterlyOriginalPrice: 0, semiAnnualOriginalPrice: 0, annualOriginalPrice: 0, monthlyPrice: 0, quarterlyPrice: 0, semiAnnualPrice: 0, annualPrice: 0, availableFeatures: [] },
  { _id: "basic", name: "پایه", tagline: "محبوب‌ترین", description: "برای خشکشویی‌های کوچک و متوسط", features: ["مدیریت سفارشات", "تقویم سفارشات", "مدیریت مشتریان", "مدیریت انبار", "مدیریت هزینه‌ها", "گزارشات خشکشویی", "سرویس پیامکی سفارشات", "سیستم وفاداری مشتری", "۵۰۰ اعتبار پیامکی"], monthlySmsQuota: 500, isActive: true, isComingSoon: false, sortOrder: 1, duration: 30, monthlyOriginalPrice: 1490000, quarterlyOriginalPrice: 3990000, semiAnnualOriginalPrice: 7590000, annualOriginalPrice: 14300000, monthlyPrice: 890000, quarterlyPrice: 2390000, semiAnnualPrice: 4560000, annualPrice: 8580000, availableFeatures: [] },
  { _id: "pro", name: "حرفه‌ای", tagline: "به‌زودی", description: "برای خشکشویی‌های حرفه‌ای — به‌زودی", features: ["تمام امکانات پلن پایه", "تقویم سفارشات با مدیریت ظرفیت روزانه", "اپ مشتری (سفارش آنلاین توسط مشتریان)", "۱۰۰۰ اعتبار پیامکی", "پشتیبانی اختصاصی"], monthlySmsQuota: 1000, isActive: false, isComingSoon: true, sortOrder: 2, duration: 30, monthlyOriginalPrice: 0, quarterlyOriginalPrice: 0, semiAnnualOriginalPrice: 0, annualOriginalPrice: 0, monthlyPrice: 0, quarterlyPrice: 0, semiAnnualPrice: 0, annualPrice: 0, availableFeatures: [] },
];

const FAQ_ITEMS = [
  { q: "آیا امکان تست رایگان وجود دارد؟", a: "بله، طرح رایگان ما ۷ روزه فعال می‌شود و می‌توانید تمام امکانات را تست کنید." },
  { q: "آیا نیاز به نصب نرم‌افزار است؟", a: "خیر، سامانه کاملاً تحت وب است و فقط با مرورگر قابل استفاده است." },
  { q: "آیا داده‌های من امن هستند؟", a: "بله، تمام داده‌ها روی سرورهای امن با رمزنگاری ذخیره می‌شوند و بکاپ‌گیری روزانه انجام می‌شود." },
  { q: "آیا پشتیبانی دارید؟", a: "بله، تیم پشتیبانی ما ۲۴ ساعته پاسخگوی شماست." },
  { q: "آیا امکان ارسال پیامک خودکار وجود دارد؟", a: "بله، سامانه به‌صورت خودکار در ثبت سفارش، تکمیل و آماده تحویل به مشتریان پیامک می‌فرستد." },
];

export default function HomePage() {
  const { data: apiPlans, isLoading: plansLoading } = usePublicPlans();
  const plans = apiPlans && apiPlans.length > 0 ? apiPlans : FALLBACK_PLANS;
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="container mx-auto px-4 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-right"
            >
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="ml-1 size-3" />
                سامانه شماره یک مدیریت خشکشویی
              </Badge>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                خشکشویی خود را
                <br />
                <span className="gradient-text">هوشمندانه مدیریت کنید</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0">
                تمام ابزارهای لازم برای مدیریت خشکشویی در یک سامانه: سفارشات، مشتریان، قیمت‌گذاری، انبار، گزارش‌گیری و پیامک.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button asChild size="lg" className="text-base">
                  <Link href="/login">
                    شروع رایگان
                    <ArrowLeft className="mr-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base">
                  <Link href="/features">مشاهده امکانات</Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground lg:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  بدون نیاز به نصب
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  پشتیبانی فارسی
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative mx-auto max-w-md">
                <div className="absolute inset-0 -z-10 animate-blob rounded-full bg-primary/20 blur-3xl" />
                <Card className="overflow-hidden shadow-2xl">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                          <BarChart3 className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">داشبورد امروز</p>
                          <p className="text-xs text-muted-foreground">۱۴۰۳/۰۵/۱۲</p>
                        </div>
                      </div>
                      <Badge variant="default">فعال</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-secondary p-3">
                        <p className="text-xs text-muted-foreground">سفارشات امروز</p>
                        <p className="mt-1 text-2xl font-bold">{toPersianDigits("۴۸")}</p>
                      </div>
                      <div className="rounded-lg bg-secondary p-3">
                        <p className="text-xs text-muted-foreground">درآمد امروز</p>
                        <p className="mt-1 text-2xl font-bold">{toPersianDigits("۳.۲")}M</p>
                      </div>
                      <div className="rounded-lg bg-secondary p-3">
                        <p className="text-xs text-muted-foreground">در حال انجام</p>
                        <p className="mt-1 text-2xl font-bold">{toPersianDigits("۱۲")}</p>
                      </div>
                      <div className="rounded-lg bg-secondary p-3">
                        <p className="text-xs text-muted-foreground">آماده تحویل</p>
                        <p className="mt-1 text-2xl font-bold">{toPersianDigits("۸")}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between rounded-lg border p-2">
                        <span className="text-sm">پیراهن - خشکشویی</span>
                        <span className="text-sm font-medium">{toPersianDigits("۸۰,۰۰۰")}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-2">
                        <span className="text-sm">کت - اتوکشی</span>
                        <span className="text-sm font-medium">{toPersianDigits("۴۰,۰۰۰")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-secondary/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl font-bold gradient-text sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">امکانات</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">هر آنچه برای مدیریت خشکشویی نیاز دارید</h2>
            <p className="mt-4 text-muted-foreground">یک سامانه، تمام ابزارها</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Card className="h-full transition-shadow hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-6" />
                      </div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="mb-4">مزایا</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">چرا سپیدنو؟</h2>
              <p className="mt-4 text-muted-foreground">با سپیدنو، کسب‌وکار شما هوشمندتر، سریع‌تر و سودآورتر می‌شود.</p>
              <div className="mt-6 space-y-4">
                {[
                  { icon: Zap, title: "افزایش سرعت کار", desc: "ثبت سفارش در کمتر از ۳۰ ثانیه" },
                  { icon: TrendingUp, title: "افزایش درآمد", desc: "با سیستم وفاداری و پیامک خودکار، مشتریان بیشتری برگردانید" },
                  { icon: ShieldCheck, title: "کاهش خطا", desc: "چک‌لیست آسیب‌ها و عکس‌های سفارش، اختلافات را حذف می‌کند" },
                ].map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{b.title}</h4>
                        <p className="text-sm text-muted-foreground">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <Card className="shadow-xl">
                <CardContent className="p-6">
                  <h3 className="mb-4 font-semibold">نمودار درآمد ماهانه</h3>
                  <div className="flex h-48 items-end justify-between gap-2">
                    {[40, 65, 50, 80, 70, 95, 85].map((h, i) => (
                      <div key={i} className="flex h-full flex-1 flex-col justify-end">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-primary to-chart-2"
                          style={{ height: `${h}%` }}
                        />
                        <p className="mt-2 text-center text-xs text-muted-foreground">{toPersianDigits(i + 1)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">نظرات مشتریان</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">مشتریان ما چه می‌گویند؟</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {REVIEWS.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-4 flex gap-1">
                      {Array.from({ length: review.rating }).map((_, idx) => (
                        <Star key={idx} className="size-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                    <div className="mt-4 flex items-center gap-3 border-t pt-4">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{review.name}</p>
                        <p className="text-xs text-muted-foreground">{review.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">قیمت‌گذاری</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">طرح متناسب با کسب‌وکار شما</h2>
            <p className="mt-4 text-muted-foreground">از طرح رایگان شروع کنید و هر زمان ارتقا دهید</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3 items-stretch">
            {plansLoading ? (
              <div className="col-span-3 flex justify-center py-10">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : plans.map((plan, i) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const p = plan as any;
              const isComingSoon = p.isComingSoon;
              const isHighlight = p.tagline === "محبوب‌ترین" || p.name === "پایه";

              // All period prices
              const periods = [
                { key: "monthly", label: "ماهانه", days: 30, original: p.monthlyOriginalPrice || 0, price: p.monthlyPrice || 0 },
                { key: "quarterly", label: "سه ماهه", days: 90, original: p.quarterlyOriginalPrice || 0, price: p.quarterlyPrice || 0 },
                { key: "semiAnnual", label: "شش ماهه", days: 180, original: p.semiAnnualOriginalPrice || 0, price: p.semiAnnualPrice || 0 },
                { key: "annual", label: "سالانه", days: 365, original: p.annualOriginalPrice || 0, price: p.annualPrice || 0 },
              ].filter(pr => pr.price > 0 || (p.monthlyPrice === 0 && pr.key === "monthly"));

              return (
              <motion.div
                key={p._id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={isHighlight ? "md:-mt-4" : ""}
              >
                <Card className={cn("h-full flex flex-col", isHighlight ? "border-primary shadow-lg" : isComingSoon ? "opacity-75" : "")}>
                  <CardContent className="p-6 flex flex-col flex-1">
                    {p.tagline && (
                      <Badge className={`mb-4 w-full justify-center ${isComingSoon ? "bg-amber-500" : ""}`}>
                        {p.tagline}
                      </Badge>
                    )}
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.description}</p>

                    {/* All period prices */}
                    <div className="mt-4 space-y-2">
                      {isComingSoon ? (
                        <span className="text-2xl font-bold text-muted-foreground">به‌زودی</span>
                      ) : p.monthlyPrice === 0 ? (
                        <span className="text-3xl font-bold">رایگان</span>
                      ) : (
                        periods.map((pr) => {
                          const discountPercent = pr.original > 0 && pr.original !== pr.price
                            ? Math.round((1 - pr.price / pr.original) * 100) : 0;
                          return (
                            <div key={pr.key} className="flex items-center justify-between rounded-lg border p-2">
                              <span className="text-sm text-muted-foreground">{pr.label}</span>
                              <div className="text-left">
                                {pr.original > 0 && pr.original !== pr.price && (
                                  <span className="ml-2 text-xs text-muted-foreground line-through">
                                    {formatToman(pr.original)}
                                  </span>
                                )}
                                <span className="font-bold text-sm">
                                  {pr.price === 0 ? "رایگان" : formatToman(pr.price)}
                                </span>
                                {discountPercent > 0 && (
                                  <Badge variant="destructive" className="mr-1 text-xs">٪{toPersianDigits(discountPercent)}</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Features list */}
                    <ul className="mt-4 space-y-2 text-sm flex-1">
                      {(p.features || []).map((f: string, fi: number) => (
                        <li key={fi} className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA button */}
                    <Button
                      asChild
                      className="mt-6 w-full"
                      variant={isHighlight ? "default" : "outline"}
                      disabled={isComingSoon}
                    >
                      <Link href={isComingSoon ? "#" : "/login"}>
                        {isComingSoon ? "به‌زودی" : "شروع کنید"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="link">
              <Link href="/pricing">مقایسه کامل طرح‌ها</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">سوالات متداول</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">سوالات شما، پاسخ ما</h2>
          </div>
          <div className="mt-12">
            <Accordion type="single" collapsible>
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-right">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground">
            <div className="absolute inset-0 -z-10 opacity-20">
              <div className="absolute right-10 top-10 size-40 animate-float rounded-full bg-white" />
              <div className="absolute bottom-10 left-10 size-32 animate-blob rounded-full bg-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">آماده شروع هستید؟</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              همین امروز به سپیدنو بپیوندید و کسب‌وکار خود را هوشمند کنید
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">شروع رایگان</Link>
              </Button>
              <Button asChild size="lg" className="bg-white/15 text-white border border-white/40 hover:bg-white/25 backdrop-blur-sm">
                <Link href="/contact">تماس با ما</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

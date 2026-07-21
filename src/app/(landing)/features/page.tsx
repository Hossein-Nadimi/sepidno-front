import type { Metadata } from "next";
import Link from "next/link";
import {
  ShoppingBag, Users, Tags, Boxes, Gift, MessageSquare, BarChart3, CreditCard,
  ShieldCheck, Zap, Settings, Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "امکانات سامانه",
  description: "آشنایی با تمام امکانات سامانه مدیریت خشکشویی: داشبورد، سفارشات، مشتریان، قیمت‌گذاری، انبار، کش‌بک، پیامک و گزارش‌گیری.",
};

const FEATURES = [
  {
    icon: BarChart3,
    title: "داشبورد هوشمند",
    desc: "نمای کلی از عملکرد کسب‌وکار شما در یک نگاه. سفارشات امروز، درآمد، نمودارها و شاخص‌های کلیدی.",
    items: ["سفارشات امروز", "درآمد روزانه/هفتگی/ماهانه", "نمودار درآمد و سفارشات", "شاخص‌های کلیدی عملکرد"],
  },
  {
    icon: ShoppingBag,
    title: "مدیریت سفارشات",
    desc: "ثبت سریع سفارشات با چک‌لیست آسیب‌ها، عکس‌ها و قیمت‌گذاری خودکار.",
    items: ["ثبت سفارش با چند آیتم", "چک‌لیست آسیب‌ها", "آپلود عکس", "چاپ قبض"],
  },
  {
    icon: Users,
    title: "مدیریت مشتریان",
    desc: "پروفایل کامل مشتریان شامل تاریخچه خرید، موجودی کیف پول و آمار.",
    items: ["جستجوی پیشرفته", "تاریخچه سفارشات", "موجودی کش‌بک", "آمار خرید"],
  },
  {
    icon: Tags,
    title: "قیمت‌گذاری هوشمند",
    desc: "ماتریس قیمت بر اساس نوع لباس و خدمت. هر لباس با هر خدمت، قیمت جداگانه.",
    items: ["ماتریس قیمت", "ویرایش گروهی", "مدت زمان تخمینی", "فعال/غیرفعال کردن"],
  },
  {
    icon: Boxes,
    title: "مدیریت انبار",
    desc: "کنترل کامل موجودی مواد مصرفی و حرکت‌های انبار.",
    items: ["ثبت موجودی", "هشدار کمبود", "ورود و خروج", "گزارش مصرف"],
  },
  {
    icon: Gift,
    title: "سیستم وفاداری و کش‌بک",
    desc: "پاداش خودکار به مشتریان وفادار و افزایش درآمد.",
    items: ["تنظیم درصد پاداش", "انقضای خودکار", "حداقل و حداکثر پاداش", "گزارش کامل"],
  },
  {
    icon: MessageSquare,
    title: "پیامک خودکار",
    desc: "اطلاع‌رسانی خودکار به مشتریان در رویدادهای مهم.",
    items: ["ثبت سفارش", "تکمیل سفارش", "آماده تحویل", "تولد مشتری"],
  },
  {
    icon: BarChart3,
    title: "گزارش‌گیری پیشرفته",
    desc: "تحلیل کامل عملکرد با گزارش‌های متنوع و فیلترهای Jalali.",
    items: ["درآمد", "سفارشات", "مشتریان", "خدمات و لباس‌ها"],
  },
  {
    icon: CreditCard,
    title: "مدیریت اشتراک",
    desc: "طرح‌های متنوع متناسب با اندازه کسب‌وکار شما.",
    items: ["طرح رایگان", "طرح حرفه‌ای", "طرح سازمانی", "خرید بسته پیامک"],
  },
  {
    icon: Settings,
    title: "تنظیمات سفارشی",
    desc: "پیکربندی کامل کسب‌وکار، ساعات کاری، قوانین و تنظیمات قبض.",
    items: ["اطلاعات کسب‌وکار", "ساعات کاری", "تنظیمات قبض", "قوانین و مقررات"],
  },
  {
    icon: Receipt,
    title: "قبض دیجیتال",
    desc: "تولید قبض با QR کد، بارکد و قابلیت چاپ.",
    items: ["QR کد", "بارکد", "چاپ مستقیم", "قالب سفارشی"],
  },
  {
    icon: ShieldCheck,
    title: "امنیت و پشتیبانی",
    desc: "داده‌های شما با امنیت بالا ذخیره می‌شوند و پشتیبانی ۲۴/۷ در دسترس است.",
    items: ["رمزنگاری داده‌ها", "بکاپ روزانه", "پشتیبانی فارسی", "آپدیت رایگان"],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">امکانات</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">تمام امکانات یک سامانه</h1>
            <p className="mt-6 text-lg text-muted-foreground">
              سپیدنو تمام ابزارهای لازم برای مدیریت خشکشویی شما را در یک سامانه یکپارچه ارائه می‌دهد.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} className="h-full transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
                    <ul className="mt-4 space-y-1.5">
                      {feature.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Zap className="size-3 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <Button asChild size="lg">
              <Link href="/login">همین حالا شروع کنید</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

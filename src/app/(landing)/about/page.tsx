import type { Metadata } from "next";
import Link from "next/link";
import { Target, Eye, Heart, Users, Building2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "درباره ما",
  description: "داستان شرکت، ماموریت و چشم‌انداز سامانه مدیریت خشکشویی. تیم ما متعهد به ارائه بهترین ابزارها برای کسب‌وکارهای ایرانی است.",
};

const VALUES = [
  { icon: Target, title: "ماموریت ما", desc: "توانمندسازی خشکشویی‌های ایرانی با ابزارهای هوشمند و ساده" },
  { icon: Eye, title: "چشم‌انداز", desc: "تبدیل شدن به برترین سامانه مدیریت خشکشویی در خاورمیانه" },
  { icon: Heart, title: "ارزش‌های ما", desc: "صداقت، نوآوری، کیفیت و پشتیبانی واقعی از مشتریان" },
];

export default function AboutPage() {
  return (
    <>
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">درباره ما</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">داستان سپیدنو</h1>
            <p className="mt-6 text-lg text-muted-foreground">
              ما تیمی از توسعه‌دهندگان و کارآفرینان ایرانی هستیم که در سال ۱۴۰۲ با هدف ساده‌سازی مدیریت خشکشویی‌ها شروع به کار کردیم.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {VALUES.map((value, i) => {
              const Icon = value.icon;
              return (
                <Card key={i}>
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-7" />
                    </div>
                    <h3 className="font-semibold">{value.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{value.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-secondary/30 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold">چرا سپیدنو را ساختیم؟</h2>
            <p className="mt-4 text-muted-foreground">
              خشکشویی‌های ایرانی سال‌ها با روش‌های سنتی مدیریت می‌شدند: دفترچه یادداشت، قبض کاغذی و تماس‌های تلفنی.
              این روش‌ها هم خطاساز بودند و هم زمان‌بر. ما تصمیم گرفتیم سامانه‌ای بسازیم که هم ساده باشد و هم کامل.
            </p>
            <p className="mt-4 text-muted-foreground">
              سپیدنو حاصل تلاش تیمی است که با گپ‌وگفت با صدها خشکشویی‌دار، نیازهای واقعی آن‌ها را فهمید و راه‌حلی ساخت که واقعاً کاربردی باشد.
              امروز بیش از ۵۰۰ خشکشویی فعال از سامانه ما استفاده می‌کنند.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Users, value: "۵۰۰+", label: "خشکشویی فعال" },
              { icon: Building2, value: "۱۴۰۲", label: "سال تاسیس" },
              { icon: Award, value: "۹۸٪", label: "رضایت مشتری" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="size-6" />
                  </div>
                  <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">آماده پیوستن به ما هستید؟</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            همین امروز به جمع ۵۰۰+ خشکشویی موفق بپیوندید
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/login">شروع رایگان</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

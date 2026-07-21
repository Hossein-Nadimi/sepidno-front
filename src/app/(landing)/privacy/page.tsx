import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حریم خصوصی",
  description: "سیاست حریم خصوصی سامانه مدیریت خشکشویی - نحوه جمع‌آوری، استفاده و محافظت از اطلاعات کاربران.",
};

export default function PrivacyPage() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">سیاست حریم خصوصی</h1>
        <p className="mt-4 text-sm text-muted-foreground">آخرین بروزرسانی: تیر ۱۴۰۳</p>

        <div className="prose prose-slate mt-10 max-w-none dark:prose-invert">
          <h2 className="text-xl font-bold">مقدمه</h2>
          <p className="text-muted-foreground">
            سپیدنو به حریم خصوصی کاربران خود احترام می‌گذارد. این سیاست توضیح می‌دهد که چه اطلاعاتی را جمع‌آوری می‌کنیم و چگونه از آن‌ها استفاده می‌کنیم.
          </p>

          <h2 className="mt-8 text-xl font-bold">اطلاعات جمع‌آوری شده</h2>
          <p className="text-muted-foreground">ما اطلاعات زیر را جمع‌آوری می‌کنیم:</p>
          <ul className="mt-2 list-disc pr-6 text-muted-foreground">
            <li>اطلاعات هویتی: نام، نام خانوادگی، شماره موبایل</li>
            <li>اطلاعات کسب‌وکار: نام خشکشویی، آدرس، ساعات کاری</li>
            <li>اطلاعات تراکنشی: سفارشات، پرداخت‌ها، اشتراک‌ها</li>
            <li>اطلاعات فنی: آدرس IP، نوع مرورگر، دستگاه</li>
          </ul>

          <h2 className="mt-8 text-xl font-bold">نحوه استفاده از اطلاعات</h2>
          <p className="text-muted-foreground">
            از اطلاعات شما برای ارائه و بهبود خدمات، پشتیبانی، ارسال پیامک‌های مرتبط با سفارشات و امور مالی استفاده می‌کنیم.
          </p>

          <h2 className="mt-8 text-xl font-bold">محافظت از اطلاعات</h2>
          <p className="text-muted-foreground">
            تمام اطلاعات با رمزنگاری SSL ذخیره می‌شوند. دسترسی به اطلاعات محدود است و فقط کارکنان مجاز می‌توانند به آن دسترسی داشته باشند. بکاپ‌گیری روزانه انجام می‌شود.
          </p>

          <h2 className="mt-8 text-xl font-bold">اشتراک‌گذاری اطلاعات</h2>
          <p className="text-muted-foreground">
            ما اطلاعات شما را به هیچ شخص ثالثی نمی‌فروشیم. فقط در موارد قانونی یا برای ارائه خدمات (مثل ارسال پیامک از طریق ارائه‌دهنده پیامک) اطلاعات لازم را به اشتراک می‌گذاریم.
          </p>

          <h2 className="mt-8 text-xl font-bold">حقوق شما</h2>
          <p className="text-muted-foreground">شما حق دارید:</p>
          <ul className="mt-2 list-disc pr-6 text-muted-foreground">
            <li>به اطلاعات خود دسترسی داشته باشید</li>
            <li>اطلاعات نادرست را اصلاح کنید</li>
            <li>درخواست حذف حساب کاربری خود را بدهید</li>
            <li>از دریافت پیامک‌های تبلیغاتی انصراف دهید</li>
          </ul>

          <h2 className="mt-8 text-xl font-bold">تماس با ما</h2>
          <p className="text-muted-foreground">
            در صورت داشتن سوال درباره حریم خصوصی، با ایمیل privacy@sepidno.ir تماس بگیرید.
          </p>
        </div>
      </div>
    </section>
  );
}

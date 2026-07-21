import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "قوانین و مقررات",
  description: "قوانین و مقررات استفاده از سامانه مدیریت خشکشویی - شرایط استفاده، حقوق و مسئولیت‌های کاربران.",
};

export default function TermsPage() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">قوانین و مقررات</h1>
        <p className="mt-4 text-sm text-muted-foreground">آخرین بروزرسانی: تیر ۱۴۰۳</p>

        <div className="prose prose-slate mt-10 max-w-none dark:prose-invert">
          <h2 className="text-xl font-bold">پذیرش قوانین</h2>
          <p className="text-muted-foreground">
            با استفاده از سامانه سپیدنو، شما قوانین و مقررات زیر را می‌پذیرید. در صورت عدم موافقت، لطفاً از سامانه استفاده نکنید.
          </p>

          <h2 className="mt-8 text-xl font-bold">ثبت‌نام و حساب کاربری</h2>
          <p className="text-muted-foreground">
            برای استفاده از سامانه باید با شماره موبایل معتبر ثبت‌نام کنید. شما مسئول حفظ امنیت حساب کاربری خود هستید و باید هرگونه استفاده غیرمجاز را به اطلاع ما برسانید.
          </p>

          <h2 className="mt-8 text-xl font-bold">اشتراک و پرداخت</h2>
          <p className="text-muted-foreground">
            طرح‌های اشتراک به صورت ماهانه یا سالانه محاسبه می‌شوند. پرداخت‌ها به صورت آنلاین انجام می‌شود و فاکتور رسمی صادر می‌گردد. در صورت عدم پرداخت به موقع، اشتراک شما به حالت تعلیق در می‌آید.
          </p>

          <h2 className="mt-8 text-xl font-bold">استفاده از خدمات</h2>
          <p className="text-muted-foreground">شما متعهد می‌شوید:</p>
          <ul className="mt-2 list-disc pr-6 text-muted-foreground">
            <li>از سامانه فقط برای اهداف قانونی استفاده کنید</li>
            <li>اطلاعات واقعی و دقیق وارد کنید</li>
            <li>از اطلاعات دیگر کاربران سوءاستفاده نکنید</li>
            <li>امنیت سامانه را به خطر نیندازید</li>
          </ul>

          <h2 className="mt-8 text-xl font-bold">محتوای کاربر</h2>
          <p className="text-muted-foreground">
            شما مالک تمام اطلاعاتی که در سامانه وارد می‌کنید (مشتریان، سفارشات و...) هستید. ما حق دارید در صورت تخلف، دسترسی شما را قطع کنیم.
          </p>

          <h2 className="mt-8 text-xl font-bold">حد مسئولیت</h2>
          <p className="text-muted-foreground">
            سامانه «همان‌طور که هست» ارائه می‌شود. ما تضمین نمی‌کنیم که سامانه همیشه بدون نقص کار کند. در هیچ صورتی مسئولیت خسارات مستقیم، غیرمستقیم یا از دست رفتن سود بر عهده ما نخواهد بود.
          </p>

          <h2 className="mt-8 text-xl font-bold">فسخ قرارداد</h2>
          <p className="text-muted-foreground">
            شما می‌توانید در هر زمان اشتراک خود را لغو کنید. هزینه پرداخت شده برای دوره باقی‌مانده بازگردانده نمی‌شود.
          </p>

          <h2 className="mt-8 text-xl font-bold">تغییر قوانین</h2>
          <p className="text-muted-foreground">
            ما حق تغییر این قوانین را محفوظ می‌داریم. تغییرات پس از اطلاع‌رسانی در سامانه اعمال می‌شوند.
          </p>

          <h2 className="mt-8 text-xl font-bold">قانون حاکم</h2>
          <p className="text-muted-foreground">
            این قوانین تابع قوانین جمهوری اسلامی ایران است و هرگونه اختلاف در مراجع قانونی ایران رسیدگی می‌شود.
          </p>
        </div>
      </div>
    </section>
  );
}

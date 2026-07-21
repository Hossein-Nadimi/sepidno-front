import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "سوالات متداول",
  description: "پاسخ سوالات رایج درباره سامانه مدیریت خشکشویی: قیمت، امکانات، پشتیبانی، امنیت و نحوه استفاده.",
};

const FAQ = [
  {
    q: "آیا امکان تست رایگان وجود دارد؟",
    a: "بله، طرح استارتر ما کاملاً رایگان است و می‌توانید تا یک شعبه و ۵۰ پیامک در ماه را به صورت رایگان استفاده کنید. هیچ کارت اعتباری برای ثبت‌نام لازم نیست.",
  },
  {
    q: "آیا برای استفاده از سامانه نیاز به نصب نرم‌افزار است؟",
    a: "خیر، سامانه کاملاً تحت وب است. کافی است با مرورگر (کروم، فایرفاکس، سافاری و...) به آدرس سامانه وارد شوید. همچنین روی موبایل و تبلت هم بهینه شده است.",
  },
  {
    q: "آیا داده‌های من امن هستند؟",
    a: "بله، تمام داده‌ها با رمزنگاری SSL ذخیره می‌شوند و بکاپ‌گیری روزانه از آن‌ها گرفته می‌شود. سرورها در ایران مستقر هستند و کاملاً مطابق با قوانین کشور عمل می‌کنیم.",
  },
  {
    q: "آیا پشتیبانی فارسی دارید؟",
    a: "بله، تیم پشتیبانی ما ۲۴ ساعت در روز، ۷ روز در هفته به زبان فارسی پاسخگوی شماست. در طرح حرفه‌ای و سازمانی، پشتیبانی اولویت‌دار و اختصاصی دریافت می‌کنید.",
  },
  {
    q: "آیا می‌توانم طرحم را تغییر دهم؟",
    a: "بله، در هر زمان می‌توانید از پنل کاربری، طرح خود را ارتقا دهید یا تغییر دهید. هزینه به صورت روزشمار محاسبه می‌شود.",
  },
  {
    q: "اگر سهمیه پیامک ماهانه تمام شود چه می‌شود؟",
    a: "می‌توانید بسته‌های پیامک اضافی (۵۰۰، ۱۰۰۰ یا ۵۰۰۰ پیامک) را به صورت یک‌باره خریداری کنید. این پیامک‌ها تا تاریخ انقضا معتبر هستند.",
  },
  {
    q: "آیا سامانه برای لباسشویی‌های صنعتی هم مناسب است؟",
    a: "بله، سپیدنو برای هر اندازه کسب‌وکاری مناسب است. طرح سازمانی ما شامل امکانات پیشرفته و API برای یکپارچه‌سازی با سیستم‌های موجود است.",
  },
  {
    q: "آیا آموزش استفاده از سامانه ارائه می‌دهید؟",
    a: "بله، ویدیوهای آموزشی کامل در سامانه موجود است. همچنین برای طرح‌های حرفه‌ای و سازمانی، جلسه آموزش رایگان آنلاین برگزار می‌کنیم.",
  },
  {
    q: "آیا می‌توانم اطلاعات مشتریانم را از سیستم قبلی انتقال دهم؟",
    a: "بله، تیم ما به شما در انتقال اطلاعات از سیستم‌های قبلی کمک می‌کند. کافی است با پشتیبانی تماس بگیرید.",
  },
  {
    q: "آیا فاکتور رسمی دریافت می‌کنم؟",
    a: "بله، برای تمام پرداخت‌ها فاکتور رسمی با مهر شرکت صادر می‌شود و در پنل کاربری شما قابل دسترس است.",
  },
];

export default function FAQPage() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">سوالات متداول</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">سوال شما، پاسخ ما</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            پاسخ سوالات رایج درباره سامانه سپیدنو
          </p>
        </div>

        <div className="mt-12">
          <Accordion type="single" collapsible>
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-right text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 rounded-2xl bg-secondary/50 p-8 text-center">
          <h3 className="text-lg font-semibold">سوال دیگری دارید؟</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            با تیم پشتیبانی ما در تماس باشید
          </p>
          <a href="tel:02112345678" className="mt-4 inline-block text-primary hover:underline" dir="ltr">
            021-12345678
          </a>
        </div>
      </div>
    </section>
  );
}

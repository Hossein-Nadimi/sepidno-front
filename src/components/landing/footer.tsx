import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Send, Camera } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-3 flex items-center gap-2">
              <Image src="/logo.svg" alt="سپیدنو" width={36} height={36} />
              <span className="text-lg font-bold">سپیدنو</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              سامانه مدیریت یکپارچه خشکشویی و لباسشویی برای کسب‌وکارهای ایرانی
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">دسترسی سریع</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/features" className="hover:text-foreground">امکانات</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">قیمت‌گذاری</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">سوالات متداول</Link></li>
              <li><Link href="/login" className="hover:text-foreground">ورود</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">تماس با ما</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="size-4" /><span dir="ltr">09391503092</span></li>
              <li className="flex items-center gap-2"><Mail className="size-4" />info@sepidno.ir</li>
              <li className="flex items-center gap-2"><MapPin className="size-4" />تبریز، ایران</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">شبکه‌های اجتماعی</h3>
            <div className="flex gap-3">
              <a href="https://t.me/sepidnoapp" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="flex size-9 items-center justify-center rounded-lg border hover:bg-accent transition-colors">
                <Send className="size-4" />
              </a>
              <a href="https://instagram.com/sepidnoapp" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex size-9 items-center justify-center rounded-lg border hover:bg-accent transition-colors">
                <Camera className="size-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© ۱۴۰۳ سپیدنو. تمامی حقوق محفوظ است.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">حریم خصوصی</Link>
            <Link href="/terms" className="hover:text-foreground">قوانین و مقررات</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

# پنل مدیریت سپیدنو

پنل مدیریت خشکشویی — Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS 4 + shadcn/ui
- TanStack Query
- React Hook Form + Zod
- Axios (JWT + Refresh Token + 401 retry)
- Zustand (auth store)
- next-themes (Dark mode)
- Recharts
- React Hot Toast
- Lucide Icons
- moment-jalaali (Jalali calendar)

## Features

- ورود OTP + بررسی کد + مدیریت نشست (JWT/Refresh)
- محافظت از مسیرها (AuthGuard)
- چیدمان واکنش‌گرا: سایدبار + تاپ‌بار + Breadcrumb + Dark Mode + RTL کامل
- داشبورد با KPI ها و نمودارها (درآمد، سفارشات، SMS باقی‌مانده، ...)
- مدیریت مشتریان (لیست، جستجو، پروفایل، آمار، ایجاد/ویرایش/حذف)
- مدیریت سفارشات (آیتم‌های چندگانه، چک‌لیست آسیب، تصاویر، چاپ قبض)
- ماتریس قیمت‌گذاری (نوع لباس × خدمت)
- مدیریت انبار (آیتم‌ها + حرکت‌ها)
- گزارشات (درآمد، سفارشات، مشتریان، خدمات، انبار، کش‌بک، SMS)
- تنظیمات کسب‌وکار (اطلاعات، ساعات کاری، SMS، قبض، وفاداری)
- اشتراک + خرید بسته پیامک
- پشتیبانی کامل از تاریخ Jalali
- اعداد فارسی در سراسر UI

## Setup

```bash
npm install
cp .env.example .env.local   # then edit NEXT_PUBLIC_API_URL
npm run dev                  # http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

## Architecture

```
src/
├── app/                    # App router pages
│   ├── login/              # OTP login flow
│   └── (dashboard)/        # Protected dashboard pages
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── common/             # Shared (pagination, search, dialog, ...)
│   └── layout/             # Sidebar + Topbar
├── hooks/                  # Custom hooks
├── lib/                    # utils, api client, jalali, nav config
├── providers/              # React providers
├── services/               # API service layer
├── store/                  # Zustand stores
└── types/                  # Shared TypeScript types
```

## Multi-Tenant

هر درخواست به `/api/laundry/*` نیاز به هدر `x-business-id` دارد که به‌صورت خودکار توسط Axios interceptor (از `useAuthStore.activeBusinessId`) اضافه می‌شود. Super Admin باید این هدر را به‌صورت دستی در پنل تنظیم کند.

## Auth Flow

1. کاربر شماره موبایل را وارد می‌کند → `POST /auth/otp/send`
2. کد OTP وارد می‌شود → `POST /auth/otp/verify` → دریافت `accessToken` + `refreshToken`
3. توکن‌ها در `localStorage` (Zustand persist) ذخیره می‌شوند
4. Axios به‌صورت خودکار `Authorization: Bearer ...` را به هر درخواست اضافه می‌کند
5. در صورت ۴۰۱، یک‌بار `POST /auth/refresh` صدا زده می‌شود و در صورت موفقیت درخواست اصلی تکرار می‌شود؛ در غیر این صورت کاربر به `/login` هدایت می‌شود

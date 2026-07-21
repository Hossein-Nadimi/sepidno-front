import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "قیمت‌گذاری",
  description: "مقایسه طرح‌های اشتراک سامانه مدیریت خشکشویی سپیدنو",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Phone, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toEnglishDigits } from "@/lib/utils";

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(7, "شماره موبایل معتبر وارد کنید")
    .regex(/^\+?[0-9]{7,15}$/, "شماره موبایل معتبر وارد کنید"),
});

const otpSchema = z.object({
  code: z
    .string()
    .min(4, "کد یکبار مصرف حداقل ۴ رقم است")
    .max(8, "کد یکبار مصرف حداکثر ۸ رقم است")
    .regex(/^\d{4,8}$/, "کد باید فقط عدد باشد"),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // If already logged in, redirect to dashboard (after hydration)
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema), defaultValues: { phoneNumber: "" } });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema), defaultValues: { code: "" } });

  function startResendCountdown() {
    setResendIn(60);
    const id = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function onSendOtp(values: PhoneForm) {
    setLoading(true);
    try {
      await authService.sendOtp(values.phoneNumber);
      setPhoneNumber(values.phoneNumber);
      setStep("otp");
      toast.success("کد یکبار مصرف ارسال شد");
      startResendCountdown();
    } catch {
      // Toast shown by interceptor
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(values: OtpForm) {
    setLoading(true);
    try {
      const code = toEnglishDigits(values.code);
      const data = await authService.verifyOtp(phoneNumber, code);
      login(data.user, data.accessToken, data.refreshToken);
      toast.success("خوش آمدید");
      router.replace("/dashboard");
    } catch {
      // Toast shown by interceptor
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (resendIn > 0) return;
    setLoading(true);
    try {
      await authService.sendOtp(phoneNumber);
      toast.success("کد جدید ارسال شد");
      startResendCountdown();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="text-2xl font-bold">پنل مدیریت سپیدنو</h1>
          <p className="mt-1 text-sm text-muted-foreground">برای ورود، شماره موبایل خود را وارد کنید</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{step === "phone" ? "ورود با کد یکبار مصرف" : "تأیید کد یکبار مصرف"}</CardTitle>
            <CardDescription>
              {step === "phone"
                ? "کد یکبار مصرف به شماره موبایل شما ارسال می‌شود"
                : `کد ارسال شده به ${phoneNumber} را وارد کنید`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "phone" ? (
              <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">شماره موبایل</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      className="pr-9"
                      placeholder="09121234567"
                      dir="ltr"
                      autoComplete="tel"
                      {...phoneForm.register("phoneNumber")}
                    />
                  </div>
                  {phoneForm.formState.errors.phoneNumber && (
                    <p className="text-xs text-destructive">{phoneForm.formState.errors.phoneNumber.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "ارسال کد"}
                </Button>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">کد یکبار مصرف</Label>
                  <Input
                    id="code"
                    className="text-center text-lg tracking-[0.5em]"
                    placeholder="------"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    {...otpForm.register("code")}
                  />
                  {otpForm.formState.errors.code && (
                    <p className="text-xs text-destructive">{otpForm.formState.errors.code.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "ورود"}
                </Button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      otpForm.reset();
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <span className="inline-flex items-center gap-1">
                      <ArrowRight className="size-3" />
                      تغییر شماره
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={resendIn > 0 || loading}
                    className="text-primary hover:underline disabled:text-muted-foreground"
                  >
                    {resendIn > 0 ? `ارسال مجدد در ${resendIn} ثانیه` : (
                      <span className="inline-flex items-center gap-1">
                        <RefreshCw className="size-3" />
                        ارسال مجدد کد
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          با ورود، قوانین و مقررات سامانه را می‌پذیرید
        </p>
      </div>
    </div>
  );
}

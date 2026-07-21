"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  name: z.string().min(2, "نام الزامی است"),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  phone: z.string().min(7, "شماره تماس الزامی است"),
  message: z.string().min(10, "پیام حداقل ۱۰ کاراکتر است"),
});

type FormValues = z.infer<typeof schema>;

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(_values: FormValues) {
    setLoading(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    toast.success("پیام شما ارسال شد. به زودی با شما تماس می‌گیریم.");
    reset();
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">تماس با ما</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">با ما در ارتباط باشید</h1>
          <p className="mt-4 text-lg text-muted-foreground">سوال یا پیشنهاد دارید؟ خوشحال می‌شویم بشنویم.</p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Contact form */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">نام و نام خانوادگی</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل</Label>
                    <Input id="email" dir="ltr" {...register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">شماره تماس</Label>
                    <Input id="phone" dir="ltr" {...register("phone")} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">پیام شما</Label>
                  <Textarea id="message" rows={5} {...register("message")} />
                  {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "ارسال پیام"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact info + map */}
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">تلفن تماس</p>
                    <p dir="ltr" className="mt-1 text-sm text-muted-foreground">09391503092</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">ایمیل</p>
                    <p dir="ltr" className="mt-1 text-sm text-muted-foreground">info@sepidno.ir</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">آدرس</p>
                    <p className="mt-1 text-sm text-muted-foreground">تبریز، ایران</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map placeholder */}
            <div className="relative aspect-video overflow-hidden rounded-2xl border bg-muted">
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MapPin className="mx-auto size-12 mb-2" />
                  <p className="text-sm">نقشه گوگل</p>
                  <p className="text-xs">تبریز، ایران</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

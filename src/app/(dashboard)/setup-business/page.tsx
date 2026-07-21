"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Store, Phone, CheckCircle2, Upload, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/page-header";
import { resolveMediaUrl } from "@/lib/utils";

export default function SetupBusinessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    description: "",
    address: "",
    city: "",
    province: "",
    logo: "",
    phone: "",
    mobile: "",
    policies: "",
  });

  // Check if user has active subscription
  const { data: subStatus } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => api.get("/laundry/subscriptions/status").then((r) => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post("/laundry/subscriptions/business", payload).then((r) => r.data),
    onSuccess: async () => {
      toast.success("خشکشویی شما با موفقیت ایجاد شد");
      // Re-fetch the current user to get updated role/permissions
      // (role changes from 'User' to 'BusinessOwner' after business creation)
      try {
        const meRes = await api.get("/auth/me");
        const updatedUser = meRes.data.data;
        // Update the auth store with the new user data (including new permissions)
        useAuthStore.getState().setUser(updatedUser);
      } catch {
        // If /auth/me fails, just continue — the user can refresh manually
      }
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      queryClient.invalidateQueries({ queryKey: ["my-business"] });
      // Navigate to dashboard
      router.push("/dashboard");
    },
  });

  // If no active subscription, redirect to subscription page
  if (subStatus && !subStatus.hasActiveSubscription) {
    router.replace("/subscription");
    return null;
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("نام خشکشویی الزامی است");
      return;
    }
    mutation.mutate(form);
  }

  async function handleLogoUpload(file: File) {
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const res = await api.post("/uploads/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm({ ...form, logo: res.data.data.url });
      toast.success("لوگو آپلود شد");
    } catch {
      toast.error("خطا در آپلود لوگو");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="ایجاد خشکشویی"
        description="اطلاعات خشکشویی خود را وارد کنید"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            اطلاعات خشکشویی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>اشتراک شما فعال است! حالا اطلاعات خشکشویی خود را تکمیل کنید.</span>
          </div>

          {/* Logo upload */}
          <div className="space-y-2">
            <Label>لوگو (اختیاری)</Label>
            <div className="flex items-center gap-4">
              {form.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaUrl(form.logo)}
                  alt="لوگو"
                  className="size-16 rounded-lg object-cover border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                  <ImageIcon className="size-6" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                  <Upload className="size-4 ml-1" />
                  آپلود لوگو
                </Button>
                {form.logo && (
                  <Button type="button" variant="ghost" size="sm" className="mr-2" onClick={() => setForm({ ...form, logo: "" })}>
                    حذف
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>نام خشکشویی *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: خشکشویی پاک"
            />
          </div>

          <div className="space-y-2">
            <Label>نام صاحب خشکشویی</Label>
            <Input
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              placeholder="نام و نام خانوادگی صاحب خشکشویی"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>تلفن ثابت (اختیاری)</Label>
              <Input
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="02112345678"
              />
            </div>
            <div className="space-y-2">
              <Label>موبایل خشکشویی (اختیاری)</Label>
              <Input
                dir="ltr"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="09121234567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>شماره موبایل حساب کاربری</Label>
            <div className="flex items-center gap-2">
              <div className="flex h-9 flex-1 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground" dir="ltr">
                <Phone className="size-4 ml-2" />
                {user?.phoneNumber}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              این شماره برای ورود به حساب استفاده می‌شود و قابل تغییر نیست.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>استان</Label>
              <Input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                placeholder="مثلاً تهران"
              />
            </div>
            <div className="space-y-2">
              <Label>شهر</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="مثلاً تهران"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>آدرس</Label>
            <Textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="آدرس کامل خشکشویی"
            />
          </div>

          <div className="space-y-2">
            <Label>توضیحات (اختیاری)</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>قوانین و مقررات (نمایش در قبض)</Label>
            <Textarea
              rows={3}
              value={form.policies}
              onChange={(e) => setForm({ ...form, policies: e.target.value })}
              placeholder="قوانین خشکشویی خود را وارد کنید. این متن در پایین قبض چاپ می‌شود."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          انصراف
        </Button>
        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Save className="size-4 ml-1" />
              ایجاد خشکشویی
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

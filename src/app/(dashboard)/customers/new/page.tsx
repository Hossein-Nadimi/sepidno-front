"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowRight, Calendar } from "lucide-react";
import moment from "moment-jalaali";
import { customerService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/page-header";
import { JalaliDatePicker } from "@/components/common/jalali-date-picker";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

const schema = z.object({
  firstName: z.string().max(80).optional().or(z.literal("")),
  lastName: z.string().min(1, "نام خانوادگی الزامی است").max(80),
  mobile: z.string().min(7, "موبایل معتبر وارد کنید").max(20),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  // Accept empty string (default from <select>) OR male/female OR undefined
  gender: z.union([z.enum(["male", "female"]), z.literal("")]).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [birthDateJalali, setBirthDateJalali] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", mobile: "", phone: "", address: "", birthDate: "", gender: "", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      // Convert Jalali birth date to Gregorian if set
      let birthDateISO: string | undefined;
      if (birthDateJalali) {
        const m = moment(birthDateJalali, "jYYYY/jMM/jDD", true);
        if (m.isValid()) {
          birthDateISO = m.toDate().toISOString();
        }
      }
      await customerService.create({
        firstName: values.firstName || undefined,
        lastName: values.lastName,
        mobile: values.mobile,
        phone: values.phone || undefined,
        address: values.address || undefined,
        birthDate: birthDateISO,
        gender: values.gender === "male" || values.gender === "female" ? values.gender : undefined,
        notes: values.notes || undefined,
      });
      toast.success("مشتری با موفقیت ایجاد شد");
      // Invalidate customer list query so the new customer shows up immediately
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.push("/customers");
    } catch {
      // Toast shown by interceptor
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="مشتری جدید"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowRight className="size-4 ml-1" />
            بازگشت
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات مشتری</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">نام (اختیاری)</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">نام خانوادگی *</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mobile">موبایل *</Label>
                <Input id="mobile" dir="ltr" placeholder="09121234567" {...register("mobile")} />
                {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">تلفن ثابت (اختیاری)</Label>
                <Input id="phone" dir="ltr" {...register("phone")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birthDate">تاریخ تولد (اختیاری)</Label>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Calendar className="size-4 ml-2" />
                    {birthDateJalali || "انتخاب تاریخ"}
                  </Button>
                  {showDatePicker && (
                    <div className="absolute z-50 mt-1 left-0">
                      <JalaliDatePicker
                        value={birthDateJalali}
                        onChange={(v) => {
                          setBirthDateJalali(v);
                          // Convert Jalali to Gregorian for the form
                          const m = moment(v, "jYYYY/jMM/jDD", true);
                          if (m.isValid()) {
                            // Store as ISO string
                            const gregorian = m.format("YYYY-MM-DD");
                            // Use register to set value
                          }
                          setShowDatePicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">جنسیت (اختیاری)</Label>
                <select
                  id="gender"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  {...register("gender")}
                >
                  <option value="">—</option>
                  <option value="male">آقا</option>
                  <option value="female">خانم</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">آدرس (اختیاری)</Label>
              <Textarea id="address" rows={2} {...register("address")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">یادداشت (اختیاری)</Label>
              <Textarea id="notes" rows={3} {...register("notes")} />
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            انصراف
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "ذخیره مشتری"}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Loader2,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Wallet,
  Award,
  Edit,
  Save,
} from "lucide-react";
import { customerService, orderService } from "@/services";
import type { Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { TableLoading } from "@/components/common/loading";
import { EmptyState } from "@/components/common/empty-state";
import { JalaliDatePicker } from "@/components/common/jalali-date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatToman } from "@/lib/utils";
import { toJalali, toJalaliDateTime, fromJalali } from "@/lib/jalali";
import moment from "moment-jalaali";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

const schema = z.object({
  firstName: z.string().max(80).optional().or(z.literal("")),
  lastName: z.string().min(1).max(80),
  mobile: z.string().min(7).max(20),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(searchParams.get("edit") === "1");

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", params.id],
    queryFn: () => customerService.get(params.id),
    enabled: !!params.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["customer-stats", params.id],
    queryFn: () => customerService.getStats(params.id),
    enabled: !!params.id,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["customer-orders", params.id],
    queryFn: () => orderService.list({ customer: params.id, pageSize: 10 }),
    enabled: !!params.id,
  });

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      customerService.update(params.id, {
        firstName: values.firstName || undefined,
        lastName: values.lastName,
        mobile: values.mobile,
        phone: values.phone || undefined,
        address: values.address || undefined,
        birthDate: birthDateISO || undefined,
        gender: gender || undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("اطلاعات مشتری به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["customer", params.id] });
      setEditMode(false);
    },
  });

  // Local state for birth date (Jalali) and gender (select) — kept in sync
  // with the server-loaded customer via the `values` prop of useForm.
  const [birthDateJalali, setBirthDateJalali] = useState("");
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const birthDateISO = (() => {
    if (!birthDateJalali) return "";
    try {
      return fromJalali(birthDateJalali).toISOString();
    } catch {
      return "";
    }
  })();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: customer
      ? {
          firstName: customer.firstName || "",
          lastName: customer.lastName,
          mobile: customer.mobile,
          phone: customer.phone || "",
          address: customer.address || "",
          notes: customer.notes || "",
        }
      : undefined,
  });

  // Sync local birth date / gender state once the customer loads.
  // Using JSON.stringify to detect actual value changes, not reference changes.
  useEffect(() => {
    if (customer) {
      // Birth date
      if (customer.birthDate) {
        const m = moment(customer.birthDate);
        setBirthDateJalali(m.isValid() ? m.format("jYYYY/jMM/jDD") : "");
      } else {
        setBirthDateJalali("");
      }
      // Gender — explicitly check for valid values
      if (customer.gender === "male" || customer.gender === "female") {
        setGender(customer.gender);
      } else {
        setGender("");
      }
    }
  }, [customer?._id, customer?.gender, customer?.birthDate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="جزئیات مشتری" />
        <TableLoading />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <PageHeader title="جزئیات مشتری" />
        <EmptyState title="مشتری یافت نشد" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        description={`مشتری از ${toJalali(customer.createdAt)}`}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowRight className="size-4 ml-1" />
            بازگشت
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="تعداد سفارشات" value={formatNumber(stats?.totalOrders ?? customer.totalOrders)} icon={<ShoppingBag className="size-5" />} />
        <StatCard title="مجموع خرید" value={formatToman(stats?.totalRevenue ?? customer.totalSpending)} icon={<Wallet className="size-5" />} />
        <StatCard title="میانگین سفارش" value={formatToman(stats?.averageOrderValue ?? 0)} icon={<Award className="size-5" />} />
        <StatCard title="موجودی کیف پول" value={formatToman(customer.currentCashbackBalance)} icon={<Wallet className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info / Edit form */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>اطلاعات تماس</CardTitle>
            {!editMode ? (
              <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                <Edit className="size-4 ml-1" />
                ویرایش
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                انصراف
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editMode ? (
              <form onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
                <div className="space-y-2">
                  <Label>نام (اختیاری)</Label>
                  <Input {...form.register("firstName")} />
                  {form.formState.errors.firstName && <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>نام خانوادگی</Label>
                  <Input {...form.register("lastName")} />
                  {form.formState.errors.lastName && <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>موبایل</Label>
                  <Input dir="ltr" {...form.register("mobile")} />
                  {form.formState.errors.mobile && <p className="text-xs text-destructive">{form.formState.errors.mobile.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>تلفن</Label>
                  <Input dir="ltr" {...form.register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label>تاریخ تولد (اختیاری)</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowBirthDatePicker(!showBirthDatePicker)}
                    >
                      <Calendar className="size-4 ml-2" />
                      {birthDateJalali || "انتخاب تاریخ"}
                    </Button>
                    {showBirthDatePicker && (
                      <div className="absolute z-50 mt-1 left-0">
                        <JalaliDatePicker
                          value={birthDateJalali}
                          onChange={(v) => {
                            setBirthDateJalali(v);
                            setShowBirthDatePicker(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>جنسیت (اختیاری)</Label>
                  <Select
                    key={`gender-${gender}`}
                    value={gender}
                    onValueChange={(v) => setGender(v as "male" | "female")}
                  >
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">آقا</SelectItem>
                      <SelectItem value="female">خانم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>آدرس</Label>
                  <Textarea rows={2} {...form.register("address")} />
                </div>
                <div className="space-y-2">
                  <Label>یادداشت</Label>
                  <Textarea rows={2} {...form.register("notes")} />
                </div>
                <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                  {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 ml-1" />}
                  ذخیره تغییرات
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <span dir="ltr">{customer.mobile}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <span dir="ltr">{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-muted-foreground mt-0.5" />
                    <span>{customer.address}</span>
                  </div>
                )}
                {customer.birthDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>{toJalali(customer.birthDate)}</span>
                  </div>
                )}
                {customer.gender && (
                  <div className="flex items-center gap-2">
                    <Award className="size-4 text-muted-foreground" />
                    <span>{customer.gender === "male" ? "آقا" : "خانم"}</span>
                  </div>
                )}
                {customer.notes && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-1">یادداشت:</p>
                    <p>{customer.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order history */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>تاریخچه سفارشات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!ordersData?.items?.length ? (
              <EmptyState title="سفارشی برای این مشتری ثبت نشده است" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره سفارش</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead className="text-center">مبلغ</TableHead>
                    <TableHead className="text-left"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData.items.map((o) => (
                    <TableRow key={o._id}>
                      <TableCell className="font-medium" dir="ltr">{o.orderNumber}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{toJalaliDateTime(o.acceptedAt)}</TableCell>
                      <TableCell className="text-center">{formatToman(o.finalPrice)}</TableCell>
                      <TableCell className="text-left">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/orders/${o._id}`)}>
                          مشاهده
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

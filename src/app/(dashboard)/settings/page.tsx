"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Store, MessageSquare, Receipt, Gift, Upload, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { settingsService, loyaltyService } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { PageHelp } from "@/components/common/page-help";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveMediaUrl, cn } from "@/lib/utils";

const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

export default function SettingsPage() {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("business");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["business-settings"],
    queryFn: settingsService.get,
  });
  const { data: loyalty } = useQuery({
    queryKey: ["loyalty-settings"],
    queryFn: loyaltyService.getSettings,
  });

  const [businessForm, setBusinessForm] = useState({
    laundryName: "",
    ownerName: "",
    logo: "",
    phone: "",
    mobile: "",
    address: "",
    policies: "",
    maxDailyOrders: 0,
  });
  const [workingHours, setWorkingHours] = useState<Array<{ day: number; open: string; close: string; closed: boolean }>>([]);
  const [smsForm, setSmsForm] = useState<{ smsEnabled: boolean; smsProvider: string; smsSender: string; notifications: Record<string, boolean>; urgentMultiplier: number }>({
    smsEnabled: false, smsProvider: "", smsSender: "", notifications: {}, urgentMultiplier: 2,
  });
  const [receiptForm, setReceiptForm] = useState({
    showLogo: true,
    showQrCode: true,
    showBarcode: false,
    showBusinessPhone: true,
    showPolicies: true,
  });
  const [loyaltyForm, setLoyaltyForm] = useState({
    enabled: false,
    rewardType: "percentage" as "percentage" | "fixed",
    rewardValue: 0,
    minimumOrder: 0,
    maximumCashback: 0,
    expirationDays: 90,
    allowCombineWithDiscounts: true,
  });

  // Sync loaded data
  const [loaded, setLoaded] = useState(false);
  if (settings && !loaded) {
    setBusinessForm({
      laundryName: settings.laundryName || "",
      ownerName: settings.ownerName || "",
      logo: settings.logo || "",
      phone: settings.phone || "",
      mobile: settings.mobile || "",
      address: settings.address || "",
      policies: settings.policies || "",
      maxDailyOrders: (settings as { maxDailyOrders?: number }).maxDailyOrders ?? 0,
    });
    setWorkingHours(settings.workingHours?.length ? settings.workingHours : DAYS.map((_, i) => ({ day: i, open: "09:00", close: "21:00", closed: i === 6 })));
    setSmsForm({
      smsEnabled: settings.smsEnabled,
      smsProvider: settings.smsProvider || "",
      smsSender: settings.smsSender || "",
      notifications: {
        orderRegistered: !!settings.notifications?.orderRegistered,
        orderCompleted: !!settings.notifications?.orderCompleted,
        orderReady: !!settings.notifications?.orderReady,
        birthday: !!settings.notifications?.birthday,
      },
      urgentMultiplier: settings.urgentMultiplier ?? 2,
    });
    setReceiptForm({ ...settings.receipt });
    setLoaded(true);
  }
  if (loyalty && loyaltyForm.rewardValue === 0 && loyalty.rewardValue > 0) {
    setLoyaltyForm({
      enabled: loyalty.enabled,
      rewardType: loyalty.rewardType,
      rewardValue: loyalty.rewardValue,
      minimumOrder: loyalty.minimumOrder,
      maximumCashback: loyalty.maximumCashback,
      expirationDays: loyalty.expirationDays,
      allowCombineWithDiscounts: loyalty.allowCombineWithDiscounts,
    });
  }

  const saveBusiness = useMutation({
    mutationFn: () => settingsService.update({ ...businessForm, workingHours, urgentMultiplier: smsForm.urgentMultiplier, maxDailyOrders: businessForm.maxDailyOrders }),
    onSuccess: () => {
      toast.success("اطلاعات کسب‌وکار ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    },
  });
  const saveSms = useMutation({
    mutationFn: () => settingsService.update(smsForm),
    onSuccess: () => {
      toast.success("تنظیمات پیامک ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    },
  });
  const saveReceipt = useMutation({
    mutationFn: () => settingsService.update({ receipt: receiptForm }),
    onSuccess: () => {
      toast.success("تنظیمات قبض ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    },
  });
  const saveLoyalty = useMutation({
    mutationFn: () => loyaltyService.upsertSettings(loyaltyForm),
    onSuccess: () => {
      toast.success("تنظیمات وفاداری ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["loyalty-settings"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="تنظیمات" />
        <Card><CardContent className="h-96 animate-pulse bg-muted/30" /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="تنظیمات"
        description="پیکربندی کسب‌وکار، پیامک، قبض و وفاداری"
        actions={
          <PageHelp
            title="راهنمای تنظیمات"
            sections={[
              { title: "تب کسب‌وکار", body: "نام خشکشویی، لوگو، تلفن، موبایل، آدرس، قوانین (نمایش در قبض)، ساعات کاری و ضریب سفارش فوری را تنظیم کنید." },
              { title: "تب پیامک", body: "فعال/غیرفعال کردن ارسال پیامک و انتخاب رویدادهایی که می‌خواهید پیامک ارسال شود: ثبت سفارش، آماده تحویل، تولد مشتری. پیامک کش‌بک به‌طور خودکار هنگام تغییر وضعیت به «آماده تحویل» ارسال می‌شود، به شرطی که سیستم وفاداری فعال باشد." },
              { title: "تب قبض", body: "تعیین اینکه چه اطلاعاتی در قبض چاپ شود: لوگو، QR کد، بارکد، تلفن، قوانین." },
              { title: "تب وفاداری", body: "فعال‌سازی سیستم کش‌بک. تعیین نوع پاداش (درصدی یا مبلغ ثابت)، حداقل سفارش، حداکثر کش‌بک، مدت انقضا و امکان ترکیب با تخفیف." },
            ]}
          />
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid !flex !h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
          <TabsTrigger value="business" className="!h-auto py-2 text-xs sm:text-sm"><Store className="size-4 ml-1 shrink-0" /><span className="truncate">کسب‌وکار</span></TabsTrigger>
          <TabsTrigger value="sms" className="!h-auto py-2 text-xs sm:text-sm"><MessageSquare className="size-4 ml-1 shrink-0" /><span className="truncate">پیامک</span></TabsTrigger>
          <TabsTrigger value="receipt" className="!h-auto py-2 text-xs sm:text-sm"><Receipt className="size-4 ml-1 shrink-0" /><span className="truncate">قبض</span></TabsTrigger>
          <TabsTrigger value="loyalty" className="!h-auto py-2 text-xs sm:text-sm"><Gift className="size-4 ml-1 shrink-0" /><span className="truncate">وفاداری</span></TabsTrigger>
        </TabsList>

        {/* Business info */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>اطلاعات کسب‌وکار</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Laundry name (shown on receipts/invoices) */}
              <div className="space-y-2">
                <Label>نام خشکشویی</Label>
                <Input
                  value={businessForm.laundryName}
                  onChange={(e) => setBusinessForm({ ...businessForm, laundryName: e.target.value })}
                  placeholder="مثال: خشکشویی پاک‌شود"
                />
                <p className="text-xs text-muted-foreground">این نام در قبض و فاکتور نمایش داده می‌شود.</p>
              </div>
              <div className="space-y-2">
                <Label>نام صاحب خشکشویی</Label>
                <Input
                  value={businessForm.ownerName}
                  onChange={(e) => setBusinessForm({ ...businessForm, ownerName: e.target.value })}
                  placeholder="نام و نام خانوادگی صاحب خشکشویی"
                />
              </div>
              <div className="space-y-2">
                <Label>لوگو</Label>
                <div className="flex items-center gap-4">
                  {businessForm.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(businessForm.logo)}
                      alt="لوگو"
                      className="size-16 rounded-lg object-cover border"
                      onError={(e) => {
                        console.error("Logo failed to load:", businessForm.logo);
                        (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                      }}
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
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        // Upload to server
                        const formData = new FormData();
                        formData.append("logo", file);
                        try {
                          const api = (await import("@/lib/api")).default;
                          const res = await api.post("/uploads/logo", formData, {
                            headers: { "Content-Type": "multipart/form-data" },
                          });
                          setBusinessForm({ ...businessForm, logo: res.data.data.url });
                          toast.success("لوگو آپلود شد");
                        } catch {
                          toast.error("خطا در آپلود لوگو");
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                      <Upload className="size-4 ml-1" />
                      آپلود لوگو
                    </Button>
                    {businessForm.logo && (
                      <Button type="button" variant="ghost" size="sm" className="mr-2" onClick={() => setBusinessForm({ ...businessForm, logo: "" })}>
                        حذف
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>تلفن ثابت</Label>
                  <Input value={businessForm.phone} onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>موبایل</Label>
                  <Input value={businessForm.mobile} onChange={(e) => setBusinessForm({ ...businessForm, mobile: e.target.value })} dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>آدرس</Label>
                <Textarea rows={2} value={businessForm.address} onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>قوانین و مقررات (نمایش در قبض)</Label>
                <Textarea rows={4} value={businessForm.policies} onChange={(e) => setBusinessForm({ ...businessForm, policies: e.target.value })} />
              </div>
              {/* Urgent multiplier */}
              <div className="space-y-2">
                <Label>ضریب سفارش فوری</Label>
                <Input
                  type="number"
                  min={1}
                  step={0.1}
                  value={smsForm.urgentMultiplier ?? 2}
                  onChange={(e) => setSmsForm({ ...smsForm, urgentMultiplier: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">مبلغ سفارش فوری در این ضریب ضرب می‌شود (پیش‌فرض: ۲)</p>
              </div>

              {/* Daily order limits */}
              <div className="space-y-2">
                <Label>حداکثر سفارش روزانه</Label>
                <Input
                  type="number"
                  min={0}
                  value={businessForm.maxDailyOrders ?? 0}
                  onChange={(e) => setBusinessForm({ ...businessForm, maxDailyOrders: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  ۰ یعنی بدون محدودیت. وقتی عددی تنظیم شود، روزهایی که ظرفیتشان تکمیل شده در تقویم با رنگ قرمز
                  نمایش داده می‌شوند. این محدودیت فقط هشدار است و ثبت سفارش را مسدود نمی‌کند.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>ساعات کاری</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {workingHours.map((wh, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-lg border p-2.5 sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:p-0"
                >
                  <div className="flex items-center justify-between gap-2 sm:w-20 sm:shrink-0">
                    <span className="text-sm font-medium">{DAYS[wh.day]}</span>
                    {/* On mobile, put the switch here so it doesn't overflow */}
                    <div className="flex items-center gap-1.5 sm:hidden">
                      <Switch
                        checked={!wh.closed}
                        onCheckedChange={(v) => setWorkingHours(workingHours.map((w, i) => i === idx ? { ...w, closed: !v } : w))}
                      />
                      <Label className="text-xs text-muted-foreground">{wh.closed ? "تعطیل" : "باز"}</Label>
                    </div>
                  </div>
                  <div className={cn("flex items-center gap-2", wh.closed && "opacity-50")}>
                    <Input
                      type="time"
                      value={wh.open}
                      onChange={(e) => setWorkingHours(workingHours.map((w, i) => i === idx ? { ...w, open: e.target.value } : w))}
                      className="w-full sm:w-32"
                      disabled={wh.closed}
                    />
                    <span className="text-muted-foreground shrink-0">تا</span>
                    <Input
                      type="time"
                      value={wh.close}
                      onChange={(e) => setWorkingHours(workingHours.map((w, i) => i === idx ? { ...w, close: e.target.value } : w))}
                      className="w-full sm:w-32"
                      disabled={wh.closed}
                    />
                  </div>
                  {/* Switch on desktop only */}
                  <div className="hidden items-center gap-2 sm:flex">
                    <Switch
                      checked={!wh.closed}
                      onCheckedChange={(v) => setWorkingHours(workingHours.map((w, i) => i === idx ? { ...w, closed: !v } : w))}
                    />
                    <Label className="text-xs text-muted-foreground">{wh.closed ? "تعطیل" : "باز"}</Label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => saveBusiness.mutate()} disabled={saveBusiness.isPending}>
              {saveBusiness.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 ml-1" />}
              ذخیره
            </Button>
          </div>
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>تنظیمات پیامک</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Switch checked={smsForm.smsEnabled} onCheckedChange={(v) => setSmsForm({ ...smsForm, smsEnabled: v })} id="smsEnabled" />
                <Label htmlFor="smsEnabled">فعال‌سازی ارسال پیامک</Label>
              </div>
              {/* Notification toggles */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">رویدادهای اطلاع‌رسانی</p>
                <div className="space-y-2 rounded-lg border p-3">
                  {[
                    { key: 'orderRegistered', label: 'ثبت سفارش' },
                    { key: 'orderReady', label: 'آماده تحویل' },
                    { key: 'birthday', label: 'تولد مشتری' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label htmlFor={item.key} className="text-sm cursor-pointer">{item.label}</Label>
                      <Switch
                        id={item.key}
                        checked={!!(smsForm.notifications as Record<string, boolean>)?.[item.key]}
                        onCheckedChange={(v) => setSmsForm({
                          ...smsForm,
                          notifications: { ...smsForm.notifications, [item.key]: v },
                        })}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">برای هر رویداد، پیامک به‌صورت خودکار به مشتری ارسال می‌شود.</p>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => saveSms.mutate()} disabled={saveSms.isPending}>
              {saveSms.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 ml-1" />}
              ذخیره
            </Button>
          </div>
        </TabsContent>

        {/* Receipt */}
        <TabsContent value="receipt" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>نمایش در قبض</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "showLogo", label: "نمایش لوگو" },
                { key: "showQrCode", label: "نمایش QR کد" },
                { key: "showBarcode", label: "نمایش بارکد" },
                { key: "showBusinessPhone", label: "نمایش تلفن کسب‌وکار" },
                { key: "showPolicies", label: "نمایش قوانین و مقررات" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor={item.key}>{item.label}</Label>
                  <Switch
                    id={item.key}
                    checked={(receiptForm as never)[item.key]}
                    onCheckedChange={(v) => setReceiptForm({ ...receiptForm, [item.key]: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => saveReceipt.mutate()} disabled={saveReceipt.isPending}>
              {saveReceipt.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 ml-1" />}
              ذخیره
            </Button>
          </div>
        </TabsContent>

        {/* Loyalty */}
        <TabsContent value="loyalty" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>تنظیمات وفاداری و کش‌بک</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Switch checked={loyaltyForm.enabled} onCheckedChange={(v) => setLoyaltyForm({ ...loyaltyForm, enabled: v })} id="loyaltyEnabled" />
                <Label htmlFor="loyaltyEnabled">فعال‌سازی سیستم وفاداری</Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>نوع پاداش</Label>
                  <Select value={loyaltyForm.rewardType} onValueChange={(v) => setLoyaltyForm({ ...loyaltyForm, rewardType: v as "percentage" | "fixed" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">درصدی</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>مقدار پاداش ({loyaltyForm.rewardType === "percentage" ? "درصد" : "تومان"})</Label>
                  <Input
                    type="number"
                    min={0}
                    value={loyaltyForm.rewardValue}
                    onChange={(e) => setLoyaltyForm({ ...loyaltyForm, rewardValue: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>حداقل مبلغ سفارش</Label>
                  <Input
                    type="number"
                    min={0}
                    value={loyaltyForm.minimumOrder}
                    onChange={(e) => setLoyaltyForm({ ...loyaltyForm, minimumOrder: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>حداکثر کش‌بک</Label>
                  <Input
                    type="number"
                    min={0}
                    value={loyaltyForm.maximumCashback}
                    onChange={(e) => setLoyaltyForm({ ...loyaltyForm, maximumCashback: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>مدت انقضا (روز)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={loyaltyForm.expirationDays}
                    onChange={(e) => setLoyaltyForm({ ...loyaltyForm, expirationDays: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Switch
                    checked={loyaltyForm.allowCombineWithDiscounts}
                    onCheckedChange={(v) => setLoyaltyForm({ ...loyaltyForm, allowCombineWithDiscounts: v })}
                    id="combine"
                  />
                  <Label htmlFor="combine">اجازه ترکیب با تخفیف</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => saveLoyalty.mutate()} disabled={saveLoyalty.isPending}>
              {saveLoyalty.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 ml-1" />}
              ذخیره
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

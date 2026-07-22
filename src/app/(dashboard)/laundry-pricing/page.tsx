"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tags, Save, Loader2, Edit2, Check, X, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { pricingService, catalogService, customGarmentService } from "@/services";
import type { GarmentType, ServiceType, Pricing } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { PageHelp } from "@/components/common/page-help";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TableLoading } from "@/components/common/loading";
import { EmptyState } from "@/components/common/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { CatalogIcon } from "@/components/common/catalog-icon";
import { formatToman, toPersianDigits, cn } from "@/lib/utils";
import type { CombinedGarmentType } from "@/services";

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<{
    garment: string;
    garmentTitle: string;
    service: string;
    serviceTitle: string;
    price: number;
    duration: number;
    active: boolean;
    existingId?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [newCustomGarment, setNewCustomGarment] = useState({ title: "", description: "" });
  const [deleteCustomId, setDeleteCustomId] = useState<string | null>(null);

  // Only fetch active catalogs (inactive ones shouldn't be shown to laundry)
  const { data: garments } = useQuery({
    queryKey: ["garments", "active"],
    queryFn: () => catalogService.garmentTypes.list({ pageSize: 100, active: true }),
  });
  const { data: customGarments } = useQuery({
    queryKey: ["combined-garments"],
    queryFn: () => customGarmentService.list(),
  });
  const { data: services } = useQuery({
    queryKey: ["services", "active"],
    queryFn: () => catalogService.serviceTypes.list({ pageSize: 100, active: true }),
  });
  const { data: pricingData, isLoading } = useQuery({
    queryKey: ["pricing-all"],
    queryFn: () => pricingService.list({ pageSize: 500 }),
  });

  // Combined list: global + custom (custom marked with a star)
  const garmentsList: (GarmentType & { isCustom?: boolean })[] = useMemo(() => {
    const globals = (garments?.items || []).map((g: GarmentType) => ({ ...g, isCustom: false }));
    const customs = (customGarments || []).filter((g: CombinedGarmentType) => g.isCustom).map((g: CombinedGarmentType) => ({
      _id: g._id,
      title: g.title,
      slug: g.slug,
      isCustom: true,
      active: true,
    } as unknown as GarmentType & { isCustom: boolean }));
    return [...globals, ...customs];
  }, [garments, customGarments]);
  const servicesList = services?.items || [];

  // Set default tab when data loads
  if (garmentsList.length > 0 && !activeTab) {
    setActiveTab(garmentsList[0]._id);
  }

  // Create custom garment type
  const createCustomMutation = useMutation({
    mutationFn: () => customGarmentService.create({
      title: newCustomGarment.title,
      description: newCustomGarment.description || undefined,
    }),
    onSuccess: () => {
      toast.success("نوع لباس اختصاصی ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["combined-garments"] });
      setShowCustomDialog(false);
      setNewCustomGarment({ title: "", description: "" });
    },
    onError: () => toast.error("خطا در ایجاد نوع لباس"),
  });

  // Delete custom garment type
  const deleteCustomMutation = useMutation({
    mutationFn: (id: string) => customGarmentService.delete(id),
    onSuccess: () => {
      toast.success("نوع لباس اختصاصی حذف شد");
      queryClient.invalidateQueries({ queryKey: ["combined-garments"] });
      queryClient.invalidateQueries({ queryKey: ["pricing-all"] });
      setDeleteCustomId(null);
      // If we deleted the active tab, switch to first one
      if (garmentsList.length > 1 && garmentsList[0]._id === activeTab) {
        setActiveTab(garmentsList[1]._id);
      }
    },
  });

  const priceMap = useMemo(() => {
    const map = new Map<string, Pricing>();
    (pricingData?.items || []).forEach((p) => {
      const g = typeof p.garmentType === "object" ? p.garmentType._id : p.garmentType;
      const s = typeof p.serviceType === "object" ? p.serviceType._id : p.serviceType;
      map.set(`${g}-${s}`, p);
    });
    return map;
  }, [pricingData]);

  const saveMutation = useMutation({
    mutationFn: async (data: {
      garmentType: string;
      serviceType: string;
      price: number;
      estimatedDuration: number;
      active: boolean;
      existingId?: string;
    }) => {
      if (data.existingId) {
        return pricingService.update(data.existingId, {
          price: data.price,
          estimatedDuration: data.estimatedDuration,
          active: data.active,
        });
      } else {
        return pricingService.create({
          garmentType: data.garmentType,
          serviceType: data.serviceType,
          price: data.price,
          estimatedDuration: data.estimatedDuration,
          active: data.active,
        });
      }
    },
    onSuccess: () => {
      toast.success("قیمت ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["pricing-all"] });
      setEditing(null);
    },
    onError: () => {
      toast.error("خطا در ذخیره قیمت");
    },
  });

  function onSave() {
    if (!editing) return;
    if (editing.price < 0) {
      toast.error("قیمت معتبر نیست");
      return;
    }
    saveMutation.mutate({
      garmentType: editing.garment,
      serviceType: editing.service,
      price: editing.price,
      estimatedDuration: editing.duration,
      active: editing.active,
      existingId: editing.existingId,
    });
  }

  // Stats
  const totalPrices = priceMap.size;
  const activePrices = Array.from(priceMap.values()).filter((p) => p.active).length;
  const totalSlots = garmentsList.length * servicesList.length;
  const coverage = totalSlots > 0 ? Math.round((totalPrices / totalSlots) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="قیمت‌گذاری"
        description="قیمت هر خدمت برای هر نوع لباس را تعیین کنید"
        actions={
          <PageHelp
            title="راهنمای قیمت‌گذاری"
            sections={[
              { title: "ماتریس قیمت", body: "در این صفحه قیمت هر خدمت (شستشو، اتوکشی، خشک‌شویی) برای هر نوع لباس را تعیین کنید. روی هر سلول کلیک کنید تا قیمت را وارد کنید." },
              { title: "انواع لباس اختصاصی", body: "می‌توانید انواع لباس مخصوص خشکشویی خود را اضافه کنید که فقط برای شما نمایش داده می‌شوند." },
              { title: "قیمت دستی", body: "اگر برای ترکیبی قیمت تعریف نشده، هنگام ثبت سفارش می‌توانید قیمت دستی وارد کنید." },
              { title: "پوشش قیمت‌گذاری", body: "نشان می‌دهد چند درصد از ترکیب لباس-خدمت قیمت‌گذاری شده است." },
            ]}
          />
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">پوشش قیمت‌گذاری</p>
            <p className="mt-1 text-2xl font-bold">{toPersianDigits(coverage)}٪</p>
            <p className="text-xs text-muted-foreground">{toPersianDigits(totalPrices)} از {toPersianDigits(totalSlots)} ترکیب</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">قیمت‌های فعال</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{toPersianDigits(activePrices)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">قیمت‌های غیرفعال</p>
            <p className="mt-1 text-2xl font-bold text-muted-foreground">{toPersianDigits(totalPrices - activePrices)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Custom garment management */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <h3 className="font-semibold">انواع لباس اختصاصی</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                انواع لباس مخصوص کسب‌وکار خود را اضافه کنید.
              </p>
            </div>
            <Button onClick={() => setShowCustomDialog(true)} className="w-full sm:w-auto shrink-0">
              <Plus className="size-4 ml-1" />
              نوع لباس جدید
            </Button>
          </div>
          {(customGarments || []).filter((g: CombinedGarmentType) => g.isCustom).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(customGarments || []).filter((g: CombinedGarmentType) => g.isCustom).map((g: CombinedGarmentType) => (
                <div key={g._id} className="flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm">
                  <CatalogIcon icon={g.icon} image={g.image} size={14} className="text-primary ml-1" />
                  <span className="font-medium">{g.title}</span>
                  <span className="text-xs text-muted-foreground">★ اختصاصی</span>
                  <button
                    type="button"
                    className="mr-1 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteCustomId(g._id)}
                    title="حذف"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card><CardContent className="p-4"><TableLoading /></CardContent></Card>
      ) : !garmentsList.length || !servicesList.length ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Tags}
              title="کاتالوگ‌ها هنوز تعریف نشده‌اند"
              description="مدیر سامانه باید ابتدا انواع لباس و خدمات را در کاتالوگ‌ها ایجاد کند."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Garment type selector — wraps naturally on all screen sizes */}
          <div className="flex flex-wrap gap-2">
            {garmentsList.map((g: GarmentType & { isCustom?: boolean; icon?: string; image?: string }) => {
              const pricedCount = servicesList.filter((s: ServiceType) => priceMap.has(`${g._id}-${s._id}`)).length;
              const isActive = activeTab === g._id;
              return (
                <button
                  key={g._id}
                  type="button"
                  onClick={() => setActiveTab(g._id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-accent",
                  )}
                >
                  <CatalogIcon
                    icon={g.icon}
                    image={g.image}
                    size={14}
                    className={isActive ? "opacity-90" : "opacity-70"}
                  />
                  <span className="whitespace-nowrap">{g.title}</span>
                  {g.isCustom && <span className="text-xs opacity-60" title="اختصاصی">★</span>}
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs",
                    pricedCount === servicesList.length
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30"
                      : pricedCount > 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30"
                      : "bg-muted text-muted-foreground",
                    isActive && "bg-background/20 text-primary-foreground"
                  )}>
                    {toPersianDigits(pricedCount)}/{toPersianDigits(servicesList.length)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Service prices for selected garment */}
          {activeTab && (() => {
            const selectedGarment = garmentsList.find((g) => g._id === activeTab);
            if (!selectedGarment) return null;
            return (
              <Card>
                <CardContent className="p-0">
                  <div className="border-b p-4">
                    <h3 className="font-semibold">قیمت‌گذاری: {selectedGarment.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      برای هر خدمت، قیمت را تعیین کنید. می‌توانید خدمتی را با سوییچ فعال/غیرفعال کنید.
                    </p>
                  </div>
                  <div className="divide-y">
                    {servicesList.map((s: ServiceType) => {
                      const p = priceMap.get(`${selectedGarment._id}-${s._id}`);
                      const isPriced = !!p;
                      const isActive = p?.active ?? true;

                      return (
                        <div
                          key={s._id}
                          className="flex flex-col gap-2 p-3 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                        >
                          {/* Left: icon + title — click to edit */}
                          <button
                            type="button"
                            className="flex items-center gap-3 flex-1 text-right min-w-0"
                            onClick={() => setEditing({
                              garment: selectedGarment._id,
                              garmentTitle: selectedGarment.title,
                              service: s._id,
                              serviceTitle: s.title,
                              price: p?.price ?? 0,
                              duration: p?.estimatedDuration ?? 1440,
                              active: p?.active ?? true,
                              existingId: p?._id,
                            })}
                          >
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                              <CatalogIcon icon={s.icon} image={s.image} size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className={cn("font-medium", !isActive && "text-muted-foreground line-through")}>{s.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {p ? `مدت: ${toPersianDigits(p.estimatedDuration)} دقیقه` : "قیمت تعیین نشده"}
                              </p>
                            </div>
                          </button>

                          {/* Right: price + switch + edit — wraps on mobile */}
                          <div className="flex items-center gap-2 justify-between sm:gap-3 sm:justify-end pl-13 sm:pl-0">
                            {isPriced ? (
                              <span className={cn("font-medium text-sm", !isActive && "text-muted-foreground")}>
                                {formatToman(p.price)}
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditing({
                                  garment: selectedGarment._id,
                                  garmentTitle: selectedGarment.title,
                                  service: s._id,
                                  serviceTitle: s.title,
                                  price: 0,
                                  duration: 1440,
                                  active: true,
                                  existingId: undefined,
                                })}
                              >
                                <Plus className="size-4 ml-1" />
                                تعیین قیمت
                              </Button>
                            )}

                            {/* Active/Inactive switch — ALWAYS shown (even without price) */}
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className={cn("text-xs whitespace-nowrap", isActive ? "text-emerald-600" : "text-muted-foreground")}>
                                {isActive ? "فعال" : "غیرفعال"}
                              </span>
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => {
                                  if (isPriced) {
                                    // Toggle existing pricing record
                                    pricingService.update(p!._id, { active: checked }).then(() => {
                                      toast.success(checked ? "خدمت فعال شد" : "خدمت غیرفعال شد");
                                      queryClient.invalidateQueries({ queryKey: ["pricing-all"] });
                                    }).catch(() => toast.error("خطا در تغییر وضعیت"));
                                  } else {
                                    // No pricing record yet — create one with price=0 and active=false
                                    pricingService.create({
                                      garmentType: selectedGarment._id,
                                      serviceType: s._id,
                                      price: 0,
                                      estimatedDuration: 1440,
                                      active: checked,
                                    }).then(() => {
                                      toast.success(checked ? "خدمت فعال شد" : "خدمت غیرفعال شد");
                                      queryClient.invalidateQueries({ queryKey: ["pricing-all"] });
                                    }).catch(() => toast.error("خطا در تغییر وضعیت"));
                                  }
                                }}
                              />
                            </div>

                            {/* Edit button — only if priced */}
                            {isPriced && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                onClick={() => setEditing({
                                  garment: selectedGarment._id,
                                  garmentTitle: selectedGarment.title,
                                  service: s._id,
                                  serviceTitle: s.title,
                                  price: p?.price ?? 0,
                                  duration: p?.estimatedDuration ?? 1440,
                                  active: p?.active ?? true,
                                  existingId: p?._id,
                                })}
                              >
                                <Edit2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>قیمت‌گذاری</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">لباس: </span>
                <span className="font-medium">{editing.garmentTitle}</span>
                <span className="mx-2 text-muted-foreground">|</span>
                <span className="text-muted-foreground">خدمت: </span>
                <span className="font-medium">{editing.serviceTitle}</span>
              </div>
              <div className="space-y-2">
                <Label>قیمت (تومان)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">{formatToman(editing.price)}</p>
              </div>
              <div className="space-y-2">
                <Label>مدت زمان تخمینی (دقیقه)</Label>
                <Input
                  type="number"
                  min={1}
                  value={editing.duration}
                  onChange={(e) => setEditing({ ...editing, duration: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  {toPersianDigits(editing.duration)} دقیقه ≈ {toPersianDigits(Math.round(editing.duration / 60))} ساعت
                </p>
              </div>
              {/* Active/Inactive toggle is in the list, not here */}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>انصراف</Button>
            <Button onClick={onSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 ml-1" />}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create custom garment dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن نوع لباس اختصاصی</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input
                value={newCustomGarment.title}
                onChange={(e) => setNewCustomGarment({ ...newCustomGarment, title: e.target.value })}
                placeholder="مثال: لباس عروس، کتوش معماری، ..."
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات (اختیاری)</Label>
              <Input
                value={newCustomGarment.description}
                onChange={(e) => setNewCustomGarment({ ...newCustomGarment, description: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              این نوع لباس فقط برای کسب‌وکار شما نمایش داده می‌شود و در کاتالوگ عمومی سامانه قرار نمی‌گیرد.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)}>انصراف</Button>
            <Button
              onClick={() => createCustomMutation.mutate()}
              disabled={!newCustomGarment.title.trim() || createCustomMutation.isPending}
            >
              {createCustomMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4 ml-1" />}
              افزودن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete custom garment confirmation */}
      <ConfirmDialog
        open={!!deleteCustomId}
        onOpenChange={(o) => !o && setDeleteCustomId(null)}
        title="حذف نوع لباس اختصاصی"
        description="آیا از حذف این نوع لباس اطمینان دارید؟ قیمت‌گذاری‌های مرتبط نیز حذف خواهند شد."
        confirmText="حذف"
        onConfirm={() => {
          if (deleteCustomId) deleteCustomMutation.mutate(deleteCustomId);
        }}
        loading={deleteCustomMutation.isPending}
      />
    </div>
  );
}

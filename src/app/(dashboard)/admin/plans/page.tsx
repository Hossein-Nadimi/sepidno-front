"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Plus, Edit2, Trash2, Loader2, Save } from "lucide-react";
import { adminService } from "@/services";
import type { SubscriptionPlan } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { PriceInput } from "@/components/common/price-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatToman, toPersianDigits } from "@/lib/utils";
import toast from "react-hot-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EMPTY_PLAN: any = {
  name: "",
  tagline: "",
  description: "",
  monthlyOriginalPrice: 0,
  quarterlyOriginalPrice: 0,
  semiAnnualOriginalPrice: 0,
  annualOriginalPrice: 0,
  monthlyPrice: 0,
  quarterlyPrice: 0,
  semiAnnualPrice: 0,
  annualPrice: 0,
  duration: 30,
  features: [],
  monthlySmsQuota: 0,
  availableFeatures: [],
  isActive: true,
  isComingSoon: false,
  sortOrder: 0,
};

const PERIODS = [
  { key: "monthly", label: "ماهانه", priceKey: "monthlyPrice", originalKey: "monthlyOriginalPrice" },
  { key: "quarterly", label: "سه ماهه", priceKey: "quarterlyPrice", originalKey: "quarterlyOriginalPrice" },
  { key: "semiAnnual", label: "شش ماهه", priceKey: "semiAnnualPrice", originalKey: "semiAnnualOriginalPrice" },
  { key: "annual", label: "سالانه", priceKey: "annualPrice", originalKey: "annualOriginalPrice" },
];

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => adminService.plans.list({ pageSize: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminService.plans.create(payload),
    onSuccess: () => {
      toast.success("پلن ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      setEditing(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      adminService.plans.update(id, payload),
    onSuccess: () => {
      toast.success("پلن به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.plans.delete(id),
    onSuccess: () => {
      toast.success("پلن حذف شد");
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      setDeleteTarget(null);
    },
  });

  function openCreate() {
    setEditing({ ...EMPTY_PLAN });
    setFeaturesText("");
  }

  function openEdit(plan: SubscriptionPlan) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEditing({ ...plan } as any);
    setFeaturesText((plan.features || []).join("\n"));
  }

  function handleSave() {
    if (!editing) return;
    if (!editing.name?.trim()) {
      toast.error("نام پلن الزامی است");
      return;
    }
    const payload = {
      ...editing,
      features: featuresText.split("\n").map((s: string) => s.trim()).filter(Boolean),
    };
    if (editing._id) {
      updateMutation.mutate({ id: editing._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const plans = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="پلن‌های اشتراک"
        description="مدیریت طرح‌های اشتراک پلتفرم"
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4 ml-1" />
            پلن جدید
          </Button>
        }
      />

      {isLoading ? (
        <TableLoading />
      ) : plans.length === 0 ? (
        <EmptyState icon={Crown} title="پلنی ثبت نشده است" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = plan as any;
            return (
              <Card key={p._id}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{p.name}</h3>
                      {p.tagline && <Badge className="mt-1">{p.tagline}</Badge>}
                      {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                    </div>
                    <Badge variant={p.isActive ? "default" : p.isComingSoon ? "secondary" : "destructive"}>
                      {p.isComingSoon ? "به‌زودی" : p.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>

                  {/* Show all period prices */}
                  <div className="mb-4 space-y-1.5">
                    {PERIODS.map((per) => {
                      const price = p[per.priceKey] || 0;
                      const original = p[per.originalKey] || 0;
                      const discount = original > 0 && original !== price
                        ? Math.round((1 - price / original) * 100) : 0;
                      return (
                        <div key={per.key} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{per.label}</span>
                          <div className="flex items-center gap-2">
                            {original > 0 && original !== price && (
                              <span className="text-xs text-muted-foreground line-through">
                                {toPersianDigits(original.toLocaleString("en-US"))}
                              </span>
                            )}
                            <span className="font-medium">
                              {price === 0 ? "رایگان" : formatToman(price)}
                            </span>
                            {discount > 0 && (
                              <Badge variant="destructive" className="text-xs">٪{toPersianDigits(discount)}</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mb-4 space-y-1 text-sm text-muted-foreground">
                    <p>• مدت: {toPersianDigits(p.duration)} روز</p>
                    <p>• اعتبار پیامکی: {toPersianDigits(p.monthlySmsQuota)}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                      <Edit2 className="size-4 ml-1" />
                      ویرایش
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(p)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog — with original + discount prices for all periods */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?._id ? "ویرایش پلن" : "پلن جدید"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>نام پلن</Label>
                  <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>عنوان کوتاه (Tagline)</Label>
                  <Input value={editing.tagline || ""} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} placeholder="مثال: محبوب‌ترین، به‌زودی" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>توضیحات</Label>
                <Textarea rows={2} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>

              {/* Price table: original + discount for each period */}
              <div className="space-y-2">
                <Label>قیمت‌ها (اصل و تخفیف‌دار)</Label>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="p-2 text-right">دوره</th>
                        <th className="p-2 text-center">قیمت اصلی</th>
                        <th className="p-2 text-center">قیمت تخفیف‌دار</th>
                        <th className="p-2 text-center">٪ تخفیف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PERIODS.map((per) => {
                        const price = editing[per.priceKey] || 0;
                        const original = editing[per.originalKey] || 0;
                        const discount = original > 0 && original !== price
                          ? Math.round((1 - price / original) * 100) : 0;
                        return (
                          <tr key={per.key} className="border-b">
                            <td className="p-2 font-medium">{per.label}</td>
                            <td className="p-2">
                              <PriceInput
                                className="h-8 w-32"
                                value={original}
                                onChange={(v) => setEditing({ ...editing, [per.originalKey]: v })}
                              />
                            </td>
                            <td className="p-2">
                              <PriceInput
                                className="h-8 w-32"
                                value={price}
                                onChange={(v) => setEditing({ ...editing, [per.priceKey]: v })}
                              />
                            </td>
                            <td className="p-2 text-center">
                              {discount > 0 ? (
                                <Badge variant="destructive">٪{toPersianDigits(discount)}</Badge>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">درصد تخفیف خودکار محاسبه می‌شود. اگر قیمت اصلی و تخفیف‌دار برابر باشند، تخفیف صفر است.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>مدت (روز)</Label>
                  <Input type="number" min={1} value={editing.duration ?? 30}
                    onChange={(e) => setEditing({ ...editing, duration: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>اعتبار پیامکی</Label>
                  <Input type="number" min={0} value={editing.monthlySmsQuota ?? 0}
                    onChange={(e) => setEditing({ ...editing, monthlySmsQuota: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>ترتیب نمایش</Label>
                  <Input type="number" min={0} value={editing.sortOrder ?? 0}
                    onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>امکانات (هر خط یک مورد)</Label>
                <Textarea rows={4} value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder={"مثال:\nمدیریت سفارشات\nمدیریت مشتریان"} />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Switch checked={!!editing.isActive} onCheckedChange={(v) => setEditing({ ...editing, isActive: v })} id="planActive" />
                  <Label htmlFor="planActive">پلن فعال</Label>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Switch checked={!!editing.isComingSoon} onCheckedChange={(v) => setEditing({ ...editing, isComingSoon: v })} id="planComingSoon" />
                  <Label htmlFor="planComingSoon">به‌زودی</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>انصراف</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 ml-1" />}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="حذف پلن"
        description={`آیا از حذف پلن «${deleteTarget?.name}» اطمینان دارید؟`}
        confirmText="حذف"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget._id); }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

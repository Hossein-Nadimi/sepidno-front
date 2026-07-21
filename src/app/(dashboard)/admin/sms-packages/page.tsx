"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Edit2, Trash2, Loader2, Save } from "lucide-react";
import { adminService } from "@/services";
import type { SmsPackage } from "@/types";
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

const EMPTY: Partial<SmsPackage> = {
  title: "",
  description: "",
  smsCount: 100,
  price: 0,
  expireDays: 0,
  active: true,
  displayOrder: 0,
};

export default function AdminSmsPackagesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<SmsPackage> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SmsPackage | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sms-packages"],
    queryFn: () => adminService.smsPackagesAdmin.list({ pageSize: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<SmsPackage>) => adminService.smsPackagesAdmin.create(payload),
    onSuccess: () => {
      toast.success("بسته ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["admin-sms-packages"] });
      setEditing(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SmsPackage> }) =>
      adminService.smsPackagesAdmin.update(id, payload),
    onSuccess: () => {
      toast.success("بسته به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["admin-sms-packages"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.smsPackagesAdmin.delete(id),
    onSuccess: () => {
      toast.success("بسته حذف شد");
      queryClient.invalidateQueries({ queryKey: ["admin-sms-packages"] });
      setDeleteTarget(null);
    },
  });

  function handleSave() {
    if (!editing) return;
    if (!editing.title?.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    if (editing._id) {
      updateMutation.mutate({ id: editing._id, payload: editing });
    } else {
      createMutation.mutate(editing);
    }
  }

  const packages = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="بسته‌های پیامک"
        description="مدیریت بسته‌های پیامک قابل خرید توسط بیزینس‌ها"
        actions={
          <Button onClick={() => setEditing({ ...EMPTY })}>
            <Plus className="size-4 ml-1" />
            بسته جدید
          </Button>
        }
      />

      {isLoading ? (
        <TableLoading />
      ) : packages.length === 0 ? (
        <EmptyState icon={Package} title="بسته‌ای ثبت نشده است" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg._id}>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{pkg.title}</h3>
                    {pkg.description && <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>}
                  </div>
                  <Badge variant={pkg.active ? "default" : "secondary"}>
                    {pkg.active ? "فعال" : "غیرفعال"}
                  </Badge>
                </div>
                <div className="mb-4 text-center">
                  <p className="text-3xl font-bold text-primary">{toPersianDigits(pkg.smsCount)}</p>
                  <p className="text-sm text-muted-foreground">پیامک</p>
                  <p className="mt-2 text-lg font-medium">{formatToman(pkg.price)}</p>
                  {pkg.expireDays > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">اعتبار: {toPersianDigits(pkg.expireDays)} روز</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing({ ...pkg })}>
                    <Edit2 className="size-4 ml-1" />
                    ویرایش
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(pkg)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?._id ? "ویرایش بسته" : "بسته جدید"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>عنوان</Label>
                <Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>توضیحات</Label>
                <Textarea rows={2} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>تعداد پیامک</Label>
                  <Input type="number" min={1} value={editing.smsCount ?? 100} onChange={(e) => setEditing({ ...editing, smsCount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>قیمت (تومان)</Label>
                  <PriceInput value={editing.price ?? 0} onChange={(v) => setEditing({ ...editing, price: v })} />
                </div>
                <div className="space-y-2">
                  <Label>مدت اعتبار (روز — ۰ یعنی نامحدود)</Label>
                  <Input type="number" min={0} value={editing.expireDays ?? 0} onChange={(e) => setEditing({ ...editing, expireDays: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>ترتیب نمایش</Label>
                  <Input type="number" min={0} value={editing.displayOrder ?? 0} onChange={(e) => setEditing({ ...editing, displayOrder: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Switch checked={!!editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} id="pkgActive" />
                <Label htmlFor="pkgActive">بسته فعال</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>انصراف</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4 ml-1" />
              )}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="حذف بسته"
        description={`آیا از حذف بسته «${deleteTarget?.title}» اطمینان دارید؟`}
        confirmText="حذف"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget._id); }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

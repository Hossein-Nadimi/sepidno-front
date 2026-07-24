"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Edit2, Trash2, Loader2, Save, Upload } from "lucide-react";
import { adminService } from "@/services";
import type { CatalogItem } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { CatalogIcon } from "@/components/common/catalog-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toPersianDigits, resolveMediaUrl } from "@/lib/utils";
import { toJalaliDateTime } from "@/lib/jalali";
import toast from "react-hot-toast";

const CATALOGS = [
  { key: "garment-types", label: "انواع لباس", hasIcon: true, hasCategory: true },
  { key: "service-types", label: "انواع خدمت", hasIcon: true },
  { key: "fabric-types", label: "انواع پارچه", hasIcon: true },
  { key: "colors", label: "رنگ‌ها", hasIcon: false },
  { key: "inventory-item-types", label: "انواع اقلام انبار", hasIcon: true },
  { key: "order-statuses", label: "وضعیت‌های سفارش", hasIcon: false },
  { key: "sms-templates", label: "قالب‌های پیامک", hasIcon: false },
  { key: "receipt-templates", label: "قالب‌های قبض", hasIcon: false },
];

interface EditState {
  id?: string;
  title: string;
  description: string;
  icon: string;
  image: string;
  category: string;
  displayOrder: number;
  active: boolean;
  extra: Record<string, string>;
}

export default function AdminCatalogsPage() {
  const queryClient = useQueryClient();
  const [activeCatalog, setActiveCatalog] = useState(CATALOGS[0].key);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-catalog", activeCatalog],
    queryFn: () => adminService.catalogs.list(activeCatalog, { pageSize: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminService.catalogs.create(activeCatalog, payload),
    onSuccess: () => {
      toast.success("آیتم ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["admin-catalog", activeCatalog] });
      setEditing(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      adminService.catalogs.update(activeCatalog, id, payload),
    onSuccess: () => {
      toast.success("آیتم به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["admin-catalog", activeCatalog] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.catalogs.delete(activeCatalog, id),
    onSuccess: () => {
      toast.success("آیتم حذف شد");
      queryClient.invalidateQueries({ queryKey: ["admin-catalog", activeCatalog] });
      setDeleteTarget(null);
    },
  });

  function handleSave() {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    const payload: Record<string, unknown> = {
      title: editing.title,
      description: editing.description,
      icon: editing.icon,
      image: editing.image,
      category: editing.category,
      displayOrder: editing.displayOrder,
      active: editing.active,
    };
    // Merge catalog-specific extras
    for (const [k, v] of Object.entries(editing.extra)) {
      if (v !== "") payload[k] = v;
    }
    if (editing.id) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const api = (await import("@/lib/api")).default;
      const res = await api.post("/uploads/catalog-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditing({ ...(editing as EditState), image: res.data.data.url });
      toast.success("تصویر آپلود شد");
    } catch {
      toast.error("خطا در آپلود تصویر");
    }
  }

  const items = data?.items || [];

  // Determine extra fields based on catalog
  const extraFields: Array<{ key: string; label: string; type?: string }> = [];
  if (activeCatalog === "colors") extraFields.push({ key: "hex", label: "کد رنگ (hex)" });
  if (activeCatalog === "inventory-item-types") extraFields.push({ key: "unit", label: "واحد" });
  if (activeCatalog === "order-statuses") {
    extraFields.push({ key: "isCompleted", label: "وضعیت تکمیل شده", type: "boolean" });
    extraFields.push({ key: "isCancelled", label: "وضعیت لغو شده", type: "boolean" });
  }
  if (activeCatalog === "sms-templates") {
    extraFields.push({ key: "body", label: "متن قالب", type: "textarea" });
    extraFields.push({ key: "event", label: "رویداد (event)" });
  }
  if (activeCatalog === "receipt-templates") {
    extraFields.push({ key: "body", label: "متن قالب", type: "textarea" });
  }

  // Should the icon fields be shown for the active catalog?
  const showIconFields = CATALOGS.find((c) => c.key === activeCatalog)?.hasIcon ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="کاتالوگ‌های سراسری"
        description="مدیریت کاتالوگ‌های مشترک پلتفرم"
        actions={
          <Button onClick={() => setEditing({ title: "", description: "", icon: "", image: "", category: "", displayOrder: 0, active: true, extra: {} })}>
            <Plus className="size-4 ml-1" />
            آیتم جدید
          </Button>
        }
      />

      <Tabs value={activeCatalog} onValueChange={setActiveCatalog}>
        <TabsList className="flex-wrap h-auto">
          {CATALOGS.map((c) => (
            <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><TableLoading /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={BookOpen} title="آیتمی در این کاتالوگ ثبت نشده است" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {showIconFields && <TableHead className="w-12 text-center">آیکون</TableHead>}
                  <TableHead>عنوان</TableHead>
                  {activeCatalog === "garment-types" && <TableHead>دسته‌بندی</TableHead>}
                  <TableHead>slug</TableHead>
                  <TableHead className="text-center">ترتیب</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                  <TableHead className="text-center">وضعیت</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item._id}>
                    {showIconFields && (
                      <TableCell label="آیکون" className="text-center">
                        <div className="flex justify-center">
                          <CatalogIcon icon={item.icon} image={item.image} size={24} />
                        </div>
                      </TableCell>
                    )}
                    <TableCell label="عنوان" className="font-medium">{item.title}</TableCell>
                    {activeCatalog === "garment-types" && (
                      <TableCell label="دسته‌بندی">
                        {(item as { category?: string }).category ? (
                          <Badge variant="outline">{(item as { category?: string }).category}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell label="slug" dir="ltr" className="text-xs text-muted-foreground">{item.slug}</TableCell>
                    <TableCell label="ترتیب" className="text-center">{toPersianDigits(item.displayOrder)}</TableCell>
                    <TableCell label="تاریخ ثبت" className="text-sm text-muted-foreground">{toJalaliDateTime(item.createdAt)}</TableCell>
                    <TableCell label="وضعیت" className="text-center">
                      <Badge variant={item.active ? "default" : "secondary"}>
                        {item.active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell label="عملیات">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setEditing({
                              id: item._id,
                              title: item.title,
                              description: item.description || "",
                              icon: item.icon || "",
                              image: item.image || "",
                              category: (item as { category?: string }).category || "",
                              displayOrder: item.displayOrder,
                              active: item.active,
                              extra: {},
                            })
                          }
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "ویرایش آیتم" : "آیتم جدید"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>عنوان</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>توضیحات</Label>
                <Textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>

              {showIconFields && (
                <>
                  <div className="space-y-2">
                    <Label>آیکون (نام lucide)</Label>
                    <Input
                      value={editing.icon}
                      onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                      placeholder="مثلاً: shirt, scissors, droplets"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      نام آیکون از{" "}
                      <a
                        href="https://lucide.dev/icons"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        lucide.dev/icons
                      </a>{" "}
                      وارد کنید. اگر تصویر هم آپلود شده باشد، تصویر اولویت دارد.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>تصویر (اختیاری)</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        ref={imageInputRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file);
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                        <Upload className="size-4 ml-1" />
                        آپلود تصویر
                      </Button>
                      {editing.image && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setEditing({ ...editing, image: "" })}
                        >
                          حذف تصویر
                        </Button>
                      )}
                      <div className="flex size-10 items-center justify-center rounded border">
                        {editing.image ? (
                          <img
                            src={resolveMediaUrl(editing.image)}
                            alt=""
                            className="size-10 rounded object-cover"
                          />
                        ) : (
                          <CatalogIcon icon={editing.icon} size={20} />
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Category field — only for garment types */}
              {activeCatalog === "garment-types" && (
                <div className="space-y-2">
                  <Label>دسته‌بندی</Label>
                  <Select
                    value={editing.category || "_none"}
                    onValueChange={(v) => setEditing({ ...editing, category: v === "_none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب دسته‌بندی..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— بدون دسته‌بندی —</SelectItem>
                      <SelectItem value="عمومی">عمومی</SelectItem>
                      <SelectItem value="پالتو و بارانی">پالتو و بارانی</SelectItem>
                      <SelectItem value="کاپشن و اورکت">کاپشن و اورکت</SelectItem>
                      <SelectItem value="رسمی و کت">رسمی و کت</SelectItem>
                      <SelectItem value="مجلسی">مجلسی</SelectItem>
                      <SelectItem value="مانتو و زنانه">مانتو و زنانه</SelectItem>
                      <SelectItem value="پتو و رختخواب">پتو و رختخواب</SelectItem>
                      <SelectItem value="پرده و روفرشی">پرده و روفرشی</SelectItem>
                      <SelectItem value="کودک">کودک</SelectItem>
                      <SelectItem value="کیف و چمدان">کیف و چمدان</SelectItem>
                      <SelectItem value="متفرقه">متفرقه</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    دسته‌بندی برای گروه‌بندی لباس‌ها در ثبت سفارش و قیمت‌گذاری استفاده می‌شود.
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>ترتیب نمایش</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.displayOrder}
                    onChange={(e) => setEditing({ ...editing, displayOrder: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Switch
                    checked={editing.active}
                    onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                    id="catActive"
                  />
                  <Label htmlFor="catActive">فعال</Label>
                </div>
              </div>
              {extraFields.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label>{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      rows={4}
                      value={editing.extra[f.key] || ""}
                      onChange={(e) => setEditing({ ...editing, extra: { ...editing.extra, [f.key]: e.target.value } })}
                    />
                  ) : f.type === "boolean" ? (
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={editing.extra[f.key] === "true"}
                        onCheckedChange={(v) => setEditing({ ...editing, extra: { ...editing.extra, [f.key]: v ? "true" : "" } })}
                        id={`extra-${f.key}`}
                      />
                      <Label htmlFor={`extra-${f.key}`}>{f.label}</Label>
                    </div>
                  ) : (
                    <Input
                      value={editing.extra[f.key] || ""}
                      onChange={(e) => setEditing({ ...editing, extra: { ...editing.extra, [f.key]: e.target.value } })}
                    />
                  )}
                </div>
              ))}
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
        title="حذف آیتم"
        description={`آیا از حذف «${deleteTarget?.title}» اطمینان دارید؟`}
        confirmText="حذف"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget._id); }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

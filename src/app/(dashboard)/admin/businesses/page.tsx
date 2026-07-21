"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Search, Power, Ban, CheckCircle2, Loader2, Save, BarChart3 } from "lucide-react";
import { adminService, type AdminBusiness } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/common/search-input";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDebounced } from "@/hooks/use-debounced";
import toast from "react-hot-toast";
import { toJalaliDateTime } from "@/lib/jalali";
import { BusinessDetailDialog } from "./business-detail-dialog";

interface CreateForm {
  name: string;
  slug: string;
  description: string;
  phone: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  category: string;
  status: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPhone: string;
}

const EMPTY_FORM: CreateForm = {
  name: "",
  slug: "",
  description: "",
  phone: "",
  mobile: "",
  province: "",
  city: "",
  address: "",
  category: "",
  status: "pending",
  ownerFirstName: "",
  ownerLastName: "",
  ownerPhone: "",
};

export default function AdminBusinessesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [actionTarget, setActionTarget] = useState<{ business: AdminBusiness; action: "activate" | "suspend" | "delete" } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_FORM);
  const [detailTarget, setDetailTarget] = useState<AdminBusiness | null>(null);
  const debouncedSearch = useDebounced(search, 400);

  const { data: categories } = useQuery({
    queryKey: ["admin-business-categories"],
    queryFn: () => adminService.businessCategories.list({ pageSize: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-businesses", { page, search: debouncedSearch, status }],
    queryFn: () =>
      adminService.businesses.list({
        page,
        pageSize: 20,
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.businesses.updateStatus(id, status),
    onSuccess: () => {
      toast.success("وضعیت بیزینس به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
      setActionTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.businesses.delete(id),
    onSuccess: () => {
      toast.success("بیزینس حذف شد");
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
      setActionTarget(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiPost("/businesses", payload),
    onSuccess: () => {
      toast.success("بیزینس با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    },
  });

  async function apiPost(url: string, payload: unknown) {
    const api = (await import("@/lib/api")).default;
    const res = await api.post(url, payload);
    return res.data.data;
  }

  const businesses = data?.items || [];

  const statusBadge = (s: string) => {
    switch (s) {
      case "active": return <Badge variant="default" className="gap-1"><CheckCircle2 className="size-3" />فعال</Badge>;
      case "pending": return <Badge variant="secondary">در انتظار</Badge>;
      case "suspended": return <Badge variant="destructive" className="gap-1"><Ban className="size-3" />معلق</Badge>;
      case "inactive": return <Badge variant="outline">غیرفعال</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  function handleConfirm() {
    if (!actionTarget) return;
    if (actionTarget.action === "activate") {
      updateStatusMutation.mutate({ id: actionTarget.business._id, status: "active" });
    } else if (actionTarget.action === "suspend") {
      updateStatusMutation.mutate({ id: actionTarget.business._id, status: "suspended" });
    } else if (actionTarget.action === "delete") {
      deleteMutation.mutate(actionTarget.business._id);
    }
  }

  function handleCreate() {
    if (!createForm.name.trim()) {
      toast.error("نام بیزینس الزامی است");
      return;
    }
    if (!createForm.category) {
      toast.error("دسته‌بندی را انتخاب کنید");
      return;
    }
    if (!createForm.ownerPhone.trim()) {
      toast.error("شماره موبایل صاحب بیزینس الزامی است");
      return;
    }
    createMutation.mutate({
      name: createForm.name,
      slug: createForm.slug || undefined,
      description: createForm.description || undefined,
      phone: createForm.phone || undefined,
      mobile: createForm.mobile || undefined,
      province: createForm.province || undefined,
      city: createForm.city || undefined,
      address: createForm.address || undefined,
      category: createForm.category,
      status: createForm.status,
      ownerFirstName: createForm.ownerFirstName || undefined,
      ownerLastName: createForm.ownerLastName || undefined,
      ownerPhone: createForm.ownerPhone,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="مدیریت بیزینس‌ها"
        description="لیست تمام بیزینس‌های ثبت شده در پلتفرم"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 ml-1" />
            بیزینس جدید
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="جستجو با نام یا slug"
            className="sm:flex-1"
          />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="pending">در انتظار</SelectItem>
              <SelectItem value="suspended">معلق</SelectItem>
              <SelectItem value="inactive">غیرفعال</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><TableLoading /></div>
          ) : businesses.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="بیزینسی یافت نشد"
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4 ml-1" />
                  بیزینس جدید
                </Button>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام بیزینس</TableHead>
                    <TableHead>مالک</TableHead>
                    <TableHead>دسته</TableHead>
                    <TableHead>تاریخ ثبت</TableHead>
                    <TableHead className="text-center">وضعیت</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((b: AdminBusiness) => (
                    <TableRow key={b._id}>
                      <TableCell label="نام بیزینس">
                        <div className="flex items-center gap-2">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Building2 className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium">{b.name}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{b.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell label="مالک">
                        {b.owner ? (
                          <div>
                            <p className="text-sm">{b.owner.firstName} {b.owner.lastName}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{b.owner.phoneNumber}</p>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell label="دسته" className="text-sm">{b.category?.name || "—"}</TableCell>
                      <TableCell label="تاریخ ثبت" className="text-sm text-muted-foreground">{toJalaliDateTime(b.createdAt)}</TableCell>
                      <TableCell label="وضعیت" className="text-center">{statusBadge(b.status)}</TableCell>
                      <TableCell label="عملیات">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="مشاهده گزارشات و مدیریت"
                            onClick={() => setDetailTarget(b)}
                          >
                            <BarChart3 className="size-4 text-primary" />
                          </Button>
                          {b.status !== "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="فعال‌سازی"
                              onClick={() => setActionTarget({ business: b, action: "activate" })}
                            >
                              <Power className="size-4 text-emerald-600" />
                            </Button>
                          )}
                          {b.status !== "suspended" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="تعلیق"
                              onClick={() => setActionTarget({ business: b, action: "suspend" })}
                            >
                              <Ban className="size-4 text-amber-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="حذف"
                            onClick={() => setActionTarget({ business: b, action: "delete" })}
                          >
                            <CheckCircle2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data?.meta && (
                <Pagination
                  page={data.meta.page}
                  pageSize={data.meta.pageSize}
                  total={data.meta.total}
                  totalPages={data.meta.totalPages}
                  hasNext={data.meta.hasNext}
                  hasPrev={data.meta.hasPrev}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create business dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ایجاد بیزینس جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              صاحب بیزینس با شماره موبایل وارد می‌شود. اگر کاربری با این شماره وجود نداشته باشد، автоматически ساخته می‌شود.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>نام بیزینس *</Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>slug (اختیاری)</Label>
                <Input dir="ltr" value={createForm.slug} onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })} placeholder="auto-generated" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>دسته‌بندی *</Label>
              <Select value={createForm.category} onValueChange={(v) => setCreateForm({ ...createForm, category: v })}>
                <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                <SelectContent>
                  {categories?.items.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>تلفن ثابت</Label>
                <Input dir="ltr" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>موبایل بیزینس</Label>
                <Input dir="ltr" value={createForm.mobile} onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>استان</Label>
                <Input value={createForm.province} onChange={(e) => setCreateForm({ ...createForm, province: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>شهر</Label>
                <Input value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>آدرس</Label>
              <Textarea rows={2} value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} />
            </div>

            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-semibold">اطلاعات صاحب بیزینس</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>نام</Label>
                  <Input value={createForm.ownerFirstName} onChange={(e) => setCreateForm({ ...createForm, ownerFirstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>نام خانوادگی</Label>
                  <Input value={createForm.ownerLastName} onChange={(e) => setCreateForm({ ...createForm, ownerLastName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>موبایل *</Label>
                  <Input dir="ltr" value={createForm.ownerPhone} onChange={(e) => setCreateForm({ ...createForm, ownerPhone: e.target.value })} placeholder="0912..." />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>وضعیت اولیه</Label>
                <Select value={createForm.status} onValueChange={(v) => setCreateForm({ ...createForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>انصراف</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 ml-1" />}
              ایجاد بیزینس
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!actionTarget}
        onOpenChange={(o) => !o && setActionTarget(null)}
        title={
          actionTarget?.action === "activate" ? "فعال‌سازی بیزینس" :
          actionTarget?.action === "suspend" ? "تعلیق بیزینس" :
          "حذف بیزینس"
        }
        description={
          actionTarget?.action === "activate"
            ? `آیا از فعال‌سازی «${actionTarget.business.name}» اطمینان دارید؟`
            : actionTarget?.action === "suspend"
            ? `آیا از تعلیق «${actionTarget.business.name}» اطمینان دارید؟ بیزینس تعلیق شده نمی‌تواند به پلتفرم دسترسی داشته باشد.`
            : `آیا از حذف «${actionTarget?.business.name}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`
        }
        confirmText={
          actionTarget?.action === "activate" ? "فعال‌سازی" :
          actionTarget?.action === "suspend" ? "تعلیق" : "حذف"
        }
        onConfirm={handleConfirm}
        loading={updateStatusMutation.isPending || deleteMutation.isPending}
      />

      <BusinessDetailDialog
        business={detailTarget}
        open={!!detailTarget}
        onOpenChange={(o) => !o && setDetailTarget(null)}
      />
    </div>
  );
}

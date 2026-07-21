"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Eye, Phone, User as UserIcon, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customerService } from "@/services";
import type { Customer } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { PageHelp } from "@/components/common/page-help";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/common/search-input";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useDebounced } from "@/hooks/use-debounced";
import { formatNumber, formatToman, toPersianDigits } from "@/lib/utils";
import { toJalaliDateTime } from "@/lib/jalali";
import toast from "react-hot-toast";

export default function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("-createdAt");
  const debouncedSearch = useDebounced(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", { page, search: debouncedSearch, sortBy }],
    queryFn: () =>
      customerService.list({
        page,
        pageSize: 20,
        sort: sortBy,
        search: debouncedSearch || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: () => {
      toast.success("مشتری حذف شد");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDeleteId(null);
    },
  });

  const customers = data?.items || [];

  // Export to CSV (Excel-compatible)
  function exportToExcel() {
    const headers = ["نام", "نام خانوادگی", "موبایل", "تلفن", "آدرس", "تاریخ تولد", "جنسیت", "تعداد سفارشات", "مجموع خرید", "موجودی کش‌بک"];
    const rows = customers.map((c: Customer) => [
      c.firstName,
      c.lastName,
      c.mobile,
      c.phone || "",
      c.address || "",
      c.birthDate ? new Date(c.birthDate).toLocaleDateString("fa-IR") : "",
      c.gender === "male" ? "آقا" : c.gender === "female" ? "خانم" : "",
      String(c.totalOrders),
      String(c.totalSpending),
      String(c.currentCashbackBalance),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("خروجی Excel دانلود شد");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="مشتریان"
        description="مدیریت مشتریان خشکشویی"
        actions={
          <div className="flex gap-2">
            <PageHelp
              title="راهنمای مشتریان"
              sections={[
                { title: "لیست مشتریان", body: "در این صفحه تمام مشتریان خشکشویی شما نمایش داده می‌شود. می‌توانید با نام، نام خانوادگی یا موبایل جستجو کنید." },
                { title: "افزودن مشتری", body: "با کلیک روی «مشتری جدید» می‌توانید مشتری جدیدی ثبت کنید. فقط نام خانوادگی و موبایل الزامی است." },
                { title: "خروجی Excel", body: "می‌توانید لیست مشتریان را به‌صورت فایل Excel دانلود کنید." },
                { title: "اطلاعات مشتری", body: "با کلیک روی هر مشتری، جزئیات کامل او شامل تاریخچه سفارشات، موجودی کش‌بک و اطلاعات تماس را ببینید." },
              ]}
            />
            <Button variant="outline" onClick={exportToExcel} disabled={customers.length === 0}>
              <Download className="size-4 ml-1" />
              خروجی Excel
            </Button>
            <Button onClick={() => router.push("/customers/new")}>
              <Plus className="size-4 ml-1" />
              مشتری جدید
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="جستجو با نام، نام خانوادگی یا موبایل" className="sm:flex-1" />
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="مرتب‌سازی" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-createdAt">جدیدترین</SelectItem>
              <SelectItem value="-totalOrders">بیشترین سفارش</SelectItem>
              <SelectItem value="-totalSpending">بیشترین خرید</SelectItem>
              <SelectItem value="firstName">نام (الفبا)</SelectItem>
              <SelectItem value="lastName">نام خانوادگی (الفبا)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableLoading />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={UserIcon}
              title="مشتری‌ای یافت نشد"
              description="برای افزودن اولین مشتری، روی دکمه «مشتری جدید» کلیک کنید."
              action={
                <Button onClick={() => router.push("/customers/new")}>
                  <Plus className="size-4 ml-1" />
                  مشتری جدید
                </Button>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام و نام خانوادگی</TableHead>
                    <TableHead>موبایل</TableHead>
                    <TableHead className="text-center">سفارشات</TableHead>
                    <TableHead className="text-center">مجموع خرید</TableHead>
                    <TableHead>تاریخ ثبت</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c: Customer) => (
                    <TableRow key={c._id}>
                      <TableCell label="نام">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {c.firstName?.[0]}
                          </div>
                          <span className="font-medium">{c.firstName} {c.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell label="موبایل" dir="ltr" className="text-right">{c.mobile}</TableCell>
                      <TableCell label="سفارشات" className="text-center">{toPersianDigits(c.totalOrders)}</TableCell>
                      <TableCell label="مجموع خرید" className="text-center">{formatToman(c.totalSpending)}</TableCell>
                      <TableCell label="تاریخ ثبت" className="text-sm text-muted-foreground">{toJalaliDateTime(c.createdAt)}</TableCell>
                      <TableCell label="عملیات">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${c._id}`)} title="مشاهده">
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${c._id}?edit=1`)} title="ویرایش">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(c._id)} title="حذف">
                            <Trash2 className="size-4" />
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="حذف مشتری"
        description="آیا از حذف این مشتری اطمینان دارید؟ این عملیات قابل بازگشت نیست."
        confirmText="حذف"
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

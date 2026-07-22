"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBag, Eye, Filter, Zap, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { orderService, catalogService } from "@/services";
import type { Order, OrderStatus as OrderStatusType } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { PageHelp } from "@/components/common/page-help";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/common/search-input";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounced } from "@/hooks/use-debounced";
import { formatToman, toPersianDigits } from "@/lib/utils";
import { toJalaliDateTime, toJalali } from "@/lib/jalali";

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("-createdAt");
  const debouncedSearch = useDebounced(search, 400);

  const { data: statuses } = useQuery({
    queryKey: ["order-statuses"],
    queryFn: () => catalogService.orderStatuses.all(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["orders", { page, search: debouncedSearch, status, sortBy }],
    queryFn: () =>
      orderService.list({
        page,
        pageSize: 20,
        sort: sortBy,
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
      }),
  });

  const orders = data?.items || [];
  const statusMap = new Map((statuses || []).map((s) => [s._id, s]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="سفارشات"
        description="مدیریت و پیگیری سفارشات"
        actions={
          <div className="flex gap-2">
            <PageHelp
              title="راهنمای سفارشات"
              sections={[
                { title: "لیست سفارشات", body: "در این صفحه تمام سفارشات خشکشویی شما نمایش داده می‌شود. می‌توانید با شماره سفارش یا موبایل مشتری جستجو کنید و بر اساس وضعیت فیلتر کنید." },
                { title: "تغییر وضعیت", body: "برای هر سفارش می‌توانید مستقیماً از لیست، وضعیت را تغییر دهید (مثلاً از «پذیرش» به «در حال انجام» یا «آماده تحویل»)." },
                { title: "سفارش فوری", body: "سفارشاتی که فوری علامت خورده‌اند با نشان زرد رنگ مشخص می‌شوند. مبلغ این سفارشات بر اساس ضریب فوری (در تنظیمات) محاسبه می‌شود." },
                { title: "عملیات", body: "با کلیک روی آیکون چشم، جزئیات سفارش را ببینید. با کلیک روی آیکون مداد، سفارش را ویرایش کنید." },
              ]}
            />
            <Button onClick={() => router.push("/orders/new")}>
              <Plus className="size-4 ml-1" />
              سفارش جدید
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="جستجو با شماره سفارش یا موبایل"
            className="w-full"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-2">
              <Filter className="size-4 shrink-0 text-muted-foreground" />
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  {statuses?.map((s) => (
                    <SelectItem key={s._id} value={s._id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="مرتب‌سازی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-createdAt">جدیدترین</SelectItem>
                <SelectItem value="createdAt">قدیمی‌ترین</SelectItem>
                <SelectItem value="-deliveryDate">نزدیک‌ترین تحویل</SelectItem>
                <SelectItem value="deliveryDate">دورترین تحویل</SelectItem>
                <SelectItem value="-finalPrice">بیشترین مبلغ</SelectItem>
                <SelectItem value="finalPrice">کمترین مبلغ</SelectItem>
                <SelectItem value="-urgent">فوری اول</SelectItem>
                <SelectItem value="-acceptedAt">پذیرش اخیر</SelectItem>
                <SelectItem value="-updatedAt">آخرین تغییر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><TableLoading /></div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="سفارشی یافت نشد"
              description="برای ثبت اولین سفارش روی دکمه «سفارش جدید» کلیک کنید."
              action={
                <Button onClick={() => router.push("/orders/new")}>
                  <Plus className="size-4 ml-1" />
                  سفارش جدید
                </Button>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره سفارش</TableHead>
                    <TableHead>مشتری</TableHead>
                    <TableHead>تاریخ تحویل</TableHead>
                    <TableHead className="text-center">آیتم‌ها</TableHead>
                    <TableHead className="text-center">مبلغ</TableHead>
                    <TableHead className="text-center">وضعیت</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o: Order) => {
                    const customer = typeof o.customer === "object" ? o.customer : null;
                    const statusObj = statusMap.get(typeof o.status === "string" ? o.status : (o.status as { _id: string })._id) as OrderStatusType | undefined;
                    const currentStatusId = typeof o.status === "object" ? (o.status as { _id: string })._id : o.status;
                    return (
                      <TableRow key={o._id} className={o.urgent ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                        <TableCell label="شماره سفارش">
                          <div className="flex items-center gap-2">
                            {o.urgent && (
                              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                <Zap className="size-3" />
                                فوری
                              </span>
                            )}
                            <span className="font-medium" dir="ltr">{o.orderNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell label="مشتری">{customer ? `${customer.firstName} ${customer.lastName}` : "—"}</TableCell>
                        <TableCell label="تاریخ تحویل" className="text-sm text-muted-foreground">{toJalali(o.deliveryDate)}</TableCell>
                        <TableCell label="آیتم‌ها" className="text-center">{toPersianDigits(o.items.length)}</TableCell>
                        <TableCell label="مبلغ" className="text-center font-medium">{formatToman(o.finalPrice)}</TableCell>
                        <TableCell label="وضعیت" className="text-center">
                          <Select
                            value={currentStatusId}
                            onValueChange={(v) => {
                              orderService.update(o._id, { status: v }).then(() => {
                                toast.success("وضعیت سفارش تغییر کرد");
                                // Invalidate queries
                                queryClient.invalidateQueries({ queryKey: ["orders"] });
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 w-32 mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses?.map((s) => (
                                <SelectItem key={s._id} value={s._id}>{s.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell label="عملیات">
                          <div className="flex items-center justify-end">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/orders/${o._id}`)} title="مشاهده">
                              <Eye className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/orders/${o._id}/edit`)} title="ویرایش">
                              <Edit2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
    </div>
  );
}

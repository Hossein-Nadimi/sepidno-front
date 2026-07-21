"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Search } from "lucide-react";
import { adminService } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/common/search-input";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { Badge } from "@/components/ui/badge";
import { useDebounced } from "@/hooks/use-debounced";
import { toJalaliDateTime } from "@/lib/jalali";
import { formatNumber, toPersianDigits } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "فعال", variant: "default" },
  pending: { label: "در انتظار", variant: "secondary" },
  expired: { label: "منقضی", variant: "destructive" },
  cancelled: { label: "لغو شده", variant: "outline" },
};

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounced(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-active-subscriptions", { page, search: debouncedSearch }],
    queryFn: () =>
      adminService.activeSubscriptions.list({
        page,
        pageSize: 20,
        search: debouncedSearch || undefined,
      }),
  });

  const subs = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="اشتراک‌های فعال"
        description="لیست تمام اشتراک‌های فعال در پلتفرم"
      />

      <Card>
        <CardContent className="p-4">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="جستجو..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><TableLoading /></div>
          ) : subs.length === 0 ? (
            <EmptyState icon={CreditCard} title="اشتراکی یافت نشد" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>بیزینس</TableHead>
                    <TableHead>پلن</TableHead>
                    <TableHead>تاریخ شروع</TableHead>
                    <TableHead>تاریخ انقضا</TableHead>
                    <TableHead className="text-center">پیامک مصرفی</TableHead>
                    <TableHead className="text-center">وضعیت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subs.map((s) => {
                    const statusInfo = STATUS_LABELS[s.status] || { label: s.status, variant: "outline" as const };
                    return (
                      <TableRow key={s._id}>
                        <TableCell label="بیزینس" className="font-medium">
                          {typeof s.business === "object" && s.business ? (s.business as { name?: string }).name : "—"}
                        </TableCell>
                        <TableCell label="پلن">
                          {typeof s.subscriptionPlan === "object" && s.subscriptionPlan ? (s.subscriptionPlan as { name?: string }).name : "—"}
                        </TableCell>
                        <TableCell label="تاریخ شروع" className="text-sm text-muted-foreground">{toJalaliDateTime(s.startDate)}</TableCell>
                        <TableCell label="تاریخ انقضا" className="text-sm text-muted-foreground">{toJalaliDateTime(s.expireDate)}</TableCell>
                        <TableCell label="پیامک مصرفی" className="text-center">
                          {toPersianDigits(s.monthlySmsUsed)} / {formatNumber(s.monthlySmsQuota)}
                        </TableCell>
                        <TableCell label="وضعیت" className="text-center">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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

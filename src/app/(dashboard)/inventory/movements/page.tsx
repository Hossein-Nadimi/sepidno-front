"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { inventoryService } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { toPersianDigits } from "@/lib/utils";
import { toJalaliDateTime } from "@/lib/jalali";

export default function MovementsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["movements", page],
    queryFn: () => inventoryService.movements.list({ page, pageSize: 20, sort: "-createdAt" }),
  });

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="حرکت‌های انبار"
        actions={
          <Button variant="outline" onClick={() => router.push("/inventory")}>
            <ArrowRight className="size-4 ml-1" />
            بازگشت
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><TableLoading /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={RefreshCw} title="هیچ حرکتی ثبت نشده است" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>نوع</TableHead>
                    <TableHead className="text-center">تعداد</TableHead>
                    <TableHead>توضیحات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell label="تاریخ" className="text-sm text-muted-foreground">{toJalaliDateTime(m.createdAt)}</TableCell>
                      <TableCell label="نوع">
                        <Badge variant={m.type === "stock_in" ? "default" : m.type === "stock_out" ? "destructive" : "secondary"}>
                          {m.type === "stock_in" ? "ورود" : m.type === "stock_out" ? "خروج" : "تعدیل"}
                        </Badge>
                      </TableCell>
                      <TableCell label="تعداد" className="text-center">{toPersianDigits(m.quantity)}</TableCell>
                      <TableCell label="توضیحات">{m.description || "—"}</TableCell>
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
    </div>
  );
}

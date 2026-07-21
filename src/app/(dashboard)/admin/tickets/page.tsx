"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ticket as TicketIcon, MessageSquare } from "lucide-react";
import { ticketService, type Ticket } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { Pagination } from "@/components/common/pagination";
import { toJalaliDateTime } from "@/lib/jalali";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "باز", variant: "default" },
  pending: { label: "در انتظار", variant: "secondary" },
  answered: { label: "پاسخ داده شده", variant: "default" },
  closed: { label: "بسته شده", variant: "outline" },
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
  urgent: "فوری",
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tickets", { page, status }],
    queryFn: () => ticketService.list({ page, pageSize: 20, status: status !== "all" ? status : undefined }),
  });

  const tickets = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader title="تیکت‌ها" description="مدیریت تیکت‌های پشتیبانی" />

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="open">باز</SelectItem>
              <SelectItem value="pending">در انتظار</SelectItem>
              <SelectItem value="answered">پاسخ داده شده</SelectItem>
              <SelectItem value="closed">بسته شده</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><TableLoading /></div>
          ) : tickets.length === 0 ? (
            <EmptyState icon={TicketIcon} title="تیکتی یافت نشد" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عنوان</TableHead>
                    <TableHead>کاربر</TableHead>
                    <TableHead>کسب‌وکار</TableHead>
                    <TableHead className="text-center">اولویت</TableHead>
                    <TableHead className="text-center">وضعیت</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t: Ticket) => {
                    const statusInfo = STATUS_LABELS[t.status] || { label: t.status, variant: "outline" as const };
                    const user = typeof t.createdBy === "object" ? t.createdBy : null;
                    const biz = typeof t.business === "object" ? t.business : null;
                    return (
                      <TableRow key={t._id} className="cursor-pointer" onClick={() => router.push(`/admin/tickets/${t._id}`)}>
                        <TableCell label="عنوان" className="font-medium">{t.title}</TableCell>
                        <TableCell label="کاربر">
                          {user ? (
                            <div>
                              <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-muted-foreground" dir="ltr">{user.phoneNumber}</p>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell label="کسب‌وکار">{biz?.name || "—"}</TableCell>
                        <TableCell label="اولویت" className="text-center">
                          <Badge variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "default" : "secondary"}>
                            {PRIORITY_LABELS[t.priority] || t.priority}
                          </Badge>
                        </TableCell>
                        <TableCell label="وضعیت" className="text-center">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell label="تاریخ ایجاد" className="text-sm text-muted-foreground">{toJalaliDateTime(t.createdAt)}</TableCell>
                        <TableCell label="عملیات">
                          <MessageSquare className="size-4 text-muted-foreground" />
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

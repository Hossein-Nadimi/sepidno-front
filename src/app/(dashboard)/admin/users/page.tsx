"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Power, ShieldCheck } from "lucide-react";
import { adminService } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/common/search-input";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { Badge } from "@/components/ui/badge";
import { useDebounced } from "@/hooks/use-debounced";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import toast from "react-hot-toast";
import { toJalaliDateTime } from "@/lib/jalali";
import { toPersianDigits } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "سوپر ادمین",
  business_owner: "صاحب بیزینس",
  business_manager: "مدیر بیزینس",
  business_staff: "کارمند",
  user: "کاربر",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toggleTarget, setToggleTarget] = useState<{ id: string; name: string; isActive: boolean } | null>(null);
  const debouncedSearch = useDebounced(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", { page, search: debouncedSearch }],
    queryFn: () =>
      adminService.users.list({
        page,
        pageSize: 20,
        search: debouncedSearch || undefined,
      }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.users.update(id, { isActive }),
    onSuccess: () => {
      toast.success("وضعیت کاربر به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setToggleTarget(null);
    },
  });

  const users = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="مدیریت کاربران"
        description="لیست تمام کاربران پلتفرم"
      />

      <Card>
        <CardContent className="p-4">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="جستجو با نام یا شماره موبایل"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><TableLoading /></div>
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="کاربری یافت نشد" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>کاربر</TableHead>
                    <TableHead>موبایل</TableHead>
                    <TableHead>نقش</TableHead>
                    <TableHead>آخرین ورود</TableHead>
                    <TableHead>تاریخ ثبت</TableHead>
                    <TableHead className="text-center">وضعیت</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell label="کاربر">
                        <div className="flex items-center gap-2">
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {u.firstName?.[0] || u.phoneNumber[0]}
                          </div>
                          <div>
                            <p className="font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground">شناسه: {toPersianDigits(u._id.slice(-6))}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell label="موبایل" dir="ltr" className="text-right">{u.phoneNumber}</TableCell>
                      <TableCell label="نقش">
                        <Badge variant={u.role?.name === "super_admin" ? "default" : "secondary"} className="gap-1">
                          {u.role?.name === "super_admin" && <ShieldCheck className="size-3" />}
                          {ROLE_LABELS[u.role?.name || "user"] || u.role?.name}
                        </Badge>
                      </TableCell>
                      <TableCell label="آخرین ورود" className="text-sm text-muted-foreground">
                        {u.lastLoginAt ? toJalaliDateTime(u.lastLoginAt) : "—"}
                      </TableCell>
                      <TableCell label="تاریخ ثبت" className="text-sm text-muted-foreground">{toJalaliDateTime(u.createdAt)}</TableCell>
                      <TableCell label="وضعیت" className="text-center">
                        <Badge variant={u.isActive ? "default" : "destructive"}>
                          {u.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </TableCell>
                      <TableCell label="عملیات">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={u.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                            disabled={u.role?.name === "super_admin"}
                            onClick={() =>
                              setToggleTarget({
                                id: u._id,
                                name: `${u.firstName} ${u.lastName}`.trim() || u.phoneNumber,
                                isActive: u.isActive,
                              })
                            }
                          >
                            <Power className={`size-4 ${u.isActive ? "text-amber-600" : "text-emerald-600"}`} />
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
        open={!!toggleTarget}
        onOpenChange={(o) => !o && setToggleTarget(null)}
        title={toggleTarget?.isActive ? "غیرفعال‌سازی کاربر" : "فعال‌سازی کاربر"}
        description={
          toggleTarget?.isActive
            ? `آیا از غیرفعال‌سازی «${toggleTarget.name}» اطمینان دارید؟ این کاربر نمی‌تواند وارد شود.`
            : `آیا از فعال‌سازی «${toggleTarget?.name}» اطمینان دارید؟`
        }
        confirmText={toggleTarget?.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
        onConfirm={() => {
          if (toggleTarget) {
            toggleActiveMutation.mutate({
              id: toggleTarget.id,
              isActive: !toggleTarget.isActive,
            });
          }
        }}
        loading={toggleActiveMutation.isPending}
      />
    </div>
  );
}

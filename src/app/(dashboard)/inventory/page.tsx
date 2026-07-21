"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Boxes, Plus, ArrowDownCircle, ArrowUpCircle, RefreshCw, AlertTriangle, Edit2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { inventoryService, catalogService } from "@/services";
import type { InventoryItem } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { PageHelp } from "@/components/common/page-help";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { formatNumber, toPersianDigits } from "@/lib/utils";
import { toJalaliDateTime } from "@/lib/jalali";

export default function InventoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [movement, setMovement] = useState<{ itemId: string; itemName: string; type: "stock_in" | "stock_out" | "adjustment" } | null>(null);
  const [newItem, setNewItem] = useState({ inventoryItemType: "", currentQuantity: 0, minimumQuantity: 0, unit: "" });
  const [moveData, setMoveData] = useState({ quantity: 0, description: "" });
  const [editItem, setEditItem] = useState<{ id: string; currentQuantity: number; minimumQuantity: number; unit: string; description: string } | null>(null);

  const { data: itemTypes } = useQuery({ queryKey: ["inventory-item-types"], queryFn: () => catalogService.inventoryItemTypes.all() });
  const { data, isLoading } = useQuery({
    queryKey: ["inventory", { page, lowStockOnly }],
    queryFn: () => inventoryService.items.list({ page, pageSize: 20, lowStock: lowStockOnly || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: () => inventoryService.items.create(newItem),
    onSuccess: () => {
      toast.success("آیتم انبار ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setOpenCreate(false);
      setNewItem({ inventoryItemType: "", currentQuantity: 0, minimumQuantity: 0, unit: "" });
    },
  });

  const movementMutation = useMutation({
    mutationFn: () => {
      if (!movement) throw new Error();
      const qty = movement.type === "stock_out" ? -Math.abs(moveData.quantity) : moveData.quantity;
      return inventoryService.movements.create({
        inventoryItem: movement.itemId,
        type: movement.type,
        quantity: qty,
        description: moveData.description,
      });
    },
    onSuccess: () => {
      toast.success("حرکت انبار ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setMovement(null);
      setMoveData({ quantity: 0, description: "" });
    },
  });

  const editMutation = useMutation({
    mutationFn: () => {
      if (!editItem) throw new Error();
      return inventoryService.items.update(editItem.id, {
        currentQuantity: editItem.currentQuantity,
        minimumQuantity: editItem.minimumQuantity,
        unit: editItem.unit,
        description: editItem.description,
      });
    },
    onSuccess: () => {
      toast.success("آیتم انبار به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setEditItem(null);
    },
  });

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="انبار"
        description="مدیریت موجودی و حرکت‌های انبار"
        actions={
          <div className="flex gap-2">
            <PageHelp
              title="راهنمای انبار"
              sections={[
                { title: "مدیریت موجودی", body: "در این صفحه موجودی مواد و تجهیزات خشکشویی خود را مدیریت کنید: پودر، نرم‌کننده، چسب، کیسه و سایر اقلام." },
                { title: "افزودن آیتم", body: "با کلیک روی «آیتم جدید»، نوع قلم، موجودی فعلی و حداقل موجودی را وارد کنید. وقتی موجودی به حداقل برسد، به‌صورت خودکار هشدار «رو به اتمام» نمایش داده می‌شود." },
                { title: "ورود و خروج", body: "با کلیک روی «ورود» یا «خروج»، میزان ورود یا مصرف هر قلم را ثبت کنید. تاریخچه تمام حرکت‌ها در صفحه «حرکت‌های انبار» قابل مشاهده است." },
                { title: "فیلتر", body: "می‌توانید فقط اقلام رو به اتمام را فیلتر کنید." },
              ]}
            />
            <Button onClick={() => setOpenCreate(true)}>
              <Plus className="size-4 ml-1" />
              آیتم جدید
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }} className="size-4" />
            <Label>نمایش فقط موجودی‌های رو به اتمام</Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/inventory/movements")}>
            <RefreshCw className="size-4 ml-1" />
            تاریخچه حرکت‌ها
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><TableLoading /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={Boxes} title="آیتمی در انبار ثبت نشده است" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع اقلام</TableHead>
                    <TableHead className="text-center">موجودی فعلی</TableHead>
                    <TableHead className="text-center">حداقل موجودی</TableHead>
                    <TableHead>واحد</TableHead>
                    <TableHead className="text-center">وضعیت</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: InventoryItem) => {
                    const type = typeof item.inventoryItemType === "object" ? item.inventoryItemType : null;
                    const isLow = item.currentQuantity <= item.minimumQuantity;
                    return (
                      <TableRow key={item._id}>
                        <TableCell label="نام" className="font-medium">{type?.title || "—"}</TableCell>
                        <TableCell label="موجودی" className="text-center">{toPersianDigits(item.currentQuantity)}</TableCell>
                        <TableCell label="حداقل" className="text-center text-muted-foreground">{toPersianDigits(item.minimumQuantity)}</TableCell>
                        <TableCell label="واحد">{item.unit || "—"}</TableCell>
                        <TableCell label="وضعیت" className="text-center">
                          {isLow ? (
                            <Badge variant="destructive"><AlertTriangle className="size-3 ml-1" />رو به اتمام</Badge>
                          ) : (
                            <Badge variant="default">نرمال</Badge>
                          )}
                        </TableCell>
                        <TableCell label="عملیات">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditItem({
                                id: item._id,
                                currentQuantity: item.currentQuantity,
                                minimumQuantity: item.minimumQuantity,
                                unit: item.unit,
                                description: item.description || "",
                              })}
                            >
                              <Edit2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMovement({ itemId: item._id, itemName: type?.title || "", type: "stock_in" })}
                            >
                              <ArrowDownCircle className="size-4 text-emerald-600" />
                              ورود
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMovement({ itemId: item._id, itemName: type?.title || "", type: "stock_out" })}
                            >
                              <ArrowUpCircle className="size-4 text-red-600" />
                              خروج
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

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>افزودن آیتم انبار</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>نوع اقلام</Label>
              <Select onValueChange={(v) => setNewItem({ ...newItem, inventoryItemType: v })}>
                <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                <SelectContent>
                  {itemTypes?.map((t) => (
                    <SelectItem key={t._id} value={t._id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>موجودی اولیه</Label>
                <Input type="number" min={0} value={newItem.currentQuantity} onChange={(e) => setNewItem({ ...newItem, currentQuantity: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>حداقل موجودی</Label>
                <Input type="number" min={0} value={newItem.minimumQuantity} onChange={(e) => setNewItem({ ...newItem, minimumQuantity: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>واحد</Label>
              <Input value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} placeholder="عدد، لیتر، کیلوگرم..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>انصراف</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newItem.inventoryItemType}>
              ثبت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement dialog */}
      <Dialog open={!!movement} onOpenChange={(o) => !o && setMovement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movement?.type === "stock_in" ? "ثبت ورود به انبار" : movement?.type === "stock_out" ? "ثبت خروج از انبار" : "تعدیل"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">آیتم: {movement?.itemName}</p>
            <div className="space-y-2">
              <Label>تعداد</Label>
              <Input
                type="number"
                min={1}
                value={moveData.quantity}
                onChange={(e) => setMoveData({ ...moveData, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Input value={moveData.description} onChange={(e) => setMoveData({ ...moveData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovement(null)}>انصراف</Button>
            <Button onClick={() => movementMutation.mutate()} disabled={movementMutation.isPending || moveData.quantity <= 0}>
              ثبت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ویرایش آیتم انبار</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>موجودی فعلی</Label>
                  <Input type="number" min={0} value={editItem.currentQuantity}
                    onChange={(e) => setEditItem({ ...editItem, currentQuantity: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>حداقل موجودی</Label>
                  <Input type="number" min={0} value={editItem.minimumQuantity}
                    onChange={(e) => setEditItem({ ...editItem, minimumQuantity: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>واحد</Label>
                <Input value={editItem.unit} onChange={(e) => setEditItem({ ...editItem, unit: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>توضیحات</Label>
                <Input value={editItem.description} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>انصراف</Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>
              {editMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "ذخیره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

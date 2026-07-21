"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Loader2, Save, Wallet, TrendingDown, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment-jalaali";
import { expenseService, type Expense } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { PageHelp } from "@/components/common/page-help";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { Pagination } from "@/components/common/pagination";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { JalaliDatePicker } from "@/components/common/jalali-date-picker";
import { PriceInput } from "@/components/common/price-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatToman, toPersianDigits } from "@/lib/utils";
import { toJalali } from "@/lib/jalali";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

const EXPENSE_CATEGORIES = [
  "اجاره",
  "حقوق کارمند",
  "قبض آب",
  "قبض برق",
  "قبض گاز",
  "تلفن و اینترنت",
  "مواد اولیه",
  "ناهار و پذیرایی",
  "خسارت لباس",
  "تعمیرات",
  "تبلیغات",
  "حمل و نقل",
  "سایر",
];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editItem, setEditItem] = useState<{ id?: string; title: string; category: string; amount: number; description: string; date: string; dateJalali: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", page],
    queryFn: () => expenseService.list({ page, pageSize: 20, sort: "-date" }),
  });

  const { data: stats } = useQuery({
    queryKey: ["expense-stats"],
    queryFn: () => expenseService.stats({ preset: "thisMonth" }),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!editItem) throw new Error();
      // Convert Jalali to Gregorian
      let dateISO = editItem.date;
      if (editItem.dateJalali) {
        const m = moment(editItem.dateJalali, "jYYYY/jMM/jDD", true);
        if (m.isValid()) dateISO = m.toDate().toISOString();
      }
      return editItem.id
        ? expenseService.update(editItem.id, { title: editItem.title, category: editItem.category, amount: editItem.amount, description: editItem.description, date: dateISO })
        : expenseService.create({ title: editItem.title, category: editItem.category, amount: editItem.amount, description: editItem.description, date: dateISO });
    },
    onSuccess: () => {
      toast.success(editItem?.id ? "هزینه به‌روزرسانی شد" : "هزینه ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      setEditItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => {
      toast.success("هزینه حذف شد");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      setDeleteTarget(null);
    },
  });

  const expenses = data?.items || [];

  function openCreate() {
    const todayJalali = moment().format("jYYYY/jMM/jDD");
    setEditItem({ title: "", category: "", amount: 0, description: "", date: new Date().toISOString(), dateJalali: todayJalali });
  }

  function openEdit(exp: Expense) {
    const m = moment(exp.date);
    setEditItem({
      id: exp._id,
      title: exp.title,
      category: (exp as Expense & { category?: string }).category || "",
      amount: exp.amount,
      description: exp.description || "",
      date: exp.date,
      dateJalali: m.isValid() ? m.format("jYYYY/jMM/jDD") : "",
    });
  }

  function handleSave() {
    if (!editItem) return;
    if (!editItem.title.trim()) { toast.error("عنوان الزامی است"); return; }
    if (editItem.amount <= 0) { toast.error("مبلغ باید بزرگتر از صفر باشد"); return; }
    createMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="هزینه‌ها"
        description="مدیریت هزینه‌های خشکشویی"
        actions={
          <div className="flex gap-2">
            <PageHelp
              title="راهنمای هزینه‌ها"
              sections={[
                { title: "ثبت هزینه", body: "در این صفحه می‌توانید تمام هزینه‌های خشکشویی خود را ثبت کنید: اجاره، حقوق کارمند، قبض‌ها، مواد اولیه و سایر هزینه‌ها." },
                { title: "افزودن هزینه جدید", body: "با کلیک روی «هزینه جدید»، عنوان، دسته‌بندی، مبلغ و تاریخ هزینه را وارد کنید. تاریخ به‌صورت شمسی انتخاب می‌شود." },
                { title: "ویرایش و حذف", body: "می‌توانید هزینه‌های ثبت شده را ویرایش یا حذف کنید." },
                { title: "آمار هزینه‌ها", body: "مجموع هزینه‌های ماه جاری و میانگین هزینه در بالای صفحه نمایش داده می‌شود." },
              ]}
            />
            <Button onClick={openCreate}><Plus className="size-4 ml-1" /> هزینه جدید</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="هزینه‌های این ماه" value={formatToman(stats?.total ?? 0)} icon={<TrendingDown className="size-5" />} description={`${toPersianDigits(stats?.count ?? 0)} مورد`} />
        <StatCard title="میانگین هزینه" value={formatToman(stats?.count ? Math.round((stats.total ?? 0) / stats.count) : 0)} icon={<Wallet className="size-5" />} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><TableLoading /></div> :
           expenses.length === 0 ? <EmptyState icon={Wallet} title="هزینه‌ای ثبت نشده است" action={<Button onClick={openCreate}><Plus className="size-4 ml-1" /> هزینه جدید</Button>} /> :
           (<>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>عنوان</TableHead>
                   <TableHead>دسته‌بندی</TableHead>
                   <TableHead className="text-center">مبلغ</TableHead>
                   <TableHead>تاریخ</TableHead>
                   <TableHead className="text-left">عملیات</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {expenses.map((exp) => (
                   <TableRow key={exp._id}>
                     <TableCell label="عنوان" className="font-medium">{exp.title}</TableCell>
                     <TableCell label="دسته‌بندی" className="text-sm text-muted-foreground">{(exp as Expense & { category?: string }).category || "—"}</TableCell>
                     <TableCell label="مبلغ" className="text-center font-medium">{formatToman(exp.amount)}</TableCell>
                     <TableCell label="تاریخ" className="text-sm text-muted-foreground">{toJalali(exp.date)}</TableCell>
                     <TableCell label="عملیات">
                       <div className="flex items-center justify-end gap-1">
                         <Button variant="ghost" size="icon" onClick={() => openEdit(exp)}><Edit2 className="size-4" /></Button>
                         <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(exp)}><Trash2 className="size-4" /></Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
             {data?.meta && <Pagination page={data.meta.page} pageSize={data.meta.pageSize} total={data.meta.total} totalPages={data.meta.totalPages} hasNext={data.meta.hasNext} hasPrev={data.meta.hasPrev} onPageChange={setPage} />}
           </>)}
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem?.id ? "ویرایش هزینه" : "هزینه جدید"}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>عنوان *</Label>
                <Input
                  value={editItem.title}
                  onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                  placeholder="مثال: اجاره ماه خرداد"
                />
              </div>
              <div className="space-y-2">
                <Label>دسته‌بندی</Label>
                <Select value={editItem.category} onValueChange={(v) => setEditItem({ ...editItem, category: v })}>
                  <SelectTrigger><SelectValue placeholder="انتخاب دسته" /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>مبلغ (تومان) *</Label>
                  <PriceInput value={editItem.amount} onChange={(v) => setEditItem({ ...editItem, amount: v })} />
                </div>
                <div className="space-y-2">
                  <Label>تاریخ</Label>
                  <div className="relative">
                    <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setShowDatePicker(!showDatePicker)}>
                      <Calendar className="size-4 ml-2" />
                      {editItem.dateJalali || "انتخاب تاریخ"}
                    </Button>
                    {showDatePicker && (
                      <div className="absolute z-50 mt-1 left-0">
                        <JalaliDatePicker
                          value={editItem.dateJalali}
                          onChange={(v) => { setEditItem({ ...editItem, dateJalali: v }); setShowDatePicker(false); }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>توضیحات</Label>
                <Textarea rows={2} value={editItem.description} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>انصراف</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 ml-1" />}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} title="حذف هزینه" description={`آیا از حذف «${deleteTarget?.title}» اطمینان دارید؟`} confirmText="حذف" onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget._id); }} loading={deleteMutation.isPending} />
    </div>
  );
}

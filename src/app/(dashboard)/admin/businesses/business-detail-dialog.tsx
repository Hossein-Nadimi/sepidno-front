"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CreditCard, MessageSquare, BarChart3, Wallet, ShoppingBag, Users, TrendingUp } from "lucide-react";
import { adminService, type AdminBusiness } from "@/services";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatCard } from "@/components/common/stat-card";
import { formatNumber, formatToman, toPersianDigits } from "@/lib/utils";
import { toJalaliDateTime } from "@/lib/jalali";
import toast from "react-hot-toast";

type Period = "monthly" | "quarterly" | "semiAnnual" | "annual";

const PERIOD_LABELS: Record<Period, string> = {
  monthly: "ماهانه",
  quarterly: "سه ماهه",
  semiAnnual: "شش ماهه",
  annual: "سالانه",
};

export function BusinessDetailDialog({
  business,
  open,
  onOpenChange,
}: {
  business: AdminBusiness | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"reports" | "subscription" | "sms">("reports");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedSmsPackageId, setSelectedSmsPackageId] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("monthly");

  // Fetch plans and SMS packages for activation
  const { data: plansData } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => adminService.plans.list({ pageSize: 100 }),
    enabled: open && tab === "subscription",
  });
  const { data: smsPackagesData } = useQuery({
    queryKey: ["admin-sms-packages"],
    queryFn: () => adminService.smsPackagesAdmin.list({ pageSize: 100 }),
    enabled: open && tab === "sms",
  });

  // Fetch reports for this business
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["admin-business-dashboard", business?._id],
    queryFn: () => adminService.businessReports(business!._id).dashboard(),
    enabled: open && tab === "reports" && !!business?._id,
  });

  const { data: revenue } = useQuery({
    queryKey: ["admin-business-revenue", business?._id],
    queryFn: () => adminService.businessReports(business!._id).revenue(),
    enabled: open && tab === "reports" && !!business?._id,
  });

  const { data: ordersReport } = useQuery({
    queryKey: ["admin-business-orders-report", business?._id],
    queryFn: () => adminService.businessReports(business!._id).orders(),
    enabled: open && tab === "reports" && !!business?._id,
  });

  const { data: customersReport } = useQuery({
    queryKey: ["admin-business-customers-report", business?._id],
    queryFn: () => adminService.businessReports(business!._id).customers(),
    enabled: open && tab === "reports" && !!business?._id,
  });

  const activateSubMutation = useMutation({
    mutationFn: () => adminService.businesses.activateSubscription(business!._id, selectedPlanId, selectedPeriod),
    onSuccess: () => {
      toast.success("اشتراک با موفقیت فعال شد");
      queryClient.invalidateQueries({ queryKey: ["admin-active-subscriptions"] });
      setSelectedPlanId("");
      setSelectedPeriod("monthly");
    },
  });

  const activateSmsMutation = useMutation({
    mutationFn: () => adminService.businesses.activateSmsPackage(business!._id, selectedSmsPackageId),
    onSuccess: () => {
      toast.success("بسته پیامک با موفقیت فعال شد");
      queryClient.invalidateQueries({ queryKey: ["admin-business-sms", business?._id] });
      setSelectedSmsPackageId("");
    },
  });

  if (!business) return null;

  const dash = dashboard as {
    todayOrders?: number;
    todayRevenue?: number;
    inProgressCount?: number;
    completedCount?: number;
    readyCount?: number;
    delayedCount?: number;
    newCustomersCount?: number;
  } | undefined;

  const rev = revenue as { totalRevenue?: number; totalOrders?: number; averageOrderValue?: number } | undefined;
  const ordRep = ordersReport as { total?: number; delayed?: number } | undefined;
  const custRep = customersReport as { newCustomers?: number; repeatCustomers?: number; topCustomers?: Array<{ firstName?: string; lastName?: string; totalSpending?: number }> } | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            مدیریت «{business.name}»
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => setTab("reports")}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${tab === "reports" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            گزارشات
          </button>
          <button
            type="button"
            onClick={() => setTab("subscription")}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${tab === "subscription" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            فعال‌سازی اشتراک
          </button>
          <button
            type="button"
            onClick={() => setTab("sms")}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${tab === "sms" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            بسته پیامک
          </button>
        </div>

        {/* Reports tab */}
        {tab === "reports" && (
          <div className="space-y-4 py-2">
            {dashboardLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin" /></div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard title="سفارشات امروز" value={formatNumber(dash?.todayOrders ?? 0)} icon={<ShoppingBag className="size-5" />} />
                  <StatCard title="درآمد امروز" value={formatToman(dash?.todayRevenue ?? 0)} icon={<Wallet className="size-5" />} />
                  <StatCard title="در حال انجام" value={formatNumber(dash?.inProgressCount ?? 0)} icon={<TrendingUp className="size-5" />} />
                  <StatCard title="سفارشات تأخیری" value={formatNumber(dash?.delayedCount ?? 0)} icon={<TrendingUp className="size-5" />} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">درآمد ماه جاری</p>
                      <p className="mt-1 text-lg font-bold text-primary">{formatToman(rev?.totalRevenue ?? 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">سفارشات ماه</p>
                      <p className="mt-1 text-lg font-bold">{toPersianDigits(rev?.totalOrders ?? 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">میانگین سفارش</p>
                      <p className="mt-1 text-lg font-bold">{formatToman(rev?.averageOrderValue ?? 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">مشتریان جدید (ماه)</p>
                      <p className="mt-1 text-lg font-bold">{toPersianDigits(custRep?.newCustomers ?? 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">مشتریان بازگشتی</p>
                      <p className="mt-1 text-lg font-bold">{toPersianDigits(custRep?.repeatCustomers ?? 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">آماده تحویل</p>
                      <p className="mt-1 text-lg font-bold">{toPersianDigits(dash?.readyCount ?? 0)}</p>
                    </CardContent>
                  </Card>
                </div>

                {custRep?.topCustomers && custRep.topCustomers.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">برترین مشتریان</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {custRep.topCustomers.slice(0, 5).map((c, i) => (
                        <div key={i} className="flex items-center justify-between rounded border p-2 text-sm">
                          <span>{c.firstName} {c.lastName}</span>
                          <span className="font-bold">{formatToman(c.totalSpending)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Subscription tab */}
        {tab === "subscription" && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
              با این امکان می‌توانید یک اشتراک را بدون پرداخت برای این خشکشویی فعال کنید.
            </div>
            <div className="space-y-2">
              <Label>انتخاب پلن</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger><SelectValue placeholder="انتخاب پلن" /></SelectTrigger>
                <SelectContent>
                  {plansData?.items.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} — {toPersianDigits(p.monthlyPrice > 0 ? `${p.monthlyPrice.toLocaleString("en-US")} تومان` : "رایگان")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>دوره</Label>
              <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as Period)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!selectedPlanId || activateSubMutation.isPending}
              onClick={() => activateSubMutation.mutate()}
            >
              {activateSubMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4 ml-1" />}
              فعال‌سازی اشتراک
            </Button>
          </div>
        )}

        {/* SMS tab */}
        {tab === "sms" && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
              با این امکان می‌توانید یک بسته پیامک را بدون پرداخت برای این خشکشویی فعال کنید.
            </div>
            <div className="space-y-2">
              <Label>انتخاب بسته پیامک</Label>
              <Select value={selectedSmsPackageId} onValueChange={setSelectedSmsPackageId}>
                <SelectTrigger><SelectValue placeholder="انتخاب بسته" /></SelectTrigger>
                <SelectContent>
                  {smsPackagesData?.items.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.title} — {toPersianDigits(p.smsCount)} پیامک
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!selectedSmsPackageId || activateSmsMutation.isPending}
              onClick={() => activateSmsMutation.mutate()}
            >
              {activateSmsMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4 ml-1" />}
              فعال‌سازی بسته پیامک
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>بستن</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

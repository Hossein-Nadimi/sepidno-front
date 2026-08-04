"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowRight, Loader2, Plus, Trash2, Search, Calendar, Zap,
  ShoppingCart, ChevronLeft, Settings2, UserPlus, Wallet, CheckCircle2,
} from "lucide-react";
import { orderService, customerService, catalogService, pricingService, settingsService, customGarmentService, type CombinedGarmentType } from "@/services";
import type { GarmentType, ServiceType, Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/page-header";
import { JalaliDatePicker } from "@/components/common/jalali-date-picker";
import { PriceInput } from "@/components/common/price-input";
import { CatalogIcon } from "@/components/common/catalog-icon";
import { SearchInput } from "@/components/common/search-input";
import { HelpTip } from "@/components/common/help-tip";
import { useDebounced } from "@/hooks/use-debounced";
import { formatToman, toPersianDigits, cn } from "@/lib/utils";
import { toJalali } from "@/lib/jalali";
import moment from "moment-jalaali";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

const DEFAULT_DAMAGE_ITEMS = [
  { key: "stain", title: "لکه" },
  { key: "tear", title: "پارگی" },
  { key: "broken_button", title: "دکمه شکسته" },
  { key: "broken_zip", title: "زیپ خراب" },
];

interface CartItem {
  garmentType: string;
  garmentTitle: string;
  quantity: number;
  services: string[];
  serviceTitles: string[];
  unitPrice: number;
  customPrices: Record<string, number>;
  /** When true, quantity is meterage (متراژ) and accepts decimals. */
  isPricedPerMeter?: boolean;
  color?: string;
  fabric?: string;
  brand?: string;
  size?: string;
  description?: string;
  damageChecklist: Array<{ key: string; title: string; value: boolean; note?: string }>;
}

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [activeGarment, setActiveGarment] = useState<string>("");
  const [garmentSearch, setGarmentSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [detailForm, setDetailForm] = useState({
    color: "", fabric: "", brand: "", size: "", description: "",
    damageChecklist: DEFAULT_DAMAGE_ITEMS.map((d) => ({ ...d, value: false, note: "" })),
  });
  const [garmentDrafts, setGarmentDrafts] = useState<Record<string, {
    services: string[];
    quantity: number;
    customPrices: Record<string, number>;
    showDetails: boolean;
    detailForm: typeof detailForm;
  }>>({});
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [useCashback, setUseCashback] = useState(false);
  const [isPaidAtRegistration, setIsPaidAtRegistration] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Queries
  const { data: orderData, isLoading } = useQuery({
    queryKey: ["order", params.id],
    queryFn: () => orderService.get(params.id),
    enabled: !!params.id,
  });

  const { data: garments } = useQuery({ queryKey: ["combined-garments"], queryFn: () => customGarmentService.list() });
  const { data: services } = useQuery({ queryKey: ["services"], queryFn: () => catalogService.serviceTypes.all() });
  const { data: colors } = useQuery({ queryKey: ["colors"], queryFn: () => catalogService.colors.all() });
  const { data: fabrics } = useQuery({ queryKey: ["fabrics"], queryFn: () => catalogService.fabricTypes.all() });
  const { data: pricingData } = useQuery({
    queryKey: ["pricing-all"],
    queryFn: () => pricingService.list({ pageSize: 500 }),
  });
  const { data: businessSettings } = useQuery({
    queryKey: ["business-settings"],
    queryFn: () => settingsService.get(),
  });

  // Price map — only include ACTIVE pricing entries.
  const priceMap = new Map<string, number>();
  (pricingData?.items || []).forEach((p) => {
    if (p.active === false) return; // skip inactive pricing
    const g = typeof p.garmentType === "object" ? p.garmentType?._id : p.garmentType;
    const s = typeof p.serviceType === "object" ? p.serviceType?._id : p.serviceType;
    if (g && s) priceMap.set(`${g}-${s}`, p.price);
  });

  const urgentMultiplier = businessSettings?.urgentMultiplier ?? 2;

  function resolveServicePrice(garmentId: string, svcId: string): number {
    const matrix = priceMap.get(`${garmentId}-${svcId}`);
    if (matrix !== undefined) return matrix;
    return manualPrices[svcId] || 0;
  }

  const currentUnitPrice = activeGarment
    ? selectedServices.reduce((sum, svcId) => sum + resolveServicePrice(activeGarment, svcId), 0)
    : 0;

  // Is the active garment priced per meter? (e.g. پرده)
  const activeGarmentIsPerMeter = activeGarment
    ? (garments?.find((g: CombinedGarmentType) => g._id === activeGarment)?.isPricedPerMeter ?? false)
    : false;

  // Cart totals
  const totalPrice = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const afterDiscount = Math.max(0, totalPrice - discount);
  const beforeCashback = urgent ? Math.round(afterDiscount * urgentMultiplier) : afterDiscount;
  const customerCashback = selectedCustomer?.currentCashbackBalance ?? 0;
  const cashbackToUse = useCashback ? Math.min(customerCashback, beforeCashback) : 0;
  const finalPrice = Math.max(0, beforeCashback - cashbackToUse);

  // Populate state from loaded order
  useEffect(() => {
    if (orderData && !loaded) {
      const customer = typeof orderData.customer === "object" ? orderData.customer as Customer : null;
      setSelectedCustomer(customer);

      const m = moment(orderData.deliveryDate);
      setDeliveryDate(m.isValid() ? m.format("jYYYY/jMM/jDD") : "");

      setDiscount(orderData.discount || 0);
      setNotes(orderData.notes || "");
      setUrgent(orderData.urgent || false);
      setIsPaidAtRegistration((orderData as { isPaidAtRegistration?: boolean }).isPaidAtRegistration || false);

      // Build cart from order items
      const items: CartItem[] = (orderData.items || []).map((item) => {
        const garment = typeof item.garmentType === "object" ? item.garmentType : null;
        const garmentId = garment?._id || String(item.garmentType);
        const svcList = (item.services || []).map((s) => typeof s === "object" ? (s as { _id: string })._id : s);
        const svcTitles = (item.services || []).map((s) => typeof s === "object" ? (s as { title?: string }).title || "" : "");
        const unitPrice = item.unitPrice || 0;
        const colorVal = item.color ? (typeof item.color === "object" ? (item.color as { _id: string })._id : String(item.color)) : undefined;
        const fabricVal = item.fabric ? (typeof item.fabric === "object" ? (item.fabric as { _id: string })._id : String(item.fabric)) : undefined;
        // Look up isPricedPerMeter from the garments list
        const combined = (garments || []).find((g: CombinedGarmentType) => g._id === garmentId);
        return {
          garmentType: garmentId,
          garmentTitle: garment?.title || "",
          quantity: item.quantity,
          services: svcList,
          serviceTitles: svcTitles,
          unitPrice,
          customPrices: (item as { customPrices?: Record<string, number> }).customPrices || {},
          isPricedPerMeter: combined?.isPricedPerMeter ?? false,
          color: colorVal,
          fabric: fabricVal,
          brand: item.brand || undefined,
          size: item.size || undefined,
          description: item.description || undefined,
          damageChecklist: item.damageChecklist || [],
        };
      });
      setCart(items);
      setLoaded(true);
    }
  }, [orderData, loaded]);

  // Switch garment tab
  function switchGarmentTab(newGarmentId: string) {
    if (newGarmentId === activeGarment) return;
    if (activeGarment) {
      setGarmentDrafts((prev) => ({
        ...prev,
        [activeGarment]: {
          services: selectedServices,
          quantity,
          customPrices: { ...manualPrices },
          showDetails,
          detailForm,
        },
      }));
    }
    const draft = newGarmentId ? garmentDrafts[newGarmentId] : undefined;
    if (draft) {
      setSelectedServices(draft.services);
      setQuantity(draft.quantity);
      setManualPrices(draft.customPrices);
      setShowDetails(draft.showDetails);
      setDetailForm(draft.detailForm);
    } else {
      setSelectedServices([]);
      setQuantity(1);
      setManualPrices({});
      setShowDetails(false);
      setDetailForm({
        color: "", fabric: "", brand: "", size: "", description: "",
        damageChecklist: DEFAULT_DAMAGE_ITEMS.map((d) => ({ ...d, value: false, note: "" })),
      });
    }
    setActiveGarment(newGarmentId);
  }

  // Add to cart — adds ALL garments with selected services
  function addToCart() {
    const allDrafts: Record<string, {
      services: string[];
      quantity: number;
      customPrices: Record<string, number>;
      showDetails: boolean;
      detailForm: typeof detailForm;
    }> = { ...garmentDrafts };

    if (activeGarment && selectedServices.length > 0) {
      allDrafts[activeGarment] = {
        services: selectedServices,
        quantity,
        customPrices: { ...manualPrices },
        showDetails,
        detailForm,
      };
    }

    const garmentIdsWithData = Object.keys(allDrafts).filter((gid) => allDrafts[gid].services.length > 0);

    if (garmentIdsWithData.length === 0) {
      toast.error("حداقل برای یک لباس، خدمت انتخاب کنید");
      return;
    }

    // Validate prices
    for (const gid of garmentIdsWithData) {
      const draft = allDrafts[gid];
      const missingPrice = draft.services.find((svcId) => {
        const matrix = priceMap.get(`${gid}-${svcId}`);
        const manual = draft.customPrices[svcId];
        return matrix === undefined && (!manual || manual <= 0);
      });
      if (missingPrice) {
        const svc = services?.find((s) => s._id === missingPrice);
        const garment = garments?.find((g: CombinedGarmentType) => g._id === gid);
        toast.error(`قیمت برای «${garment?.title || ""}» → «${svc?.title || ""}» وارد نشده است`);
        switchGarmentTab(gid);
        return;
      }
    }

    // Add each garment to cart
    const newCart = [...cart];
    let addedCount = 0;

    for (const gid of garmentIdsWithData) {
      const draft = allDrafts[gid];
      const garment = garments?.find((g: CombinedGarmentType) => g._id === gid);
      const svcTitles = draft.services.map((id) => services?.find((s) => s._id === id)?.title || "");

      const customPrices: Record<string, number> = {};
      draft.services.forEach((svcId) => {
        const matrix = priceMap.get(`${gid}-${svcId}`);
        if (matrix === undefined) {
          customPrices[svcId] = draft.customPrices[svcId] || 0;
        }
      });

      const unitPrice = draft.services.reduce((sum, svcId) => {
        const matrix = priceMap.get(`${gid}-${svcId}`);
        if (matrix !== undefined) return sum + matrix;
        return sum + (draft.customPrices[svcId] || 0);
      }, 0);

      const existingIdx = newCart.findIndex(
        (item) => item.garmentType === gid &&
        JSON.stringify(item.services.sort()) === JSON.stringify([...draft.services].sort())
      );

      if (existingIdx >= 0) {
        newCart[existingIdx].quantity += draft.quantity;
      } else {
        newCart.push({
          garmentType: gid,
          garmentTitle: garment?.title || "",
          quantity: draft.quantity,
          services: [...draft.services],
          serviceTitles: svcTitles,
          unitPrice,
          customPrices,
          isPricedPerMeter: garment?.isPricedPerMeter ?? false,
          color: draft.detailForm.color || undefined,
          fabric: draft.detailForm.fabric || undefined,
          brand: draft.detailForm.brand || undefined,
          size: draft.detailForm.size || undefined,
          description: draft.detailForm.description || undefined,
          damageChecklist: draft.detailForm.damageChecklist,
        });
      }
      addedCount++;
    }

    setCart(newCart);
    if (addedCount > 1) {
      toast.success(`${toPersianDigits(addedCount)} آیتم به سبد اضافه شد`);
    } else {
      toast.success("آیتم به سبد اضافه شد");
    }

    // Reset
    setSelectedServices([]);
    setQuantity(1);
    setManualPrices({});
    setShowDetails(false);
    setDetailForm({
      color: "", fabric: "", brand: "", size: "", description: "",
      damageChecklist: DEFAULT_DAMAGE_ITEMS.map((d) => ({ ...d, value: false, note: "" })),
    });
    setGarmentDrafts({});
  }

  function removeFromCart(idx: number) {
    setCart(cart.filter((_, i) => i !== idx));
  }

  function updateCartQty(idx: number, qty: number) {
    const isPerMeter = cart[idx]?.isPricedPerMeter;
    const min = isPerMeter ? 0.1 : 1;
    if (qty < min) return;
    const next = [...cart];
    next[idx].quantity = isPerMeter ? Math.round(qty * 100) / 100 : Math.floor(qty);
    setCart(next);
  }

  // Update order
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!deliveryDate) throw new Error("تاریخ تحویل را انتخاب کنید");
      // Send Jalali date directly — backend converts via jalaliDayRange()
      return orderService.update(params.id, {
        deliveryDate,
        discount,
        notes,
        urgent,
        isPaidAtRegistration,
        items: cart.map((item) => ({
          garmentType: item.garmentType,
          quantity: item.quantity,
          services: item.services,
          color: item.color || "",
          fabric: item.fabric || "",
          brand: item.brand || "",
          size: item.size || "",
          description: item.description || "",
          images: [],
          damageChecklist: item.damageChecklist,
          customPrices: item.customPrices,
        })),
      });
    },
    onSuccess: () => {
      toast.success("سفارش با موفقیت به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", params.id] });
      queryClient.invalidateQueries({ queryKey: ["orders-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.push(`/orders/${params.id}`);
    },
  });

  function handleSubmit() {
    if (!selectedCustomer) {
      toast.error("مشتری را انتخاب کنید");
      return;
    }
    if (cart.length === 0) {
      toast.error("سبد خرید خالی است");
      return;
    }
    if (!deliveryDate) {
      toast.error("تاریخ تحویل را انتخاب کنید");
      return;
    }
    updateMutation.mutate();
  }

  const todayJalali = moment().format("jYYYY/jMM/jDD");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="ویرایش سفارش" />
        <div className="p-4">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="space-y-6">
        <PageHeader title="ویرایش سفارش" />
        <div className="p-4">سفارش یافت نشد</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="ویرایش سفارش"
        description={`شماره سفارش: ${orderData.orderNumber}`}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowRight className="size-4 ml-1" />
            بازگشت
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Garment selection + services */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer (read-only in edit mode) */}
          <Card>
            <CardHeader><CardTitle>مشتری</CardTitle></CardHeader>
            <CardContent>
              {selectedCustomer && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">{selectedCustomer.mobile}</p>
                  </div>
                </div>
              )}
              {customerCashback > 0 && (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      موجودی کش‌بک: {formatToman(customerCashback)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Garment selection — category tabs + garment buttons (matches order create page) */}
          <Card>
            <CardHeader><CardTitle className="text-base">انتخاب لباس و خدمات (افزودن آیتم جدید)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {/* Search bar */}
              <SearchInput
                value={garmentSearch}
                onChange={setGarmentSearch}
                placeholder="جستجوی نوع لباس..."
                className="w-full"
              />

              {(() => {
                // Require at least 2 characters before filtering
                const q = garmentSearch.trim().toLowerCase();
                const filtered = (garments || []).filter((g: CombinedGarmentType) => {
                  if (q.length < 2) return true; // show all when < 2 chars
                  return g.title.toLowerCase().includes(q) || (g.category || "").toLowerCase().includes(q);
                });

                const grouped = new Map<string, CombinedGarmentType[]>();
                for (const g of filtered) {
                  const cat = g.category || "سایر";
                  if (!grouped.has(cat)) grouped.set(cat, []);
                  grouped.get(cat)!.push(g);
                }

                if (grouped.size === 0) return <p className="py-4 text-center text-sm text-muted-foreground">لباسی یافت نشد</p>;

                const isSearching = q.length >= 2;
                // Sort categories alphabetically (Persian)
                const cats = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0], "fa"));

                return (
                  <>
                    {/* Category tabs — horizontal row */}
                    <div className="flex flex-wrap gap-2">
                      {cats.map(([cat, items]) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const next = new Set(expandedCategories);
                            next.clear();
                            next.add(cat);
                            setExpandedCategories(next);
                          }}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors sm:text-sm",
                            isSearching || expandedCategories.has(cat)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card hover:bg-accent",
                          )}
                        >
                          {cat} <span className="opacity-60">({toPersianDigits(items.length)})</span>
                        </button>
                      ))}
                    </div>

                    {/* Garment buttons for active/searched categories */}
                    {cats.map(([cat, items]) => {
                      const isOpen = isSearching || expandedCategories.has(cat);
                      if (!isOpen) return null;
                      return (
                        <div key={cat} className="rounded-lg border bg-muted/20 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                              {cat}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {items.map((g: CombinedGarmentType) => (
                              <button
                                key={g._id}
                                type="button"
                                onClick={() => switchGarmentTab(g._id)}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                                  activeGarment === g._id
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card hover:bg-accent"
                                )}
                              >
                                <CatalogIcon icon={g.icon} image={g.image} size={16} className={activeGarment === g._id ? "text-primary-foreground" : "text-muted-foreground"} />
                                {g.title}
                                {g.isCustom && <span className="mr-1 text-xs opacity-60">★</span>}
                                {g.isPricedPerMeter && (
                                  <span className={cn("rounded px-1 text-[10px]", activeGarment === g._id ? "bg-primary-foreground/20" : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400")}>متر</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {activeGarment && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                {/* Services for selected garment — 2-column grid (matches order create page) */}
                <div className="space-y-2">
                  <Label>خدمات</Label>
                  <div className="grid grid-cols-1 gap-2 rounded-lg border p-2 sm:grid-cols-2 sm:p-3">
                    {services?.map((s: ServiceType) => {
                      const checked = selectedServices.includes(s._id);
                      const price = priceMap.get(`${activeGarment}-${s._id}`);
                      return (
                        <div key={s._id} className="flex flex-col gap-2 rounded-md p-2 hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-2">
                          <div className="flex items-center gap-2 sm:flex-1">
                            <Checkbox
                              id={`svc-${s._id}`}
                              checked={checked}
                              onCheckedChange={(v) => {
                                setSelectedServices(v ? [...selectedServices, s._id] : selectedServices.filter((x) => x !== s._id));
                              }}
                            />
                            <CatalogIcon icon={s.icon} image={s.image} size={16} className="text-muted-foreground" />
                            <Label htmlFor={`svc-${s._id}`} className="cursor-pointer text-sm">
                              {s.title}
                            </Label>
                          </div>
                          {checked && (
                            <div className="pr-7 sm:pr-0">
                              {price !== undefined ? (
                                <span className="text-sm text-muted-foreground">{formatToman(price)}</span>
                              ) : (
                                <PriceInput
                                  placeholder="قیمت دستی"
                                  className="h-8 w-full sm:w-28"
                                  value={manualPrices[s._id] ?? 0}
                                  onChange={(v) => {
                                    setManualPrices((prev) => ({
                                      ...prev,
                                      [s._id]: v,
                                    }));
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setQuantity(Math.max(activeGarmentIsPerMeter ? 0.1 : 1, +(quantity - (activeGarmentIsPerMeter ? 0.5 : 1)).toFixed(2)))}
                      >-</Button>
                      <Input
                        type="number"
                        min={activeGarmentIsPerMeter ? 0.1 : 1}
                        step={activeGarmentIsPerMeter ? 0.1 : 1}
                        value={quantity}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setQuantity(activeGarmentIsPerMeter ? Math.max(0.1, v) : Math.max(1, Math.floor(v)));
                        }}
                        className="w-20 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setQuantity(+(quantity + (activeGarmentIsPerMeter ? 0.5 : 1)).toFixed(2))}
                      >+</Button>
                      <span className="mr-1 text-sm text-muted-foreground whitespace-nowrap">
                        {activeGarmentIsPerMeter ? "متر" : "عدد"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      قیمت {activeGarmentIsPerMeter ? "هر متر" : "واحد"}: {formatToman(currentUnitPrice)} | جمع: {formatToman(currentUnitPrice * quantity)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Settings2 className="size-4" />
                    مشخصات بیشتر (اختیاری)
                    <ChevronLeft className={cn("size-4 transition-transform", showDetails && "rotate-90")} />
                  </button>

                  {showDetails && (
                    <div className="space-y-4 rounded-lg border border-dashed p-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label className="text-xs">رنگ</Label>
                          <Select value={detailForm.color} onValueChange={(v) => setDetailForm({ ...detailForm, color: v })}>
                            <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {colors?.map((c) => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">پارچه</Label>
                          <Select value={detailForm.fabric} onValueChange={(v) => setDetailForm({ ...detailForm, fabric: v })}>
                            <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {fabrics?.map((f) => <SelectItem key={f._id} value={f._id}>{f.title}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">سایز</Label>
                          <Input className="h-8" value={detailForm.size} onChange={(e) => setDetailForm({ ...detailForm, size: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">برند</Label>
                        <Input className="h-8" value={detailForm.brand} onChange={(e) => setDetailForm({ ...detailForm, brand: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">توضیحات</Label>
                        <Textarea rows={2} value={detailForm.description} onChange={(e) => setDetailForm({ ...detailForm, description: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">چک‌لیست آسیب</Label>
                        <div className="space-y-2 rounded border p-2">
                          {detailForm.damageChecklist.map((d, di) => (
                            <div key={di} className="flex items-center gap-3">
                              <Checkbox
                                id={`dmg-${di}`}
                                checked={d.value}
                                onCheckedChange={(v) => {
                                  const next = [...detailForm.damageChecklist];
                                  next[di] = { ...d, value: !!v };
                                  setDetailForm({ ...detailForm, damageChecklist: next });
                                }}
                              />
                              <Label htmlFor={`dmg-${di}`} className="cursor-pointer text-sm">{d.title}</Label>
                              <Input className="h-7 flex-1" placeholder="توضیح" value={d.note || ""}
                                onChange={(e) => {
                                  const next = [...detailForm.damageChecklist];
                                  next[di] = { ...d, note: e.target.value };
                                  setDetailForm({ ...detailForm, damageChecklist: next });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="button" onClick={addToCart} className="w-full" size="lg">
                    <Plus className="size-4 ml-1" />
                    افزودن به سبد
                  </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Cart + order info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5" />
                سبد سفارش
              </CardTitle>
              {cart.length > 0 && <Badge variant="secondary">{toPersianDigits(cart.length)} آیتم</Badge>}
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">سبد خالی است</p>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.garmentTitle}</p>
                        <p className="text-xs text-muted-foreground">{item.serviceTitles.join("، ")}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => removeFromCart(idx)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-6"
                          onClick={() => updateCartQty(idx, +(item.quantity - (item.isPricedPerMeter ? 0.5 : 1)).toFixed(2))}
                        >-</Button>
                        <span className="w-10 text-center text-sm font-medium">{toPersianDigits(item.quantity)}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-6"
                          onClick={() => updateCartQty(idx, +(item.quantity + (item.isPricedPerMeter ? 0.5 : 1)).toFixed(2))}
                        >+</Button>
                        <span className="mr-1 text-xs text-muted-foreground">
                          {item.isPricedPerMeter ? "متر" : "عدد"}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{formatToman(item.unitPrice * item.quantity)}</span>
                    </div>
                  </div>
                ))
              )}
              {cart.length > 0 && (
                <div className="border-t pt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>جمع کل</span>
                    <span>{formatToman(totalPrice)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>اطلاعات سفارش</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>تاریخ تحویل</Label>
                <div className="relative">
                  <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setShowDatePicker(!showDatePicker)}>
                    <Calendar className="size-4 ml-2" />
                    {deliveryDate || "انتخاب تاریخ"}
                  </Button>
                  {showDatePicker && (
                    <div className="absolute z-50 mt-1 left-0">
                      <JalaliDatePicker value={deliveryDate} onChange={(v) => { setDeliveryDate(v); setShowDatePicker(false); }} minDate={todayJalali} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>تخفیف (تومان)</Label>
                <PriceInput value={discount} onChange={setDiscount} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">سفارش فوری</p>
                    <p className="text-xs text-muted-foreground">ضریب: {toPersianDigits(urgentMultiplier)} برابر</p>
                  </div>
                </div>
                <Switch checked={urgent} onCheckedChange={setUrgent} />
              </div>

              {/* Paid at registration — matches order create page */}
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">پرداخت شده هنگام ثبت</p>
                    <HelpTip content="اگر مشتری هنگام ثبت سفارش مبلغ را نقداً پرداخت کرده است، این گزینه را فعال کنید. در زمان تحویل دیگر از مشتری طلب وجه نخواهد بود." />
                    <p className="text-xs text-muted-foreground">هزینه سفارش در زمان ثبت تسویه شده</p>
                  </div>
                </div>
                <Switch checked={isPaidAtRegistration} onCheckedChange={setIsPaidAtRegistration} />
              </div>

              <div className="space-y-2">
                <Label>یادداشت</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="space-y-2 p-4">
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">جمع کل</span>
                  <span>{formatToman(totalPrice)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">تخفیف</span>
                  <span>- {formatToman(discount)}</span>
                </div>
              )}
              {urgent && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>ضریب فوری (×{toPersianDigits(urgentMultiplier)})</span>
                  <span>+ {formatToman(afterDiscount * (urgentMultiplier - 1))}</span>
                </div>
              )}
              {cashbackToUse > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>کش‌بک</span>
                  <span>- {formatToman(cashbackToUse)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>مبلغ نهایی</span>
                <span className="text-primary">{formatToman(finalPrice)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={updateMutation.isPending || cart.length === 0}
            onClick={handleSubmit}
          >
            {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "به‌روزرسانی سفارش"}
          </Button>
        </div>
      </div>
    </div>
  );
}

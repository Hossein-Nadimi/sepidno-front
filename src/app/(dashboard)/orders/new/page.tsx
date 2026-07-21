"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowRight, Loader2, Plus, Trash2, Search, Calendar, Zap,
  ShoppingCart, ChevronLeft, Settings2, UserPlus, Wallet,
} from "lucide-react";
import { orderService, customerService, catalogService, pricingService, settingsService, customGarmentService, type CombinedGarmentType } from "@/services";
import type { GarmentType, ServiceType, Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/common/page-header";
import { PageHelp } from "@/components/common/page-help";
import { JalaliDatePicker } from "@/components/common/jalali-date-picker";
import { PriceInput } from "@/components/common/price-input";
import { useDebounced } from "@/hooks/use-debounced";
import { formatToman, toPersianDigits, cn } from "@/lib/utils";
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
  // Optional details
  color?: string;
  fabric?: string;
  brand?: string;
  size?: string;
  description?: string;
  damageChecklist: Array<{ key: string; title: string; value: boolean; note?: string }>;
}

export default function NewOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [activeGarment, setActiveGarment] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [detailForm, setDetailForm] = useState({
    color: "", fabric: "", brand: "", size: "", description: "",
    damageChecklist: DEFAULT_DAMAGE_ITEMS.map((d) => ({ ...d, value: false, note: "" })),
  });
  /**
   * Per-garment draft state — preserves the user's in-progress input for each
   * garment tab so switching tabs does not lose unsaved data. The draft is
   * cleared only when "add to cart" is clicked.
   */
  const [garmentDrafts, setGarmentDrafts] = useState<Record<string, {
    services: string[];
    quantity: number;
    customPrices: Record<string, number>;
    showDetails: boolean;
    detailForm: typeof detailForm;
  }>>({});
  /** Manual price overrides entered for the currently-active garment. Key = serviceId. */
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    birthDate: "",
    gender: "" as "" | "male" | "female",
  });
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [useCashback, setUseCashback] = useState(true);
  const debouncedSearch = useDebounced(customerSearch, 400);

  // Detect phone-number-like search (digits, +, spaces) to auto-fill mobile field
  const phoneLikeRegex = /^[0-9+\s]{4,}$/;
  const searchLooksLikePhone = phoneLikeRegex.test(customerSearch.trim());

  // Queries
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

  // Customer search
  const { data: customerResults, isLoading: searchingCustomers } = useQuery({
    queryKey: ["customers-search", debouncedSearch],
    queryFn: () => customerService.list({ search: debouncedSearch, pageSize: 10 }),
    enabled: debouncedSearch.length >= 3,
  });

  // Price map
  const priceMap = new Map<string, number>();
  (pricingData?.items || []).forEach((p) => {
    const g = typeof p.garmentType === "object" ? p.garmentType._id : p.garmentType;
    const s = typeof p.serviceType === "object" ? p.serviceType._id : p.serviceType;
    priceMap.set(`${g}-${s}`, p.price);
  });

  const urgentMultiplier = businessSettings?.urgentMultiplier ?? 2;

  /**
   * Resolve the unit price for a (garment, service) pair.
   *  - If a catalog matrix price exists, use it.
   *  - Otherwise, fall back to the user-entered manual price from `manualPrices`.
   *  - If neither exists, returns 0 (the caller must require manual entry).
   */
  function resolveServicePrice(garmentId: string, svcId: string): number {
    const matrix = priceMap.get(`${garmentId}-${svcId}`);
    if (matrix !== undefined) return matrix;
    return manualPrices[svcId] || 0;
  }

  // Calculate current item price (sum across selected services)
  const currentUnitPrice = activeGarment
    ? selectedServices.reduce((sum, svcId) => sum + resolveServicePrice(activeGarment, svcId), 0)
    : 0;

  // Cart totals
  const totalPrice = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const afterDiscount = Math.max(0, totalPrice - discount);
  const beforeCashback = urgent ? Math.round(afterDiscount * urgentMultiplier) : afterDiscount;
  // Customer's available cashback balance
  const customerCashback = selectedCustomer?.currentCashbackBalance ?? 0;
  // Cashback to use = min(customer balance, beforeCashback) if useCashback is on
  const cashbackToUse = useCashback ? Math.min(customerCashback, beforeCashback) : 0;
  const finalPrice = Math.max(0, beforeCashback - cashbackToUse);

  // Create customer inline
  const createCustomerMutation = useMutation({
    mutationFn: () => {
      // Convert Jalali birth date to ISO if provided
      let birthDateISO: string | undefined;
      if (newCustomer.birthDate) {
        const m = moment(newCustomer.birthDate, "jYYYY/jMM/jDD", true);
        if (m.isValid()) birthDateISO = m.toDate().toISOString();
      }
      const mobileValue = newCustomer.mobile || (searchLooksLikePhone ? customerSearch.trim() : "");
      return customerService.create({
        firstName: newCustomer.firstName || undefined,
        lastName: newCustomer.lastName,
        mobile: mobileValue,
        birthDate: birthDateISO,
        gender: newCustomer.gender || undefined,
      });
    },
    onSuccess: (customer: Customer) => {
      toast.success("مشتری جدید ایجاد شد");
      setSelectedCustomer(customer);
      setCustomerSearch(`${customer.firstName} ${customer.lastName} - ${customer.mobile}`);
      setShowCustomerSearch(false);
      setNewCustomer({ firstName: "", lastName: "", mobile: "", birthDate: "", gender: "" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  // Create order
  const createMutation = useMutation({
    mutationFn: () => {
      const m = moment(deliveryDate, "jYYYY/jMM/jDD", true);
      if (!m.isValid()) throw new Error("Invalid date");
      return orderService.create({
        customer: selectedCustomer!._id,
        deliveryDate: m.toDate().toISOString(),
        discount,
        notes,
        urgent,
        useCashback,
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
      toast.success("سفارش با موفقیت ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.push("/orders");
    },
  });

  // Switch active garment tab — saves the current draft and restores the
  // draft for the newly-selected garment (if any).
  function switchGarmentTab(newGarmentId: string) {
    if (newGarmentId === activeGarment) return;
    // Save current state into garmentDrafts[activeGarment]
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
    // Restore draft for the new garment (or reset to empty)
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

  // Add to cart — adds ALL garments that have at least one service selected.
  // This includes the currently active garment AND all saved drafts.
  function addToCart() {
    // First, save the current active garment's state into the drafts map
    // so we can process all garments uniformly.
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

    // Collect all garment IDs that have at least one service selected
    const garmentIdsWithData = Object.keys(allDrafts).filter((gid) => allDrafts[gid].services.length > 0);

    if (garmentIdsWithData.length === 0) {
      toast.error("حداقل برای یک لباس، خدمت انتخاب کنید");
      return;
    }

    // Validate prices for ALL garments before adding any to cart
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
        // Switch to that garment tab so the user can fix it
        switchGarmentTab(gid);
        return;
      }
    }

    // All good — add each garment to cart
    const newCart = [...cart];
    let addedCount = 0;

    for (const gid of garmentIdsWithData) {
      const draft = allDrafts[gid];
      const garment = garments?.find((g: CombinedGarmentType) => g._id === gid);
      const svcTitles = draft.services.map((id) => services?.find((s) => s._id === id)?.title || "");

      // Build customPrices map for services without matrix price
      const customPrices: Record<string, number> = {};
      draft.services.forEach((svcId) => {
        const matrix = priceMap.get(`${gid}-${svcId}`);
        if (matrix === undefined) {
          customPrices[svcId] = draft.customPrices[svcId] || 0;
        }
      });

      // Compute unit price
      const unitPrice = draft.services.reduce((sum, svcId) => {
        const matrix = priceMap.get(`${gid}-${svcId}`);
        if (matrix !== undefined) return sum + matrix;
        return sum + (draft.customPrices[svcId] || 0);
      }, 0);

      // Check if same garment + same services already in cart → increment quantity
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
    } else if (addedCount === 1) {
      // Check if it was a new item or quantity increment
      const wasNew = newCart.length > cart.length;
      toast.success(wasNew ? "آیتم به سبد اضافه شد" : "تعداد آیتم در سبد افزایش یافت");
    }

    // Reset everything: clear current selection AND all drafts
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

  // Remove from cart
  function removeFromCart(idx: number) {
    setCart(cart.filter((_, i) => i !== idx));
  }

  // Update quantity in cart
  function updateCartQty(idx: number, qty: number) {
    if (qty < 1) return;
    const next = [...cart];
    next[idx].quantity = qty;
    setCart(next);
  }

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
    // Check for items with 0 price that need manual pricing
    const needsPrice = cart.some((item) => item.unitPrice === 0 && Object.values(item.customPrices).every((v) => v === 0));
    if (needsPrice) {
      toast.error("برخی آیتم‌ها قیمت ندارند. لطفاً قیمت دستی وارد کنید");
      return;
    }
    createMutation.mutate();
  }

  const todayJalali = moment().format("jYYYY/jMM/jDD");

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="سفارش جدید"
        actions={
          <div className="flex gap-2">
            <PageHelp
              title="راهنمای ثبت سفارش"
              sections={[
                { title: "۱. انتخاب مشتری", body: "ابتدا نام یا موبایل مشتری را جستجو کنید. اگر مشتری جدید است، فرم زیر جستجو را پر کنید و «افزودن مشتری» را بزنید." },
                { title: "۲. انتخاب لباس و خدمات", body: "روی تب لباس مورد نظر بزنید (مثلاً پیراهن، شلوار). سپس خدمت‌های مورد نظر را تیک بزنید. اگر قیمت تعریف نشده، قیمت دستی وارد کنید.\nمی‌توانید چند لباس را پر کنید و بین تب‌ها جابجا شوید — اطلاعات هر تب حفظ می‌شود." },
                { title: "۳. افزودن به سبد", body: "بعد از تکمیل تمام لباس‌ها، دکمه «افزودن به سبد» را بزنید. تمام لباس‌هایی که خدمت انتخاب کرده‌اید به سبد اضافه می‌شوند." },
                { title: "۴. اطلاعات سفارش", body: "تاریخ تحویل را انتخاب کنید. اگر تخفیف دارید وارد کنید. سفارش فوری را فعال کنید اگر مشتری عجله دارد (مبلغ بر اساس ضریب فوری ضرب می‌شود)." },
                { title: "۵. ثبت سفارش", body: "بعد از اطمینان از سبد و اطلاعات، دکمه «ثبت سفارش» را بزنید. اگر پیامک فعال باشد، به‌طور خودکار برای مشتری پیامک ثبت سفارش ارسال می‌شود." },
                { title: "کش‌بک", body: "اگر مشتری اعتبار کش‌بک دارد، می‌توانید آن را در این سفارش استفاده کنید. موجودی کش‌بک از مبلغ نهایی کسر می‌شود." },
              ]}
            />
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowRight className="size-4 ml-1" />
              بازگشت
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Garment selection + services */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <Card>
            <CardHeader><CardTitle className="text-base">مشتری</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selectedCustomer ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                      <p className="text-sm text-muted-foreground" dir="ltr">{selectedCustomer.mobile}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch("");
                      setShowCustomerSearch(true);
                      setUseCashback(false);
                    }}>تغییر</Button>
                  </div>
                  {customerCashback > 0 && (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <Wallet className="size-4 text-emerald-600 shrink-0" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          موجودی: {formatToman(customerCashback)}
                        </span>
                      </div>
                      <Switch checked={useCashback} onCheckedChange={setUseCashback} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="جستجوی نام یا موبایل..."
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerSearch(true); }}
                      onFocus={() => setShowCustomerSearch(true)}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowCustomerSearch(!showCustomerSearch)} className="shrink-0">
                      <Search className="size-4" />
                    </Button>
                  </div>

                  {showCustomerSearch && customerSearch.length >= 3 && (
                    <div className="max-h-60 overflow-y-auto rounded-lg border bg-popover">
                      {searchingCustomers ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">در حال جستجو...</div>
                      ) : customerResults?.items?.length ? (
                        customerResults.items.map((c) => (
                          <button key={c._id} type="button" onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch(`${c.firstName} ${c.lastName} - ${c.mobile}`);
                            setShowCustomerSearch(false);
                          }} className="flex w-full items-center justify-between border-b px-3 py-2.5 text-sm hover:bg-accent">
                            <span className="truncate">{c.firstName} {c.lastName}</span>
                            <span dir="ltr" className="text-xs text-muted-foreground shrink-0 mr-2">{c.mobile}</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center">
                          <p className="mb-2 text-sm text-muted-foreground">مشتری یافت نشد</p>
                        </div>
                      )}
                    </div>
                  )}

                  {showCustomerSearch && (!customerResults?.items?.length || customerSearch.length < 3) && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="mb-3 flex items-center gap-2">
                        <UserPlus className="size-4 text-primary" />
                        <p className="text-sm font-medium">افزودن مشتری جدید</p>
                        {searchLooksLikePhone && (
                          <Badge variant="secondary" className="text-xs">از جستجو</Badge>
                        )}
                      </div>
                      {/* Mobile: single column; Desktop: 3 columns */}
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">نام (اختیاری)</Label>
                          <Input value={newCustomer.firstName} onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">نام خانوادگی *</Label>
                          <Input value={newCustomer.lastName} onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">موبایل</Label>
                          <Input
                            dir="ltr"
                            value={newCustomer.mobile || (searchLooksLikePhone ? customerSearch.trim() : "")}
                            onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                            placeholder="0912..."
                          />
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">تاریخ تولد (اختیاری)</Label>
                          <div className="relative">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setShowBirthDatePicker(!showBirthDatePicker)}
                            >
                              <Calendar className="size-4 ml-2" />
                              {newCustomer.birthDate || "انتخاب تاریخ"}
                            </Button>
                            {showBirthDatePicker && (
                              <div className="absolute z-50 mt-1 left-0">
                                <JalaliDatePicker
                                  value={newCustomer.birthDate}
                                  onChange={(v) => {
                                    setNewCustomer({ ...newCustomer, birthDate: v });
                                    setShowBirthDatePicker(false);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">جنسیت (اختیاری)</Label>
                          <Select
                            value={newCustomer.gender}
                            onValueChange={(v) => setNewCustomer({ ...newCustomer, gender: v as "male" | "female" })}
                          >
                            <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">آقا</SelectItem>
                              <SelectItem value="female">خانم</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button type="button" size="sm" className="mt-3 w-full sm:w-auto"
                        disabled={!newCustomer.lastName || (!newCustomer.mobile && !searchLooksLikePhone) || createCustomerMutation.isPending}
                        onClick={() => {
                          if (!newCustomer.mobile && searchLooksLikePhone) {
                            setNewCustomer({ ...newCustomer, mobile: customerSearch.trim() });
                          }
                          createCustomerMutation.mutate();
                        }}>
                        {createCustomerMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4 ml-1" />}
                        افزودن مشتری
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Garment tabs — wrapping grid instead of horizontal scroll */}
          <Card>
            <CardHeader><CardTitle className="text-base">انتخاب لباس و خدمات</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Garment selection — wrapping grid (mobile-friendly, no horizontal scroll) */}
              <div className="flex flex-wrap gap-2">
                {garments?.map((g: CombinedGarmentType) => (
                  <button
                    key={g._id}
                    type="button"
                    onClick={() => switchGarmentTab(g._id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      activeGarment === g._id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    )}
                  >
                    {g.title}
                    {g.isCustom && <span className="mr-1 text-xs opacity-60">★</span>}
                  </button>
                ))}
              </div>

              {activeGarment && (
                <>
                  {/* Services for selected garment */}
                  <div className="space-y-2">
                    <Label>خدمات</Label>
                    <div className="space-y-2 rounded-lg border p-2 sm:p-3">
                      {services?.map((s: ServiceType) => {
                        const checked = selectedServices.includes(s._id);
                        const price = priceMap.get(`${activeGarment}-${s._id}`);
                        return (
                          <div key={s._id} className="flex flex-col gap-2 rounded-md p-2 hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-3">
                            <div className="flex items-center gap-2 sm:flex-1">
                              <Checkbox
                                id={`svc-${s._id}`}
                                checked={checked}
                                onCheckedChange={(v) => {
                                  setSelectedServices(v ? [...selectedServices, s._id] : selectedServices.filter((x) => x !== s._id));
                                }}
                              />
                              <Label htmlFor={`svc-${s._id}`} className="cursor-pointer text-sm">
                                {s.title}
                              </Label>
                            </div>
                            {checked && (
                              <div className="pr-7 sm:pr-0">
                                {price !== undefined ? (
                                  <span className="text-sm text-muted-foreground">{formatToman(price)}</span>
                                ) : (
                                  <Input
                                    type="number"
                                    min={0}
                                    placeholder="قیمت دستی"
                                    className="h-8 w-full sm:w-28"
                                    value={manualPrices[s._id] ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setManualPrices((prev) => ({
                                        ...prev,
                                        [s._id]: v === "" ? 0 : Number(v),
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

                  {/* Quantity — stacked on mobile, side-by-side on desktop */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="size-9 shrink-0" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                        <span className="text-lg">−</span>
                      </Button>
                      <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="w-16 text-center" />
                      <Button type="button" variant="outline" size="icon" className="size-9 shrink-0" onClick={() => setQuantity(quantity + 1)}>
                        <span className="text-lg">+</span>
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      قیمت واحد: {formatToman(currentUnitPrice)} | جمع: {formatToman(currentUnitPrice * quantity)}
                    </div>
                  </div>

                  {/* Optional details toggle */}
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
                    <div className="space-y-3 rounded-lg border border-dashed p-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">رنگ</Label>
                          <Select value={detailForm.color} onValueChange={(v) => setDetailForm({ ...detailForm, color: v })}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {colors?.map((c) => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">پارچه</Label>
                          <Select value={detailForm.fabric} onValueChange={(v) => setDetailForm({ ...detailForm, fabric: v })}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {fabrics?.map((f) => <SelectItem key={f._id} value={f._id}>{f.title}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">سایز</Label>
                          <Input className="h-9" value={detailForm.size} onChange={(e) => setDetailForm({ ...detailForm, size: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">برند</Label>
                        <Input className="h-9" value={detailForm.brand} onChange={(e) => setDetailForm({ ...detailForm, brand: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">توضیحات</Label>
                        <Textarea rows={2} value={detailForm.description} onChange={(e) => setDetailForm({ ...detailForm, description: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">چک‌لیست آسیب</Label>
                        <div className="space-y-2 rounded border p-2">
                          {detailForm.damageChecklist.map((d, di) => (
                            <div key={di} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`dmg-${di}`}
                                  checked={d.value}
                                  onCheckedChange={(v) => {
                                    const next = [...detailForm.damageChecklist];
                                    next[di] = { ...d, value: !!v };
                                    setDetailForm({ ...detailForm, damageChecklist: next });
                                  }}
                                />
                                <Label htmlFor={`dmg-${di}`} className="cursor-pointer text-sm whitespace-nowrap">{d.title}</Label>
                              </div>
                              <Input className="h-8 flex-1" placeholder="توضیح" value={d.note || ""}
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

                  {/* Add to cart button */}
                  <Button type="button" onClick={addToCart} className="w-full" size="lg">
                    <Plus className="size-4 ml-1" />
                    افزودن به سبد
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Cart + order info */}
        <div className="space-y-4">
          {/* Cart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="size-5" />
                سبد سفارش
              </CardTitle>
              {cart.length > 0 && <Badge variant="secondary">{toPersianDigits(cart.length)} آیتم</Badge>}
            </CardHeader>
            <CardContent className="space-y-2">
              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">سبد خالی است</p>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="rounded-lg border p-2.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.garmentTitle}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.serviceTitles.join("، ")}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removeFromCart(idx)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" className="size-7" onClick={() => updateCartQty(idx, item.quantity - 1)}>
                          <span className="text-sm">−</span>
                        </Button>
                        <span className="w-7 text-center text-sm font-medium">{toPersianDigits(item.quantity)}</span>
                        <Button type="button" variant="outline" size="icon" className="size-7" onClick={() => updateCartQty(idx, item.quantity + 1)}>
                          <span className="text-sm">+</span>
                        </Button>
                      </div>
                      <span className="text-sm font-medium">{formatToman(item.unitPrice * item.quantity)}</span>
                    </div>
                  </div>
                ))
              )}
              {cart.length > 0 && (
                <div className="border-t pt-2 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>جمع کل</span>
                    <span>{formatToman(totalPrice)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order info */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">اطلاعات سفارش</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {/* Delivery date */}
              <div className="space-y-1">
                <Label className="text-sm">تاریخ تحویل</Label>
                <div className="relative">
                  <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setShowDatePicker(!showDatePicker)}>
                    <Calendar className="size-4 ml-2" />
                    {deliveryDate || "انتخاب تاریخ"}
                  </Button>
                  {showDatePicker && (
                    <div className="absolute z-50 mt-1 left-0 right-0">
                      <JalaliDatePicker value={deliveryDate} onChange={(v) => { setDeliveryDate(v); setShowDatePicker(false); }} minDate={todayJalali} />
                    </div>
                  )}
                </div>
              </div>

              {/* Discount */}
              <div className="space-y-1">
                <Label className="text-sm">تخفیف (تومان)</Label>
                <PriceInput value={discount} onChange={setDiscount} />
              </div>

              {/* Urgent */}
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Zap className="size-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">سفارش فوری</p>
                    <p className="text-xs text-muted-foreground">ضریب: {toPersianDigits(urgentMultiplier)} برابر</p>
                  </div>
                </div>
                <Switch checked={urgent} onCheckedChange={setUrgent} />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label className="text-sm">یادداشت</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Price summary */}
          <Card className="bg-primary/5">
            <CardContent className="space-y-2 p-3">
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
              <div className="flex justify-between font-bold text-base pt-1">
                <span>مبلغ نهایی</span>
                <span className="text-primary">{formatToman(finalPrice)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={createMutation.isPending || !selectedCustomer || cart.length === 0}
            onClick={handleSubmit}
          >
            {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "ثبت سفارش"}
          </Button>
        </div>
      </div>
    </div>
  );
}

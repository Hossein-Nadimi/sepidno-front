"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Printer,
  Edit2,
  FileText,
  Phone,
  Calendar,
  Wallet,
  Tag,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { orderService, receiptService, catalogService, settingsService } from "@/services";
import api from "@/lib/api";
import type { OrderItem, OrderStatus as OrderStatusType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/page-header";
import { TableLoading } from "@/components/common/loading";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { CatalogIcon } from "@/components/common/catalog-icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatToman, toPersianDigits, resolveMediaUrl } from "@/lib/utils";
import { toJalali, toJalaliDateTime } from "@/lib/jalali";
import toast from "react-hot-toast";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [printOpen, setPrintOpen] = useState(false);
  const [printText, setPrintText] = useState<string>("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceRecipient, setInvoiceRecipient] = useState("");

  const { data: orderData, isLoading } = useQuery({
    queryKey: ["order", params.id],
    queryFn: () => orderService.get(params.id),
    enabled: !!params.id,
  });

  const { data: statuses } = useQuery({
    queryKey: ["order-statuses"],
    queryFn: () => catalogService.orderStatuses.all(),
  });

  // Fetch business settings for receipt
  const { data: businessSettings } = useQuery({
    queryKey: ["business-settings"],
    queryFn: () => settingsService.get(),
  });

  // Fetch business name
  const { data: businessInfo } = useQuery({
    queryKey: ["my-business"],
    queryFn: () => api.get("/businesses/mine").then((r) => r.data.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (statusId: string) => orderService.update(params.id, { status: statusId }),
    onSuccess: () => {
      toast.success("وضعیت سفارش به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["order", params.id] });
    },
  });

  const printMutation = useMutation({
    mutationFn: async () => {
      // Find or generate a receipt for this order
      let receipt = null;
      try {
        receipt = await receiptService.generate(params.id);
      } catch {
        // Already exists — fetch via list endpoint
        const list = await receiptService.list({ order: params.id });
        receipt = list.items[0];
      }
      if (!receipt) throw new Error("Receipt generation failed");
      return receiptService.text(receipt._id);
    },
    onSuccess: (text) => {
      setPrintText(text);
      setPrintOpen(true);
    },
  });

  function doPrint() {
    const w = window.open("", "_blank", "width=420,height=700");
    if (!w) return;

    const order = orderData;
    const customer = typeof order?.customer === "object" ? order.customer : null;
    const items = order?.items || [];

    // Use laundryName from settings if available, fall back to businessInfo.name
    const laundryName = businessSettings?.laundryName || businessInfo?.name || "خشکشویی";
    const logoUrl = businessSettings?.logo ? resolveMediaUrl(businessSettings.logo) : "";

    const itemsHtml = items.map((item, i) => {
      const garment = typeof item.garmentType === "object" ? item.garmentType : null;
      const services = (item.services || [])
        .map((s) => (typeof s === "object" ? (s as { title?: string }).title : ""))
        .filter(Boolean)
        .join("، ");
      return `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px dashed #ddd; text-align: right;">${i + 1}. ${garment?.title || "—"}</td>
          <td style="padding: 6px 8px; border-bottom: 1px dashed #ddd; text-align: center;">${services || "—"}</td>
          <td style="padding: 6px 8px; border-bottom: 1px dashed #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 6px 8px; border-bottom: 1px dashed #ddd; text-align: left; font-weight: bold;">${Number(item.lineTotal || 0).toLocaleString("en-US")}</td>
        </tr>
      `;
    }).join("");

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="logo" style="max-height: 60px; max-width: 120px; object-fit: contain;" referrerpolicy="no-referrer" />`
      : `<div style="width: 50px; height: 50px; background: #0D9488; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">س</div>`;

    w.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8" />
        <title>قبض سفارش ${order?.orderNumber || ""}</title>
        <style>
          * { font-family: Tahoma, 'Segoe UI', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
          body { padding: 20px; background: #f8f9fa; }
          .receipt {
            max-width: 380px; margin: 0 auto; background: white;
            border-radius: 16px; overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1);
            border: 2px solid #e5e7eb;
          }
          /* Header: logo + laundry name */
          .header {
            background: linear-gradient(135deg, #0D9488, #14b8a6);
            padding: 18px 20px; text-align: center; color: white;
          }
          .logo-area { display: flex; justify-content: center; margin-bottom: 10px; }
          .header h1 { font-size: 18px; margin-bottom: 2px; font-weight: 700; }
          .header p { font-size: 11px; opacity: 0.9; }
          /* Sections */
          .section { padding: 14px 20px; border-bottom: 1px dashed #e5e7eb; }
          .section-title {
            font-size: 11px; font-weight: 700; color: #0D9488; margin-bottom: 8px;
            text-transform: uppercase; letter-spacing: 0.5px;
          }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
          .info-row .label { color: #6b7280; }
          .info-row .value { font-weight: 600; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th {
            background: #f3f4f6; padding: 8px; font-size: 11px; font-weight: 700;
            color: #374151; border-bottom: 2px solid #e5e7eb;
          }
          .items-table td { font-size: 11px; color: #1f2937; }
          .total-section { padding: 14px 20px; background: #f9fafb; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
          .total-row.final {
            border-top: 2px solid #0D9488; padding-top: 10px; margin-top: 6px;
            font-size: 14px; font-weight: bold; color: #0D9488;
          }
          /* Footer = business info */
          .footer {
            padding: 14px 20px; background: #f0fdfa; border-top: 2px solid #0D9488;
            font-size: 10px; color: #134e4a;
          }
          .footer h3 { font-size: 12px; margin-bottom: 6px; color: #0D9488; font-weight: 700; }
          .footer-row { margin-bottom: 3px; }
          .policies-box {
            margin-top: 8px; padding: 8px; background: white; border-radius: 6px;
            border: 1px dashed #0D9488; font-size: 9px; color: #4b5563;
          }
          @media print {
            body { padding: 0; background: white; }
            .receipt { box-shadow: none; border: none; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- HEADER: logo + laundry name -->
          <div class="header">
            <div class="logo-area">${logoHtml}</div>
            <h1>${laundryName}</h1>
            <p>قبض سفارش خشکشویی</p>
          </div>

          <!-- CUSTOMER INFO -->
          <div class="section">
            <div class="section-title">اطلاعات مشتری</div>
            <div class="info-row">
              <span class="label">شماره قبض:</span>
              <span class="value">${order?.orderNumber || "—"}</span>
            </div>
            <div class="info-row">
              <span class="label">تاریخ پذیرش:</span>
              <span class="value">${toJalali(order?.acceptedAt || "")}</span>
            </div>
            <div class="info-row">
              <span class="label">تاریخ تحویل:</span>
              <span class="value">${toJalali(order?.deliveryDate || "")}</span>
            </div>
            ${customer ? `
            <div class="info-row">
              <span class="label">مشتری:</span>
              <span class="value">${customer.firstName} ${customer.lastName}</span>
            </div>
            <div class="info-row">
              <span class="label">موبایل:</span>
              <span class="value" dir="ltr">${customer.mobile}</span>
            </div>
            ` : ""}
          </div>

          <!-- ORDER ITEMS -->
          <div class="section" style="padding-bottom: 0;">
            <div class="section-title">اقلام سفارش</div>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: right;">لباس / خدمت</th>
                <th style="text-align: center;">خدمات</th>
                <th style="text-align: center;">تعداد</th>
                <th style="text-align: left;">مبلغ</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- TOTALS -->
          <div class="total-section">
            <div class="total-row">
              <span>جمع کل:</span>
              <span>${Number(order?.totalPrice || 0).toLocaleString("en-US")} تومان</span>
            </div>
            ${(order?.discount || 0) > 0 ? `
            <div class="total-row" style="color: #059669;">
              <span>تخفیف:</span>
              <span>- ${Number(order?.discount || 0).toLocaleString("en-US")} تومان</span>
            </div>
            ` : ""}
            ${order?.urgent ? `
            <div class="total-row" style="color: #d97706;">
              <span>سفارش فوری:</span>
              <span>✓ اعمال شد</span>
            </div>
            ` : ""}
            ${(order?.cashbackUsed || 0) > 0 ? `
            <div class="total-row" style="color: #059669;">
              <span>کش‌بک:</span>
              <span>- ${Number(order?.cashbackUsed || 0).toLocaleString("en-US")} تومان</span>
            </div>
            ` : ""}
            <div class="total-row final">
              <span>مبلغ نهایی:</span>
              <span>${Number(order?.finalPrice || 0).toLocaleString("en-US")} تومان</span>
            </div>
          </div>

          <!-- FOOTER: BUSINESS INFO -->
          <div class="footer">
            <h3>اطلاعات خشکشویی</h3>
            <div class="footer-row"><strong>نام:</strong> ${laundryName}</div>
            ${businessSettings?.phone ? `<div class="footer-row"><strong>تلفن:</strong> <span dir="ltr">${businessSettings.phone}</span></div>` : ""}
            ${businessSettings?.mobile ? `<div class="footer-row"><strong>موبایل:</strong> <span dir="ltr">${businessSettings.mobile}</span></div>` : ""}
            ${businessSettings?.address ? `<div class="footer-row"><strong>آدرس:</strong> ${businessSettings.address}</div>` : ""}
            ${businessSettings?.policies ? `<div class="policies-box"><strong>قوانین:</strong><br/>${businessSettings.policies}</div>` : ""}
          </div>
        </div>
      </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  }

  function printInvoice() {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;

    const order = orderData;
    const customer = typeof order?.customer === "object" ? order.customer : null;
    const items = order?.items || [];

    // Use laundryName from settings if available, fall back to businessInfo.name
    const laundryName = businessSettings?.laundryName || businessInfo?.name || "خشکشویی";
    const logoUrl = businessSettings?.logo ? resolveMediaUrl(businessSettings.logo) : "";

    const itemsHtml = items.map((item, i) => {
      const garment = typeof item.garmentType === "object" ? item.garmentType : null;
      const services = (item.services || [])
        .map((s) => (typeof s === "object" ? (s as { title?: string }).title : ""))
        .filter(Boolean)
        .join("، ");
      const unitPrice = item.unitPrice || 0;
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${i + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${garment?.title || "—"}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${services || "—"}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${unitPrice.toLocaleString("en-US")}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">${(unitPrice * item.quantity).toLocaleString("en-US")}</td>
        </tr>
      `;
    }).join("");

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="logo" style="max-height: 80px; max-width: 140px; object-fit: contain;" referrerpolicy="no-referrer" />`
      : `<div style="width: 60px; height: 60px; background: #0D9488; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: bold;">س</div>`;

    w.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8" />
        <title>فاکتور ${order?.orderNumber || ""}</title>
        <style>
          * { font-family: Tahoma, 'Segoe UI', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
          body { padding: 30px; background: #fff; color: #1f2937; }
          .invoice { max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0D9488; padding-bottom: 20px; margin-bottom: 30px; }
          .header-right { display: flex; align-items: center; gap: 16px; }
          .header-info h1 { font-size: 22px; color: #0D9488; margin-bottom: 4px; }
          .header-info p { font-size: 12px; color: #6b7280; }
          .header-left { text-align: left; }
          .header-left h2 { font-size: 28px; color: #1f2937; margin-bottom: 8px; }
          .header-left .invoice-num { font-size: 14px; color: #6b7280; }

          .parties { display: flex; gap: 20px; margin-bottom: 30px; }
          .party-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
          .party-box h3 { font-size: 13px; color: #0D9488; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
          .party-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
          .party-row .label { color: #6b7280; }
          .party-row .value { font-weight: 600; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          table th { background: #0D9488; color: white; padding: 10px; font-size: 12px; border: 1px solid #0D9488; }
          table td { font-size: 12px; }

          .totals { margin-left: auto; width: 300px; margin-bottom: 40px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
          .total-row.final { border-top: 2px solid #0D9488; border-bottom: none; padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: bold; color: #0D9488; }

          .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
          .stamp-area { width: 200px; height: 120px; border: 2px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #d1d5db; font-size: 13px; }
          .signatures { display: flex; gap: 60px; }
          .sig { text-align: center; }
          .sig-line { width: 150px; border-top: 1px solid #6b7280; margin-top: 40px; padding-top: 5px; font-size: 11px; color: #6b7280; }

          .notes { margin-top: 20px; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 11px; color: #6b7280; }

          @media print {
            body { padding: 0; }
            .invoice { max-width: 100%; }
            @page { size: A4; margin: 15mm; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <!-- Header -->
          <div class="header">
            <div class="header-right">
              ${logoHtml}
              <div class="header-info">
                <h1>${laundryName}</h1>
                <p>خشکشویی و لباسشویی</p>
                ${businessSettings?.address ? `<p style="margin-top:4px;">${businessSettings.address}</p>` : ""}
                ${businessSettings?.phone ? `<p>تلفن: <span dir="ltr">${businessSettings.phone}</span></p>` : ""}
              </div>
            </div>
            <div class="header-left">
              <h2>فاکتور رسمی</h2>
              <div class="invoice-num">شماره: ${order?.orderNumber || ""}</div>
              <div class="invoice-num">تاریخ: ${toJalali(order?.acceptedAt || "")}</div>
            </div>
          </div>

          <!-- Parties -->
          <div class="parties">
            <div class="party-box">
              <h3>اطلاعات فروشنده (خشکشویی)</h3>
              <div class="party-row"><span class="label">نام:</span><span class="value">${laundryName}</span></div>
              <div class="party-row"><span class="label">تلفن:</span><span class="value" dir="ltr">${businessSettings?.phone || "—"}</span></div>
              <div class="party-row"><span class="label">آدرس:</span><span class="value" style="font-size: 10px; max-width: 180px; text-align: left;">${businessSettings?.address || "—"}</span></div>
            </div>
            <div class="party-box">
              <h3>اطلاعات خریدار</h3>
              <div class="party-row"><span class="label">نام:</span><span class="value">${customer ? `${customer.firstName} ${customer.lastName}` : "—"}</span></div>
              <div class="party-row"><span class="label">موبایل:</span><span class="value" dir="ltr">${customer?.mobile || "—"}</span></div>
              ${invoiceRecipient ? `<div class="party-row"><span class="label">به نام:</span><span class="value">${invoiceRecipient}</span></div>` : ""}
            </div>
          </div>

          <!-- Items table -->
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">ردیف</th>
                <th>شرح کالا / خدمت</th>
                <th>خدمات</th>
                <th style="width: 60px;">تعداد</th>
                <th style="width: 100px;">قیمت واحد</th>
                <th style="width: 120px;">مبلغ کل</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals">
            <div class="total-row">
              <span>جمع کل:</span>
              <span>${Number(order?.totalPrice || 0).toLocaleString("en-US")} تومان</span>
            </div>
            ${(order?.discount || 0) > 0 ? `
            <div class="total-row" style="color: #059669;">
              <span>تخفیف:</span>
              <span>- ${Number(order?.discount || 0).toLocaleString("en-US")} تومان</span>
            </div>
            ` : ""}
            ${order?.urgent ? `
            <div class="total-row" style="color: #d97706;">
              <span>ضریب فوری:</span>
              <span>✓ اعمال شده</span>
            </div>
            ` : ""}
            ${(order?.cashbackUsed || 0) > 0 ? `
            <div class="total-row" style="color: #059669;">
              <span>کش‌بک:</span>
              <span>- ${Number(order?.cashbackUsed || 0).toLocaleString("en-US")} تومان</span>
            </div>
            ` : ""}
            <div class="total-row final">
              <span>مبلغ نهایی:</span>
              <span>${Number(order?.finalPrice || 0).toLocaleString("en-US")} تومان</span>
            </div>
          </div>

          <!-- Policies -->
          ${businessSettings?.policies ? `
          <div class="notes">
            <strong>شرایط و قوانین:</strong><br/>
            ${businessSettings.policies}
          </div>
          ` : ""}

          <!-- Footer with stamp + signatures -->
          <div class="footer">
            <div class="stamp-area">
              محل مهر و امضا
            </div>
            <div class="signatures">
              <div class="sig">
                <div class="sig-line">امضای فروشنده</div>
              </div>
              <div class="sig">
                <div class="sig-line">امضای خریدار</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
    setInvoiceOpen(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="جزئیات سفارش" />
        <TableLoading />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="space-y-6">
        <PageHeader title="جزئیات سفارش" />
        <EmptyState title="سفارش یافت نشد" />
      </div>
    );
  }

  const order = orderData;
  const customer = typeof order.customer === "object" ? order.customer : null;
  const statusObj = typeof order.status === "object" ? order.status : null;
  const currentStatusId = typeof order.status === "object" ? (order.status as { _id: string })._id : order.status;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`سفارش ${order.orderNumber}`}
        description={`پذیرش: ${toJalaliDateTime(order.acceptedAt)}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowRight className="size-4 ml-1" />
              بازگشت
            </Button>
            <Button variant="outline" onClick={() => router.push(`/orders/${order._id}/edit`)}>
              <Edit2 className="size-4 ml-1" />
              ویرایش
            </Button>
            <Button onClick={() => printMutation.mutate()} disabled={printMutation.isPending}>
              {printMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4 ml-1" />}
              چاپ قبض
            </Button>
            <Button variant="outline" onClick={() => setInvoiceOpen(true)}>
              <FileText className="size-4 ml-1" />
              چاپ فاکتور
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>آیتم‌های سفارش</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item: OrderItem, idx: number) => {
              const garment = typeof item.garmentType === "object" ? item.garmentType : null;
              const services = item.services.map((s) => (typeof s === "object" ? s.title : "—")).join("، ");
              const color = typeof item.color === "object" ? item.color : null;
              const fabric = typeof item.fabric === "object" ? item.fabric : null;
              return (
                <div key={idx} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CatalogIcon
                          icon={(garment as { icon?: string } | null)?.icon}
                          image={(garment as { image?: string } | null)?.image}
                          size={20}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{garment?.title || "—"}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">خدمات: {services || "—"}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">تعداد: {toPersianDigits(item.quantity)}</Badge>
                          {color && <Badge variant="outline">رنگ: {color.title}</Badge>}
                          {fabric && <Badge variant="outline">پارچه: {fabric.title}</Badge>}
                          {item.brand && <Badge variant="outline">برند: {item.brand}</Badge>}
                          {item.size && <Badge variant="outline">سایز: {item.size}</Badge>}
                        </div>
                        {item.description && (
                          <p className="mt-2 text-sm">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">قیمت واحد: {formatToman(item.unitPrice || 0)}</p>
                      <p className="mt-1 font-bold">{formatToman(item.lineTotal || 0)}</p>
                    </div>
                  </div>

                  {/* Damage checklist */}
                  {item.damageChecklist.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <AlertCircle className="size-3" />
                        چک‌لیست آسیب‌ها
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.damageChecklist.map((d, di) => (
                          <Badge key={di} variant={d.value ? "destructive" : "outline"}>
                            {d.title}: {d.value ? "دارد" : "ندارد"}
                            {d.note ? ` (${d.note})` : ""}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {item.images && item.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                      {item.images.map((img, ii) => (
                        <a key={ii} href={img} target="_blank" rel="noopener noreferrer">
                          <img src={img} alt={`تصویر ${ii + 1}`} className="size-16 rounded object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Sidebar: customer + status + totals */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>وضعیت سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusObj && (
                <Badge variant={statusObj.isCompleted ? "default" : statusObj.isCancelled ? "destructive" : "secondary"}>
                  {statusObj.title}
                </Badge>
              )}
              <Select
                value={currentStatusId}
                onValueChange={(v) => updateStatusMutation.mutate(v)}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses?.map((s: OrderStatusType) => (
                    <SelectItem key={s._id} value={s._id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Customer */}
          {customer && (
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات مشتری</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" />
                  <span dir="ltr">{customer.mobile}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/customers/${customer._id}`)}>
                  مشاهده پروفایل مشتری
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardContent className="space-y-2 pt-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span>تحویل: {toJalali(order.deliveryDate)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-4" />
                صورت حساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">جمع کل</span>
                <span>{formatToman(order.totalPrice)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1"><Tag className="size-3" /> تخفیف</span>
                  <span>- {formatToman(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>مبلغ نهایی</span>
                <span>{formatToman(order.finalPrice)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        title="چاپ قبض"
        description="آیا می‌خواهید قبض این سفارش را چاپ کنید؟"
        confirmText="چاپ"
        variant="default"
        onConfirm={doPrint}
      />

      {/* Invoice dialog — ask for recipient name */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>چاپ فاکتور رسمی</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>فاکتور به نام چه شخص/شرکتی صادر می‌شود؟ (اختیاری)</Label>
              <Input
                value={invoiceRecipient}
                onChange={(e) => setInvoiceRecipient(e.target.value)}
                placeholder="مثلاً: شرکت نمونه / آقای محمدی"
              />
              <p className="text-xs text-muted-foreground">این فیلد اختیاری است. می‌توانید خالی بگذارید.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>انصراف</Button>
            <Button onClick={printInvoice}>
              <FileText className="size-4 ml-1" />
              چاپ فاکتور
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import api from "@/lib/api";
import type {
  SuccessResponse,
  PaginatedResponse,
  DashboardData,
  SuperAdminDashboardData,
  Customer,
  CustomerStats,
  Order,
  Pricing,
  GarmentType,
  ServiceType,
  FabricType,
  Color,
  OrderStatus,
  SmsPackage,
  BusinessSmsPackage,
  SmsUsage,
  LoyaltySettings,
  Cashback,
  InventoryItem,
  InventoryMovement,
  InventoryItemType,
  Receipt,
  BusinessSettings,
  ActiveSubscription,
  SubscriptionPlan,
} from "@/types";
import { buildQueryString } from "@/lib/utils";

/* ------------------------------- Dashboard -------------------------------- */

export const dashboardService = {
  get(params?: Record<string, unknown>): Promise<DashboardData | SuperAdminDashboardData> {
    return api.get<SuccessResponse<DashboardData | SuperAdminDashboardData>>(`/laundry/dashboard${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
};

/* ------------------------------- Customers -------------------------------- */

export interface CustomerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  sort?: string;
}

export const customerService = {
  list(params: CustomerListParams = {}): Promise<PaginatedResponse<Customer>> {
    return api.get<SuccessResponse<PaginatedResponse<Customer>>>(`/laundry/customers${buildQueryString(params as Record<string, unknown>)}`).then((r) => r.data.data);
  },
  getByMobile(mobile: string): Promise<Customer> {
    return api.get<SuccessResponse<Customer>>(`/laundry/customers/by-mobile`, { params: { mobile } }).then((r) => r.data.data);
  },
  get(id: string): Promise<Customer> {
    return api.get<SuccessResponse<Customer>>(`/laundry/customers/${id}`).then((r) => r.data.data);
  },
  getStats(id: string): Promise<CustomerStats> {
    return api.get<SuccessResponse<CustomerStats>>(`/laundry/customers/${id}/stats`).then((r) => r.data.data);
  },
  create(payload: Partial<Customer>): Promise<Customer> {
    return api.post<SuccessResponse<Customer>>("/laundry/customers", payload).then((r) => r.data.data);
  },
  update(id: string, payload: Partial<Customer>): Promise<Customer> {
    return api.patch<SuccessResponse<Customer>>(`/laundry/customers/${id}`, payload).then((r) => r.data.data);
  },
  delete(id: string): Promise<void> {
    return api.delete(`/laundry/customers/${id}`).then(() => undefined);
  },
};

/* --------------------------------- Orders --------------------------------- */

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  customer?: string;
  status?: string;
  mobile?: string;
  orderNumber?: string;
  sort?: string;
  jalaliFrom?: string;
  jalaliTo?: string;
  jalaliMonth?: string;
}

export const orderService = {
  list(params: OrderListParams = {}): Promise<PaginatedResponse<Order>> {
    return api.get<SuccessResponse<PaginatedResponse<Order>>>(`/laundry/orders${buildQueryString(params as Record<string, unknown>)}`).then((r) => r.data.data);
  },
  get(id: string): Promise<Order> {
    return api.get<SuccessResponse<Order>>(`/laundry/orders/${id}`).then((r) => r.data.data);
  },
  create(payload: unknown): Promise<Order> {
    return api.post<SuccessResponse<Order>>("/laundry/orders", payload).then((r) => r.data.data);
  },
  update(id: string, payload: unknown): Promise<Order> {
    return api.patch<SuccessResponse<Order>>(`/laundry/orders/${id}`, payload).then((r) => r.data.data);
  },
  delete(id: string): Promise<void> {
    return api.delete(`/laundry/orders/${id}`).then(() => undefined);
  },
};

/* --------------------------------- Pricing -------------------------------- */

export interface PricingListParams {
  page?: number;
  pageSize?: number;
  garmentType?: string;
  serviceType?: string;
  active?: boolean;
  sort?: string;
}

export const pricingService = {
  list(params: PricingListParams = {}): Promise<PaginatedResponse<Pricing>> {
    return api.get<SuccessResponse<PaginatedResponse<Pricing>>>(`/laundry/pricing${buildQueryString(params as Record<string, unknown>)}`).then((r) => r.data.data);
  },
  create(payload: unknown): Promise<Pricing> {
    return api.post<SuccessResponse<Pricing>>("/laundry/pricing", payload).then((r) => r.data.data);
  },
  bulkUpsert(items: unknown[]): Promise<{ created: number; updated: number }> {
    return api.post<SuccessResponse<{ created: number; updated: number }>>("/laundry/pricing/bulk", { items }).then((r) => r.data.data);
  },
  update(id: string, payload: unknown): Promise<Pricing> {
    return api.patch<SuccessResponse<Pricing>>(`/laundry/pricing/${id}`, payload).then((r) => r.data.data);
  },
  delete(id: string): Promise<void> {
    return api.delete(`/laundry/pricing/${id}`).then(() => undefined);
  },
};

/* -------------------------------- Catalogs -------------------------------- */

export const catalogService = {
  garmentTypes: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<GarmentType>> {
      return api.get<SuccessResponse<PaginatedResponse<GarmentType>>>(`/catalogs/garment-types${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
    all(): Promise<GarmentType[]> {
      return this.list({ pageSize: 100, active: true }).then((r) => r.items);
    },
  },
  serviceTypes: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<ServiceType>> {
      return api.get<SuccessResponse<PaginatedResponse<ServiceType>>>(`/catalogs/service-types${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
    all(): Promise<ServiceType[]> {
      return this.list({ pageSize: 100, active: true }).then((r) => r.items);
    },
  },
  fabricTypes: {
    all(): Promise<FabricType[]> {
      return api.get<SuccessResponse<PaginatedResponse<FabricType>>>("/catalogs/fabric-types?pageSize=100&active=true").then((r) => r.data.data.items);
    },
  },
  colors: {
    all(): Promise<Color[]> {
      return api.get<SuccessResponse<PaginatedResponse<Color>>>("/catalogs/colors?pageSize=100&active=true").then((r) => r.data.data.items);
    },
  },
  orderStatuses: {
    all(): Promise<OrderStatus[]> {
      return api.get<SuccessResponse<PaginatedResponse<OrderStatus>>>("/catalogs/order-statuses?pageSize=100&active=true").then((r) => r.data.data.items);
    },
  },
  inventoryItemTypes: {
    all(): Promise<InventoryItemType[]> {
      return api.get<SuccessResponse<PaginatedResponse<InventoryItemType>>>("/catalogs/inventory-item-types?pageSize=100&active=true").then((r) => r.data.data.items);
    },
  },
};

/* ---------------------------------- SMS ----------------------------------- */

export const smsService = {
  packages: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<SmsPackage>> {
      return api.get<SuccessResponse<PaginatedResponse<SmsPackage>>>(`/laundry/sms/packages${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
  },
  businessPackages: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<BusinessSmsPackage>> {
      return api.get<SuccessResponse<PaginatedResponse<BusinessSmsPackage>>>(`/laundry/sms/business-packages${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
    purchase(smsPackageId: string, paymentId?: string): Promise<BusinessSmsPackage> {
      return api.post<SuccessResponse<BusinessSmsPackage>>("/laundry/sms/business-packages", { smsPackage: smsPackageId, payment: paymentId }).then((r) => r.data.data);
    },
  },
  usage: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<SmsUsage>> {
      return api.get<SuccessResponse<PaginatedResponse<SmsUsage>>>(`/laundry/sms/usage${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
  },
};

/* ----------------------------- Loyalty & Cashback ------------------------- */

export const loyaltyService = {
  getSettings(): Promise<LoyaltySettings> {
    return api.get<SuccessResponse<LoyaltySettings>>("/laundry/loyalty").then((r) => r.data.data);
  },
  upsertSettings(payload: Partial<LoyaltySettings>): Promise<LoyaltySettings> {
    return api.patch<SuccessResponse<LoyaltySettings>>("/laundry/loyalty", payload).then((r) => r.data.data);
  },
  cashbacks: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<Cashback>> {
      return api.get<SuccessResponse<PaginatedResponse<Cashback>>>(`/laundry/cashbacks${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
    stats(params?: Record<string, unknown>): Promise<unknown> {
      return api.get<SuccessResponse<unknown>>(`/laundry/cashbacks/stats${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
  },
};

/* ------------------------------- Inventory -------------------------------- */

export const inventoryService = {
  items: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<InventoryItem>> {
      return api.get<SuccessResponse<PaginatedResponse<InventoryItem>>>(`/laundry/inventory/items${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
    create(payload: unknown): Promise<InventoryItem> {
      return api.post<SuccessResponse<InventoryItem>>("/laundry/inventory/items", payload).then((r) => r.data.data);
    },
    update(id: string, payload: unknown): Promise<InventoryItem> {
      return api.patch<SuccessResponse<InventoryItem>>(`/laundry/inventory/items/${id}`, payload).then((r) => r.data.data);
    },
    delete(id: string): Promise<void> {
      return api.delete(`/laundry/inventory/items/${id}`).then(() => undefined);
    },
  },
  movements: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<InventoryMovement>> {
      return api.get<SuccessResponse<PaginatedResponse<InventoryMovement>>>(`/laundry/inventory/movements${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
    create(payload: unknown): Promise<void> {
      return api.post("/laundry/inventory/movements", payload).then(() => undefined);
    },
  },
};

/* -------------------------------- Receipts -------------------------------- */

export const receiptService = {
  list(params?: Record<string, unknown>): Promise<PaginatedResponse<Receipt>> {
    return api.get<SuccessResponse<PaginatedResponse<Receipt>>>(`/laundry/receipts${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  generate(orderId: string): Promise<Receipt> {
    return api.post<SuccessResponse<Receipt>>("/laundry/receipts", { order: orderId }).then((r) => r.data.data);
  },
  get(id: string): Promise<Receipt> {
    return api.get<SuccessResponse<Receipt>>(`/laundry/receipts/${id}`).then((r) => r.data.data);
  },
  text(id: string): Promise<string> {
    return api.get<SuccessResponse<{ text: string }>>(`/laundry/receipts/${id}/text`).then((r) => r.data.data.text);
  },
};

/* -------------------------------- Settings -------------------------------- */

export const settingsService = {
  get(): Promise<BusinessSettings> {
    return api.get<SuccessResponse<BusinessSettings>>("/laundry/settings").then((r) => r.data.data);
  },
  update(payload: Partial<BusinessSettings>): Promise<BusinessSettings> {
    return api.patch<SuccessResponse<BusinessSettings>>("/laundry/settings", payload).then((r) => r.data.data);
  },
};

/* ------------------------------ Subscriptions ----------------------------- */

export const subscriptionService = {
  plans: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<SubscriptionPlan>> {
      return api.get<SuccessResponse<PaginatedResponse<SubscriptionPlan>>>(`/subscription-plans${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
  },
  active: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<ActiveSubscription>> {
      return api.get<SuccessResponse<PaginatedResponse<ActiveSubscription>>>(`/active-subscriptions${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
  },
};

/* --------------------------------- Reports -------------------------------- */

export const reportService = {
  revenue(params?: Record<string, unknown>): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>(`/laundry/reports/revenue${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  orders(params?: Record<string, unknown>): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>(`/laundry/reports/orders${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  customers(params?: Record<string, unknown>): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>(`/laundry/reports/customers${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  services(params?: Record<string, unknown>): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>(`/laundry/reports/services${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  garments(params?: Record<string, unknown>): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>(`/laundry/reports/garments${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  inventory(): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>("/laundry/reports/inventory").then((r) => r.data.data);
  },
  cashback(params?: Record<string, unknown>): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>(`/laundry/reports/cashback${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  sms(params?: Record<string, unknown>): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>(`/laundry/reports/sms${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  yearly(jalaliYear?: string): Promise<YearlyOverview> {
    const params = jalaliYear ? { jalaliYear } : undefined;
    return api.get<SuccessResponse<YearlyOverview>>(`/laundry/reports/yearly${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
};

export interface YearlyOverview {
  jalaliYear: string;
  totalRevenue: number;
  totalOrders: number;
  newCustomers: number;
  averageOrderValue: number;
  months: Array<{
    month: number;
    name: string;
    revenue: number;
    count: number;
    orders: number;
  }>;
  byStatus: Array<{ statusId: string; count: number; revenue: number }>;
}

/* ----------------------------- Super Admin -------------------------------- */

export interface AdminBusiness {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  phone?: string;
  mobile?: string;
  province?: string;
  city?: string;
  address?: string;
  status: "active" | "inactive" | "suspended" | "pending";
  owner?: { _id: string; firstName: string; lastName: string; phoneNumber: string };
  category?: { _id: string; name: string; slug: string };
  createdAt: string;
  updatedAt: string;
}

export const adminReportService = {
  overview(params?: Record<string, unknown>): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>(`/laundry/admin-reports/overview${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  laundryOrders(params?: Record<string, unknown>): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>(`/laundry/admin-reports/laundry-orders${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  laundryRevenue(params?: Record<string, unknown>): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>(`/laundry/admin-reports/laundry-revenue${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  subscriptions(): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>("/laundry/admin-reports/subscriptions").then((r) => r.data.data);
  },
  catalogs(): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>("/laundry/admin-reports/catalogs").then((r) => r.data.data);
  },
  inventory(): Promise<unknown> {
    return api.get<SuccessResponse<unknown>>("/laundry/admin-reports/inventory").then((r) => r.data.data);
  },
};

/* -------------------------------- Expenses -------------------------------- */

export interface CombinedGarmentType {
  _id: string;
  title: string;
  slug: string;
  isCustom: boolean;
}

export const customGarmentService = {
  list(): Promise<CombinedGarmentType[]> {
    return api.get<SuccessResponse<CombinedGarmentType[]>>("/laundry/custom-garments").then((r) => r.data.data);
  },
  create(payload: { title: string; description?: string }): Promise<unknown> {
    return api.post<SuccessResponse<unknown>>("/laundry/custom-garments", payload).then((r) => r.data.data);
  },
  delete(id: string): Promise<void> {
    return api.delete(`/laundry/custom-garments/${id}`).then(() => undefined);
  },
};

export interface Expense {
  _id: string;
  business: string;
  title: string;
  category?: string;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
}

export const expenseService = {
  list(params?: Record<string, unknown>): Promise<PaginatedResponse<Expense>> {
    return api.get<SuccessResponse<PaginatedResponse<Expense>>>(`/laundry/expenses${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  create(payload: { title: string; category?: string; amount: number; description?: string; date?: string }): Promise<Expense> {
    return api.post<SuccessResponse<Expense>>("/laundry/expenses", payload).then((r) => r.data.data);
  },
  update(id: string, payload: Partial<Expense>): Promise<Expense> {
    return api.patch<SuccessResponse<Expense>>(`/laundry/expenses/${id}`, payload).then((r) => r.data.data);
  },
  delete(id: string): Promise<void> {
    return api.delete(`/laundry/expenses/${id}`).then(() => undefined);
  },
  stats(params?: Record<string, unknown>): Promise<{ total: number; count: number }> {
    return api.get<SuccessResponse<{ total: number; count: number }>>(`/laundry/expenses/stats${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
};

export const adminService = {
  businesses: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<AdminBusiness>> {
      return api.get<SuccessResponse<PaginatedResponse<AdminBusiness>>>(`/businesses${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
    get(id: string): Promise<AdminBusiness> {
      return api.get<SuccessResponse<AdminBusiness>>(`/businesses/${id}`).then((r) => r.data.data);
    },
    update(id: string, payload: Partial<AdminBusiness>): Promise<AdminBusiness> {
      return api.patch<SuccessResponse<AdminBusiness>>(`/businesses/${id}`, payload).then((r) => r.data.data);
    },
    updateStatus(id: string, status: string): Promise<AdminBusiness> {
      return api.patch<SuccessResponse<AdminBusiness>>(`/businesses/${id}`, { status }).then((r) => r.data.data);
    },
    delete(id: string): Promise<void> {
      return api.delete(`/businesses/${id}`).then(() => undefined);
    },
    activateSubscription(businessId: string, planId: string, period: string): Promise<void> {
      return api.post("/laundry/admin/activate-subscription", { businessId, planId, period }).then(() => undefined);
    },
    activateSmsPackage(businessId: string, smsPackageId: string): Promise<void> {
      return api.post("/laundry/admin/activate-sms-package", { businessId, smsPackageId }).then(() => undefined);
    },
  },
  /** Fetch reports for a specific business (sets x-business-id header automatically) */
  businessReports(businessId: string) {
    return {
      revenue(): Promise<unknown> {
        return api.get<SuccessResponse<unknown>>("/laundry/reports/revenue?preset=thisMonth", { headers: { "x-business-id": businessId } }).then((r) => r.data.data);
      },
      orders(): Promise<unknown> {
        return api.get<SuccessResponse<unknown>>("/laundry/reports/orders?preset=thisMonth", { headers: { "x-business-id": businessId } }).then((r) => r.data.data);
      },
      customers(): Promise<unknown> {
        return api.get<SuccessResponse<unknown>>("/laundry/reports/customers?preset=thisMonth", { headers: { "x-business-id": businessId } }).then((r) => r.data.data);
      },
      yearly(jalaliYear?: string): Promise<unknown> {
        const params = jalaliYear ? `?jalaliYear=${jalaliYear}` : "";
        return api.get<SuccessResponse<unknown>>(`/laundry/reports/yearly${params}`, { headers: { "x-business-id": businessId } }).then((r) => r.data.data);
      },
      dashboard(): Promise<unknown> {
        return api.get<SuccessResponse<unknown>>("/laundry/dashboard", { headers: { "x-business-id": businessId } }).then((r) => r.data.data);
      },
    };
  },
  users: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<{
      _id: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      isActive: boolean;
      isPhoneVerified: boolean;
      role: { _id: string; name: string };
      lastLoginAt?: string;
      createdAt: string;
    }>> {
      return api.get<SuccessResponse<PaginatedResponse<unknown>>>(`/users${buildQueryString(params ?? {})}`).then((r) => r.data.data as PaginatedResponse<unknown> as PaginatedResponse<{
        _id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        isActive: boolean;
        isPhoneVerified: boolean;
        role: { _id: string; name: string };
        lastLoginAt?: string;
        createdAt: string;
      }>);
    },
    update(id: string, payload: { firstName?: string; lastName?: string; isActive?: boolean; roleId?: string }): Promise<unknown> {
      return api.patch<SuccessResponse<unknown>>(`/users/${id}`, payload).then((r) => r.data.data);
    },
  },
  roles: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<{ _id: string; name: string; description?: string; isSystem: boolean }>> {
      return api.get<SuccessResponse<PaginatedResponse<unknown>>>(`/roles${buildQueryString(params ?? {})}`).then((r) => r.data.data as PaginatedResponse<unknown> as PaginatedResponse<{ _id: string; name: string; description?: string; isSystem: boolean }>);
    },
  },
  plans: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<SubscriptionPlan>> {
      return api.get<SuccessResponse<PaginatedResponse<SubscriptionPlan>>>(`/subscription-plans${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
    create(payload: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
      return api.post<SuccessResponse<SubscriptionPlan>>("/subscription-plans", payload).then((r) => r.data.data);
    },
    update(id: string, payload: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
      return api.patch<SuccessResponse<SubscriptionPlan>>(`/subscription-plans/${id}`, payload).then((r) => r.data.data);
    },
    delete(id: string): Promise<void> {
      return api.delete(`/subscription-plans/${id}`).then(() => undefined);
    },
  },
  smsPackagesAdmin: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<SmsPackage>> {
      return api.get<SuccessResponse<PaginatedResponse<SmsPackage>>>(`/laundry/sms/packages${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
    create(payload: Partial<SmsPackage>): Promise<SmsPackage> {
      return api.post<SuccessResponse<SmsPackage>>("/laundry/sms/packages", payload).then((r) => r.data.data);
    },
    update(id: string, payload: Partial<SmsPackage>): Promise<SmsPackage> {
      return api.patch<SuccessResponse<SmsPackage>>(`/laundry/sms/packages/${id}`, payload).then((r) => r.data.data);
    },
    delete(id: string): Promise<void> {
      return api.delete(`/laundry/sms/packages/${id}`).then(() => undefined);
    },
  },
  catalogs: {
    list(catalog: string, params?: Record<string, unknown>): Promise<PaginatedResponse<GarmentType>> {
      return api.get<SuccessResponse<PaginatedResponse<GarmentType>>>(`/catalogs/${catalog}${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
    create(catalog: string, payload: Record<string, unknown>): Promise<unknown> {
      return api.post<SuccessResponse<unknown>>(`/catalogs/${catalog}`, payload).then((r) => r.data.data);
    },
    update(catalog: string, id: string, payload: Record<string, unknown>): Promise<unknown> {
      return api.patch<SuccessResponse<unknown>>(`/catalogs/${catalog}/${id}`, payload).then((r) => r.data.data);
    },
    delete(catalog: string, id: string): Promise<void> {
      return api.delete(`/catalogs/${catalog}/${id}`).then(() => undefined);
    },
  },
  activeSubscriptions: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<ActiveSubscription>> {
      return api.get<SuccessResponse<PaginatedResponse<ActiveSubscription>>>(`/active-subscriptions${buildQueryString(params ?? {})}`).then((r) => r.data.data);
    },
  },
  businessCategories: {
    list(params?: Record<string, unknown>): Promise<PaginatedResponse<{ _id: string; name: string; slug: string; isActive: boolean }>> {
      return api.get<SuccessResponse<PaginatedResponse<unknown>>>(`/business-categories${buildQueryString(params ?? {})}`).then((r) => r.data.data as PaginatedResponse<unknown> as PaginatedResponse<{ _id: string; name: string; slug: string; isActive: boolean }>);
    },
  },
};

/* --------------------------------- Tickets -------------------------------- */

export interface Ticket {
  _id: string;
  title: string;
  status: "open" | "pending" | "answered" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  business?: string | { _id: string; name: string } | null;
  createdBy?: string | { _id: string; firstName: string; lastName: string; phoneNumber: string };
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  _id: string;
  ticket: string;
  sender: string | { _id: string; firstName: string; lastName: string };
  message: string;
  attachments: string[];
  isAdmin: boolean;
  createdAt: string;
}

export const ticketService = {
  list(params?: Record<string, unknown>): Promise<PaginatedResponse<Ticket>> {
    return api.get<SuccessResponse<PaginatedResponse<Ticket>>>(`/tickets${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  listMine(params?: Record<string, unknown>): Promise<PaginatedResponse<Ticket>> {
    return api.get<SuccessResponse<PaginatedResponse<Ticket>>>(`/tickets/mine${buildQueryString(params ?? {})}`).then((r) => r.data.data);
  },
  get(id: string): Promise<Ticket> {
    return api.get<SuccessResponse<Ticket>>(`/tickets/${id}`).then((r) => r.data.data);
  },
  create(payload: { title: string; priority?: string; business?: string }): Promise<Ticket> {
    return api.post<SuccessResponse<Ticket>>("/tickets", payload).then((r) => r.data.data);
  },
  update(id: string, payload: Partial<Ticket>): Promise<Ticket> {
    return api.patch<SuccessResponse<Ticket>>(`/tickets/${id}`, payload).then((r) => r.data.data);
  },
  delete(id: string): Promise<void> {
    return api.delete(`/tickets/${id}`).then(() => undefined);
  },
  messages: {
    list(ticketId: string): Promise<PaginatedResponse<TicketMessage>> {
      return api.get<SuccessResponse<PaginatedResponse<TicketMessage>>>(`/ticket-messages?ticket=${ticketId}&pageSize=100`).then((r) => r.data.data);
    },
    create(ticketId: string, payload: { message: string; attachments?: string[] }): Promise<TicketMessage> {
      return api.post<SuccessResponse<TicketMessage>>(`/ticket-messages/ticket/${ticketId}`, payload).then((r) => r.data.data);
    },
  },
  uploadAttachment(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<SuccessResponse<{ url: string }>>("/uploads/ticket-attachment", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data.data.url);
  },
};

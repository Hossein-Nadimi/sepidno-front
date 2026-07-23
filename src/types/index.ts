// Shared API types — mirrors the backend Mongoose models.

export interface ID {
  _id?: string;
  id?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ path: string; message: string; code?: string }>;
}

/* --------------------------------- Auth ----------------------------------- */

export interface OtpSendResponse {
  message: string;
  ref?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyOtpResponse extends AuthTokens {
  user: User;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  permissions: string[];
  isPhoneVerified: boolean;
  isActive: boolean;
}

/* ------------------------------- Catalogs --------------------------------- */

export interface CatalogItem {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  /** Lucide icon name (e.g. "shirt") — shown in pickers if no image is set. */
  icon?: string;
  /** Optional image URL — shown if set (overrides icon). */
  image?: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GarmentType extends CatalogItem {}
export interface ServiceType extends CatalogItem {}
export interface FabricType extends CatalogItem {}
export interface Color extends CatalogItem {
  hex?: string;
}
export interface InventoryItemType extends CatalogItem {
  unit?: string;
}
export interface OrderStatus extends CatalogItem {
  isCompleted?: boolean;
  isCancelled?: boolean;
}
export interface SmsTemplate extends CatalogItem {
  body: string;
  variables?: string[];
  event?: string;
}
export interface ReceiptTemplate extends CatalogItem {
  body: string;
  defaults?: Record<string, boolean>;
}

/* ------------------------------- Customers -------------------------------- */

export interface Customer {
  _id: string;
  business: string;
  firstName: string;
  lastName: string;
  mobile: string;
  phone?: string;
  address?: string;
  birthDate?: string | null;
  gender?: "male" | "female" | null;
  notes?: string;
  totalOrders: number;
  totalSpending: number;
  currentCashbackBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
}

/* -------------------------------- Pricing --------------------------------- */

export interface Pricing {
  _id: string;
  business: string;
  garmentType: GarmentType | string;
  serviceType: ServiceType | string;
  price: number;
  estimatedDuration: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/* --------------------------------- Orders --------------------------------- */

export interface OrderItemDamage {
  key: string;
  title: string;
  value: boolean;
  note?: string;
}

export interface OrderItem {
  _id?: string;
  garmentType: GarmentType | string;
  quantity: number;
  services: (ServiceType | string)[];
  color?: Color | string;
  fabric?: FabricType | string;
  brand?: string;
  size?: string;
  description?: string;
  images?: string[];
  damageChecklist: OrderItemDamage[];
  unitPrice?: number;
  lineTotal?: number;
}

export interface Order {
  _id: string;
  business: string;
  customer: Customer | string;
  orderNumber: string;
  acceptedAt: string;
  deliveryDate: string;
  status: OrderStatus | string;
  items: OrderItem[];
  totalPrice: number;
  discount: number;
  finalPrice: number;
  notes?: string;
  cashbackIssued: boolean;
  cashbackUsed?: number;
  urgent?: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ---------------------------------- SMS ----------------------------------- */

export interface SmsPackage {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  creditCount: number;
  price: number;
  expireDays: number;
  active: boolean;
  displayOrder: number;
}

export interface BusinessSmsPackage {
  _id: string;
  business: string;
  smsPackage: SmsPackage | string;
  totalSms: number;
  remainingSms: number;
  expireDate: string;
  status: "active" | "expired" | "consumed";
  createdAt: string;
}

export interface SmsUsage {
  _id: string;
  business: string;
  phone: string;
  template?: { title: string; slug: string } | null;
  message: string;
  partsCount: number;
  cost: number;
  provider: string;
  status: "sent" | "failed";
  event?: string;
  error?: string;
  createdAt: string;
}

/* ---------------------------- Loyalty & Cashback -------------------------- */

export interface LoyaltySettings {
  _id: string;
  business: string;
  enabled: boolean;
  rewardType: "percentage" | "fixed";
  rewardValue: number;
  minimumOrder: number;
  maximumCashback: number;
  expirationDays: number;
  allowCombineWithDiscounts: boolean;
}

export interface Cashback {
  _id: string;
  business: string;
  customer: Customer | string;
  order: { orderNumber: string; finalPrice: number } | string;
  amount: number;
  expireDate: string;
  status: "unused" | "used" | "expired";
  usedAt?: string | null;
  createdAt: string;
}

/* ------------------------------- Inventory -------------------------------- */

export interface InventoryItem {
  _id: string;
  business: string;
  inventoryItemType: InventoryItemType | string;
  currentQuantity: number;
  minimumQuantity: number;
  unit: string;
  description?: string;
}

export interface InventoryMovement {
  _id: string;
  business: string;
  inventoryItem: InventoryItem | string;
  type: "stock_in" | "stock_out" | "adjustment";
  quantity: number;
  description?: string;
  createdBy?: string;
  createdAt: string;
}

/* -------------------------------- Dashboard ------------------------------- */

export interface DashboardData {
  todayOrders: number;
  inProgress: number;
  completed: number;
  readyForDelivery: number;
  delayed: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  newCustomers: number;
  topService: { id: string; title: string; count: number } | null;
  topGarment: { id: string; title: string; count: number } | null;
  remainingMonthlySms: number;
  remainingPurchasedSms: number;
  monthlyExpenses?: number;
  lowStockItems?: Array<{ _id: string; title: string; currentQuantity: number; minimumQuantity: number; unit: string }>;
  chart: {
    granularity: "daily" | "weekly" | "monthly";
    rows: Array<{ key: string; jalaliKey: string; revenue: number; orders: number }>;
  };
}

export interface SuperAdminDashboardData {
  mode: "super_admin";
  totalBusinesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  suspendedBusinesses: number;
  totalUsers: number;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  totalSmsSent: number;
  totalSmsFailed: number;
  totalCashbackIssued: number;
  totalCashbackUsed: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
  recentBusinesses: Array<{
    _id: string;
    name: string;
    slug: string;
    status: string;
    ownerName: string;
    ownerPhone: string;
    createdAt: string;
  }>;
  chart: {
    granularity: "daily" | "weekly" | "monthly";
    rows: Array<{ key: string; jalaliKey: string; revenue: number; orders: number }>;
  };
}

/* ------------------------------ Subscriptions ----------------------------- */

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  semiAnnualPrice: number;
  annualPrice: number;
  duration: number;
  features: string[];
  monthlySmsQuota: number;
  availableFeatures: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface ActiveSubscription {
  _id: string;
  business: string;
  subscriptionPlan: SubscriptionPlan | string;
  startDate: string;
  expireDate: string;
  status: "active" | "expired" | "cancelled" | "pending";
  monthlySmsQuota: number;
  monthlySmsUsed: number;
}

/* -------------------------------- Settings -------------------------------- */

export interface WorkingHour {
  day: number;
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessEnabledService {
  serviceType: string;
  enabled: boolean;
  defaultDuration: number;
  description?: string;
}

export interface BusinessSettings {
  _id: string;
  business: string;
  laundryName?: string;
  ownerName?: string;
  logo?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  workingHours: WorkingHour[];
  smsEnabled: boolean;
  smsProvider?: string;
  smsSender?: string;
  notifications: {
    orderRegistered?: boolean;
    orderCompleted?: boolean;
    orderReady?: boolean;
    birthday?: boolean;
  };
  receipt: {
    template?: string;
    showLogo: boolean;
    showQrCode: boolean;
    showBarcode: boolean;
    showBusinessPhone: boolean;
    showPolicies: boolean;
  };
  policies?: string;
  enabledServices: BusinessEnabledService[];
  urgentMultiplier: number;
  maxDailyOrders?: number;
}

/* -------------------------------- Receipts -------------------------------- */

export interface Receipt {
  _id: string;
  business: string;
  customer: Customer | string;
  order: { orderNumber: string } | string;
  receiptNumber: string;
  orderNumber: string;
  acceptedAt: string;
  deliveryDate: string;
  items: Array<{
    garmentTypeTitle: string;
    quantity: number;
    serviceTitles: string[];
    unitPrice: number;
    lineTotal: number;
  }>;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  visibility: {
    showLogo: boolean;
    showQrCode: boolean;
    showBarcode: boolean;
    showBusinessPhone: boolean;
    showPolicies: boolean;
  };
  policies?: string;
  qrPayload?: string;
  barcodePayload?: string;
  createdAt: string;
}

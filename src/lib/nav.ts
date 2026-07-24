import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Tags,
  Boxes,
  FileBarChart,
  CreditCard,
  Settings,
  Building2,
  Crown,
  Package,
  BookOpen,
  ShieldCheck,
  CalendarDays,
  Zap,
  Ticket as TicketIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

/* Business user navigation (laundry owner/manager/staff) */
export const navItems: NavItem[] = [
  { title: "داشبورد", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.read" },
  { title: "سفارشات", href: "/orders", icon: ShoppingBag, permission: "order.read" },
  { title: "تقویم سفارشات", href: "/orders-calendar", icon: CalendarDays, permission: "order.read" },
  { title: "مشتریان", href: "/customers", icon: Users, permission: "customer.read" },
  { title: "قیمت‌گذاری", href: "/laundry-pricing", icon: Tags, permission: "pricing.read" },
  { title: "انبار", href: "/inventory", icon: Boxes, permission: "inventory.read" },
  { title: "هزینه‌ها", href: "/expenses", icon: FileBarChart, permission: "report.read" },
  { title: "گزارشات", href: "/reports", icon: FileBarChart, permission: "report.read" },
  { title: "پیامک", href: "/sms", icon: Package, permission: "sms.business.package.read" },
  { title: "تیکت‌ها", href: "/tickets", icon: TicketIcon, permission: "ticket.create" },
  { title: "اشتراک", href: "/subscription", icon: CreditCard, permission: "subscription.active.read" },
  { title: "تنظیمات", href: "/settings", icon: Settings, permission: "business.settings.read" },
];

/* Super Admin navigation (platform-wide management) */
export const adminNavItems: NavItem[] = [
  { title: "داشبورد", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.read" },
  { title: "بیزینس‌ها", href: "/admin/businesses", icon: Building2, permission: "business.read" },
  { title: "کاربران", href: "/admin/users", icon: Users, permission: "user.read" },
  { title: "پلن‌های اشتراک", href: "/admin/plans", icon: Crown, permission: "subscription.plan.read" },
  { title: "بسته‌های پیامک", href: "/admin/sms-packages", icon: Package, permission: "sms.package.read" },
  { title: "کاتالوگ‌ها", href: "/admin/catalogs", icon: BookOpen, permission: "catalog.read" },
  { title: "گزارشات سامانه", href: "/admin/reports", icon: FileBarChart, permission: "report.read" },
  { title: "اشتراک‌های فعال", href: "/admin/subscriptions", icon: CreditCard, permission: "subscription.active.read" },
  { title: "تیکت‌ها", href: "/admin/tickets", icon: TicketIcon, permission: "ticket.read" },
];

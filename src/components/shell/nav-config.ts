import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Contact,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Receipt,
  Repeat,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** false (default) = not built yet -> renders the "coming soon" placeholder. */
  ready?: boolean;
  /** Phase this lands in, shown on the placeholder. */
  phase?: number;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

/** Standalone item shown above the grouped navigation. */
export const dashboardItem: NavItem = {
  title: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
  ready: true,
};

/** The full domain navigation from the architecture doc (Step 6 / Step 7). */
export const navGroups: NavGroup[] = [
  {
    label: "Finance",
    icon: Wallet,
    items: [
      { title: "Overview", href: "/finance", icon: Gauge, phase: 3 },
      { title: "Revenue", href: "/finance/revenue", icon: TrendingUp, phase: 3 },
      { title: "Expenses", href: "/finance/expenses", icon: Receipt, phase: 3 },
      { title: "Invoices", href: "/finance/invoices", icon: FileText, phase: 3 },
      { title: "Payments", href: "/finance/payments", icon: CreditCard, phase: 3 },
      { title: "Receivables", href: "/finance/receivables", icon: Wallet, phase: 3 },
      { title: "Payables", href: "/finance/payables", icon: Wallet, phase: 3 },
      { title: "Profit & Loss", href: "/finance/profit-loss", icon: BarChart3, phase: 3 },
      { title: "Financial Analytics", href: "/finance/financial-analytics", icon: BarChart3, phase: 6 },
    ],
  },
  {
    label: "CRM & Sales",
    icon: Contact,
    items: [
      { title: "Leads", href: "/crm/leads", icon: Target, phase: 2, ready: true },
      { title: "Pipeline", href: "/crm/pipeline", icon: FolderKanban, phase: 2, ready: true },
      { title: "Clients", href: "/crm/clients", icon: Users, phase: 2, ready: true },
      { title: "Sales Analytics", href: "/crm/sales-analytics", icon: BarChart3, phase: 2, ready: true },
    ],
  },
  {
    label: "Workforce",
    icon: Briefcase,
    items: [
      { title: "Workers", href: "/workforce", icon: Users, phase: 4 },
      { title: "Compensation", href: "/workforce/compensation", icon: Wallet, phase: 4 },
      { title: "Record Payment", href: "/workforce/payments/new", icon: CreditCard, phase: 4 },
      { title: "Workforce Analytics", href: "/workforce/workforce-analytics", icon: BarChart3, phase: 6 },
    ],
  },
  {
    label: "Operations",
    icon: FolderKanban,
    items: [
      { title: "Projects", href: "/operations/projects", icon: FolderKanban, phase: 5 },
      { title: "Tasks", href: "/operations/tasks", icon: ListChecks, phase: 5 },
      { title: "Calendar", href: "/operations/calendar", icon: CalendarDays, phase: 5 },
      { title: "Vendors", href: "/operations/vendors", icon: Building2, phase: 5 },
      { title: "Subscriptions", href: "/operations/subscriptions", icon: Repeat, phase: 5 },
      { title: "Documents", href: "/operations/documents", icon: FileText, phase: 5 },
      { title: "SOPs", href: "/operations/sops", icon: ClipboardList, phase: 5 },
    ],
  },
  {
    label: "Business Intelligence",
    icon: BarChart3,
    items: [
      { title: "Analytics", href: "/analytics", icon: BarChart3, phase: 6 },
    ],
  },
  {
    label: "Admin",
    icon: ShieldCheck,
    items: [
      { title: "Users", href: "/admin/users", icon: UserCog, phase: 1, ready: false },
      { title: "Roles", href: "/admin/roles", icon: ShieldCheck, phase: 1, ready: false },
      { title: "Audit Log", href: "/admin/audit-log", icon: FileText, phase: 6 },
      { title: "Settings", href: "/admin/settings", icon: Settings, phase: 1, ready: false },
    ],
  },
];

/** Flat list of every navigable route (for placeholder generation + lookups). */
export const allNavItems: NavItem[] = [
  dashboardItem,
  ...navGroups.flatMap((g) => g.items),
];

export const brandIcon = GraduationCap;

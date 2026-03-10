"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  PackagePlus,
  ClipboardList,
  BarChart2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "ダッシュボード",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "商品マスタ",
    href: "/products",
    icon: Package,
  },
  {
    label: "仕入先",
    href: "/suppliers",
    icon: Truck,
  },
  {
    label: "納入先",
    href: "/customers",
    icon: Users,
  },
  {
    label: "入庫",
    href: "/inbound",
    icon: PackagePlus,
  },
  {
    label: "オーダー",
    href: "/orders",
    icon: ClipboardList,
  },
  {
    label: "レポート",
    href: "/reports",
    icon: BarChart2,
  },
];

const adminItems = [
  {
    label: "ユーザー管理",
    href: "/admin/users",
    icon: Settings,
  },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar flex flex-col">
      <div className="p-4 border-b">
        <h1 className="font-semibold text-sm text-sidebar-foreground">在庫管理システム</h1>
      </div>
      <nav className="flex-1 p-2 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-1 border-t" />
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}

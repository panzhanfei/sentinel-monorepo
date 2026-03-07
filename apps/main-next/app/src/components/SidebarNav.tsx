"use client";
import { LayoutDashboard, Eye, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const sidebarNavItems = [
  {
    href: "/dashboard",
    label: "总览 (Next.js)",
    icon: LayoutDashboard,
  },
  {
    href: "/monitor",
    label: "资产监控 (Vue)",
    icon: Eye,
  },
  {
    href: "/audit",
    label: "安全审计 (React)",
    icon: Shield,
  },
];

export const SidebarNav = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {sidebarNavItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);

        return (
          <Link
            key={href}
            href={href}
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
              transition-all duration-200 overflow-hidden
              ${
                active
                  ? "text-indigo-600 bg-indigo-50 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            {/* 激活状态左侧指示条 */}
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
            )}

            {/* 图标 */}
            <Icon
              size={18}
              className={`
                transition-transform duration-200 group-hover:scale-110
                ${active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}
              `}
            />

            {/* 标签 */}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

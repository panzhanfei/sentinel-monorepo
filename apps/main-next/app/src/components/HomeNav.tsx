"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "总览 (Next.js)" },
  { href: "/monitor", label: "资产监控 (Vue)" },
  { href: "/audit", label: "安全审计 (React)" },
];

export const HomeNav = () => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  return (
    <nav className="flex-1 px-4 py-4 space-y-1">
      {navItems.map((item) => {
        const { href, label } = item;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-4 py-3 text-sm font-medium cursor-pointer rounded-xl transition-all ${
              isActive(href)
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

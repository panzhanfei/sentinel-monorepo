"use client";
import { Shield, Search, FileText } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const sidebarNavItems = [
  { href: "/dashboard", label: "Security_Core", icon: Shield },
  { href: "/monitor", label: "Asset_Scanner", icon: Search },
  { href: "/audit", label: "Deep_Audit", icon: FileText },
];

export const SidebarNav = () => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="flex-1 px-4 py-8 space-y-3">
      <div className="px-4 mb-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
        Main Menu
      </div>
      {sidebarNavItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);

        return (
          <Link
            key={href}
            href={href}
            className={`
              group relative flex items-center gap-2 px-4 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em]
              transition-shadow duration-300   
              ${
                active
                  ? "text-blue-400 bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }
            `}
          >
            {active && (
              <span className="absolute left-0 w-1.5 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_#3b82f6]" />
            )}
            <Icon
              size={18}
              className={`transition-transform duration-300 group-hover:scale-110 ${active ? "text-blue-400" : "text-slate-600 group-hover:text-slate-300"}`}
            />
            <span className="relative z-10">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

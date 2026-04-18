import { AuditReactHost } from "@/app/src/components/AuditReactHost";

/**
 * 布局在 /audit 与 /audit/** 之间切换时不卸载，避免 Wujie 与骨架层随 page 重挂载而闪烁。
 */
export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full w-full">
      <AuditReactHost />
      {children}
    </div>
  );
}

import { headers } from "next/headers";
import { AuditReactHost } from "@/wujie/AuditReactHost";
import { resolveWujieSubAppBases } from "@/wujie/subAppOrigins";

/**
 * 布局在 /audit 与 /audit/** 之间切换时不卸载，避免 Wujie 与骨架层随 page 重挂载而闪烁。
 */
const AuditLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const h = await headers();
  const { react } = resolveWujieSubAppBases(h.get("host"));
  return (
    <div className="relative h-full w-full">
      <AuditReactHost wujieReactBase={react} />
      {children}
    </div>
  );
};

export default AuditLayout;

import { headers } from "next/headers";
import { MonitorVueHost, resolveWujieSubAppBases } from "@/wujie";

/**
 * 布局在 /monitor 与 /monitor/** 之间切换时不卸载，避免 Wujie 骨架层闪烁。
 */
const MonitorLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const h = await headers();
  const { vue } = resolveWujieSubAppBases(h.get("host"));
  return (
    <div className="relative h-full w-full">
      <MonitorVueHost wujieVueBase={vue} />
      {children}
    </div>
  );
};

export default MonitorLayout;

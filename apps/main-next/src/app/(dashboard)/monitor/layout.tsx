import { MonitorVueHost } from "@/wujie/MonitorVueHost";

/**
 * 布局在 /monitor 与 /monitor/** 之间切换时不卸载，避免 Wujie 骨架层闪烁。
 */
const MonitorLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="relative h-full w-full">
      <MonitorVueHost />
      {children}
    </div>
  );
};

export default MonitorLayout;

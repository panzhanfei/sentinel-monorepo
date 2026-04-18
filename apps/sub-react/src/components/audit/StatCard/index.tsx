import type { IStatCardProps } from "./interface";

export const StatCard = ({
  label,
  value,
  valueClassName = "text-white",
  footer,
  decoration,
}: IStatCardProps) => {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
      {decoration}
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
        {label}
      </p>
      <p className={`text-4xl font-black mt-3 ${valueClassName}`}>{value}</p>
      {footer}
    </div>
  );
}

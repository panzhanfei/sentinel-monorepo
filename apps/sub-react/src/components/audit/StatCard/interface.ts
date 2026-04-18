import type { ReactNode } from "react";

export interface IStatCardProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  footer?: ReactNode;
  decoration?: ReactNode;
}

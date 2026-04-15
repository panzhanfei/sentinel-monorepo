import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  footer?: ReactNode;
  decoration?: ReactNode;
}

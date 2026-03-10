"use client";

import { useEffect } from "react";
import { useMotionValue, useSpring, motion, useTransform } from "framer-motion";

export function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(value);
  // spring 配置让动画有弹性，不生硬
  const rounded = useSpring(count, { stiffness: 50, damping: 15 });
  const displayValue = useTransform(rounded, (latest) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(latest),
  );

  useEffect(() => {
    count.set(value);
  }, [value, count]);

  return (
    <motion.span
      className="inline-block tabular-nums font-mono"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {displayValue}
    </motion.span>
  );
}

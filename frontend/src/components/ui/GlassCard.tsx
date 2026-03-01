import { ReactNode } from "react";

export const glassCardClass =
  "glass-card inbox-glass-text h-auto w-full max-w-full";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return <section className={`${glassCardClass} ${className}`.trim()}>{children}</section>;
}
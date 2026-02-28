import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "neutral" | "danger";
type ButtonSize = "md" | "lg";

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

const baseButtonClass =
  "btn-fill-anim inline-flex items-center justify-center overflow-hidden rounded-control border disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70";

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-brand-500 text-white [--btn-fill:#0073D1]",
  secondary: "border-brand-200 bg-white text-brand-700 shadow-sm [--btn-fill:#4D82BC] hover:text-white",
  ghost: "border-brand-200 bg-brand-50 text-brand-600 [--btn-fill:#B8DFFF]",
  neutral: "border-transparent bg-white text-ink-900 shadow-sm [--btn-fill:#E6F4FF]",
  danger: "border-transparent bg-rose-600 text-white [--btn-fill:#BE123C]"
};

const sizeClassMap: Record<ButtonSize, string> = {
  md: "px-3 py-2.5 text-sm font-semibold",
  lg: "px-3 py-3 text-base font-bold sm:py-3.5 sm:text-lg"
};

export function buttonClass({
  variant = "primary",
  size = "md",
  fullWidth = true,
  className
}: ButtonClassOptions = {}) {
  return [
    baseButtonClass,
    variantClassMap[variant],
    sizeClassMap[size],
    fullWidth ? "w-full" : "w-auto",
    className ?? ""
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonClassOptions;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = true,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

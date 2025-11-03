"use client";

import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full border border-transparent px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white shadow-glow hover:bg-accent/90 active:bg-accent/80",
        secondary:
          "bg-white/5 text-foreground border border-white/10 hover:bg-white/10",
        ghost: "bg-transparent text-foreground hover:bg-white/10",
        outline:
          "border border-white/20 text-white hover:bg-white/10 hover:border-white/40"
      },
      size: {
        default: "h-10",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

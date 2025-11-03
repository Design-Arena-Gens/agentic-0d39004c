"use client";

import clsx from "clsx";
import * as React from "react";

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  minLabel?: string;
  maxLabel?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ label, minLabel, maxLabel, className, ...props }, ref) => (
    <label className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-white/70">
        {label}
      </span>
      <div className="flex items-center gap-3">
        {minLabel && (
          <span className="text-xs text-white/40 font-mono">{minLabel}</span>
        )}
        <input
          ref={ref}
          type="range"
          className={clsx(
            "h-2 w-full appearance-none rounded-full bg-white/10 accent-accent",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent",
            "[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent",
            className
          )}
          {...props}
        />
        {maxLabel && (
          <span className="text-xs text-white/40 font-mono">{maxLabel}</span>
        )}
      </div>
    </label>
  )
);
Slider.displayName = "Slider";

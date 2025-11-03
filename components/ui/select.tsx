"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface SelectProps<T extends string>
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label: string;
  options: SelectOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
}

export function Select<T extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
  ...props
}: SelectProps<T>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-white/70">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onValueChange(event.target.value as T)}
          className={`w-full appearance-none rounded-lg border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm font-medium text-white transition hover:border-white/25 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/60 ${className ?? ""}`}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-background text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
      </div>
      {options.find((option) => option.value === value)?.description && (
        <p className="text-xs text-white/40">
          {options.find((option) => option.value === value)?.description}
        </p>
      )}
    </label>
  );
}

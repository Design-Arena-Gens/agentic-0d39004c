"use client";

import { Toaster } from "sonner";

export function Providers() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "rgba(12,12,18,0.9)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#f8f9ff",
          backdropFilter: "blur(12px)"
        }
      }}
    />
  );
}

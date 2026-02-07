"use client";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import React from "react"


export function RpgPanel({ children, className = "", style, onClick }: { children: ReactNode; className?: string; style?: React.CSSProperties; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <div className={`pixel-border ${className}`} style={{ backgroundColor: "rgba(42,26,14,0.94)", padding: 10, ...style }} onClick={onClick}>
      {children}
    </div>
  );
}

const BTN_COLORS = {
  primary: { bg: "#c8a24e", border: "#8b6508", text: "#2a1a0e", hover: "#dbb85a" },
  secondary: { bg: "#3a6e3a", border: "#2a5a1e", text: "#d4e8c4", hover: "#4a8e4a" },
  danger: { bg: "#8b3a3a", border: "#6e2222", text: "#f5d0d0", hover: "#a04a4a" },
};

export function RpgButton({ variant = "primary", children, className = "", style, ...props }:
  { variant?: "primary" | "secondary" | "danger" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const c = BTN_COLORS[variant];
  return (
    <button type="button" {...props} className={`cursor-pointer transition-all active:translate-y-px ${className}`}
      style={{
        backgroundColor: c.bg, border: `2px solid ${c.border}`, color: c.text,
        padding: "6px 12px", fontSize: 7, fontFamily: "'Press Start 2P',monospace",
        boxShadow: `inset 1px 1px 0 rgba(255,255,255,0.2), 0 2px 0 ${c.border}`,
        ...style,
      }}>
      {children}
    </button>
  );
}

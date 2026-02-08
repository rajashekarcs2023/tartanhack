"use client";
import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from "react";
import React from "react"


export function RpgPanel({ children, className = "", style, onClick }: { children: ReactNode; className?: string; style?: CSSProperties; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <div className={`pixel-border ${className}`} style={{ backgroundColor: "rgba(42,26,14,0.94)", padding: 10, ...style }} onClick={onClick}>
      {children}
    </div>
  );
}

export function RpgButton({ variant = "primary", children, className = "", style, ...props }: { variant?: "primary" | "secondary" | "danger" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const colors = {
    primary: { bg: "#8b5e3c", border: "#c4956a", shadow: "inset 1px 1px 0 #d4a87a, inset -1px -1px 0 #6a3e1c", text: "#fff8e7" },
    secondary: { bg: "#2a4a2a", border: "#5a8a5a", shadow: "inset 1px 1px 0 #6a9a6a, inset -1px -1px 0 #1a3a1a", text: "#a0d8a0" },
    danger: { bg: "#6a1a1a", border: "#a04040", shadow: "inset 1px 1px 0 #c06060, inset -1px -1px 0 #4a0a0a", text: "#f0a0a0" },
  }[variant];
  return (
    <button type="button" className={className} {...props}
      style={{ backgroundColor: colors.bg, border: `2px solid ${colors.border}`, boxShadow: colors.shadow, color: colors.text, padding: "6px 12px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 7, letterSpacing: 0.5, ...style }}>
      {children}
    </button>
  );
}

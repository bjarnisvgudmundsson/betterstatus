"use client";

import { useRef, useEffect, useState } from "react";
import type { StatusState, TogglLink } from "@/lib/types";
import { fmtDT, fmtHours, initials } from "@/lib/utils";

// ─── Status config (exported so admin page can reference it) ──────────────────
export const S = {
  on_track:    { label: "On Track",    color: "#16A34A", bg: "#DCFCE7", text: "#14532D" },
  at_risk:     { label: "At Risk",     color: "#D97706", bg: "#FEF3C7", text: "#78350F" },
  blocked:     { label: "Blocked",     color: "#DC2626", bg: "#FEE2E2", text: "#7F1D1D" },
  not_started: { label: "Not Started", color: "#9CA3AF", bg: "#F3F4F6", text: "#374151" },
  done:        { label: "Done",        color: "#6366F1", bg: "#EEF2FF", text: "#312E81" },
} as const;
export const SKEYS = Object.keys(S) as StatusState[];

// ─── Avatar ───────────────────────────────────────────────────────────────────
const ABGS  = { Consultant: "#E8E4FF", Client: "#FEF3C7", Partner: "#DCFCE7", Buyer: "#FEE2E2" } as Record<string, string>;
const ATXTS = { Consultant: "#4338CA", Client: "#92400E", Partner: "#14532D", Buyer: "#7F1D1D" } as Record<string, string>;

export function Avatar({ name, role, size = 26 }: { name: string; role: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: ABGS[role] || "#F3F4F6", color: ATXTS[role] || "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.37, fontWeight: 700, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

// ─── Status dot ───────────────────────────────────────────────────────────────
export function StatusDot({ state, size = 8 }: { state: StatusState; size?: number }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: S[state].color, flexShrink: 0 }} />
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
export function StatusPill({ state, small, onClick }: { state: StatusState; small?: boolean; onClick?: () => void }) {
  const s = S[state];
  return (
    <span onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: small ? "2px 7px" : "3px 9px", borderRadius: 4, background: s.bg, color: s.text, fontSize: small ? 11 : 12, fontWeight: 500, whiteSpace: "nowrap", cursor: onClick ? "pointer" : "default", userSelect: "none" }}>
      <StatusDot state={state} size={small ? 6 : 7} />
      {s.label}
    </span>
  );
}

// ─── Quick status pill (clickable popover) ────────────────────────────────────
export function QuickStatusPill({ state, onChangeState }: { state: StatusState; onChangeState: (s: StatusState) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <StatusPill state={state} small onClick={(e?: any) => { e?.stopPropagation?.(); setOpen((o) => !o); }} />
      {open && (
        <div className="pi" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 6, padding: 6, zIndex: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 130, display: "flex", flexDirection: "column", gap: 2 }}>
          {SKEYS.map((k) => (
            <button key={k} onClick={(e) => { e.stopPropagation(); onChangeState(k); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", borderRadius: 4, border: "none", background: k === state ? S[k].bg : "transparent", cursor: "pointer", textAlign: "left" }}>
              <StatusDot state={k} size={7} />
              <span style={{ fontSize: 12, color: "#18181B", fontWeight: k === state ? 600 : 400 }}>{S[k].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Toggl badge ──────────────────────────────────────────────────────────────
export function TogglBadge({ toggl }: { toggl: TogglLink }) {
  const h = fmtHours(toggl.hours7d);
  if (!h) return null;
  return (
    <span className="mono" title={`Toggl: ${toggl.projectId} · last 7 days`}
      style={{ fontSize: 11, color: "#6B7280", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 4, padding: "1px 7px", display: "inline-flex", alignItems: "center", gap: 4, cursor: "default" }}>
      <span style={{ color: "#9CA3AF" }}>⏱</span>{h}
    </span>
  );
}

// ─── Blocker badge ────────────────────────────────────────────────────────────
export function BlockerBadge({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#FFF5F5", border: "1px solid #FCA5A5", borderRadius: 4, padding: "7px 10px", marginTop: 8 }}>
      <span style={{ color: "#DC2626", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>⚠ Blocker</span>
      <span style={{ color: "#7F1D1D", fontSize: 12, lineHeight: 1.55 }}>{text}</span>
    </div>
  );
}

// ─── Timestamp ────────────────────────────────────────────────────────────────
export function Ts({ iso }: { iso: string }) {
  return <span className="mono" style={{ color: "#9CA3AF", fontSize: 11 }}>{fmtDT(iso)}</span>;
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ margin = "0" }: { margin?: string }) {
  return <div style={{ height: 1, background: "#EBEBEB", margin }} />;
}

// ─── Label ────────────────────────────────────────────────────────────────────
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ onClick, children, dark, small }: { onClick?: () => void; children: React.ReactNode; dark?: boolean; small?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: small ? "4px 10px" : "6px 13px", borderRadius: 4, fontSize: 12, fontWeight: 500, border: dark ? "none" : "1px solid #E5E7EB", background: dark ? "#18181B" : "#FFF", color: dark ? "#FFF" : "#374151" }}>
      {children}
    </button>
  );
}

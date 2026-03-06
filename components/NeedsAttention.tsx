"use client";
import type { Workstream, StatusState } from "@/lib/types";
import { StatusDot, QuickStatusPill, Ts } from "./atoms";

export function NeedsAttentionPanel({ workstreams, onChangeState }: { workstreams: Workstream[]; onChangeState: (itemId: string, state: StatusState) => void }) {
  const urgent = workstreams.flatMap((ws) => ws.items).filter((i) => i.state === "blocked" || i.state === "at_risk");
  if (!urgent.length) return null;
  return (
    <div style={{ background: "#FFF", border: "1px solid #FECACA", borderRadius: 6, padding: "12px 16px", marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", letterSpacing: "0.04em", textTransform: "uppercase" }}>Needs Attention</span>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{urgent.length} item{urgent.length > 1 ? "s" : ""}</span>
      </div>
      {urgent.map((item) => (
        <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderTop: "1px solid #FEF2F2" }}>
          <StatusDot state={item.state} size={8} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#18181B" }}>{item.title}</span>
              <QuickStatusPill state={item.state} onChangeState={(s) => onChangeState(item.id, s)} />
            </div>
            <div style={{ fontSize: 12, color: "#52525B" }}>{item.latestStatus}</div>
            {item.blocker && <div style={{ fontSize: 12, color: "#7F1D1D", marginTop: 3 }}>⚠ {item.blocker}</div>}
          </div>
          <Ts iso={item.updatedAt} />
        </div>
      ))}
    </div>
  );
}

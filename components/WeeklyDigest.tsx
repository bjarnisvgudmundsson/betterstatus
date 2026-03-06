"use client";
import type { Client } from "@/lib/types";
import { flatItems, fmtHours } from "@/lib/utils";
import { StatusDot, StatusPill, TogglBadge, Divider, Btn } from "./atoms";

export function WeeklyDigest({ client, onClose }: { client: Client; onClose: () => void }) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const items = flatItems(client.workstreams).map((item) => ({
    ...item,
    recentUpdates: item.updates.filter((u) => new Date(u.timestamp) >= weekAgo),
  })).filter((i) => i.recentUpdates.length > 0 || i.state === "blocked" || i.state === "at_risk");

  return (
    <div className="fi" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.28)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 16px" }}
      onClick={onClose}>
      <div className="sd" style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8, width: "100%", maxWidth: 640, maxHeight: "80vh", overflow: "auto", padding: "24px 28px" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#18181B", letterSpacing: "-0.01em" }}>This Week's Summary</div>
            <div className="mono" style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{client.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 16, color: "#9CA3AF", padding: 4, cursor: "pointer" }}>✕</button>
        </div>
        <Divider margin="14px 0 16px" />
        {!items.length && <div style={{ color: "#9CA3AF", fontSize: 13 }}>No updates this week.</div>}
        {items.map((item) => (
          <div key={item.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <StatusDot state={item.state} size={8} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#18181B" }}>{item.title}</span>
              <StatusPill state={item.state} small />
              {item.toggl && fmtHours(item.toggl.hours7d) && <TogglBadge toggl={item.toggl} />}
            </div>
            {item.recentUpdates.length > 0
              ? item.recentUpdates.map((u) => (
                <div key={u.id} style={{ fontSize: 13, color: "#374151", paddingLeft: 16, borderLeft: "2px solid #E5E7EB", marginBottom: 4, lineHeight: 1.55 }}>{u.text}</div>
              ))
              : <div style={{ fontSize: 13, color: "#52525B", paddingLeft: 16, borderLeft: `2px solid #E5E7EB` }}>{item.latestStatus}</div>
            }
          </div>
        ))}
        <Divider margin="16px 0 14px" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn onClick={onClose}>Close</Btn>
          <Btn dark onClick={() => {
            navigator.clipboard?.writeText(
              items.map((i) => `${i.title}\n${(i.recentUpdates.length ? i.recentUpdates.map((u) => u.text) : [i.latestStatus]).join("\n")}`).join("\n\n")
            );
          }}>Copy Text</Btn>
        </div>
      </div>
    </div>
  );
}

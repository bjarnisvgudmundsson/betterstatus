"use client";
import type { Update } from "@/lib/types";
import { Ts } from "./atoms";

export function WeeklyHistoryPanel({ updates }: { updates: Update[] }) {
  if (!updates.length) return <div style={{ color: "#9CA3AF", fontSize: 12 }}>No prior updates.</div>;
  const grouped: Record<string, Update[]> = {};
  updates.forEach((u) => { if (!grouped[u.weekLabel]) grouped[u.weekLabel] = []; grouped[u.weekLabel].push(u); });
  return (
    <div>
      {Object.entries(grouped).map(([week, items]) => (
        <div key={week} style={{ marginBottom: 14 }}>
          <div className="mono" style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 6 }}>{week}</div>
          {items.map((u) => (
            <div key={u.id} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 1, background: "#E5E7EB", alignSelf: "stretch", marginLeft: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>{u.text}</div>
                <Ts iso={u.timestamp} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { NavBar } from "@/components/NavBar";
import { PingCard } from "@/components/Pings";

export default function AdminPage() {
  const clients = useStore((s) => s.clients);
  const { loadClient, acknowledgePing, respondPing } = useStore();

  useEffect(() => {
    const slugs = ["lsh", "tracing", "skylink"];
    slugs.forEach(slug => loadClient(slug));
  }, [loadClient]);

  const allPings = clients.flatMap(c => (c.pings || []).map(p => ({ ...p, clientSlug: c.slug, clientName: c.name })));
  const unread = allPings.filter(p => p.status === "unread");

  return (
    <><NavBar /><div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Admin — Pings</h1>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>
        {unread.length} unread {unread.length === 1 ? "message" : "messages"}
      </p>
      {allPings.length === 0 && <div style={{ fontSize: 13, color: "#9CA3AF" }}>No messages yet.</div>}
      {allPings.map((ping: any) => (
        <div key={ping.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{ping.clientName}</div>
          <PingCard
            ping={ping}
            onAcknowledge={(id) => acknowledgePing(ping.clientSlug, id)}
            onRespond={(id, resp) => respondPing(ping.clientSlug, id, resp)}
          />
        </div>
      ))}
    </div></>
  );
}

"use client";
import { use, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { NavBar } from "@/components/NavBar";
import { StatusDot, S } from "@/components/atoms";
import type { Deliverable } from "@/lib/types";

export default function ClientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const client = useStore((s) => s.clients.find((c) => c.slug === slug));
  const loading = useStore((s) => s.loading);
  const loadClient = useStore((s) => s.loadClient);
  const { sendPing } = useStore();
  const [pingText, setPingText] = useState("");
  const [pingAuthor, setPingAuthor] = useState("");

  useEffect(() => { if (!client) loadClient(slug); }, [slug, client, loadClient]);

  if (!client) return (<><NavBar /><div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px", textAlign: "center", color: "#6B7280" }}>Loading...</div></>);

  const deliverables = client.deliverables || [];

  return (
    <><NavBar /><div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{client.name}</h1>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>{client.pageTitle}</p>
      {client.purchaserMode === "subcontractor" && client.endClientName && (
        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>Delivered by Bjarni Sv. Guðmundsson on behalf of {client.name} for {client.endClientName}</p>
      )}
      {deliverables.map((d: Deliverable) => (
        <div key={d.id} style={{ background: "#FFF", border: "1px solid #EBEBEB", borderRadius: 6, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <StatusDot state={d.state} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{d.title}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>{d.description}</div>
              {d.nextSteps && <div style={{ fontSize: 12, color: "#6B7280" }}>→ {d.nextSteps}</div>}
              {d.blocker && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>⚠ {d.blocker}</div>}
            </div>
            <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 3, background: S[d.state].bg, color: S[d.state].text }}>{S[d.state].label}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 40, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 6, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Send a message</div>
        <input value={pingAuthor} onChange={(e) => setPingAuthor(e.target.value)} placeholder="Your name..." style={{ width: "100%", padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 13, marginBottom: 8 }} />
        <textarea value={pingText} onChange={(e) => setPingText(e.target.value)} placeholder="Message..." rows={3} style={{ width: "100%", padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 13, marginBottom: 8, resize: "vertical" }} />
        <button onClick={() => { if (pingAuthor && pingText) { sendPing(slug, pingAuthor, pingText); setPingText(""); setPingAuthor(""); } }} style={{ fontSize: 13, padding: "8px 16px", background: "#18181B", color: "#FFF", border: "none", borderRadius: 4, cursor: "pointer" }}>Send</button>
      </div>
    </div></>
  );
}

"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useStore } from "@/lib/store";
import { StatusDot, TogglBadge, Btn, Divider } from "@/components/atoms";
import { NavBar } from "@/components/NavBar";
import { PingCard } from "@/components/Pings";
import { S, SKEYS } from "@/components/atoms";

const IN: React.CSSProperties = { padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 13, color: "#18181B", background: "#FFF", outline: "none", width: "100%", display: "block" };
const TA: React.CSSProperties = { padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 13, color: "#18181B", background: "#FFF", outline: "none", width: "100%", resize: "vertical", lineHeight: 1.55 };

function AS({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFF", border: "1px solid #EBEBEB", borderRadius: 6, padding: "14px 18px", marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

export default function AdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const client = useStore((s) => s.clients.find((c) => c.slug === slug));
  const loading = useStore((s) => s.loading);
  const loadClient = useStore((s) => s.loadClient);
  const { addWorkstream, addItem, postUpdate, acknowledgePing, respondPing } = useStore();

  const [newWs, setNewWs]     = useState("");
  const [newItem, setNewItem] = useState({ wsId: "", title: "", state: "not_started", status: "", blocker: "", togglId: "" });
  const [newUpd, setNewUpd]   = useState({ wsId: "", itemId: "", text: "" });
  const [toast, setToast]     = useState("");

  useEffect(() => {
    if (!client) {
      loadClient(slug);
    }
  }, [slug, client, loadClient]);

  if (loading && !client) {
    return (
      <>
        <NavBar />
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px", textAlign: "center", color: "#6B7280" }}>
          Loading...
        </div>
      </>
    );
  }

  if (!client) return notFound();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const wsItems = newUpd.wsId ? ((client.workstreams || []).find((w) => w.id === newUpd.wsId)?.items || []) : [];
  const unread  = (client.pings || []).filter((p) => p.status === "unread").length;

  return (
    <>
      <NavBar />
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#18181B", color: "#FFF", padding: "9px 18px", borderRadius: 6, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 14px rgba(0,0,0,0.18)", zIndex: 9999 }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Link href={`/client/${slug}`} style={{ color: "#9CA3AF", fontSize: 12, textDecoration: "none" }}>← Back to client</Link>
          <span style={{ color: "#E0E0E0" }}>·</span>
          <span style={{ fontSize: 12, color: "#6B7280" }}>{client.name}</span>
        </div>

        <h1 style={{ fontSize: 19, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", marginBottom: 3 }}>
          Admin — {client.name}
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>
          State persists in localStorage. Wire <code style={{ fontSize: 12, background: "#F3F4F6", padding: "1px 5px", borderRadius: 3 }}>lib/store.ts</code> to your database to make it permanent.
        </p>

        {/* PING INBOX */}
        <AS title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            Buyer Messages
            {unread > 0 && <span style={{ background: "#DC2626", color: "#FFF", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 7px" }}>{unread} new</span>}
          </span>
        }>
          {!(client.pings || []).length && <div style={{ fontSize: 12, color: "#9CA3AF" }}>No messages yet.</div>}
          {(client.pings || []).map((pg) => (
            <PingCard
              key={pg.id}
              ping={pg}
              onAcknowledge={(id) => { acknowledgePing(slug, id); showToast("Acknowledged."); }}
              onRespond={(id, resp) => { respondPing(slug, id, resp); showToast("Response saved — visible to buyer."); }}
            />
          ))}
        </AS>

        {/* ADD WORKSTREAM */}
        <AS title="Add Workstream">
          <div style={{ display: "flex", gap: 8 }}>
            <input value={newWs} onChange={(e) => setNewWs(e.target.value)} placeholder="Workstream title…" style={IN}
              onKeyDown={(e) => { if (e.key === "Enter" && newWs.trim()) { addWorkstream(slug, newWs.trim()); setNewWs(""); showToast("Workstream added."); } }} />
            <Btn dark onClick={() => { if (!newWs.trim()) return; addWorkstream(slug, newWs.trim()); setNewWs(""); showToast("Workstream added."); }}>Add</Btn>
          </div>
        </AS>

        {/* ADD ITEM */}
        <AS title="Add Item">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <select value={newItem.wsId} onChange={(e) => setNewItem((i) => ({ ...i, wsId: e.target.value }))} style={IN}>
              <option value="">Select workstream…</option>
              {(client.workstreams || []).map((ws) => <option key={ws.id} value={ws.id}>{ws.title}</option>)}
            </select>
            <input value={newItem.title}  onChange={(e) => setNewItem((i) => ({ ...i, title: e.target.value }))}  placeholder="Item title…"      style={IN} />
            <input value={newItem.status} onChange={(e) => setNewItem((i) => ({ ...i, status: e.target.value }))} placeholder="One-line status…"  style={IN} />
            <div style={{ display: "flex", gap: 8 }}>
              <select value={newItem.state} onChange={(e) => setNewItem((i) => ({ ...i, state: e.target.value }))} style={IN}>
                {SKEYS.map((k) => <option key={k} value={k}>{S[k as keyof typeof S].label}</option>)}
              </select>
              <input value={newItem.blocker} onChange={(e) => setNewItem((i) => ({ ...i, blocker: e.target.value }))} placeholder="Blocker (optional)…" style={IN} />
            </div>
            {/* Toggl project ID */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9F9F8", border: "1px solid #EBEBEB", borderRadius: 4, padding: "7px 10px" }}>
              <span style={{ fontSize: 12, color: "#9CA3AF", flexShrink: 0 }}>⏱ Toggl Project ID</span>
              <input value={newItem.togglId} onChange={(e) => setNewItem((i) => ({ ...i, togglId: e.target.value }))}
                placeholder="e.g. 12345678 (optional)" style={{ ...IN, border: "none", padding: 0, background: "transparent" }} />
            </div>
            <Btn dark onClick={() => {
              if (!newItem.wsId || !newItem.title.trim()) return;
              const toggl = newItem.togglId.trim() ? { projectId: newItem.togglId.trim(), taskId: null, hours7d: 0 } : null;
              addItem(slug, newItem.wsId, {
                title: newItem.title.trim(),
                latestStatus: newItem.status.trim() || "(No status yet)",
                state: newItem.state as any,
                blocker: newItem.blocker.trim() || undefined,
                updatedAt: new Date().toISOString(),
                seenAt: new Date().toISOString(),
                toggl,
              });
              setNewItem({ wsId: "", title: "", state: "not_started", status: "", blocker: "", togglId: "" });
              showToast("Item added.");
            }}>Add Item</Btn>
          </div>
        </AS>

        {/* POST UPDATE */}
        <AS title="Post One-Line Update">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <select value={newUpd.wsId} onChange={(e) => setNewUpd((u) => ({ ...u, wsId: e.target.value, itemId: "" }))} style={IN}>
              <option value="">Select workstream…</option>
              {(client.workstreams || []).map((ws) => <option key={ws.id} value={ws.id}>{ws.title}</option>)}
            </select>
            <select value={newUpd.itemId} onChange={(e) => setNewUpd((u) => ({ ...u, itemId: e.target.value }))} style={IN} disabled={!newUpd.wsId}>
              <option value="">Select item…</option>
              {wsItems.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
            <textarea value={newUpd.text} onChange={(e) => setNewUpd((u) => ({ ...u, text: e.target.value }))} placeholder="Status update text…" rows={3} style={TA} />
            <Btn dark onClick={() => {
              if (!newUpd.wsId || !newUpd.itemId || !newUpd.text.trim()) return;
              postUpdate(slug, newUpd.wsId, newUpd.itemId, newUpd.text.trim());
              setNewUpd({ wsId: "", itemId: "", text: "" });
              showToast("Update posted.");
            }}>Post Update</Btn>
          </div>
        </AS>

        {/* OVERVIEW */}
        <AS title="Workstream Overview">
          {(client.workstreams || []).map((ws) => (
            <div key={ws.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <StatusDot state={ws.state} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{ws.title}</span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>({ws.items.length})</span>
              </div>
              {ws.items.map((it) => (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 7, paddingLeft: 16, marginBottom: 3 }}>
                  <StatusDot state={it.state} size={7} />
                  <span style={{ fontSize: 12, color: "#374151" }}>{it.title}</span>
                  {it.toggl && <TogglBadge toggl={it.toggl} />}
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>— {it.latestStatus}</span>
                </div>
              ))}
            </div>
          ))}
        </AS>
      </div>
    </>
  );
}

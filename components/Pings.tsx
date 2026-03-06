"use client";
import { useState } from "react";
import type { Ping } from "@/lib/types";
import { Avatar, Ts, Btn, Label, Divider } from "./atoms";

const TA: React.CSSProperties = { padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 13, color: "#18181B", background: "#FFF", outline: "none", width: "100%", resize: "vertical", lineHeight: 1.55 };

// ─── Client-facing composer ───────────────────────────────────────────────────
export function PingComposer({ onSend }: { onSend: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const send = () => { if (!text.trim()) return; onSend(text.trim()); setText(""); setOpen(false); };
  return (
    <div style={{ marginTop: 20 }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "#FFF", border: "1px dashed #D4D4D4", borderRadius: 6, fontSize: 12.5, color: "#6B7280", fontWeight: 500, width: "100%", cursor: "pointer" }}>
          ✉ Ask a question or flag something to the delivery team
        </button>
      ) : (
        <div className="sd" style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 6, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Avatar name="Bjarni" role="Consultant" size={22} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Bjarni</span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>· message to delivery team</span>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Your question or note…" rows={3} style={{ ...TA, marginBottom: 10 }} autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); if (e.key === "Escape") setOpen(false); }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn dark onClick={send}>Send</Btn>
            <Btn onClick={() => { setOpen(false); setText(""); }}>Cancel</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Buyer-visible response thread ───────────────────────────────────────────
export function PingResponseThread({ pings }: { pings: Ping[] }) {
  const visible = pings.filter((p) => p.status === "responded" && p.response);
  if (!visible.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <Label>Recent Replies from Delivery Team</Label>
      {visible.map((p) => (
        <div key={p.id} style={{ background: "#F9F9F8", border: "1px solid #EBEBEB", borderRadius: 6, padding: "10px 14px", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <Avatar name={p.author} role="Buyer" size={20} />
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{p.author}</span>
              <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 6 }}><Ts iso={p.timestamp} /></span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#52525B", paddingLeft: 28, marginBottom: 8 }}>{p.text}</div>
          <div style={{ paddingLeft: 28, borderLeft: "2px solid #DCFCE7", marginLeft: 4 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 3 }}>
              <Avatar name="Bjarni G." role="Consultant" size={18} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Bjarni G.</span>
            </div>
            <div style={{ fontSize: 13, color: "#374151", paddingLeft: 24 }}>{p.response}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Admin ping card ──────────────────────────────────────────────────────────
export function PingCard({ ping, onAcknowledge, onRespond }: { ping: Ping; onAcknowledge: (id: string) => void; onRespond: (id: string, response: string) => void }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState(ping.response || "");
  const sc = {
    unread:       { border: "#FCA5A5", bg: "#FFFBF5", lb: "#FEF3C7", lt: "#78350F", dc: "#D97706", l: "Unread" },
    acknowledged: { border: "#E5E7EB", bg: "#FFF",    lb: "#DCFCE7", lt: "#14532D", dc: "#16A34A", l: "Acknowledged" },
    responded:    { border: "#E5E7EB", bg: "#FFF",    lb: "#EEF2FF", lt: "#312E81", dc: "#6366F1", l: "Responded" },
  }[ping.status];

  return (
    <div className={ping.status === "unread" ? "fi" : ""} style={{ border: `1px solid ${sc.border}`, borderRadius: 6, padding: "13px 15px", marginBottom: 10, background: sc.bg }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <Avatar name={ping.author} role="Buyer" size={28} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#18181B" }}>{ping.author}</span>
            {ping.role && <span style={{ fontSize: 11, color: "#9CA3AF" }}>{ping.role}</span>}
            <Ts iso={ping.timestamp} />
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: sc.lt, background: sc.lb, padding: "2px 8px", borderRadius: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dc, display: "inline-block" }} />
              {sc.l}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginTop: 5 }}>{ping.text}</div>
        </div>
      </div>
      {ping.response && (
        <div style={{ background: "#F8F7F5", border: "1px solid #EBEBEB", borderRadius: 5, padding: "9px 12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>Your response · visible to buyer</div>
          <div style={{ fontSize: 13, color: "#374151" }}>{ping.response}</div>
        </div>
      )}
      {!showReply && (
        <div style={{ display: "flex", gap: 8 }}>
          {ping.status === "unread" && <Btn dark onClick={() => onAcknowledge(ping.id)}>Mark Acknowledged</Btn>}
          <Btn onClick={() => setShowReply(true)}>{ping.response ? "Edit Response" : "Write Response"}</Btn>
        </div>
      )}
      {showReply && (
        <div className="sd">
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your response — visible to the buyer…" rows={3} style={{ ...TA, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn dark onClick={() => { onRespond(ping.id, replyText); setShowReply(false); }}>Save Response</Btn>
            <Btn onClick={() => setShowReply(false)}>Cancel</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

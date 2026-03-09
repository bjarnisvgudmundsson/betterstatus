"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { NavBar } from "@/components/NavBar";
import { StatusDot, S, SKEYS } from "@/components/atoms";
import type { Deliverable, StatusState } from "@/lib/types";

const IN: React.CSSProperties = { padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 13, color: "#18181B", background: "#FFF", outline: "none", width: "100%" };

function DeliverableCard({ deliverable, onUpdate }: { deliverable: Deliverable; onUpdate: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(deliverable.title);
  const [description, setDescription] = useState(deliverable.description);
  const [nextSteps, setNextSteps] = useState(deliverable.nextSteps || "");
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const { updateDeliverable, deleteDeliverable, addComment, addReply } = useStore();

  const save = (field: string, value: any) => {
    updateDeliverable(deliverable.id, { [field]: value });
    setEditing(null);
    onUpdate();
  };

  return (
    <div style={{ background: "#FFF", border: "1px solid #EBEBEB", borderRadius: 6, padding: "14px 16px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <button onClick={() => setExpanded(!expanded)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: "#6B7280", padding: 0, marginTop: 2 }}>
          {expanded ? "−" : "+"}
        </button>
        <StatusDot state={deliverable.state} />
        <div style={{ flex: 1 }}>
          {editing === "title" ? (
            <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => save("title", title)} onKeyDown={(e) => e.key === "Enter" && save("title", title)} autoFocus style={IN} />
          ) : (
            <div onClick={() => setEditing("title")} style={{ fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 4 }}>{deliverable.title}</div>
          )}
          {editing === "description" ? (
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} onBlur={() => save("description", description)} autoFocus rows={2} style={{ ...IN, resize: "vertical" }} />
          ) : (
            <div onClick={() => setEditing("description")} style={{ fontSize: 13, color: "#6B7280", cursor: "pointer", marginBottom: 6 }}>{deliverable.description}</div>
          )}
          {editing === "nextSteps" ? (
            <input value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} onBlur={() => save("nextSteps", nextSteps || undefined)} onKeyDown={(e) => e.key === "Enter" && save("nextSteps", nextSteps || undefined)} autoFocus placeholder="Next steps..." style={IN} />
          ) : deliverable.nextSteps ? (
            <div onClick={() => setEditing("nextSteps")} style={{ fontSize: 12, color: "#6B7280", cursor: "pointer" }}>→ {deliverable.nextSteps}</div>
          ) : (
            <div onClick={() => setEditing("nextSteps")} style={{ fontSize: 11, color: "#9CA3AF", cursor: "pointer" }}>+ Next steps</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <select value={deliverable.state} onChange={(e) => updateDeliverable(deliverable.id, { state: e.target.value })} style={{ fontSize: 11, padding: "3px 6px", border: "1px solid #E5E7EB", borderRadius: 3, background: S[deliverable.state as StatusState].bg, color: S[deliverable.state as StatusState].text }}>
            {SKEYS.map((k) => <option key={k} value={k}>{S[k].label}</option>)}
          </select>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>{new Date(deliverable.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
          <button onClick={() => { if (confirm("Delete?")) deleteDeliverable(deliverable.id); }} style={{ fontSize: 10, color: "#D1D5DB", background: "transparent", border: "none", cursor: "pointer" }}>✕</button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
          {deliverable.updates && deliverable.updates.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>Updates</div>
              {deliverable.updates.map((update) => (
                <div key={update.id} style={{ marginBottom: 8, fontSize: 12, color: "#4B5563" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>{update.weekLabel}</div>
                  <div>{update.text}</div>
                </div>
              ))}
            </div>
          )}

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>Comments</div>
            {deliverable.comments && deliverable.comments.map((comment) => (
              <div key={comment.id} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: "2px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>
                  {comment.author} • {new Date(comment.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
                <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 6 }}>{comment.text}</div>
                {comment.replies && comment.replies.map((reply) => (
                  <div key={reply.id} style={{ marginLeft: 16, marginTop: 8, paddingLeft: 12, borderLeft: "2px solid #F3F4F6" }}>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>
                      {reply.author} • {new Date(reply.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                    <div style={{ fontSize: 12, color: "#4B5563" }}>{reply.text}</div>
                  </div>
                ))}
                {replyTo === comment.id ? (
                  <div style={{ marginTop: 8, marginLeft: 16 }}>
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Reply..." rows={2} style={{ ...IN, fontSize: 12, marginBottom: 6 }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { addReply(deliverable.id, comment.id, "Bjarni", "Consultant", replyText); setReplyText(""); setReplyTo(null); onUpdate(); }} style={{ fontSize: 11, padding: "4px 10px", background: "#18181B", color: "#FFF", border: "none", borderRadius: 3, cursor: "pointer" }}>Reply</button>
                      <button onClick={() => { setReplyTo(null); setReplyText(""); }} style={{ fontSize: 11, padding: "4px 10px", background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 3, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyTo(comment.id)} style={{ fontSize: 11, color: "#6B7280", background: "transparent", border: "none", cursor: "pointer", marginTop: 4 }}>Reply</button>
                )}
              </div>
            ))}

            <div style={{ marginTop: 12 }}>
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." rows={2} style={{ ...IN, fontSize: 12, marginBottom: 6 }} />
              <button onClick={() => { if (commentText) { addComment(deliverable.id, "Bjarni", "Consultant", commentText); setCommentText(""); onUpdate(); } }} style={{ fontSize: 11, padding: "6px 12px", background: "#18181B", color: "#FFF", border: "none", borderRadius: 3, cursor: "pointer" }}>Add Comment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const deliverables = useStore((s) => s.deliverables);
  const loading = useStore((s) => s.loading);
  const { loadAllDeliverables, createDeliverable, createClient } = useStore();
  const [showNewDeliv, setShowNewDeliv] = useState(false);
  const [newDeliv, setNewDeliv] = useState({ clientId: "", title: "", description: "", state: "not_started" });
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ slug: "", name: "", sector: "", pageTitle: "" });
  const [filterClient, setFilterClient] = useState<string | null>(null);

  useEffect(() => { loadAllDeliverables(); }, [loadAllDeliverables]);

  if (loading && deliverables.length === 0) {
    return (<><NavBar /><div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", textAlign: "center", color: "#6B7280" }}>Loading...</div></>);
  }

  const clients = Array.from(new Set(deliverables.map(d => d.clientSlug))).map(slug => ({ slug, name: deliverables.find(d => d.clientSlug === slug)?.clientName || slug }));
  const filtered = filterClient ? deliverables.filter(d => d.clientSlug === filterClient) : deliverables;
  const grouped = clients.map(c => ({ ...c, deliverables: filtered.filter(d => d.clientSlug === c.slug) })).filter(c => c.deliverables.length > 0);

  return (
    <><NavBar /><div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>All Deliverables</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setShowNewDeliv(!showNewDeliv)} style={{ fontSize: 13, padding: "8px 14px", background: "#18181B", color: "#FFF", border: "none", borderRadius: 4, cursor: "pointer" }}>+ New deliverable</button>
        <button onClick={() => setShowNewClient(!showNewClient)} style={{ fontSize: 13, padding: "8px 14px", background: "#FFF", color: "#18181B", border: "1px solid #E5E7EB", borderRadius: 4, cursor: "pointer" }}>+ New client</button>
        <select value={filterClient || ""} onChange={(e) => setFilterClient(e.target.value || null)} style={{ fontSize: 13, padding: "8px 14px", border: "1px solid #E5E7EB", borderRadius: 4 }}>
          <option value="">All clients</option>
          {clients.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      {showNewDeliv && (
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 6, padding: 14, marginBottom: 16 }}>
          <select value={newDeliv.clientId} onChange={(e) => setNewDeliv({ ...newDeliv, clientId: e.target.value })} style={{ ...IN, marginBottom: 8 }}>
            <option value="">Select client...</option>
            {clients.map(c => <option key={c.slug} value={deliverables.find(d => d.clientSlug === c.slug)?.clientId}>{c.name}</option>)}
          </select>
          <input value={newDeliv.title} onChange={(e) => setNewDeliv({ ...newDeliv, title: e.target.value })} placeholder="Title..." style={{ ...IN, marginBottom: 8 }} />
          <textarea value={newDeliv.description} onChange={(e) => setNewDeliv({ ...newDeliv, description: e.target.value })} placeholder="Description..." rows={2} style={{ ...IN, marginBottom: 8, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <select value={newDeliv.state} onChange={(e) => setNewDeliv({ ...newDeliv, state: e.target.value })} style={IN}>{SKEYS.map(k => <option key={k} value={k}>{S[k].label}</option>)}</select>
            <button onClick={() => { createDeliverable(newDeliv); setNewDeliv({ clientId: "", title: "", description: "", state: "not_started" }); setShowNewDeliv(false); }} style={{ fontSize: 13, padding: "8px 16px", background: "#18181B", color: "#FFF", border: "none", borderRadius: 4, cursor: "pointer" }}>Create</button>
          </div>
        </div>
      )}
      {showNewClient && (
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 6, padding: 14, marginBottom: 16 }}>
          <input value={newClient.slug} onChange={(e) => setNewClient({ ...newClient, slug: e.target.value })} placeholder="Slug..." style={{ ...IN, marginBottom: 8 }} />
          <input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Name..." style={{ ...IN, marginBottom: 8 }} />
          <input value={newClient.sector} onChange={(e) => setNewClient({ ...newClient, sector: e.target.value })} placeholder="Sector..." style={{ ...IN, marginBottom: 8 }} />
          <input value={newClient.pageTitle} onChange={(e) => setNewClient({ ...newClient, pageTitle: e.target.value })} placeholder="Page title..." style={{ ...IN, marginBottom: 8 }} />
          <button onClick={() => { createClient(newClient); setNewClient({ slug: "", name: "", sector: "", pageTitle: "" }); setShowNewClient(false); }} style={{ fontSize: 13, padding: "8px 16px", background: "#18181B", color: "#FFF", border: "none", borderRadius: 4, cursor: "pointer" }}>Create Client</button>
        </div>
      )}
      {grouped.map((group) => (
        <div key={group.slug} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>{group.name}</div>
          {group.deliverables.map((d) => (<DeliverableCard key={d.id} deliverable={d} onUpdate={loadAllDeliverables} />))}
        </div>
      ))}
    </div></>
  );
}

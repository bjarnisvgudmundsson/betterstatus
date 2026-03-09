"use client";
import { use, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { NavBar } from "@/components/NavBar";
import { StatusDot, S } from "@/components/atoms";
import type { Deliverable } from "@/lib/types";

const IN: React.CSSProperties = { padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 13, color: "#18181B", background: "#FFF", outline: "none", width: "100%" };

function DeliverableCard({ deliverable, clientSlug }: { deliverable: Deliverable; clientSlug: string }) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const { addComment, addReply, loadClient } = useStore();

  const handleComment = () => {
    if (commentText) {
      addComment(deliverable.id, "Client", "Buyer", commentText);
      setCommentText("");
      loadClient(clientSlug);
    }
  };

  const handleReply = (commentId: string) => {
    if (replyText) {
      addReply(deliverable.id, commentId, "Client", "Buyer", replyText);
      setReplyText("");
      setReplyTo(null);
      loadClient(clientSlug);
    }
  };

  return (
    <div style={{ background: "#FFF", border: "1px solid #EBEBEB", borderRadius: 6, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <button onClick={() => setExpanded(!expanded)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: "#6B7280", padding: 0, marginTop: 2 }}>
          {expanded ? "−" : "+"}
        </button>
        <StatusDot state={deliverable.state} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{deliverable.title}</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>{deliverable.description}</div>
          {deliverable.nextSteps && <div style={{ fontSize: 12, color: "#6B7280" }}>→ {deliverable.nextSteps}</div>}
          {deliverable.blocker && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>⚠ {deliverable.blocker}</div>}
        </div>
        <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 3, background: S[deliverable.state].bg, color: S[deliverable.state].text }}>{S[deliverable.state].label}</div>
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
                      <button onClick={() => handleReply(comment.id)} style={{ fontSize: 11, padding: "4px 10px", background: "#18181B", color: "#FFF", border: "none", borderRadius: 3, cursor: "pointer" }}>Reply</button>
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
              <button onClick={handleComment} style={{ fontSize: 11, padding: "6px 12px", background: "#18181B", color: "#FFF", border: "none", borderRadius: 3, cursor: "pointer" }}>Add Comment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
        <DeliverableCard key={d.id} deliverable={d} clientSlug={slug} />
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

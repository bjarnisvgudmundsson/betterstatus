"use client";
import { useState } from "react";
import type { Comment } from "@/lib/types";
import { Avatar, Ts, Btn } from "./atoms";

const TA: React.CSSProperties = { padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 4, fontSize: 13, color: "#18181B", background: "#FFF", outline: "none", width: "100%", resize: "vertical", lineHeight: 1.55 };

function ReplyComposer({ onSubmit, onCancel }: { onSubmit: (t: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  return (
    <div style={{ marginTop: 8 }}>
      <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply…" rows={2} style={TA}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) { onSubmit(text.trim()); setText(""); } if (e.key === "Escape") onCancel(); }} />
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <Btn dark onClick={() => { if (text.trim()) { onSubmit(text.trim()); setText(""); } }}>Reply</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function CommentBubble({ comment, onReply, isReply = false }: { comment: Comment | Comment["replies"][0]; onReply: (id: string, text: string) => void; isReply?: boolean }) {
  const [showReply, setShowReply] = useState(false);
  const replies = (comment as Comment).replies;
  return (
    <div style={{ display: "flex", gap: 9 }}>
      <Avatar name={comment.author} role={comment.authorRole} size={isReply ? 20 : 24} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>{comment.author}</span>
          {comment.authorRole && <span style={{ fontSize: 10, color: "#9CA3AF", background: "#F3F4F6", padding: "1px 5px", borderRadius: 3 }}>{comment.authorRole}</span>}
          <Ts iso={comment.timestamp} />
        </div>
        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, background: "#F9F9F8", border: "1px solid #EBEBEB", borderRadius: "0 6px 6px 6px", padding: "7px 10px" }}>
          {comment.text}
        </div>
        {!isReply && (
          <button onClick={() => setShowReply((r) => !r)} style={{ background: "none", border: "none", fontSize: 11, color: "#9CA3AF", marginTop: 4, padding: 0, cursor: "pointer" }}>
            {showReply ? "Cancel" : "↩ Reply"}
          </button>
        )}
        {showReply && (
          <ReplyComposer onSubmit={(t) => { onReply(comment.id, t); setShowReply(false); }} onCancel={() => setShowReply(false)} />
        )}
        {!isReply && replies?.length > 0 && (
          <div style={{ marginTop: 8, paddingLeft: 4, borderLeft: "2px solid #F0F0EE" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 10 }}>
              {replies.map((r) => <CommentBubble key={r.id} comment={r} onReply={() => {}} isReply />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentThread({ comments, onAdd, onReply }: { comments: Comment[]; onAdd: (t: string) => void; onReply: (cid: string, t: string) => void }) {
  const [text, setText] = useState("");
  const submit = () => { if (!text.trim()) return; onAdd(text.trim()); setText(""); };
  return (
    <div>
      {!comments.length && <div style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 10 }}>No comments yet.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: comments.length ? 14 : 0 }}>
        {comments.map((c) => <CommentBubble key={c.id} comment={c} onReply={onReply} />)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" rows={2} style={{ ...TA, flex: 1 }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }} />
        <button onClick={submit} style={{ alignSelf: "flex-end", padding: "7px 14px", background: "#18181B", color: "#FFF", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Post</button>
      </div>
    </div>
  );
}

export function LastCommentPreview({ comments, onClick }: { comments: Comment[]; onClick: () => void }) {
  const flat = comments.flatMap((c) => [c, ...(c.replies || [])]);
  if (!flat.length) return null;
  const last = flat[flat.length - 1];
  const total = comments.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0);
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ display: "flex", alignItems: "flex-start", gap: 7, marginTop: 7, padding: "6px 9px", background: "#F9F9F8", border: "1px solid #EBEBEB", borderRadius: 5, textAlign: "left", width: "100%", cursor: "pointer" }}>
      <Avatar name={last.author} role={last.authorRole} size={18} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{last.author}</span>
          <Ts iso={last.timestamp} />
          {total > 1 && <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>{total} comments</span>}
        </div>
        <div style={{ fontSize: 12, color: "#52525B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{last.text}</div>
      </div>
    </button>
  );
}

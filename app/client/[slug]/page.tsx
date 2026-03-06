"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { fmtDT, countByState, flatItems, isUnread, totalComments, fmtHours } from "@/lib/utils";
import {
  StatusDot, StatusPill, QuickStatusPill, BlockerBadge,
  TogglBadge, Divider, Label, Btn, Ts,
} from "@/components/atoms";
import { NavBar } from "@/components/NavBar";
import { CommentThread, LastCommentPreview } from "@/components/Comments";
import { WeeklyHistoryPanel } from "@/components/WeeklyHistory";
import { WeeklyDigest } from "@/components/WeeklyDigest";
import { NeedsAttentionPanel } from "@/components/NeedsAttention";
import { PingComposer, PingResponseThread } from "@/components/Pings";
import type { StatusItem, Workstream } from "@/lib/types";

// ─── Inline Post Update ───────────────────────────────────────────────────────
function InlinePostUpdate({ onPost }: { onPost: (text: string) => void }) {
  const [text, setText] = useState("");

  const handlePost = () => {
    if (text.trim()) {
      onPost(text.trim());
      setText("");
    }
  };

  return (
    <div style={{ marginBottom: 16, padding: "10px 12px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>POST UPDATE</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Status update text…"
        rows={2}
        style={{ width: "100%", padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 3, fontSize: 13, color: "#18181B", resize: "vertical", outline: "none", lineHeight: 1.55 }}
      />
      <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handlePost}
          disabled={!text.trim()}
          style={{ padding: "4px 12px", background: text.trim() ? "#18181B" : "#E5E7EB", color: text.trim() ? "#FFF" : "#9CA3AF", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 500, cursor: text.trim() ? "pointer" : "not-allowed" }}
        >
          Post
        </button>
      </div>
    </div>
  );
}

// ─── Inline Blocker Editor ────────────────────────────────────────────────────
function InlineBlockerEditor({ blocker, onSave }: { blocker?: string; onSave: (blocker: string | undefined) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(blocker || "");

  if (!blocker && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        style={{ fontSize: 12, color: "#9CA3AF", background: "transparent", border: "none", padding: "4px 0", marginBottom: 8, cursor: "pointer", textDecoration: "underline" }}
      >
        + Add blocker
      </button>
    );
  }

  if (editing) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", marginBottom: 4 }}>BLOCKER</div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (value.trim()) {
              onSave(value.trim());
            } else {
              onSave(undefined);
            }
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (value.trim()) {
                onSave(value.trim());
              } else {
                onSave(undefined);
              }
              setEditing(false);
            } else if (e.key === "Escape") {
              setValue(blocker || "");
              setEditing(false);
            }
          }}
          autoFocus
          placeholder="Describe the blocker…"
          style={{ width: "100%", padding: "6px 8px", border: "1px solid #FCA5A5", borderRadius: 3, fontSize: 13, color: "#18181B", outline: "none" }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
      <BlockerBadge text={blocker!} />
      <button
        onClick={() => setEditing(true)}
        style={{ fontSize: 11, color: "#9CA3AF", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
      >
        ✎
      </button>
      <button
        onClick={() => onSave(undefined)}
        style={{ fontSize: 11, color: "#DC2626", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Sub-item (nested) ────────────────────────────────────────────────────────
function NestedItem({ item }: { item: StatusItem }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "5px 0" }}>
      <div style={{ width: 1, background: "#E5E7EB", alignSelf: "stretch", marginLeft: 10, marginRight: 2, flexShrink: 0 }} />
      <StatusDot state={item.state} size={7} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#18181B" }}>{item.title}</span>
          <StatusPill state={item.state} small />
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{item.latestStatus}</div>
      </div>
      <Ts iso={item.updatedAt} />
    </div>
  );
}

// ─── Status item row ──────────────────────────────────────────────────────────
function StatusItemRow({ item, slug, wsId, isConsultant }: { item: StatusItem; slug: string; wsId: string; isConsultant: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"history" | "comments">("history");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [titleValue, setTitleValue] = useState(item.title);
  const [statusValue, setStatusValue] = useState(item.latestStatus);

  const { addComment, addReply, changeItemState, updateItemTitle, updateItemStatus, updateItemBlocker, postUpdate } = useStore();
  const nComments = totalComments(item);
  const unread = isUnread(item);

  return (
    <div style={{ border: `1px solid ${unread ? "#FDE68A" : "#EBEBEB"}`, borderRadius: 6, background: unread ? "#FFFDF5" : "#FFF", marginBottom: 8, overflow: "hidden" }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{ width: "100%", background: "none", border: "none", padding: "11px 14px", display: "flex", alignItems: "flex-start", gap: 11, textAlign: "left" }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 2 }}>
          <StatusDot state={item.state} size={9} />
          {unread && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#D97706", display: "block" }} />}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
            {editingTitle && isConsultant ? (
              <input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => {
                  if (titleValue.trim() && titleValue !== item.title) {
                    updateItemTitle(slug, item.id, titleValue.trim());
                  } else {
                    setTitleValue(item.title);
                  }
                  setEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (titleValue.trim() && titleValue !== item.title) {
                      updateItemTitle(slug, item.id, titleValue.trim());
                    }
                    setEditingTitle(false);
                  } else if (e.key === "Escape") {
                    setTitleValue(item.title);
                    setEditingTitle(false);
                  }
                }}
                autoFocus
                style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B", border: "1px solid #E5E7EB", borderRadius: 3, padding: "2px 6px", outline: "none", minWidth: 200 }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B", cursor: isConsultant ? "pointer" : "default", position: "relative" }}
                onClick={(e) => {
                  if (isConsultant) {
                    e.stopPropagation();
                    setEditingTitle(true);
                  }
                }}
                onMouseEnter={(e) => {
                  if (isConsultant && !editingTitle) {
                    (e.currentTarget as HTMLElement).style.background = "#F9FAFB";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isConsultant) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                {item.title}
                {isConsultant && (
                  <span style={{ marginLeft: 4, fontSize: 10, color: "#9CA3AF", opacity: 0 }} className="edit-icon">✎</span>
                )}
              </span>
            )}
            <QuickStatusPill
              state={item.state}
              onChangeState={(s) => changeItemState(slug, item.id, s)}
            />
            {isConsultant && item.state !== "done" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changeItemState(slug, item.id, "done");
                }}
                style={{ fontSize: 11, fontWeight: 500, color: "#059669", background: "transparent", border: "none", padding: "2px 6px", borderRadius: 3, cursor: "pointer", opacity: 0 }}
                className="mark-done-btn"
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ECFDF5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                ✓ Mark done
              </button>
            )}
            {item.blocker && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", background: "#FEE2E2", padding: "1px 6px", borderRadius: 3 }}>
                Blocked
              </span>
            )}
            {unread && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "#92400E", background: "#FEF3C7", padding: "1px 6px", borderRadius: 3 }}>
                New activity
              </span>
            )}
          </div>
          {editingStatus && isConsultant ? (
            <input
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              onBlur={() => {
                if (statusValue.trim() && statusValue !== item.latestStatus) {
                  updateItemStatus(slug, item.id, statusValue.trim());
                } else {
                  setStatusValue(item.latestStatus);
                }
                setEditingStatus(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (statusValue.trim() && statusValue !== item.latestStatus) {
                    updateItemStatus(slug, item.id, statusValue.trim());
                  }
                  setEditingStatus(false);
                } else if (e.key === "Escape") {
                  setStatusValue(item.latestStatus);
                  setEditingStatus(false);
                }
              }}
              autoFocus
              style={{ fontSize: 13, color: "#52525B", lineHeight: 1.55, border: "1px solid #E5E7EB", borderRadius: 3, padding: "2px 6px", outline: "none", width: "100%" }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              style={{ fontSize: 13, color: "#52525B", lineHeight: 1.55, cursor: isConsultant ? "pointer" : "default" }}
              onClick={(e) => {
                if (isConsultant) {
                  e.stopPropagation();
                  setEditingStatus(true);
                }
              }}
              onMouseEnter={(e) => {
                if (isConsultant && !editingStatus) {
                  (e.currentTarget as HTMLElement).style.background = "#F9FAFB";
                }
              }}
              onMouseLeave={(e) => {
                if (isConsultant) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              {item.latestStatus}
              {isConsultant && (
                <span style={{ marginLeft: 4, fontSize: 10, color: "#9CA3AF", opacity: 0 }} className="edit-icon">✎</span>
              )}
            </div>
          )}

          {/* Sub-item pills on collapsed row */}
          {!expanded && item.children?.length > 0 && (
            <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
              {item.children.map((ch) => (
                <span key={ch.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#52525B", background: "#F3F4F6", border: "1px solid #EBEBEB", borderRadius: 4, padding: "2px 7px" }}>
                  <StatusDot state={ch.state} size={6} />{ch.title}
                </span>
              ))}
            </div>
          )}

          {/* Last comment preview */}
          {!expanded && item.comments?.length > 0 && (
            <LastCommentPreview
              comments={item.comments}
              onClick={() => { setExpanded(true); setTab("comments"); }}
            />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginTop: 2 }}>
          {item.toggl && <TogglBadge toggl={item.toggl} />}
          <Ts iso={item.updatedAt} />
          <span style={{ color: "#9CA3AF", fontSize: 11, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.14s" }}>▾</span>
        </div>
      </button>

      {expanded && (
        <div className="sd" style={{ borderTop: "1px solid #F3F4F6", padding: "12px 14px 16px 36px" }}>
          {/* Blocker management */}
          {isConsultant ? (
            <InlineBlockerEditor
              blocker={item.blocker}
              onSave={(blocker) => updateItemBlocker(slug, item.id, blocker)}
            />
          ) : (
            item.blocker && <BlockerBadge text={item.blocker} />
          )}

          {item.children?.length > 0 && (
            <div style={{ margin: "10px 0 4px" }}>
              <Label>Sub-items</Label>
              {item.children.map((ch) => <NestedItem key={ch.id} item={ch} />)}
            </div>
          )}

          <Divider margin="12px 0" />

          <div style={{ display: "flex", marginBottom: 14 }}>
            {([["history", "Update History"], ["comments", `Comments${nComments ? ` (${nComments})` : ""}`]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ padding: "5px 13px", border: "1px solid", borderColor: tab === k ? "#18181B" : "#E5E7EB", background: tab === k ? "#18181B" : "transparent", color: tab === k ? "#FFF" : "#6B7280", fontSize: 12, fontWeight: 500, borderRadius: k === "history" ? "4px 0 0 4px" : "0 4px 4px 0", marginLeft: k === "comments" ? -1 : 0 }}>{l}</button>
            ))}
          </div>

          {tab === "history" && (
            <>
              {isConsultant && (
                <InlinePostUpdate
                  onPost={(text) => postUpdate(slug, wsId, item.id, text)}
                />
              )}
              <WeeklyHistoryPanel updates={item.updates} />
            </>
          )}
          {tab === "comments" && (
            <CommentThread
              comments={item.comments}
              onAdd={(text) => addComment(slug, item.id, text)}
              onReply={(cid, text) => addReply(slug, item.id, cid, text)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Workstream section ───────────────────────────────────────────────────────
function WorkstreamSection({ ws, slug, isConsultant }: { ws: Workstream; slug: string; isConsultant: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const counts = countByState(ws.items);

  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setCollapsed((c) => !c)} style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, padding: "5px 0", marginBottom: 8, textAlign: "left" }}>
        <StatusDot state={ws.state} size={10} />
        <span style={{ fontSize: 15, fontWeight: 600, color: "#18181B", flex: 1 }}>{ws.title}</span>
        <div style={{ display: "flex", gap: 5 }}>
          {counts.blocked > 0 && <StatusPill state="blocked" small />}
          {counts.at_risk  > 0 && <StatusPill state="at_risk"  small />}
          {counts.done     > 0 && <span style={{ fontSize: 11, color: "#9CA3AF" }}>{counts.done} done</span>}
        </div>
        <span style={{ color: "#9CA3AF", fontSize: 11, marginLeft: 4, transform: collapsed ? "rotate(-90deg)" : "rotate(0)", transition: "transform 0.14s" }}>▾</span>
      </button>
      {!collapsed && (
        <div className="sd">
          {ws.items.map((item) => <StatusItemRow key={item.id} item={item} slug={slug} wsId={ws.id} isConsultant={isConsultant} />)}
        </div>
      )}
    </div>
  );
}

// ─── Status summary bar ───────────────────────────────────────────────────────
function StatusSummaryBar({ slug }: { slug: string }) {
  const client = useStore((s) => s.clients.find((c) => c.slug === slug))!;
  const counts = countByState(flatItems(client.workstreams));

  return (
    <div style={{ background: "#FFF", border: "1px solid #EBEBEB", borderRadius: 6, padding: "13px 18px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Overall Status</div>
          <StatusPill state={client.overallState} />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {Object.entries(counts).filter(([, v]) => v > 0).map(([state, count]) => (
            <div key={state} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <StatusDot state={state as any} size={8} />
              <span style={{ fontSize: 12, color: "#52525B" }}>{count} {state.replace("_", " ")}</span>
            </div>
          ))}
        </div>
        <div style={{ borderLeft: "1px solid #EBEBEB", paddingLeft: 14 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>Last updated</div>
          <div className="mono" style={{ fontSize: 12, color: "#374151" }}>{fmtDT(client.lastUpdated)}</div>
        </div>
      </div>
      {client.summary && (
        <>
          <Divider margin="11px 0 9px" />
          <div style={{ fontSize: 13, color: "#52525B", lineHeight: 1.65 }}>{client.summary}</div>
        </>
      )}
    </div>
  );
}

// ─── New 3-Row Card Component ─────────────────────────────────────────────────
function ItemCard({ item, slug, wsId, isConsultant }: { item: StatusItem; slug: string; wsId: string; isConsultant: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"history" | "comments">("history");
  const [editingNextSteps, setEditingNextSteps] = useState(false);
  const [nextStepsValue, setNextStepsValue] = useState(item.nextSteps || "");

  const { addComment, addReply, changeItemState, updateItemTitle, updateItemStatus, updateItemBlocker, updateItemNextSteps, postUpdate } = useStore();
  const nComments = totalComments(item);
  const unread = isUnread(item);

  // Get last comment for preview
  const flatComments = item.comments.flatMap((c) => [c, ...(c.replies || [])]);
  const lastComment = flatComments.length > 0 ? flatComments[flatComments.length - 1] : null;

  return (
    <div style={{ border: `1px solid ${unread ? "#FDE68A" : "#EBEBEB"}`, borderRadius: 6, background: unread ? "#FFFDF5" : "#FFF", marginBottom: 8, overflow: "hidden" }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{ width: "100%", background: "none", border: "none", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 0, textAlign: "left", cursor: "pointer" }}
      >
        {/* ROW 1: status dot + title + pill + timestamp */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <StatusDot state={item.state} size={9} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#18181B", flex: 1 }}>{item.title}</span>
          <StatusPill state={item.state} small />
          {isConsultant && item.toggl && <TogglBadge toggl={item.toggl} />}
          <Ts iso={item.updatedAt} />
          <span style={{ color: "#9CA3AF", fontSize: 11, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.14s" }}>▾</span>
        </div>

        {/* ROW 2: latest status text */}
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, paddingLeft: 19 }}>{item.latestStatus}</div>

        {/* Next steps (both views show if exists, consultant can edit) */}
        {!expanded && (editingNextSteps && isConsultant ? (
          <div style={{ paddingLeft: 19, marginTop: 5 }} onClick={(e) => e.stopPropagation()}>
            <input
              value={nextStepsValue}
              onChange={(e) => setNextStepsValue(e.target.value)}
              onBlur={() => {
                if (nextStepsValue.trim() !== (item.nextSteps || "")) {
                  updateItemNextSteps(slug, item.id, nextStepsValue.trim() || undefined);
                }
                setEditingNextSteps(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (nextStepsValue.trim() !== (item.nextSteps || "")) {
                    updateItemNextSteps(slug, item.id, nextStepsValue.trim() || undefined);
                  }
                  setEditingNextSteps(false);
                } else if (e.key === "Escape") {
                  setNextStepsValue(item.nextSteps || "");
                  setEditingNextSteps(false);
                }
              }}
              autoFocus
              placeholder="Next steps..."
              style={{ width: "100%", fontSize: 12, color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 3, padding: "3px 6px", outline: "none" }}
            />
          </div>
        ) : item.nextSteps ? (
          <div
            style={{ fontSize: 12, color: "#6B7280", paddingLeft: 19, marginTop: 5, cursor: isConsultant ? "pointer" : "default", position: "relative" }}
            onClick={(e) => {
              if (isConsultant) {
                e.stopPropagation();
                setEditingNextSteps(true);
              }
            }}
            onMouseEnter={(e) => {
              if (isConsultant) {
                (e.currentTarget as HTMLElement).style.background = "#F9FAFB";
              }
            }}
            onMouseLeave={(e) => {
              if (isConsultant) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }
            }}
          >
            → {item.nextSteps}
            {isConsultant && (
              <span style={{ marginLeft: 4, fontSize: 10, color: "#9CA3AF", opacity: 0 }} className="edit-icon">✎</span>
            )}
          </div>
        ) : isConsultant ? (
          <div
            style={{ fontSize: 11, color: "#9CA3AF", paddingLeft: 19, marginTop: 5, cursor: "pointer", opacity: 0 }}
            className="add-next-steps"
            onClick={(e) => {
              e.stopPropagation();
              setEditingNextSteps(true);
            }}
          >
            + Next steps
          </div>
        ) : null)}

        {/* ROW 3: last comment preview (if exists) */}
        {!expanded && lastComment && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6, paddingLeft: 19 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "#6B7280", flexShrink: 0 }}>
              {lastComment.author.charAt(0)}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{lastComment.author}</span>
            <span style={{ fontSize: 11, color: "#9CA3AF", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {lastComment.text.substring(0, 80)}{lastComment.text.length > 80 ? "…" : ""}
            </span>
          </div>
        )}
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "12px 14px 16px 36px" }}>
          {item.blocker && (
            <div style={{ marginBottom: 12 }}>
              <BlockerBadge text={item.blocker} />
            </div>
          )}

          {item.children?.length > 0 && (
            <div style={{ margin: "10px 0 4px" }}>
              <Label>Sub-items</Label>
              {item.children.map((ch) => <NestedItem key={ch.id} item={ch} />)}
            </div>
          )}

          <Divider margin="12px 0" />

          <div style={{ display: "flex", marginBottom: 14 }}>
            {([["history", "Update History"], ["comments", `Comments${nComments ? ` (${nComments})` : ""}`]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ padding: "5px 13px", border: "1px solid", borderColor: tab === k ? "#18181B" : "#E5E7EB", background: tab === k ? "#18181B" : "transparent", color: tab === k ? "#FFF" : "#6B7280", fontSize: 12, fontWeight: 500, borderRadius: k === "history" ? "4px 0 0 4px" : "0 4px 4px 0", marginLeft: k === "comments" ? -1 : 0 }}>{l}</button>
            ))}
          </div>

          {tab === "history" && (
            <>
              {isConsultant && (
                <InlinePostUpdate
                  onPost={(text) => postUpdate(slug, wsId, item.id, text)}
                />
              )}
              <WeeklyHistoryPanel updates={item.updates} />
            </>
          )}
          {tab === "comments" && (
            <CommentThread
              comments={item.comments}
              onAdd={(text) => addComment(slug, item.id, text)}
              onReply={(cid, text) => addReply(slug, item.id, cid, text)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Simple Client View (flat sorted list) ───────────────────────────────────
function SimpleClientView({ client, slug }: { client: import("@/lib/types").Client; slug: string }) {
  const sendPing = useStore((s) => s.sendPing);

  // Flatten all items from all workstreams
  const allItems: Array<StatusItem & { wsId: string }> = [];
  for (const ws of client.workstreams) {
    for (const item of ws.items) {
      allItems.push({ ...item, wsId: ws.id });
    }
  }

  // Sort by state priority: blocked, at_risk, on_track, not_started, done
  const stateOrder: Record<string, number> = { blocked: 0, at_risk: 1, on_track: 2, not_started: 3, done: 4 };
  allItems.sort((a, b) => stateOrder[a.state] - stateOrder[b.state]);

  return (
    <>
      <NavBar consultantViewLink={`/client/${slug}?view=consultant`} />
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Header - minimal */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/" style={{ color: "#9CA3AF", fontSize: 12, textDecoration: "none", marginBottom: 12, display: "inline-block" }}>← All clients</Link>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", marginBottom: 3 }}>{client.name}</h1>
          <div style={{ fontSize: 13.5, color: "#6B7280" }}>{client.pageTitle}</div>
        </div>

        {/* Flat list of all items - 3-row cards */}
        {allItems.map((item) => (
          <ItemCard key={item.id} item={item} slug={slug} wsId={item.wsId} isConsultant={false} />
        ))}

        <Divider margin="16px 0 0" />
        <PingResponseThread pings={client.pings} />
        <PingComposer onSend={(text) => sendPing(slug, "Bjarni", text)} />
      </div>
    </>
  );
}

// ─── Consultant View (full features with inline editing) ─────────────────────
function ConsultantView({ client, slug }: { client: import("@/lib/types").Client; slug: string }) {
  const [showDigest, setShowDigest] = useState(false);
  const sendPing = useStore((s) => s.sendPing);
  const changeItem = useStore((s) => s.changeItemState);
  const unreadPings = client.pings.filter((p) => p.status === "unread").length;

  return (
    <>
      <NavBar />
      {showDigest && <WeeklyDigest client={client} onClose={() => setShowDigest(false)} />}

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Link href="/" style={{ color: "#9CA3AF", fontSize: 12, textDecoration: "none" }}>← All clients</Link>
            <span style={{ color: "#E0E0E0" }}>·</span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{client.sector}</span>
          </div>
          {client.purchaserMode === "subcontractor" && client.endClientName && (
            <div className="mono" style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10 }}>
              Delivered by Bjarni Sv. Guðmundsson · on behalf of {client.name} · for {client.endClientName}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", marginBottom: 3 }}>{client.name}</h1>
              <div style={{ fontSize: 13.5, color: "#6B7280" }}>{client.pageTitle}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => setShowDigest(true)}>📋 This Week</Btn>
              <Link
                href={`/client/${slug}/admin`}
                style={{ padding: "6px 13px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#FFF", color: "#374151", fontSize: 12, fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
              >
                ⚙ Admin
                {unreadPings > 0 && (
                  <span style={{ background: "#DC2626", color: "#FFF", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {unreadPings}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        <StatusSummaryBar slug={slug} />
        <NeedsAttentionPanel
          workstreams={client.workstreams}
          onChangeState={(itemId, state) => changeItem(slug, itemId, state)}
        />
        <Divider margin="0 0 22px" />

        {/* Workstreams with 3-row cards */}
        {client.workstreams.map((ws) => (
          <div key={ws.id} style={{ marginBottom: 24 }}>
            {/* Subtle workstream label */}
            <div style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {ws.title}
            </div>
            {ws.items.map((item) => (
              <ItemCard key={item.id} item={item} slug={slug} wsId={ws.id} isConsultant={true} />
            ))}
          </div>
        ))}

        <Divider margin="8px 0 0" />
        <PingResponseThread pings={client.pings} />
        <PingComposer onSend={(text) => sendPing(slug, "Bjarni", text)} />
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const isConsultant = searchParams.get("view") === "consultant";

  const client = useStore((s) => s.clients.find((c) => c.slug === slug));
  const loading = useStore((s) => s.loading);
  const loadClient = useStore((s) => s.loadClient);

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

  if (isConsultant) {
    return <ConsultantView client={client} slug={slug} />;
  }

  return <SimpleClientView client={client} slug={slug} />;
}

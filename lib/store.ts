import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Client, StatusState, Comment, Reply } from "./types";
import { INITIAL_CLIENTS } from "./data";

interface Store {
  clients: Client[];

  // Client mutations
  updateClient: (slug: string, fn: (c: Client) => Client) => void;

  // Item mutations
  changeItemState: (slug: string, itemId: string, state: StatusState) => void;
  updateItemTitle: (slug: string, itemId: string, title: string) => void;
  updateItemStatus: (slug: string, itemId: string, status: string) => void;
  updateItemBlocker: (slug: string, itemId: string, blocker: string | undefined) => void;
  addComment: (slug: string, itemId: string, text: string) => void;
  addReply: (slug: string, itemId: string, commentId: string, text: string) => void;
  postUpdate: (slug: string, wsId: string, itemId: string, text: string) => void;

  // Workstream mutations
  addWorkstream: (slug: string, title: string) => void;
  addItem: (slug: string, wsId: string, item: Omit<import("./types").StatusItem, "id" | "updates" | "comments" | "children">) => void;

  // Ping mutations
  sendPing: (slug: string, author: string, text: string) => void;
  acknowledgePing: (slug: string, pingId: string) => void;
  respondPing: (slug: string, pingId: string, response: string) => void;
}

function mapItem(
  clients: Client[],
  slug: string,
  itemId: string,
  fn: (item: import("./types").StatusItem) => import("./types").StatusItem
): Client[] {
  return clients.map(c =>
    c.slug !== slug ? c : {
      ...c,
      workstreams: c.workstreams.map(ws => ({
        ...ws,
        items: ws.items.map(it => it.id === itemId ? fn(it) : it),
      })),
    }
  );
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      clients: INITIAL_CLIENTS,

      updateClient: (slug, fn) =>
        set(s => ({ clients: s.clients.map(c => c.slug === slug ? fn(c) : c) })),

      changeItemState: (slug, itemId, state) =>
        set(s => ({ clients: mapItem(s.clients, slug, itemId, it => ({ ...it, state, updatedAt: new Date().toISOString() })) })),

      updateItemTitle: (slug, itemId, title) =>
        set(s => ({ clients: mapItem(s.clients, slug, itemId, it => ({ ...it, title, updatedAt: new Date().toISOString() })) })),

      updateItemStatus: (slug, itemId, status) =>
        set(s => {
          const now = new Date().toISOString();
          const weekLabel = "Week of " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
          return {
            clients: mapItem(s.clients, slug, itemId, it => ({
              ...it,
              latestStatus: status,
              updatedAt: now,
              updates: [{ id: `u-${Date.now()}`, text: status, weekLabel, timestamp: now }, ...it.updates],
            }))
          };
        }),

      updateItemBlocker: (slug, itemId, blocker) =>
        set(s => ({
          clients: mapItem(s.clients, slug, itemId, it => ({
            ...it,
            blocker,
            state: blocker ? "blocked" : it.state,
            updatedAt: new Date().toISOString()
          }))
        })),

      addComment: (slug, itemId, text) =>
        set(s => ({
          clients: mapItem(s.clients, slug, itemId, it => ({
            ...it,
            comments: [...it.comments, {
              id: `c-${Date.now()}`,
              author: "Bjarni G.", authorRole: "Consultant",
              text, timestamp: new Date().toISOString(), replies: [],
            }],
          })),
        })),

      addReply: (slug, itemId, commentId, text) =>
        set(s => ({
          clients: mapItem(s.clients, slug, itemId, it => ({
            ...it,
            comments: it.comments.map(c =>
              c.id !== commentId ? c : {
                ...c,
                replies: [...(c.replies || []), {
                  id: `r-${Date.now()}`,
                  author: "Bjarni G.", authorRole: "Consultant",
                  text, timestamp: new Date().toISOString(),
                }],
              }
            ),
          })),
        })),

      postUpdate: (slug, wsId, itemId, text) =>
        set(s => {
          const now = new Date().toISOString();
          const weekLabel = "Week of " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
          return {
            clients: s.clients.map(c =>
              c.slug !== slug ? c : {
                ...c,
                lastUpdated: now,
                workstreams: c.workstreams.map(ws =>
                  ws.id !== wsId ? ws : {
                    ...ws,
                    items: ws.items.map(it =>
                      it.id !== itemId ? it : {
                        ...it,
                        latestStatus: text,
                        updatedAt: now,
                        updates: [{ id: `u-${Date.now()}`, text, weekLabel, timestamp: now }, ...it.updates],
                      }
                    ),
                  }
                ),
              }
            ),
          };
        }),

      addWorkstream: (slug, title) =>
        set(s => ({
          clients: s.clients.map(c =>
            c.slug !== slug ? c : {
              ...c,
              workstreams: [...c.workstreams, { id: `ws-${Date.now()}`, title, state: "not_started", items: [] }],
            }
          ),
        })),

      addItem: (slug, wsId, item) =>
        set(s => ({
          clients: s.clients.map(c =>
            c.slug !== slug ? c : {
              ...c,
              workstreams: c.workstreams.map(ws =>
                ws.id !== wsId ? ws : {
                  ...ws,
                  items: [...ws.items, {
                    ...item,
                    id: `it-${Date.now()}`,
                    updates: [], comments: [], children: [],
                  }],
                }
              ),
            }
          ),
        })),

      sendPing: (slug, author, text) =>
        set(s => ({
          clients: s.clients.map(c =>
            c.slug !== slug ? c : {
              ...c,
              pings: [...c.pings, {
                id: `ping-${Date.now()}`,
                author, role: "Buyer",
                text, timestamp: new Date().toISOString(),
                status: "unread", response: null,
              }],
            }
          ),
        })),

      acknowledgePing: (slug, pingId) =>
        set(s => ({
          clients: s.clients.map(c =>
            c.slug !== slug ? c : {
              ...c,
              pings: c.pings.map(p => p.id !== pingId ? p : { ...p, status: "acknowledged" }),
            }
          ),
        })),

      respondPing: (slug, pingId, response) =>
        set(s => ({
          clients: s.clients.map(c =>
            c.slug !== slug ? c : {
              ...c,
              pings: c.pings.map(p => p.id !== pingId ? p : { ...p, status: "responded", response }),
            }
          ),
        })),
    }),
    {
      name: "workstream-status-store",
      // Only persist in production — during dev you may want fresh data each time
      // Remove the `skipHydration` line below if you want persistence in dev too
    }
  )
);

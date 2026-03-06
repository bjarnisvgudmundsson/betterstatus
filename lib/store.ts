import { create } from "zustand";
import type { Client, StatusState } from "./types";

interface Store {
  clients: Client[];
  loading: boolean;

  // Data loading
  loadClients: () => Promise<void>;
  loadClient: (slug: string) => Promise<void>;

  // Client mutations
  updateClient: (slug: string, fn: (c: Client) => Client) => void;

  // Item mutations
  changeItemState: (slug: string, itemId: string, state: StatusState) => void;
  updateItemTitle: (slug: string, itemId: string, title: string) => void;
  updateItemStatus: (slug: string, itemId: string, status: string) => void;
  updateItemBlocker: (slug: string, itemId: string, blocker: string | undefined) => void;
  updateItemNextSteps: (slug: string, itemId: string, nextSteps: string | undefined) => void;
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

export const useStore = create<Store>()((set, get) => ({
  clients: [],
  loading: false,

  loadClients: async () => {
    set({ loading: true });
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const clients = await response.json();
      set({ clients, loading: false });
    } catch (error) {
      console.error("Error loading clients:", error);
      set({ loading: false });
    }
  },

  loadClient: async (slug: string) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/clients/${slug}`);
      if (!response.ok) throw new Error("Failed to fetch client");
      const client = await response.json();

      // Replace or add client in array
      set(state => ({
        clients: state.clients.some(c => c.slug === slug)
          ? state.clients.map(c => c.slug === slug ? client : c)
          : [...state.clients, client],
        loading: false,
      }));
    } catch (error) {
      console.error("Error loading client:", error);
      set({ loading: false });
    }
  },

  updateClient: (slug, fn) =>
    set(s => ({ clients: s.clients.map(c => c.slug === slug ? fn(c) : c) })),

  changeItemState: (slug, itemId, state) => {
    // Optimistic update
    set(s => ({ clients: mapItem(s.clients, slug, itemId, it => ({ ...it, state, updatedAt: new Date().toISOString() })) }));

    // API call
    fetch(`/api/clients/${slug}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    }).catch(err => console.error("Error updating item state:", err));
  },

  updateItemTitle: (slug, itemId, title) => {
    // Optimistic update
    set(s => ({ clients: mapItem(s.clients, slug, itemId, it => ({ ...it, title, updatedAt: new Date().toISOString() })) }));

    // API call
    fetch(`/api/clients/${slug}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).catch(err => console.error("Error updating item title:", err));
  },

  updateItemStatus: (slug, itemId, status) => {
    const now = new Date().toISOString();
    const weekLabel = "Week of " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    // Optimistic update
    set(s => ({
      clients: mapItem(s.clients, slug, itemId, it => ({
        ...it,
        latestStatus: status,
        updatedAt: now,
        updates: [{ id: `u-${Date.now()}`, text: status, weekLabel, timestamp: now }, ...it.updates],
      }))
    }));

    // API call
    fetch(`/api/clients/${slug}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latestStatus: status }),
    }).catch(err => console.error("Error updating item status:", err));
  },

  updateItemBlocker: (slug, itemId, blocker) => {
    // Optimistic update
    set(s => ({
      clients: mapItem(s.clients, slug, itemId, it => ({
        ...it,
        blocker,
        state: blocker ? "blocked" : it.state,
        updatedAt: new Date().toISOString()
      }))
    }));

    // API call
    fetch(`/api/clients/${slug}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocker: blocker || null }),
    }).catch(err => console.error("Error updating item blocker:", err));
  },

  updateItemNextSteps: (slug, itemId, nextSteps) => {
    // Optimistic update
    set(s => ({
      clients: mapItem(s.clients, slug, itemId, it => ({
        ...it,
        nextSteps,
        updatedAt: new Date().toISOString()
      }))
    }));

    // API call
    fetch(`/api/clients/${slug}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextSteps: nextSteps || null }),
    }).catch(err => console.error("Error updating item next steps:", err));
  },

  addComment: (slug, itemId, text) => {
    // Optimistic update
    set(s => ({
      clients: mapItem(s.clients, slug, itemId, it => ({
        ...it,
        comments: [...it.comments, {
          id: `c-${Date.now()}`,
          author: "Bjarni G.", authorRole: "Consultant",
          text, timestamp: new Date().toISOString(), replies: [],
        }],
      })),
    }));

    // API call
    fetch(`/api/clients/${slug}/items/${itemId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: "Bjarni G.", authorRole: "Consultant", text }),
    }).catch(err => console.error("Error adding comment:", err));
  },

  addReply: (slug, itemId, commentId, text) => {
    // Optimistic update
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
    }));

    // API call
    fetch(`/api/clients/${slug}/items/${itemId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: "Bjarni G.",
        authorRole: "Consultant",
        text,
        parentId: commentId
      }),
    }).catch(err => console.error("Error adding reply:", err));
  },

  postUpdate: (slug, wsId, itemId, text) => {
    const now = new Date().toISOString();
    const weekLabel = "Week of " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    // Optimistic update
    set(s => ({
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
    }));

    // API call
    fetch(`/api/clients/${slug}/items/${itemId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch(err => console.error("Error posting update:", err));
  },

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

  sendPing: (slug, author, text) => {
    // Optimistic update
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
    }));

    // API call
    fetch(`/api/clients/${slug}/pings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, text }),
    }).catch(err => console.error("Error sending ping:", err));
  },

  acknowledgePing: (slug, pingId) => {
    // Optimistic update
    set(s => ({
      clients: s.clients.map(c =>
        c.slug !== slug ? c : {
          ...c,
          pings: c.pings.map(p => p.id !== pingId ? p : { ...p, status: "acknowledged" }),
        }
      ),
    }));

    // API call
    fetch(`/api/clients/${slug}/pings/${pingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "acknowledged" }),
    }).catch(err => console.error("Error acknowledging ping:", err));
  },

  respondPing: (slug, pingId, response) => {
    // Optimistic update
    set(s => ({
      clients: s.clients.map(c =>
        c.slug !== slug ? c : {
          ...c,
          pings: c.pings.map(p => p.id !== pingId ? p : { ...p, status: "responded", response }),
        }
      ),
    }));

    // API call
    fetch(`/api/clients/${slug}/pings/${pingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "responded", response }),
    }).catch(err => console.error("Error responding to ping:", err));
  },
}));

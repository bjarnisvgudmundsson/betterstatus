import { create } from "zustand";
import type { Client, Deliverable, Ping } from "./types";

interface Store {
  clients: Client[];
  deliverables: Deliverable[];
  loading: boolean;

  // Data loading
  loadAllDeliverables: () => Promise<void>;
  loadClient: (slug: string) => Promise<void>;

  // Client mutations
  createClient: (data: { slug: string; name: string; sector?: string; pageTitle?: string; purchaserMode?: string }) => Promise<void>;
  updateClient: (slug: string, fields: Partial<Client>) => void;
  deleteClient: (slug: string) => void;

  // Deliverable mutations
  createDeliverable: (data: { clientId: string; title: string; description: string; state: string; nextSteps?: string }) => Promise<void>;
  updateDeliverable: (id: string, fields: any) => void;
  deleteDeliverable: (id: string) => void;
  postUpdate: (id: string, text: string) => void;
  addComment: (id: string, author: string, authorRole: string, text: string) => void;
  addReply: (id: string, commentId: string, author: string, authorRole: string, text: string) => void;

  // Ping mutations
  sendPing: (slug: string, author: string, text: string) => void;
  acknowledgePing: (slug: string, pingId: string) => void;
  respondPing: (slug: string, pingId: string, response: string) => void;
}

export const useStore = create<Store>()((set, get) => ({
  clients: [],
  deliverables: [],
  loading: false,

  loadAllDeliverables: async () => {
    set({ loading: true });
    try {
      const response = await fetch("/api/deliverables");
      if (!response.ok) throw new Error("Failed to fetch deliverables");
      const deliverables = await response.json();
      set({ deliverables, loading: false });
    } catch (error) {
      console.error("Error loading deliverables:", error);
      set({ loading: false });
    }
  },

  loadClient: async (slug: string) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/clients/${slug}`);
      if (!response.ok) throw new Error("Failed to fetch client");
      const client = await response.json();

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

  createClient: async (data) => {
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        get().loadAllDeliverables();
      }
    } catch (error) {
      console.error("Error creating client:", error);
    }
  },

  updateClient: (slug, fields) => {
    set(s => ({
      clients: s.clients.map(c => c.slug === slug ? { ...c, ...fields } : c),
    }));

    fetch(`/api/clients/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    }).catch(err => console.error("Error updating client:", err));
  },

  deleteClient: (slug) => {
    set(s => ({
      deliverables: s.deliverables.filter(d => d.clientSlug !== slug),
    }));

    fetch(`/api/clients/${slug}`, {
      method: "DELETE",
    }).then(() => {
      get().loadAllDeliverables();
    }).catch(err => console.error("Error deleting client:", err));
  },

  createDeliverable: async (data) => {
    try {
      const response = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        get().loadAllDeliverables();
      }
    } catch (error) {
      console.error("Error creating deliverable:", error);
    }
  },

  updateDeliverable: (id, fields) => {
    set(s => ({
      deliverables: s.deliverables.map(d => d.id === id ? { ...d, ...fields, updatedAt: new Date().toISOString() } : d),
    }));

    fetch(`/api/deliverables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    }).catch(err => console.error("Error updating deliverable:", err));
  },

  deleteDeliverable: (id) => {
    set(s => ({
      deliverables: s.deliverables.filter(d => d.id !== id),
    }));

    fetch(`/api/deliverables/${id}`, {
      method: "DELETE",
    }).catch(err => console.error("Error deleting deliverable:", err));
  },

  postUpdate: (id, text) => {
    const now = new Date().toISOString();
    const weekLabel = "Week of " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    set(s => ({
      deliverables: s.deliverables.map(d =>
        d.id !== id ? d : {
          ...d,
          updatedAt: now,
          updates: [{ id: `u-${Date.now()}`, text, weekLabel, timestamp: now }, ...d.updates],
        }
      ),
    }));

    fetch(`/api/deliverables/${id}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch(err => console.error("Error posting update:", err));
  },

  addComment: (id, author, authorRole, text) => {
    const now = new Date().toISOString();

    set(s => ({
      deliverables: s.deliverables.map(d =>
        d.id !== id ? d : {
          ...d,
          comments: [...d.comments, {
            id: `c-${Date.now()}`,
            author,
            authorRole,
            text,
            timestamp: now,
            replies: [],
          }],
        }
      ),
    }));

    fetch(`/api/deliverables/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, authorRole, text }),
    }).catch(err => console.error("Error adding comment:", err));
  },

  addReply: (id, commentId, author, authorRole, text) => {
    const now = new Date().toISOString();

    set(s => ({
      deliverables: s.deliverables.map(d =>
        d.id !== id ? d : {
          ...d,
          comments: d.comments.map(c =>
            c.id !== commentId ? c : {
              ...c,
              replies: [...c.replies, {
                id: `r-${Date.now()}`,
                author,
                authorRole,
                text,
                timestamp: now,
              }],
            }
          ),
        }
      ),
    }));

    fetch(`/api/deliverables/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, authorRole, text, parentId: commentId }),
    }).catch(err => console.error("Error adding reply:", err));
  },

  sendPing: (slug, author, text) => {
    set(s => ({
      clients: s.clients.map(c =>
        c.slug !== slug ? c : {
          ...c,
          pings: [...c.pings, {
            id: `ping-${Date.now()}`,
            author,
            role: "Buyer",
            text,
            timestamp: new Date().toISOString(),
            status: "unread" as const,
            response: null,
          }],
        }
      ),
    }));

    fetch(`/api/clients/${slug}/pings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, text }),
    }).catch(err => console.error("Error sending ping:", err));
  },

  acknowledgePing: (slug, pingId) => {
    set(s => ({
      clients: s.clients.map(c =>
        c.slug !== slug ? c : {
          ...c,
          pings: c.pings.map(p => p.id !== pingId ? p : { ...p, status: "acknowledged" as const }),
        }
      ),
    }));

    fetch(`/api/clients/${slug}/pings/${pingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "acknowledged" }),
    }).catch(err => console.error("Error acknowledging ping:", err));
  },

  respondPing: (slug, pingId, response) => {
    set(s => ({
      clients: s.clients.map(c =>
        c.slug !== slug ? c : {
          ...c,
          pings: c.pings.map(p => p.id !== pingId ? p : { ...p, status: "responded" as const, response }),
        }
      ),
    }));

    fetch(`/api/clients/${slug}/pings/${pingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "responded", response }),
    }).catch(err => console.error("Error responding to ping:", err));
  },
}));

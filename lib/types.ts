export type StatusState = "on_track" | "at_risk" | "blocked" | "not_started" | "done";

export interface TogglLink {
  projectId: string;
  taskId: string | null;
  hours7d: number;
}

export interface Comment {
  id: string;
  author: string;
  authorRole: string;
  text: string;
  timestamp: string;
  replies: Reply[];
}

export interface Reply {
  id: string;
  author: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

export interface Update {
  id: string;
  text: string;
  weekLabel: string;
  timestamp: string;
}

export interface Deliverable {
  id: string;
  clientId: string;
  clientSlug?: string;
  clientName?: string;
  title: string;
  description: string;
  state: StatusState;
  blocker?: string;
  nextSteps?: string;
  updatedAt: string;
  togglProjectId?: string;
  togglHours7d: number;
  updates: Update[];
  comments: Comment[];
}

export interface Ping {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
  status: "unread" | "acknowledged" | "responded";
  response: string | null;
}

export interface Client {
  id: string;
  slug: string;
  name: string;
  sector: string;
  pageTitle: string;
  purchaserMode: "direct" | "subcontractor";
  endClientName?: string;
  pings: Ping[];
  deliverables: Deliverable[];
  unreadPings?: number;
}

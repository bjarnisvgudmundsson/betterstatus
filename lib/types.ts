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

export interface StatusItem {
  id: string;
  title: string;
  latestStatus: string;
  state: StatusState;
  blocker?: string;
  updatedAt: string;
  seenAt?: string;
  toggl?: TogglLink | null;
  updates: Update[];
  comments: Comment[];
  children: StatusItem[];
}

export interface Workstream {
  id: string;
  title: string;
  state: StatusState;
  items: StatusItem[];
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
  overallState: StatusState;
  lastUpdated: string;
  summary: string;
  pings: Ping[];
  workstreams: Workstream[];
}

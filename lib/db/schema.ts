import { pgTable, serial, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  pageTitle: text("page_title").notNull(),
  overallState: text("overall_state").notNull(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull(),
  summary: text("summary").notNull(),
  purchaserMode: text("purchaser_mode").notNull(),
  endClientName: text("end_client_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workstreams = pgTable("workstreams", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  state: text("state").notNull(),
  position: integer("position").default(0).notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  workstreamId: integer("workstream_id").notNull().references(() => workstreams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  latestStatus: text("latest_status").notNull(),
  state: text("state").notNull(),
  blocker: text("blocker"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  seenAt: timestamp("seen_at", { withTimezone: true }),
  nextSteps: text("next_steps"),
  togglProjectId: text("toggl_project_id"),
  togglHours7d: numeric("toggl_hours_7d", { precision: 10, scale: 2 }).default("0").notNull(),
  position: integer("position").default(0).notNull(),
});

export const subItems = pgTable("sub_items", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  latestStatus: text("latest_status").notNull(),
  state: text("state").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  position: integer("position").default(0).notNull(),
});

export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  weekLabel: text("week_label").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  parentId: integer("parent_id").references((): any => comments.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  authorRole: text("author_role").notNull(),
  text: text("text").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
});

export const pings = pgTable("pings", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  role: text("role").notNull(),
  text: text("text").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  status: text("status").default("unread").notNull(),
  response: text("response"),
});

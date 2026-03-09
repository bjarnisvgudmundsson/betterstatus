import { pgTable, serial, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  pageTitle: text("page_title").notNull(),
  purchaserMode: text("purchaser_mode").notNull(),
  endClientName: text("end_client_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deliverables = pgTable("deliverables", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  state: text("state").notNull(),
  blocker: text("blocker"),
  nextSteps: text("next_steps"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  togglProjectId: text("toggl_project_id"),
  togglHours7d: numeric("toggl_hours_7d", { precision: 10, scale: 2 }).default("0").notNull(),
  position: integer("position").default(0).notNull(),
});

export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  deliverableId: integer("deliverable_id").notNull().references(() => deliverables.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  weekLabel: text("week_label").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  deliverableId: integer("deliverable_id").notNull().references(() => deliverables.id, { onDelete: "cascade" }),
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

import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("journal_entries", {
  id: text("id").primaryKey(),
  revision: integer("revision").notNull(),
  draft: text("draft").notNull(),
  live: text("live"),
});
export const assets = sqliteTable("journal_media", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  mime: text("mime").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  bytes: integer("bytes").notNull(),
  created: integer("created").notNull(),
});
export const letters = sqliteTable("journal_letters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sender: text("sender").notNull(),
  email: text("email").notNull(),
  body: text("body").notNull(),
  received: integer("received").notNull(),
  ticket: text("ticket").notNull().unique(),
});
export const contactRates = sqliteTable("journal_contact_rates", {
  key: text("key").primaryKey(),
  window: integer("window").notNull(),
  count: integer("count").notNull(),
});
export const preferences = sqliteTable("journal_settings", {
  name: text("name").primaryKey(),
  value: text("value").notNull(),
});

export const visitVisitors = sqliteTable("journal_visit_visitors", {
  id: text("id").primaryKey(),
  consented: integer("consented").notNull(),
  policy: text("policy").notNull(),
  lastSeen: integer("last_seen").notNull(),
}, t => [index("visit_visitors_seen").on(t.lastSeen)]);
export const visitSessions = sqliteTable("journal_visit_sessions", {
  id: text("id").primaryKey(),
  visitor: text("visitor").notNull(),
  started: integer("started").notNull(),
  lastSeen: integer("last_seen").notNull(),
  source: text("source").notNull(),
  referrer: text("referrer").notNull(),
  campaign: text("campaign").notNull(),
}, t => [index("visit_sessions_seen").on(t.lastSeen)]);
export const visitEvents = sqliteTable("journal_visit_events", {
  id: integer("id").primaryKey({autoIncrement:true}),
  eventKey: text("event_key").notNull().unique(),
  visitor: text("visitor").notNull(),
  session: text("session").notNull(),
  created: integer("created").notNull(),
  path: text("path").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull(),
  ip: text("ip").notNull(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  city: text("city").notNull(),
  device: text("device").notNull(),
  browser: text("browser").notNull(),
  os: text("os").notNull(),
}, t => [index("visit_events_created").on(t.created),index("visit_events_session").on(t.session,t.created),index("visit_events_visitor").on(t.visitor,t.created),index("visit_events_path").on(t.path,t.created)]);
export const visitRates = sqliteTable("journal_visit_rates", {
  key: text("key").primaryKey(),
  window: integer("window").notNull(),
  count: integer("count").notNull(),
});

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

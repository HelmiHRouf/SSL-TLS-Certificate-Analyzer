import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  shareId: text("share_id").unique().notNull(),
  domain: text("domain").notNull(),
  grade: text("grade").notNull(),
  result: jsonb("result").notNull(),
  scannedAt: timestamp("scanned_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

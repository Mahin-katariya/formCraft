import { pgTable, uuid, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { formsTable } from './forms';

export const formEventsTable = pgTable('form_events', {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid('form_id').notNull().references(() => formsTable.id),
    sessionId: varchar("session_id", { length: 50 }).notNull(),
    eventType: varchar("event_type", { length: 20 }).notNull(),
    timestamp: timestamp("timestamp").defaultNow(),
    duration: integer("duration")
});

export type SelectFormEvent = typeof formEventsTable.$inferSelect;
export type InsertFormEvent = typeof formEventsTable.$inferInsert;

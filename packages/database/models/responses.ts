import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { formsTable } from './forms.js';

export const responsesTable = pgTable('responses', {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid('form_id').notNull().references(() => formsTable.id),
    data: jsonb("data").notNull(),
    sessionId: varchar("session_id", { length: 50 }),
    submittedAt: timestamp("submitted_at").defaultNow()
});

export type SelectResponse = typeof responsesTable.$inferSelect;
export type InsertResponse = typeof responsesTable.$inferInsert;

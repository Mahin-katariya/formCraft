import {pgTable, uuid, varchar, timestamp, unique} from 'drizzle-orm/pg-core';
import { userTable } from './users.js';
export const authProviderTable = pgTable('auth_providers', {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id').notNull().references(() => userTable.id),
    provider: varchar("provider", {length: 50}).notNull(),
    providerUserId: varchar("provider_user_id", {length: 255}).notNull(),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => {
    return {
        uniqueProvderUserID: unique().on(table.provider, table.providerUserId)
    }
});

export type SelectAuthProvider = typeof authProviderTable.$inferSelect;
export type InsertAuthProvider = typeof authProviderTable.$inferInsert;
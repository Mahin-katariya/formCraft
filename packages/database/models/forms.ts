import {pgTable , uuid, varchar, text, boolean, timestamp, integer} from 'drizzle-orm/pg-core';
import { userTable } from './users';
import { nanoid } from 'nanoid';

export const formsTable = pgTable('forms',{
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => userTable.id),
    title: varchar("title", {length: 255}).notNull(),
    description: text("description"),
    slug: varchar("slug", {length: 100}).notNull().unique().$default(() => nanoid(8)),
    status: varchar("status", {length: 20}).notNull().default('draft'),
    responseLimit: integer("response_limit"),
    expiresAt: timestamp("expires_at"),
    digestEnabled: boolean("digest_enabled").default(true),
    digestInterval: integer("digest_interval").default(60),
    lastDigestAt: timestamp("last_digest_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
});

export type SelectForms = typeof formsTable.$inferSelect;
export type InsertForms = typeof formsTable.$inferInsert;
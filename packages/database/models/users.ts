import {pgTable , uuid, varchar, text, boolean, timestamp} from 'drizzle-orm/pg-core';

export const userTable = pgTable('users',{
    id: uuid("id").primaryKey().defaultRandom(),
    displayName: varchar("display_name", {length: 100}),
    email: varchar("email", {length: 255}).notNull().unique(),
    passwordHash: text("password_hash"),
    refreshToken: text("refresh_token"),
    avatarUrl: text("avatar_url"),
    emailVerified: boolean("email_verified").default(false),
    verificationToken: text("verification_token"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
});

export type SelectUser = typeof userTable.$inferSelect;
export type InsertUser = typeof userTable.$inferInsert;
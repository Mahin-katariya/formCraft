import {pgTable , uuid, varchar, text, boolean, timestamp, integer, jsonb, PgUUID} from 'drizzle-orm/pg-core';
import { formsTable } from './forms.js';
import { foreignKey } from 'drizzle-orm/cockroach-core';

export const fieldsTable = pgTable('fields',{
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid('form_id').notNull().references(() => formsTable.id),
    label: varchar("label", {length: 255}).notNull(),
    type: varchar("type", {length: 50}).notNull(),
    required: boolean("required").default(false),
    position: text("position").notNull(),
    placeholder: varchar("placeholder", {length: 255}),
    options: jsonb("options"),
    conditionFieldId: uuid("condition_field_id"),
    conditionOperator: varchar("condition_operator", {length: 20}),
    conditionValue: text("condition_value"),    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
}, (table) => ({
    conditionFieldFK: foreignKey({
        columns: [table.conditionFieldId],
        foreignColumns: [table.id]
    })
}));

export type SelectFields = typeof fieldsTable.$inferSelect;
export type InsertFields = typeof fieldsTable.$inferInsert;
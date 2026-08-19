import { defineRelations } from "drizzle-orm";
import * as schema from '../schema.js'

// export const userRelations = relations(userTable, ({many}) => ({
//     forms: many(formsTable),
// }));

// export const formsRelation = relations(formsTable, ({one, many}) => ({
//     user: one(userTable,
//     {
//         fields: [formsTable.userId],
//         references: [userTable.id],
//     }),
//     fields: many(fieldsTable),
//     responses: many(responsesTable),
//     formEvents: many(formEventsTable)
// }));

export const relations = defineRelations(schema, (r) => ({
    
    userTable: {
        forms: r.many.formsTable({
            from: r.userTable.id,
            to: r.formsTable.userId
        }),

        authProviders: r.many.authProviderTable({
            from: r.userTable.id,
            to: r.authProviderTable.userId
        })
    },
    authProviderTable: {
        user: r.one.userTable({
            from: r.authProviderTable.userId,
            to: r.userTable.id
        })
    },
    formsTable: {
        user: r.one.userTable({
            from: r.formsTable.userId,
            to: r.userTable.id,
        }),
        fields: r.many.fieldsTable({
            from: r.formsTable.id,
            to: r.fieldsTable.formId
        }),
        responses: r.many.responsesTable({
            from: r.formsTable.id,
            to: r.responsesTable.formId
        }),
        formEvents: r.many.formEventsTable({
            from: r.formsTable.id,
            to: r.formEventsTable.formId
        })
    },
    fieldsTable: {
        form: r.one.formsTable({
            from: r.fieldsTable.formId,
            to: r.formsTable.id
        }),
        conditionField: r.one.fieldsTable({
            from: r.fieldsTable.conditionFieldId,
            to: r.fieldsTable.id
        })
    },
    responsesTable: {
        form: r.one.formsTable({
            from: r.responsesTable.formId,
            to: r.formsTable.id
        })
    },
    formEventsTable: {
        form: r.one.formsTable({
            from: r.formEventsTable.formId,
            to: r.formsTable.id
        })
    }
}));
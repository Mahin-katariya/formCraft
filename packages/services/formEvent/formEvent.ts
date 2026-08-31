import db, { eq, InsertFormEvent, formEventsTable } from '@repo/database'

class FormEventService {
    private static instance: FormEventService;

    private constructor(){}

    static getInstance(): FormEventService {
        if(!FormEventService.instance){
            FormEventService.instance = new FormEventService();
        }
        return FormEventService.instance;
    }

    async trackEvent(data: InsertFormEvent){
        const [result] = await db.insert(formEventsTable).values(data).returning();
        if(!result) return {success: false, data: null};
        return {success: true, data: {...result}};
    }

    async listByFormId(formId: string){
        const rows = await db.select().from(formEventsTable).where(eq(formEventsTable.formId, formId));
        return {success: true, data: rows};
    }
}

export const formEventService = FormEventService.getInstance();

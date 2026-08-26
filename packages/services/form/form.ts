import db, { and, desc, eq, formsTable, isNull } from '@repo/database'

class FormService {
    private static instance: FormService;

    private constructor(){}

    static getInstance(): FormService{
        if(!FormService.instance){
            FormService.instance = new FormService();
        }
        return FormService.instance;
    }

    async createForm(data: {userId: string, title: string, description: string | undefined}){
        const {userId, title, description} = data;
        const [result] = await db.insert(formsTable).values({userId, title, description}).returning(); //drizzle automatically generates slug, as we have written in the model schema


        if(!result) return {success: false, data: null}; 

        return {success: true, data: {...result}};
    }

    async listFormsByUser(userId: string){
        const forms = await db
        .select()
        .from(formsTable)
        .where(
            and (
                eq(formsTable.userId, userId),
                isNull(formsTable.deletedAt)
            )
        ).orderBy(desc(formsTable.createdAt));

        if(!forms) return {success: false, data: []};
        return {success: true, data: forms}
    }

    async getFormById(id: string){
        const [form] = await db.select().from(formsTable).where(eq(formsTable.id,id));

        if(!form) return {success: false, data: null};
        return {success: true, data: {...form}}
    }

    async updateFormById(id: string, data: {title: string | undefined, description: string|undefined, slug: string|undefined, responseLimit: number|undefined|null, expiresAt: string|undefined|null}){
        
        const {title, description, slug, responseLimit, expiresAt} = data;
        const updateData: Record<string, unknown> = {};
        if(title !== undefined) updateData.title = title;
        if(description !== undefined) updateData.description = description;
        if(slug !== undefined) updateData.slug = slug;
        if(responseLimit !== undefined) updateData.responseLimit = responseLimit;
        if(expiresAt !== undefined) updateData.expiresAt = expiresAt;

        const [result] = await db.update(formsTable).set(updateData).where(eq(formsTable.id,id)).returning();

        if(!result) return {success: false, data: null};
        return {success: true, data: {...result}};
    }

    async softDeleteForm(id: string){
        const [result] = await db.update(formsTable).set({deletedAt: new Date()}).where(eq(formsTable.id,id)).returning();

        if(!result) return {success: false, data: null};
        return {success: true, data: null};
    }

    async findFormBySlug(slug: string){
        const [result] = await db
        .select()
        .from(formsTable)
        .where(
            and(
                eq(formsTable.slug, slug),
                isNull(formsTable.deletedAt)
            )
        );

        if(!result) return {success: false, data: null};
        return {success: true, data: {...result}};
    }
}

export const formService = FormService.getInstance();
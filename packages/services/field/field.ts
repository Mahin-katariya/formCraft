import db, { and, asc, desc, eq, fieldsTable, formsTable, isNull } from '@repo/database'
import {InsertFields} from '@repo/database'

class FieldService{
    private static instance: FieldService;

    private constructor(){};

    static getInstance(): FieldService {
        if(!FieldService.instance){
            FieldService.instance = new FieldService();
        }
        return FieldService.instance;
    }

    async createField(data: InsertFields){
        const [result] = await db
        .insert(fieldsTable)
        .values({formId:data.formId, label: data.label, type: data.type, required: data.required,placeholder: data.placeholder,options: data.options, position: data.position})
        .returning();

        if(!result) return {success: false, data: null};
        return {success: true, data: {...result}};
    }

    async listFieldsByFormId(formID: string){
        const result = await db
        .select()
        .from(fieldsTable)
        .where(eq(fieldsTable.formId, formID));

        result.sort((a, b) => a.position < b.position ? -1 : a.position > b.position ? 1 : 0);

        return {success: true, data: result};
    };

    async getFieldById(id: string){
        const [result] = await db.select().from(fieldsTable).where(eq(fieldsTable.id,id));

        if(!result) return {success: false, data: null};
        return {success: true, data: {...result}};
    };

    async updateField(id: string, data: Partial<InsertFields>){
        const [result] = await db.update(fieldsTable).set(data).where(eq(fieldsTable.id,id)).returning();

        if(!result) return {success: false, data: null};
        return {success: true, data: {...result}};
    };

    async deleteField(id: string){
        const [result] = await db.delete(fieldsTable).where(eq(fieldsTable.id,id)).returning();

        if(!result) return {success: false, data: null};
        return {success: true, data: null};
    }

    async updateFieldPosition(id: string, position: string){
        const [result] = await db.update(fieldsTable).set({position}).where(eq(fieldsTable.id, id)).returning();

        if(!result) return {success: false, data: null};
        return {success: true, data: {...result}};
    }

    async clearConditionsBySourceId(fieldId: string){
        await db
        .update(fieldsTable)
        .set({conditionFieldId: null, conditionOperator: null, conditionValue:null})
        .where(eq(fieldsTable.conditionFieldId, fieldId));

        return {success: true, data: null};
    }
}

export const fieldService = FieldService.getInstance();
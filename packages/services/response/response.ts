import db, { count, eq, desc, inArray, InsertResponse, responsesTable } from '@repo/database'
class ResponseService {
    private static instance: ResponseService;

    private constructor(){}

    static getInstance(): ResponseService{
        if(!ResponseService.instance){
            ResponseService.instance = new ResponseService();
        }
        return ResponseService.instance;
    }

    async createResponse(data: InsertResponse){
        const [result] = await db.insert(responsesTable).values(data).returning();
        if(!result) return {success: false, data: null};
        return {success: true, data: {...result}};
    }

    async countResponseByFormId(formId: string){
        const [result] = await db.select({count: count()}).from(responsesTable).where(eq(responsesTable.formId, formId));
        if(!result) return {success: false, count: null};
        return {success: true, count: result.count};
    }

    async listByFormId(formId: string, page = 1, pageSize = 20){
        const offset = (page - 1) * pageSize;

        const [countResult] = await db.select({count: count()}).from(responsesTable).where(eq(responsesTable.formId, formId));
        const total = countResult?.count ?? 0;

        const rows = await db.select().from(responsesTable)
            .where(eq(responsesTable.formId, formId))
            .orderBy(desc(responsesTable.submittedAt))
            .limit(pageSize)
            .offset(offset);

        return {success: true, data: rows, total};
    }

    async listByFormIds(formIds: string[], page = 1, pageSize = 20){
        if(formIds.length === 0) return {success: true, data: [], total: 0};

        const offset = (page - 1) * pageSize;

        const [countResult] = await db.select({count: count()}).from(responsesTable).where(inArray(responsesTable.formId, formIds));
        const total = countResult?.count ?? 0;

        const rows = await db.select().from(responsesTable)
            .where(inArray(responsesTable.formId, formIds))
            .orderBy(desc(responsesTable.submittedAt))
            .limit(pageSize)
            .offset(offset);

        return {success: true, data: rows, total};
    }

    async getById(id: string){
        const [result] = await db.select().from(responsesTable).where(eq(responsesTable.id, id));
        if(!result) return {success: false, data: null};
        return {success: true, data: {...result}};
    }
}

export const responseService = ResponseService.getInstance();
import db, { count, eq, InsertResponse, responsesTable } from '@repo/database'
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
}

export const responseService = ResponseService.getInstance();
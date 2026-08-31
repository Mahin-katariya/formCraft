import {z} from 'zod'

export const listByFormInput = z.object({
    formId: z.string().describe("UUID of the form"),
    page: z.number().positive().default(1).describe("page number"),
    pageSize: z.number().positive().max(100).default(20).describe("items per page"),
});

export const listAllInput = z.object({
    page: z.number().positive().default(1).describe("page number"),
    pageSize: z.number().positive().max(100).default(20).describe("items per page"),
});

export const getResponseByIdInput = z.object({
    id: z.string().describe("UUID of the response"),
});

export const responseItem = z.object({
    id: z.string().describe("response UUID"),
    formId: z.string().describe("parent form UUID"),
    data: z.record(z.string(), z.any()).describe("response data keyed by field ID"),
    sessionId: z.string().nullable().describe("submitter session ID"),
    submittedAt: z.date().nullable().describe("submission timestamp"),
});

export const paginatedResponseOutput = z.object({
    responses: z.array(responseItem),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
});

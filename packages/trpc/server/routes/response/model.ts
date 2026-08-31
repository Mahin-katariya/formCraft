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

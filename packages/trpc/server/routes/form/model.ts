import {z} from 'zod'

export const createFormInput = z.object({
    title: z.string().max(255).describe("title of the form"),
    description: z.string().optional().describe("description of the form"),
});

export const updateFormInput = z.object({
    id: z.string().describe("UUID of the form"),
    title: z.string().optional().describe("updated title of the form"),
    description: z.string().optional().describe("updated description of the form"),
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/).optional().describe("updated slug of the form"),
    responseLimit: z.number().positive().nullable().optional().describe("response limit of the form "),
    expiresAt: z.string().nullable().optional().describe("updated expiry time for the published form")
});

export const getFormByIdInput = z.object({
    id: z.string().describe("id of the form")
});

export const deleteFormByIdInput = z.object({
    id: z.string().describe("id of the the form that is to be deleted")
})

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
});

export const formOutput = z.object({
    id: z.string().describe("form UUID"),
    userId: z.string().describe("owner user UUID"),
    title: z.string().describe("form title"),
    description: z.string().nullable().describe("form description"),
    slug: z.string().describe("unique slug"),
    status: z.string().describe("draft | published | closed"),
    responseLimit: z.number().nullable().describe("max responses"),
    expiresAt: z.date().nullable().describe("expiry timestamp"),
    digestEnabled: z.boolean().nullable().describe("digest enabled"),
    digestInterval: z.number().nullable().describe("digest interval minutes"),
    lastDigestAt: z.date().nullable().describe("last digest timestamp"),
    deletedAt: z.date().nullable().describe("soft delete timestamp"),
    createdAt: z.date().nullable().describe("creation timestamp"),
    updatedAt: z.date().nullable().describe("last update timestamp"),
});

export const formListOutput = z.object({
    success: z.boolean(),
    data: z.array(formOutput).nullable()
});

export const formUpdateOutput = z.object({
    updatedFormResult: z.object({
        success: z.boolean(),
        data: formOutput.nullable()
    })
});

export const deleteFormOutput = z.object({
    success: z.boolean()
});


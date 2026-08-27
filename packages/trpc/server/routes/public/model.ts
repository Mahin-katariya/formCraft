import {z} from 'zod';

export const getFormBySlugInput = z.object({
    slug: z.string().describe("slug for the form")
});

export const submitResponseInput = z.object({
    slug: z.string().describe("slug for the form"),
    data: z.record(z.string(), z.any()).describe("input data of the form submitted by the user (response data)"),
    sessionId: z.string().describe("responses current session id")
})

export type GetFormBySlugInput = z.infer<typeof getFormBySlugInput>;
export type SubmitResponseInput = z.infer<typeof submitResponseInput>;
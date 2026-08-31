import {z} from 'zod';

export const getFormBySlugInput = z.object({
    slug: z.string().describe("slug for the form")
});

export const submitResponseInput = z.object({
    slug: z.string().describe("slug for the form"),
    data: z.record(z.string(), z.any()).describe("input data of the form submitted by the user (response data)"),
    sessionId: z.string().describe("responses current session id")
})

export const trackEventInput = z.object({
    formId: z.string().describe("UUID of the form"),
    sessionId: z.string().describe("session id linking events"),
    eventType: z.enum(['view', 'start', 'complete']).describe("type of event"),
    duration: z.number().optional().describe("milliseconds since page load")
});

export type GetFormBySlugInput = z.infer<typeof getFormBySlugInput>;
export type SubmitResponseInput = z.infer<typeof submitResponseInput>;
export type TrackEventInput = z.infer<typeof trackEventInput>;
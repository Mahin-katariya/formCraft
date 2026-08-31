import {z} from 'zod'

export const getAnalyticsInput = z.object({
    formId: z.string().describe("UUID of the form"),
});

export const analyticsOutput = z.object({
    answers: z.object({
        visits: z.number(),
        submissions: z.number(),
        uniqueRespondents: z.number(),
        avgVisitDuration: z.number(),
    }),
    dropoffs: z.object({
        started: z.number(),
        completions: z.number(),
        completionRate: z.number(),
        avgCompletionDuration: z.number(),
    }),
    distributions: z.array(z.object({
        fieldId: z.string(),
        fieldLabel: z.string(),
        fieldType: z.string(),
        distribution: z.array(z.object({
            value: z.string(),
            count: z.number(),
        })),
    })),
    responsesOverTime: z.array(z.object({
        date: z.string(),
        count: z.number(),
    })),
});

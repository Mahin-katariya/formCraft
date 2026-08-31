import {z} from 'zod'

export const getAnalyticsInput = z.object({
    formId: z.string().describe("UUID of the form"),
});

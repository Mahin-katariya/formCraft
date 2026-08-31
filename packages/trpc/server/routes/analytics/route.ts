import { getAnalyticsInput, analyticsOutput } from './model.js'
import { protectedProcedure, router } from '../../trpc.js'
import { generatePath } from '../../utils/path-generator.js'
import { TRPCError } from '@trpc/server'
import { formService, fieldService, responseService, formEventService } from '@repo/services'

const getPath = generatePath('/analytics');
const TAG = 'Analytics';

export const analyticsRouter = router({
    getByForm: protectedProcedure.meta({
        openapi: {
            method: 'GET',
            path: getPath('/{formId}'),
            tags: [TAG]
        }
    })
    .input(getAnalyticsInput)
    .output(analyticsOutput)
    .query(async ({input, ctx}) => {
        const form = await formService.getFormById(input.formId);
        if(!form.success || !form.data || form.data.deletedAt)
            throw new TRPCError({code: 'NOT_FOUND', message: 'form not found'});
        if(form.data.userId !== ctx.userId)
            throw new TRPCError({code: 'FORBIDDEN', message: 'not your form'});

        const [eventsResult, responsesResult, fieldsResult] = await Promise.all([
            formEventService.listByFormId(input.formId),
            responseService.listByFormId(input.formId, 1, 10000),
            fieldService.listFieldsByFormId(input.formId)
        ]);

        const events = eventsResult.data;
        const responses = responsesResult.data;
        const fields = fieldsResult.success ? fieldsResult.data ?? [] : [];

        const sessionEvents = new Map<string, typeof events>();
        for(const e of events) {
            const list = sessionEvents.get(e.sessionId) ?? [];
            list.push(e);
            sessionEvents.set(e.sessionId, list);
        }

        const visits = events.filter(e => e.eventType === 'view').length;
        const submissions = responses.length;
        const uniqueRespondents = new Set(events.filter(e => e.eventType === 'view').map(e => e.sessionId)).size;

        let totalVisitDuration = 0;
        let visitDurationCount = 0;
        for(const [, sessEvents] of sessionEvents) {
            const timestamps = sessEvents.map(e => new Date(e.timestamp!).getTime()).filter(t => !isNaN(t));
            if(timestamps.length >= 2) {
                totalVisitDuration += (Math.max(...timestamps) - Math.min(...timestamps)) / 1000;
                visitDurationCount++;
            }
        }
        const avgVisitDuration = visitDurationCount > 0 ? Math.round(totalVisitDuration / visitDurationCount) : 0;

        const started = new Set(events.filter(e => e.eventType === 'start').map(e => e.sessionId)).size;
        const completions = events.filter(e => e.eventType === 'complete').length;
        const completionRate = started > 0 ? Math.round((completions / started) * 100) / 100 : 0;

        let totalCompletionDuration = 0;
        let completionDurationCount = 0;
        for(const [, sessEvents] of sessionEvents) {
            const startEvent = sessEvents.find(e => e.eventType === 'start');
            const completeEvent = sessEvents.find(e => e.eventType === 'complete');
            if(startEvent?.timestamp && completeEvent?.timestamp) {
                const diff = (new Date(completeEvent.timestamp).getTime() - new Date(startEvent.timestamp).getTime()) / 1000;
                if(diff >= 0) {
                    totalCompletionDuration += diff;
                    completionDurationCount++;
                }
            }
        }
        const avgCompletionDuration = completionDurationCount > 0 ? Math.round(totalCompletionDuration / completionDurationCount) : 0;

        const distributions: {fieldId: string; fieldLabel: string; fieldType: string; distribution: {value: string; count: number}[]}[] = [];
        const selectAndRatingFields = fields.filter(f => ['single_select', 'multi_select', 'rating'].includes(f.type));

        for(const field of selectAndRatingFields) {
            const valueCounts = new Map<string, number>();
            for(const resp of responses) {
                const data = resp.data as Record<string, unknown>;
                const val = data[field.id];
                if(val === undefined || val === null) continue;
                if(Array.isArray(val)) {
                    for(const v of val) {
                        valueCounts.set(String(v), (valueCounts.get(String(v)) ?? 0) + 1);
                    }
                } else {
                    valueCounts.set(String(val), (valueCounts.get(String(val)) ?? 0) + 1);
                }
            }
            distributions.push({
                fieldId: field.id,
                fieldLabel: field.label,
                fieldType: field.type,
                distribution: Array.from(valueCounts.entries()).map(([value, count]) => ({value, count}))
            });
        }

        const responsesOverTime: {date: string; count: number}[] = [];
        const dateCounts = new Map<string, number>();
        for(const resp of responses) {
            if(!resp.submittedAt) continue;
            const date = new Date(resp.submittedAt).toISOString().split('T')[0]!;
            dateCounts.set(date, (dateCounts.get(date) ?? 0) + 1);
        }
        for(const [date, count] of Array.from(dateCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
            responsesOverTime.push({date, count});
        }

        return {
            answers: {visits, submissions, uniqueRespondents, avgVisitDuration},
            dropoffs: {started, completions, completionRate, avgCompletionDuration},
            distributions,
            responsesOverTime
        };
    })
})

import { TRPCError } from '@trpc/server'
import { fieldService, formService, responseService, formEventService } from '@repo/services';

import { publicProcedure, router } from '../../trpc.js'
import { generatePath } from '../../utils/path-generator.js'
import { getFormBySlugInput, submitResponseInput, trackEventInput, publicFormOutput, successOutput } from './model.js';
import { buildResponseSchema } from './schema-builder.js';

const getPath = generatePath('/public/forms');

const tag = ['Public'];

export const publicFormRouter = router({
    getFormBySlug: publicProcedure
    .meta({
    openapi: {
        method: 'GET',
        path: getPath('/{slug}'),
        tags: tag
    }
    })
    .input(getFormBySlugInput)
    .output(publicFormOutput)
    .query(async ({input}) => {
        
        const form = await formService.findFormBySlug(input.slug);
        if(!form.success || !form.data) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'form is not available'
        });

        if(form.data.deletedAt) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'form is not available'
        });

        if(form.data.status !== 'published') throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'form is not available'
        });

        if(form.data.expiresAt && form.data.expiresAt < new Date()) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'form is not available'
        });

        if(form.data.responseLimit) {
            const responseCount = await responseService.countResponseByFormId(form.data.id);
            if(responseCount.success && responseCount.count !== null && responseCount.count >= form.data.responseLimit) throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'form is not available'
            });
        }

        const fields = await fieldService.listFieldsByFormId(form.data.id);

        if(!fields.success || !fields.data) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'failed to fetch fields'
        });

        return {
            id: form.data.id,
            title: form.data.title,
            description: form.data.description,
            slug: form.data.slug,
            fields: fields.data.map(f => ({
                id: f.id,
                label: f.label,
                type: f.type,
                required: f.required,
                placeholder: f.placeholder,
                options: f.options,
                conditionFieldId: f.conditionFieldId,
                conditionOperator: f.conditionOperator,
                conditionValue: f.conditionValue
            }))
        };
    }),
    submitResponse: publicProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/{slug}/submit'),
            tags: tag
        }
    })
    .input(submitResponseInput)
    .output(successOutput)
    .mutation(async ({input}) => {
        const form = await formService.findFormBySlug(input.slug);
        if(!form.success || !form.data) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'form is not available'
        });

        if(form.data.deletedAt) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'form is not available'
        });

        if(form.data.status !== 'published') throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'form is not available'
        });

        if(form.data.expiresAt && form.data.expiresAt < new Date()) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'form is not available'
        });

        if(form.data.responseLimit) {
            const responseCount = await responseService.countResponseByFormId(form.data.id);
            if(responseCount.success && responseCount.count !== null && responseCount.count >= form.data.responseLimit) throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'form is not available'
            });
        }

        const fields = await fieldService.listFieldsByFormId(form.data.id);

        if(!fields.success || !fields.data) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'failed to fetch fields'
        });

        const schema = buildResponseSchema(fields.data, input.data);

        const parsed = schema.safeParse(input.data);

        if(!parsed.success) throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `${parsed.error}`
        });

        await responseService.createResponse({formId: form.data.id, data: parsed.data, sessionId: input.sessionId});

        if(form.data.responseLimit){
            const currentCount = await responseService.countResponseByFormId(form.data.id);
            if(currentCount.success && currentCount.count !== null && currentCount.count >= form.data.responseLimit){
                await formService.updateFormStatus(form.data.id, 'closed');
            }
        }

        return {success: true};
    }),
    trackEvent: publicProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/track'),
            tags: tag
        }
    })
    .input(trackEventInput)
    .output(successOutput)
    .mutation(async ({input}) => {
        const form = await formService.getFormById(input.formId);
        if(!form.success || !form.data) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'form not found'
        });

        await formEventService.trackEvent({
            formId: input.formId,
            sessionId: input.sessionId,
            eventType: input.eventType,
            duration: input.duration ?? null
        });

        return {success: true};
    })
}) 
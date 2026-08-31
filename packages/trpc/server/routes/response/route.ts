import { listByFormInput, listAllInput, getResponseByIdInput } from './model.js'
import { protectedProcedure, router } from '../../trpc.js'
import { generatePath } from '../../utils/path-generator.js'
import { TRPCError } from '@trpc/server'
import { formService, responseService } from '@repo/services'

const getPath = generatePath('/responses');

const TAG = 'Responses';

async function getOwnedForm(formId: string, userId: string) {
    const form = await formService.getFormById(formId);
    if (!form.success || !form.data || form.data.deletedAt)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'form not found' });
    if (form.data.userId !== userId)
        throw new TRPCError({ code: 'FORBIDDEN', message: 'not your form' });
    return form.data;
}

export const responseRouter = router({
    listByForm: protectedProcedure.meta({
        openapi: {
            method: 'GET',
            path: getPath('/by-form'),
            tags: [TAG]
        }
    })
    .input(listByFormInput)
    .query(async ({input, ctx}) => {
        const {formId, page, pageSize} = input;

        await getOwnedForm(formId, ctx.userId);

        const result = await responseService.listByFormId(formId, page, pageSize);

        return {
            responses: result.data,
            total: result.total,
            page,
            pageSize
        };
    }),

    listAll: protectedProcedure.meta({
        openapi: {
            method: 'GET',
            path: getPath(''),
            tags: [TAG]
        }
    })
    .input(listAllInput)
    .query(async ({input, ctx}) => {
        const {page, pageSize} = input;

        const forms = await formService.listFormsByUser(ctx.userId);
        if(!forms.success || !forms.data) return {responses: [], total: 0, page, pageSize};

        const formIds = forms.data.map(f => f.id);
        if(formIds.length === 0) return {responses: [], total: 0, page, pageSize};

        const result = await responseService.listByFormIds(formIds, page, pageSize);

        return {
            responses: result.data,
            total: result.total,
            page,
            pageSize
        };
    }),

    getById: protectedProcedure.meta({
        openapi: {
            method: 'GET',
            path: getPath('/{id}'),
            tags: [TAG]
        }
    })
    .input(getResponseByIdInput)
    .query(async ({input, ctx}) => {
        const result = await responseService.getById(input.id);
        if(!result.success || !result.data)
            throw new TRPCError({code: 'NOT_FOUND', message: 'response not found'});

        await getOwnedForm(result.data.formId, ctx.userId);

        return result.data;
    })
})

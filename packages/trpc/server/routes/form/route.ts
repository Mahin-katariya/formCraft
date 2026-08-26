import {createFormInput, deleteFormByIdInput, getFormByIdInput, updateFormInput} from './model.js'
import { publicProcedure, protectedProcedure, router } from '../../trpc.js'
import { generatePath } from '../../utils/path-generator.js'
import { TRPCError } from '@trpc/server'
import { formService } from '@repo/services';


const getPath = generatePath('/forms');

const TAG = 'Forms';

async function getOwnedForm(formId: string, userId: string) {
    const form = await formService.getFormById(formId);
    if (!form.success || !form.data || form.data.deletedAt)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'form not found' });
    if (form.data.userId !== userId)
        throw new TRPCError({ code: 'FORBIDDEN', message: 'not your form' });
    return form.data;
}

export const formsRouter = router({
    createForm: protectedProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath(''),
            tags: [TAG]
        }
    })
    .input(createFormInput)
    .mutation(async ({input, ctx}) => {
        const {title, description} = input;

        const form = await formService.createForm({title,description,userId: ctx.userId});

        if(!form.success) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'failed to create a form'
        });

        return {...form.data};
    }),
    listAllFormsCreatedByUser: protectedProcedure.meta({
        openapi: {
            method: 'GET',
            path: getPath(''),
            tags: [TAG]
        }
    })
    .query(async ({ctx}) => {
        const forms  = await formService.listFormsByUser(ctx.userId);
        if(!forms.success) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'failed to fetch all forms created by the user'
        });

        return forms;
    }),
    getFormById: protectedProcedure.meta({
        openapi: {
            method: 'GET',
            path: getPath('/{id}'),
            tags: [TAG]
        }
    })
    .input(getFormByIdInput)
    .query(async ({input, ctx}) => {
        const form = await getOwnedForm(input.id, ctx.userId);
        return {...form};
    }),
    updateForm: protectedProcedure.meta({
        openapi: {
            method: 'PATCH',
            path: getPath('/{id}'),
            tags: [TAG]
        }
    })
    .input(updateFormInput)
    .mutation(async ({input,ctx}) => {
        const {id,title,description,slug,responseLimit,expiresAt} = input;

        await getOwnedForm(id, ctx.userId);

        if(slug){
            const formWithSlugExists = await formService.findFormBySlug(slug);
            if(formWithSlugExists.success && formWithSlugExists.data?.id !== id) throw new TRPCError({
                code: 'CONFLICT',
                message: 'slug already taken'
            });
        }

        const updateData = {title, description, slug, responseLimit, expiresAt};

        const updatedFormResult = await formService.updateFormById(id,updateData);

        if(!updatedFormResult.success) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'failed to update the form'
        });

        return {updatedFormResult};
    }),
    deleteForm: protectedProcedure.meta({
        openapi: {
            method: 'DELETE',
            path: getPath('/{id}'),
            tags: [TAG]
        }
    })
    .input(deleteFormByIdInput)
    .mutation(async ({input,ctx}) => {
        const {id} = input;
        await getOwnedForm(id, ctx.userId);

        const result = await formService.softDeleteForm(id);

        if(!result.success) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'failed to delete the form'
        });

        return {success: result.success};
    }),
    publishForm: protectedProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/{id}/publish'),
            tags: [TAG]
        }
    })
    .input(getFormByIdInput)
    .mutation(async ({input,ctx}) => {
        const form = await getOwnedForm(input.id, ctx.userId);

        if(form.status !== 'draft') throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'only draft forms can be published'
        });

        const updatedForm = await formService.updateFormStatus(input.id, 'published');

        return {...updatedForm.data};
    }),
    unpublishForm: protectedProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/{id}/unpublish'),
            tags: [TAG]
        }
    })
    .input(getFormByIdInput)
    .mutation(async ({input, ctx}) => {
        const form = await getOwnedForm(input.id, ctx.userId);

        if(form.status !== 'published') throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'only published forms can be unpublished'
        });

        const updatedForm = await formService.updateFormStatus(input.id, 'draft');

        return {...updatedForm.data};
    }),
    closeForm: protectedProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/{id}/close'),
            tags: [TAG]
        }
    })
    .input(getFormByIdInput)
    .mutation(async ({input, ctx}) => {
        const form = await getOwnedForm(input.id, ctx.userId);

        if(form.status !== 'published') throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'only published forms can be closed'
        });

        const updatedForm = await formService.updateFormStatus(input.id, 'closed');

        return {...updatedForm.data};
    })
})
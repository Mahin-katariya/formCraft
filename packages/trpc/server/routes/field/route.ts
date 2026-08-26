import {generateKeyBetween} from 'fractional-indexing'

import {createFieldInput,updateFieldInput,listFieldInput,deleteFieldInput,reorderFieldInput} from './model.js'
import {formService, fieldService} from '@repo/services'
import { publicProcedure, protectedProcedure, router } from '../../trpc.js'
import { generatePath } from '../../utils/path-generator.js'
import { TRPCError } from '@trpc/server'

const getPath = generatePath('/fields');

const tag = 'Fields';

async function getOwnedForm(formId: string, userId: string) {
    const form = await formService.getFormById(formId);
    if (!form.success || !form.data || form.data.deletedAt)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'form not found' });
    if (form.data.userId !== userId)
        throw new TRPCError({ code: 'FORBIDDEN', message: 'not your form' });
    return form.data;
}

export const fieldsRouter = router({
    createField: protectedProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/{formId}'),
            tags: [tag]
        }
    })
    .input(createFieldInput)
    .mutation(async ({input,ctx}) => {
        const {formId, label, type, required, placeholder, options} = input;
        
        await getOwnedForm(formId,ctx.userId);

        const fields = await fieldService.listFieldsByFormId(formId);

        if(!fields.success) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'unable to fetch the fields for the form'
        });

        const lastPosition = fields.data.length > 0 ? fields.data[fields.data.length - 1]?.position : null;
        const position = generateKeyBetween(lastPosition, null);

        const newField = await fieldService.createField({formId, label, type, required, placeholder: placeholder ?? null, options: options ?? null, position});

        if(!newField.success) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create a field'
        });

        return {...newField.data};
    }),
    listByForm: protectedProcedure.meta({
        openapi: {
            method: 'GET',
            path: getPath('/{formId}'),
            tags: [tag]
        }
    })
    .input(listFieldInput)
    .query(async ({input, ctx}) => {
        const {formId} = input;
        await getOwnedForm(formId, ctx.userId);
        const fields = await fieldService.listFieldsByFormId(formId);

        return fields.data;
    }),
    updateField: protectedProcedure.meta({
        openapi: {
            method: 'PATCH',
            path: getPath('/{id}'),
            tags: [tag]
        }
    })
    .input(updateFieldInput)
    .mutation(async ({input, ctx}) => {
        const {id, label, type, required, placeholder, options}  = input;
        
        const field = await fieldService.getFieldById(id);

        if(!field.success || !field.data) throw new TRPCError({
            code: 'BAD_REQUEST',
            message: "field doesn't exists"
        });

        await getOwnedForm(field.data.formId, ctx.userId);

        const updatedData: Record<string, unknown> = {};
        if(label !== undefined) updatedData.label = label;
        if(type !== undefined) updatedData.type = type;
        if(required !== undefined) updatedData.required = required;
        if(placeholder !== undefined) updatedData.placeholder = placeholder;
        if(options !== undefined) updatedData.options = options;

        const updatedField = await fieldService.updateField(id, updatedData);

        if(!updatedField.success || !updatedField.data) throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'invalid id, cannot update the field'
        });

        return {...updatedField.data};
    }),
    deleteField: protectedProcedure.meta({
        openapi: {
            method: 'DELETE',
            path: getPath('/{id}'),
            tags: [tag]
        }
    })
    .input(deleteFieldInput)
    .mutation(async ({input, ctx}) => {
        const field = await fieldService.getFieldById(input.id);

        if(!field.success || !field.data) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'field not found'
        });

        await getOwnedForm(field.data.formId, ctx.userId);

        const result = await fieldService.deleteField(input.id);

        if(!result.success) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'failed to delete the field'
        });

        return {success: true};
    }),
    reorderField: protectedProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/reorder'),
            tags: [tag]
        }
    })
    .input(reorderFieldInput)
    .mutation(async ({input, ctx}) => {
        const {formId, fieldId, newIndex} = input;

        await getOwnedForm(formId, ctx.userId);

        const fields = await fieldService.listFieldsByFormId(formId);
        const others = fields.data.filter(f => f.id !== fieldId);

        const beforeKey = others[newIndex - 1]?.position ?? null;
        const afterKey = others[newIndex]?.position ?? null;
        const newPosition = generateKeyBetween(beforeKey, afterKey);

        await fieldService.updateFieldPosition(fieldId, newPosition);

        const updatedFields = await fieldService.listFieldsByFormId(formId);
        return updatedFields.data;
    })
})
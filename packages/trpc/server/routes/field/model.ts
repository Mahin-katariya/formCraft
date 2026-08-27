import {z} from 'zod';

const FIELD_TYPES = [
    'short_text', 'long_text', 'number', 'email', 'phone', 'url', 'date', 'single_select', 'multi_select', 'rating'
] as const;



export const createFieldInput = z.object({
    formId: z.string().describe('id of the form the fields belong to'),
    label: z.string().max(255).describe('label of the field'),
    type: z.enum(FIELD_TYPES).describe('type of the field'),
    required: z.boolean().optional().describe('required status for the field'),
    placeholder: z.string().optional().describe("placeholder for the field"),
    options: z.array(z.string()).optional().describe("options for the select field")
});

export const updateFieldInput = z.object({
    id: z.string().describe('id of the field'),
    label: z.string().max(255).optional().describe('updated label of the field'),
    type: z.enum(FIELD_TYPES).optional().describe('updated type of the field'),
    required: z.boolean().optional().describe('updated required status for the field'),
    placeholder: z.string().optional().describe('udpated placeholder for the field'),
    options: z.array(z.string()).optional().describe("updated options for the select field"),
    conditionFieldId: z.string().nullable().optional().describe("UUID of the source field"),
    conditionOperator: z.enum(['equals','not_equals']).nullable().optional().describe('operator to check if the conditional field should appear or not'),
    conditionValue: z.string().nullable().optional().describe("the option value to compare against")
});

export const deleteFieldInput = z.object({
    id: z.string().describe("id of the field"),
})

export const listFieldInput = z.object({
    formId: z.string().describe('id of the form the fields belong to')
})

export const reorderFieldInput = z.object({
    formId: z.string().describe("id of the form the fields belong to"),
    fieldId: z.string().describe("id of the field thats being reordered"),
    newIndex: z.number().describe("new position of the field")
})

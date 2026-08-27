import {z} from "zod";

import {SelectFields} from '@repo/database'

export function buildResponseSchema(fields: SelectFields[], submittedData: Record<string, unknown>){
    const schemaShape: Record<string, z.ZodType> = {};
    for(const field of fields){
        let isHidden = false;
        if(field.conditionFieldId !== null){
            const sourceValue = submittedData[field.conditionFieldId];
            if(field.conditionOperator === 'equals' && sourceValue !== field.conditionValue) isHidden = true;
            if(field.conditionOperator === 'not_equals' && sourceValue === field.conditionValue) isHidden = true;
        }
        let zodType: z.ZodTypeAny
        switch (field.type) {
            case 'short_text':
                zodType = z.string().describe("short text input type")
                break;
            case 'long_text':
                zodType = z.string().describe("long text input type");
                break;
            case 'email':
                zodType = z.email().describe('email input type');
                break;
            case 'url':
                zodType = z.url().describe('url input type');
                break;
            case 'phone':
                zodType = z.string().describe("phone input type");
                break;
            case 'number' :
                zodType = z.coerce.number().describe('number input type');
                break;
            case 'date':
                zodType = z.iso.date().describe('date input type');
                break;
            case 'rating':
                zodType = z.coerce.number().min(1).max(5).describe('rating input type (1-5 raiting)');
                break;
            case 'single_select': 
                zodType = z.enum(field.options as [string,...string[]]).describe('options of the selected field');
                break;
            case 'multi_select':
                zodType = z.array(z.enum(field.options as [string, ...string[]]));
                break;
            default:
                zodType = z.any();
                break;
        }

        if(isHidden || !field.required){
            zodType = zodType.optional();
        }

        schemaShape[field.id] = zodType;

    }//
    return z.object(schemaShape);

}
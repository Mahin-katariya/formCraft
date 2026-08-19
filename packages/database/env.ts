import z from 'zod'

const envSchema = z.object({
    DATABASE_URL: z.string().describe("URL for the database conenction")
});

function craeteEnv(env: NodeJS.ProcessEnv){
    const safeParsedResult = envSchema.safeParse(env);
    if(!safeParsedResult.success) throw new Error(safeParsedResult.error.message);
    return safeParsedResult.data;
}

export const env = craeteEnv(process.env);
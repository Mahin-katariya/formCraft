import z from 'zod';

const envSchema = z.object({
    PORT: z.string().optional(),
    NODE_ENV: z.enum(["development", "prod"]).default("development"),
    BASE_URL: z.string().default("http://localhost:8000"),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
})

function createEnv(env: NodeJS.ProcessEnv){
    const safeParsedResult = envSchema.safeParse(env);
    if(!safeParsedResult.success) throw new Error(safeParsedResult.error.message);
    return safeParsedResult.data;
}

export const env = createEnv(process.env);
import z from 'zod'

const envSchema = z.object({
    ACCESS_TOKEN_SECRET: z.string().describe("Access Token Secret for access token generation"),
    REFRESH_TOKEN_SECRET: z.string().describe("Refresh Token Secret for refresh token generation")
});

function craeteEnv(env: NodeJS.ProcessEnv){
    const safeParsedResult = envSchema.safeParse(env);
    if(!safeParsedResult.success) throw new Error(safeParsedResult.error.message);
    return safeParsedResult.data;
}

export const env = craeteEnv(process.env);
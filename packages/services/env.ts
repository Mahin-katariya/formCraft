import z from 'zod'

const envSchema = z.object({
    ACCESS_TOKEN_SECRET: z.string().describe("Access Token Secret for access token generation"),
    REFRESH_TOKEN_SECRET: z.string().describe("Refresh Token Secret for refresh token generation"),
    RESEND_API_KEY: z.string().describe("Resend Email Service API Key"),
    RESEND_FROM_EMAIL: z.string().describe("Sending Email from: <pigeon form>"),
    FRONTEND_URL: z.string().describe("Verification link redirects to our frontend"),
    GOOGLE_CLIENT_ID: z.string().describe("Google Client Id for verifying the client application")
});

function craeteEnv(env: NodeJS.ProcessEnv){
    const safeParsedResult = envSchema.safeParse(env);
    if(!safeParsedResult.success) throw new Error(safeParsedResult.error.message);
    return safeParsedResult.data;
}

export const env = craeteEnv(process.env);
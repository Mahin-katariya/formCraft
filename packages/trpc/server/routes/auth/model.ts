import {z} from 'zod';

export const createUserWithEmailAndPassword = z.object({
    displayName: z.string().optional().describe("display name of the user"),
    email: z.email().describe("email of the user"),
    password: z.string().min(8).describe("password of the user")
});

export const signInUserWithEmailAndPassword = z.object({
    email: z.email().describe("email of the user"),
    password: z.string().min(8).describe("password of the user")
});

export const verifyEmail = z.object({
    token: z.string().describe("email verification token")
})

export const googleLogin = z.object({
    idToken: z.string().describe("idToken received from the google OAuth Server")
})

export const authTokenOutput = z.object({
    accessToken: z.string().describe("JWT access token"),
    id: z.string().describe("user UUID"),
    email: z.string().describe("user email"),
    emailVerified: z.boolean().nullable().describe("whether the email is verified")
});

export const refreshOutput = z.object({
    accessToken: z.string().describe("new JWT access token")
});

export const logoutOutput = z.object({
    success: z.boolean().describe("whether logout succeeded")
});

export const meOutput = z.object({
    id: z.string().describe("user UUID"),
    email: z.string().describe("user email"),
    displayName: z.string().nullable().describe("display name"),
    avatarUrl: z.string().nullable().describe("avatar URL"),
    emailVerified: z.boolean().nullable().describe("whether email is verified")
});

export const verifyEmailOutput = z.object({
    success: z.boolean().describe("whether verification succeeded")
});

export type CreateUserWithEmailAndPasswordType = z.infer<typeof createUserWithEmailAndPassword>;
export type SignInUserWithEmailAndPasswordType = z.infer<typeof signInUserWithEmailAndPassword>;
export type VerifyEmailType = z.infer<typeof verifyEmail>;
export type GoogleLoginType = z.infer<typeof googleLogin>
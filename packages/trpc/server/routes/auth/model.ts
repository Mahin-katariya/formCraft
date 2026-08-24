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

export type CreateUserWithEmailAndPasswordType = z.infer<typeof createUserWithEmailAndPassword>;
export type SignInUserWithEmailAndPasswordType = z.infer<typeof signInUserWithEmailAndPassword>;
export type verifyEmailType = z.infer<typeof verifyEmail>;
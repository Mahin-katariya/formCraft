import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { Context } from "./context.js";
import {authService, userService} from "@repo/services";

export const trpcContext =
        initTRPC
        .meta<OpenApiMeta>()
        .context<Context>()
        .create();

export const router = trpcContext.router;

export const publicProcedure = trpcContext.procedure;

const authMiddleware = trpcContext.middleware(async ({ctx, next}) => {
    const token = ctx.getAuthHeader();

    if(!token) throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "authorization header - token missing",
    });

    try {
        const {userId} = authService.verifyAccessToken(token);
        return next({ctx: {userId}});
    } catch (error) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "invalid or expired token",
        });
    }
});

export const protectedProcedure = publicProcedure.use(authMiddleware);

export const verifiedProcedure = protectedProcedure.use(async ({ctx, next}) => {
    const user = await userService.findUserById(ctx.userId);
    if(!user) throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'user not found!'
    });

    if(!user.emailVerified) throw new TRPCError({
        code: 'FORBIDDEN',
        message: "please verify your email"
    });

    return next();
});



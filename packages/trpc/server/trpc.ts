import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { Context } from "./context.js";
import {authService} from "@repo/services";

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


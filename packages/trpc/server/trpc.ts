import { initTRPC } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { Context } from "./context.js";

export const trpcContext = 
        initTRPC
        .meta<OpenApiMeta>()
        .context<Context>()
        .create();

export const router = trpcContext.router;

export const publicProcedure = trpcContext.procedure;


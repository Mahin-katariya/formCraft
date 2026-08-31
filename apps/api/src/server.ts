import express from 'express';
import cors from 'cors';
import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from 'trpc-to-openapi';
import { apiReference } from '@scalar/express-api-reference';
import cookieParser from 'cookie-parser';

import { env } from './env';
import {serverRouter, createContext} from '@repo/trpc/server'

export const app = express();

const openApiDocument = generateOpenApiDocument(serverRouter, {
    title: "PigeonForm API",
    version: "1.0.0",
    baseUrl: `http://localhost:${env.PORT ?? 8000}`,
});


app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(cookieParser());

app.use(express.json());

app.get('/', (req, res) => {
    return res.send('FormCraft is up and running ...');
});

app.get('/health',  (req,res) => {
    return res.json({
        message: "FormCraft is healthy",
        healthy: true
    });
});

app.get("/openapi.json", (_req, res) => res.json(openApiDocument));

app.use(
    "/docs",
    apiReference({
        spec: { url: "/openapi.json" },
    })
);

app.use("/api", createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext
}));

app.use("/trpc", trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext
}))


import express from 'express';
import cors from 'cors';
import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from 'trpc-to-openapi';
import { apiReference } from '@scalar/express-api-reference';
import cookieParser from 'cookie-parser';

import { env } from './env';
import {serverRouter, createContext} from '@repo/trpc/server'

export const app = express();

// TODO : create OpenAPIDocument instance once server router is written in packages/trpc
// const openAPIDocument = generateOpenApiDocument()


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

// TODO: create get routes for openAPi route


// TODO: create middleware for express and trpc server
// app.use("/api", createOpenApiExpressMiddleware({
//     router: "",
//     createContext
// }))

app.use("/trpc", trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext
}))


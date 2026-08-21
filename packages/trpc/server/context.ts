import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { clearCookieFactory, createCookieFactory, getCookieFactory } from "./utils/cookie.js";
import { getAuthHeaderFactory } from "./utils/headers.js";

export interface TRPCContext {
  createCookie: ReturnType<typeof createCookieFactory>,
  getCookie: ReturnType<typeof getCookieFactory>,
  clearCookie: ReturnType<typeof clearCookieFactory>,
  getAuthHeader: ReturnType<typeof getAuthHeaderFactory>
  userId: null | string
}

export const createContext = async ({req,res}: CreateExpressContextOptions) => ({
    createCookie: createCookieFactory(res),
    getCookie: getCookieFactory(req),
    clearCookie: clearCookieFactory(res),
    getAuthHeader: getAuthHeaderFactory(req),
    userId: null
});

export type Context = Awaited<ReturnType<typeof createContext>>;


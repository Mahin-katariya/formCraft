import type { CookieOptions, Response, Request } from "express-serve-static-core";
import type { TRPCContext } from "../context.js";
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_MONTH = 30 * ONE_DAY;
const ONE_YEAR = 12 * ONE_MONTH;

const defaultCookieOptions: CookieOptions = {
    path: '/',
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    maxAge: ONE_YEAR
};

export function createCookieFactory(res: Response){
    return function createCookie(name: string, value: string, opts: CookieOptions = defaultCookieOptions){
        res.cookie(name,value,opts);
    }
}

export function getCookieFactory(req: Request) {
    return function getCookie(name: string) {
        return req.cookies?.[name];
    };
}

export function clearCookieFactory(res: Response) {
    return function clearCookie(name: string) {
        res.clearCookie(name);
    };
}

const REFRESH_COOKIE_NAME = 'refresh-token';

export function setRefreshCookie(ctx: TRPCContext, token: string){
    ctx.createCookie(REFRESH_COOKIE_NAME, token);
}

export function getRefreshCookie(ctx: TRPCContext){
    return ctx.getCookie(REFRESH_COOKIE_NAME);
};

export function clearRefreshCookie(ctx: TRPCContext){
    ctx.clearCookie(REFRESH_COOKIE_NAME);
}
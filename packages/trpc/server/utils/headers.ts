import type { Request, Response } from "express";

export function getAuthHeaderFactory(req: Request){
    return function getAuthHeader(){
        let token = req.headers.authorization?.split(" ")[1];
        return token;
    }
}
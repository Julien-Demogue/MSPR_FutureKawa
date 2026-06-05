import { Request as ExpressRequest } from "express";

export const extractAccessFromCookie = (req: ExpressRequest): string | null => {
    if (cookieHasTokens(req)) {
        return req.cookies["auth-cookie"].access_token;
    }

    return null;
};

export const extractRefreshFromCookie = (req: ExpressRequest): string | null => {
    if (cookieHasTokens(req)) {
        return req.cookies["auth-cookie"].refresh_token;
    }

    return null;
};

export const cookieHasTokens = (req: ExpressRequest): boolean => {
    return req.cookies && req.cookies["auth-cookie"];
};

import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { auth as betterAuth } from '../../lib/auth';
import { fromNodeHeaders } from "better-auth/node";
import config from '../../config';
import AppError from '../errors/AppError';
import { TUserRole } from '../module/User/user.utils';
import catchAsync from '../utils/catchAsync';

const auth = (...requiredRoles: TUserRole[]) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        // BetterAuth Session Check
        const session = await betterAuth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
        }

        const user = session.user;
        const role = user.role as TUserRole;

        if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
            throw new AppError(
                httpStatus.UNAUTHORIZED,
                'You are not authorized!',
            );
        }

        // Attach user to request for use in controllers
        req.user = user as any;
        next();
    });
};

export default auth;

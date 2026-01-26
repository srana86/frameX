import { TUserRole } from '../middlewares/auth';

declare global {
    namespace Express {
        interface Request {
            user: {
                id: string;
                userId: string; // compatibility field
                email: string;
                role: TUserRole | string;
                tenantId?: string;
                [key: string]: any; // Allow for other better-auth fields
            };
            tenantId: string;
        }
    }
}

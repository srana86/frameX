import { z } from 'zod';

const loginValidationSchema = z.object({
    body: z.object({
        email: z.string({ message: 'Email is required' }).email(),
        password: z.string({ message: 'Password is required' }),
    }),
});

const refreshTokenValidationSchema = z.object({
    cookies: z.object({
        refreshToken: z.string({ message: 'Refresh token is required' }),
    }),
});

const changePasswordValidationSchema = z.object({
    body: z.object({
        oldPassword: z.string({ message: 'Old password is required' }),
        newPassword: z.string({ message: 'New password is required' }),
    }),
});

export const AuthValidation = {
    loginValidationSchema,
    refreshTokenValidationSchema,
    changePasswordValidationSchema,
};

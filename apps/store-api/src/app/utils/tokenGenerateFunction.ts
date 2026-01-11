import jwt, { JwtPayload } from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  role: string;
  tenantId: string;
}

export const createToken = (
  jwtPayload: TokenPayload,
  secret: string,
  expiresIn: string
) => {
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload & TokenPayload;
};

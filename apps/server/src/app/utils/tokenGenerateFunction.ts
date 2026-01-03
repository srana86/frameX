import * as jwt from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";

export const createToken = (
  jwtPayload: { userId: string; role: string },
  secret: string,
  expiresIn: string
) => {
  // expiresIn accepts string (like "1h", "7d") which is compatible with StringValue from 'ms' package
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};

import { Request, Response, NextFunction } from "express";
import TokenService from "../utils/token.js";
import RedisService from "../../DB/redis.connection.js";
import {AppError} from "../utils/globalErrorHandling.js";

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new AppError("Authorization header is required", 401);
  }

  const [bearer, token] = authorization.split(" ");

  if (bearer !== "Bearer" || !token) {
    throw new AppError("Invalid authorization format", 401);
  }

  let decoded;

  try {
    decoded = TokenService.verifyAccessToken(token);
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }

  const savedRefreshToken = await RedisService.getValue(
    `refresh-token:${decoded.id}`,
  );

  if (!savedRefreshToken) {
    throw new AppError("User session is revoked", 401);
  }

  req.user = decoded;

  return next();
};
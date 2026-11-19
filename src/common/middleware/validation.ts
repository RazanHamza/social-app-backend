
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/globalErrorHandling.js";

type ReqType = "body" | "params" | "query";
type SchemaType = Partial<Record<ReqType, ZodType>>;

export const Validation = (schema: SchemaType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ResultError = [];

    for (const key of Object.keys(schema) as ReqType[]) {
      if (!schema[key]) continue;

      const result = schema[key].safeParse(req[key]);

      if (!result.success) {
        ResultError.push(...result.error.issues);
      } else {
        Object.defineProperty(req, key, {
          value: result.data,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }

    if (ResultError.length > 0) {
      throw new AppError(ResultError, 400);
    }

    next();
  };
};

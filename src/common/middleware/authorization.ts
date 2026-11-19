
import { Request, Response, NextFunction } from "express";
import { userRepository } from "../../modules/auth/repositories/user.repository.js";
import userModel from "../../DB/models/user.model.js";
import { RoleEnum } from "../enum/user.enum.js";
import { AppError } from "../utils/globalErrorHandling.js";

const userRepo = new userRepository(userModel);

export const authorization = (...roles: RoleEnum[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Please login first", 401);
    }

    const user = await userRepo.findOne({
      filter: { _id: req.user.id },
      projection: { role: 1 },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!roles.includes(user.role)) {
      throw new AppError("You are not authorized to access this resource", 403);
    }

    return next();
  };
};

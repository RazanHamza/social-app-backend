import { Request, Response } from "express";
import userModel from "../../DB/models/user.model.js";
import { userRepository } from "../auth/repositories/user.repository.js";
import { AppError } from "../../common/utils/globalErrorHandling.js";
import mongoose from "mongoose";

class UserService {
  private readonly _userRepo = new userRepository(userModel);

  getProfile = async (req: Request, res: Response) => {
    const user = await this._userRepo.findOne({
      filter: { _id: req.user!.id },
      projection: {
        fName: 1,
        lName: 1,
        email: 1,
        gender: 1,
        phone: 1,
        profileImage: 1,
        isConfirmed: 1,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      user,
    });
  };

  updateProfile = async (req: Request, res: Response) => {
    const updatedUser = await this._userRepo.findByIdAndUpdate({
      id: req.user!.id,
      data: req.body,
      options: {
        new: true,
        runValidators: true,
        select: "fName lName email gender phone profileImage isConfirmed",
      },
    });

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  };

  followUser = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const currentUserId = req.user!.id;

    if (!userId || typeof userId !== "string") {
      throw new AppError("User ID is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400);
    }

    if (currentUserId === userId) {
      throw new AppError("You cannot follow yourself", 400);
    }

    const targetUser = await this._userRepo.findOne({
      filter: { _id: userId },
      projection: { _id: 1 },
    });

    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    // Add target user to following list
    const followResult = await this._userRepo.updateOne({
      filter: {
        _id: currentUserId,
        following: { $ne: targetUser._id },
      },
      data: {
        $addToSet: {
          following: targetUser._id,
        },
      },
    });

    if (followResult.modifiedCount === 0) {
      throw new AppError("You are already following this user", 409);
    }

    // Add current user to target user's followers list
    await this._userRepo.updateOne({
      filter: { _id: targetUser._id },
      data: {
        $addToSet: {
          followers: new mongoose.Types.ObjectId(currentUserId),
        },
      },
    });

    return res.status(200).json({
      message: "User followed successfully",
    });
  };

  unfollowUser = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const currentUserId = req.user!.id;

    if (!userId || typeof userId !== "string") {
      throw new AppError("User ID is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400);
    }

    if (currentUserId === userId) {
      throw new AppError("You cannot unfollow yourself", 400);
    }

    const targetUser = await this._userRepo.findOne({
      filter: { _id: userId },
      projection: { _id: 1 },
    });

    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    const unfollowResult = await this._userRepo.updateOne({
      filter: {
        _id: currentUserId,
        following: targetUser._id,
      },
      data: {
        $pull: {
          following: targetUser._id,
        },
      },
    });

    if (unfollowResult.modifiedCount === 0) {
      throw new AppError("You are not following this user", 409);
    }

    await this._userRepo.updateOne({
      filter: { _id: targetUser._id },
      data: {
        $pull: {
          followers: new mongoose.Types.ObjectId(currentUserId),
        },
      },
    });

    return res.status(200).json({
      message: "User unfollowed successfully",
    });
  };

searchUsers = async (req: Request, res: Response) => {
  const { search, page, limit } = req.query;

  const currentUserId = req.user!.id;

  const filter: any = {
    _id: { $ne: currentUserId },
  };

  if (search && typeof search === "string") {
    filter.$or = [
      { fName: { $regex: search, $options: "i" } },
      { lName: { $regex: search, $options: "i" } },
    ];
  }

  const currentPage = Number(page) || 1;
  const pageLimit = Number(limit) || 10;
  const skip = (currentPage - 1) * pageLimit;

  const users = await this._userRepo.find({
    filter,
    options: {
      select: "fName lName profileImage",
      skip,
      limit: pageLimit,
    },
  });

  return res.status(200).json({
    message: "Users retrieved successfully",
    users,
    pagination: {
      page: currentPage,
      limit: pageLimit,
      count: users.length,
    },
  });
};

}

export default new UserService();

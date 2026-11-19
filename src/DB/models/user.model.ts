import mongoose from "mongoose";
import { GenderEnum, RoleEnum } from "../../common/enum/user.enum.js";

export interface IUser {
  fName: string;
  lName: string;
  email: string;
  password?: string;
  googleId?: string;
  gender: GenderEnum;
  role: RoleEnum;
  isConfirmed: boolean;
  phone?: string;
  profileImage?: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
}

const userScheme = new mongoose.Schema<IUser>(
  {
    fName: {
      type: String,
      trim: true,
      minLength: 3,
      maxLength: 20,
      required: true,
    },
    lName: {
      type: String,
      trim: true,
      minLength: 3,
      maxLength: 20,
      required: true,
    },
    email: { type: String, trim: true, unique: true, required: true },
    googleId: { type: String, unique: true, sparse: true },
    password: { type: String, trim: true, required: false },
    gender: {
      type: String,
      enum: [GenderEnum.female, GenderEnum.male],
      default: GenderEnum.male,
    },
    role: {
      type: String,
      enum: [RoleEnum.user, RoleEnum.admin],
      default: RoleEnum.user,
    },
    phone: String,
    profileImage: String,
    isConfirmed: Boolean,
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    strictQuery: true,
  },
);

const userModel =
  mongoose.models.User || mongoose.model<IUser>("User", userScheme);

export default userModel;


import { GenderEnum } from "../../common/enum/user.enum.js";
import * as z from "zod";

export const signUpSchema = {
  body: z.strictObject({
    fName: z.string().min(2).max(100).trim(),
    lName: z.string().min(2).max(100).trim(),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .max(100)
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
    cPassword: z.string(),
    gender: z.enum(GenderEnum).optional(),
    phone: z.string().optional(),
  }).refine(
    (val) => val.password === val.cPassword,
    {
      message: "password & confirm password must be the same",
      path: ["cPassword"],
    }
  ),
};

export const verifyEmailSchema = {
  body: z.strictObject({
    email: z.string().email(),
    otp: z.string().length(6).regex(/^\d{6}$/),
  }),
};

export const loginSchema = {
  body: z.strictObject({
    email: z.string().email(),
    password: z.string().min(8).max(100),
  }),
};

export const refreshTokenSchema = {
  body: z.strictObject({
    refreshToken: z.string().min(1),
  }),
};

export const forgotPasswordSchema = {
  body: z.strictObject({
    email: z.string().email(),
  }),
};

export const resetPasswordSchema = {
  body: z.strictObject({
    email: z.string().email(),
    otp: z.string().length(6).regex(/^\d{6}$/),
    password: z.string().min(8).max(100).regex(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    ),
    cPassword: z.string(),
  }).refine((val) => val.password === val.cPassword, {
    message: "password & confirm password must be the same",
    path: ["cPassword"],
  }),
};
export type SignUpBody = z.infer<typeof signUpSchema.body>;
export type LoginBody = z.infer<typeof loginSchema.body>;
export type RefreshTokenBody = z.infer<typeof refreshTokenSchema.body>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema.body>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema.body>;

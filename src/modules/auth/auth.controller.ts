import { Router } from "express";
import AS from "./auth.service.js";
import { Validation } from '../../common/middleware/validation.js';
import { signUpSchema,verifyEmailSchema,loginSchema,refreshTokenSchema,forgotPasswordSchema,resetPasswordSchema} from '../../modules/auth/auth.validation.js';


const authRouter = Router();

authRouter.post(
  "/signup",
  Validation(signUpSchema),
  AS.signUp
);

authRouter.post(
  "/verify-email",
  Validation(verifyEmailSchema),
  AS.verifyEmail,
);

authRouter.post(
  "/login",
  Validation(loginSchema),
  AS.login,
);

authRouter.post(
  "/refresh-token",
  Validation(refreshTokenSchema),
  AS.refreshToken
);

authRouter.post(
  "/logout",
  Validation(refreshTokenSchema),
  AS.logout
);

authRouter.post(
  "/forgot-password",
  Validation(forgotPasswordSchema),
  AS.forgotPassword
);

authRouter.post(
  "/reset-password",
  Validation(resetPasswordSchema),
  AS.resetPassword
);

authRouter.get("/google", AS.googleLogin);

authRouter.get("/google/callback", AS.googleCallback);

export default authRouter;
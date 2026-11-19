import { type Request, type Response } from "express";
import userModel, { type IUser } from "../../DB/models/user.model.js";
import { AppError } from "../../common/utils/globalErrorHandling.js";
import { type SignUpBody } from "./auth.validation.js";
import { userRepository } from "./repositories/user.repository.js";
import RedisService from "../../DB/redis.connection.js";
import EmailService from "./email.service.js";
import TokenService from "../../common/utils/token.js";
import googleClient from "../../config/google.js";
import bcrypt from "bcrypt";


class AuthService {
  private readonly _userRepo = new userRepository(userModel);

  googleLogin = async (req: Request, res: Response) => {
    const url = googleClient.generateAuthUrl({
      scope: ["openid", "email", "profile"],
      prompt: "select_account",
    });

    return res.redirect(url);
  };

  googleCallback = async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      throw new AppError("Google authorization code is missing", 400);
    }

    const { tokens } = await googleClient.getToken(code);

    if (!tokens.id_token) {
      throw new AppError("Google ID token not found", 401);
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const googleUser = ticket.getPayload();

    if (!googleUser || !googleUser.email || !googleUser.sub) {
      throw new AppError("Invalid Google account information", 401);
    }

    if (googleUser.email_verified !== true) {
      throw new AppError("Google email is not verified", 403);
    }

    let user = await this._userRepo.findOne({
      filter: { email: googleUser.email },
    });

    if (!user) {
      const [createdUser] = await this._userRepo.create({
        fName: googleUser.given_name || "Google",
        lName: googleUser.family_name || "User",
        email: googleUser.email,
        googleId: googleUser.sub,
        profileImage: googleUser.picture,
        isConfirmed: true,
      } as Partial<IUser>);

      if (!createdUser) {
        throw new AppError("Google account creation failed", 500);
      }

      user = createdUser;
    } else if (!user.googleId) {
  const updatedUser = await this._userRepo.findOneAndUpdate({
    filter: { email: googleUser.email },
    data: {
      googleId: googleUser.sub,
      isConfirmed: true,
      ...(googleUser.picture && {
        profileImage: googleUser.picture,
      }),
    },
    options: { new: true },
  });

  if (updatedUser) {
    user = updatedUser;
  }
}

    const payload = {
  id: user._id.toString(),
  email: user.email,
};

const accessToken = TokenService.generateAccessToken(payload);
const refreshToken = TokenService.generateRefreshToken(payload);

await RedisService.setValue({
  key: `refresh-token:${user._id.toString()}`,
  value: refreshToken,
  ttl: 7 * 24 * 60 * 60,
});

return res.status(200).json({
  message: "Google login successful",
  accessToken,
  refreshToken,
});
  };

  signUp = async (req: Request<{}, {}, SignUpBody>, res: Response) => {
    const { email, fName, lName, password, gender, phone } = req.body;

    const emailExist = await this._userRepo.findOne({
      filter: { email },
    });

    if (emailExist) {
      throw new AppError("email already exist", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [createdUser] = await this._userRepo.create({
      email,
      fName,
      lName,
      password: hashedPassword,
      gender,
      phone,
      isConfirmed: false,
    } as Partial<IUser>);

    if (!createdUser) {
      throw new AppError("User creation failed", 500);
    }

    await this.sendVerificationEmail(email);

    const { password: _password, ...safeUser } = createdUser.toObject();

    return res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      user: safeUser,
    });
  };

  generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  saveOTP = async (email: string) => {
    const otp = this.generateOTP();

    await RedisService.setValue({
      key: `email-verification:${email}`,
      value: otp,
      ttl: 300,
    });

    return otp;
  };

  sendVerificationEmail = async (email: string) => {
    const otp = await this.saveOTP(email);

    await EmailService.sendEmail({
      to: email,
      subject: "Email Verification",
      html: `
      <div style="font-family: Arial; text-align: center;">
        <h2>Verify Your Email</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      </div>
    `,
    });

    return true;
  };

  verifyEmail = async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const user = await this._userRepo.findOne({
      filter: { email },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isConfirmed) {
      throw new AppError("Email already verified", 400);
    }

    const savedOTP = await RedisService.getValue(`email-verification:${email}`);

    if (!savedOTP) {
      throw new AppError("OTP expired or not found", 400);
    }

    if (String(savedOTP) !== String(otp)) {
      throw new AppError("Invalid OTP", 400);
    }

    await this._userRepo.findOneAndUpdate({
      filter: { email },
      data: { isConfirmed: true },
      options: { new: true },
    });

    await RedisService.deleteKey(`email-verification:${email}`);

    return res.status(200).json({
      message: "Email verified successfully",
    });
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await this._userRepo.findOne({
      filter: { email },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.password) {
      throw new AppError("Please login using Google", 401);
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isConfirmed) {
      throw new AppError("Please verify your email first", 403);
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
    };

    const accessToken = TokenService.generateAccessToken(payload);
    const refreshToken = TokenService.generateRefreshToken(payload);

    await RedisService.setValue({
      key: `refresh-token:${user._id.toString()}`,
      value: refreshToken,
      ttl: 7 * 24 * 60 * 60,
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  };

  refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    let decoded;

    try {
      decoded = TokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const key = `refresh-token:${decoded.id}`;

    const savedRefreshToken = await RedisService.getValue(key);

    if (!savedRefreshToken || String(savedRefreshToken) !== refreshToken) {
      throw new AppError("Refresh token is invalid or revoked", 401);
    }

    const user = await this._userRepo.findOne({
      filter: { _id: decoded.id },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
    };

    const newAccessToken = TokenService.generateAccessToken(payload);
    const newRefreshToken = TokenService.generateRefreshToken(payload);

    await RedisService.setValue({
      key,
      value: newRefreshToken,
      ttl: 7 * 24 * 60 * 60,
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  };

  logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    let decoded;

    try {
      decoded = TokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const key = `refresh-token:${decoded.id}`;

    const savedRefreshToken = await RedisService.getValue(key);

    if (!savedRefreshToken || String(savedRefreshToken) !== refreshToken) {
      throw new AppError("Refresh token is invalid or already revoked", 401);
    }

    await RedisService.deleteKey(key);

    return res.status(200).json({
      message: "Logged out successfully",
    });
  };

  forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await this._userRepo.findOne({
      filter: { email },
    });

    if (!user) {
      return res.status(200).json({
        message: "If the account exists, a reset code will be sent",
      });
    }

    if (!user.isConfirmed) {
      throw new AppError("Please verify your email first", 403);
    }

    const otp = this.generateOTP();

    await RedisService.setValue({
      key: `password-reset:${email}`,
      value: otp,
      ttl: 300,
    });

    await EmailService.sendEmail({
      to: email,
      subject: "Password Reset OTP",
      html: `
      <div style="font-family: Arial; text-align: center;">
        <h2>Password Reset</h2>
        <p>Your password reset code is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      </div>
    `,
    });

    return res.status(200).json({
      message: "If the account exists, a reset code will be sent",
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const { email, otp, password } = req.body;

    const user = await this._userRepo.findOne({
      filter: { email },
    });

    if (!user) {
      throw new AppError("Invalid email or OTP", 400);
    }

    const savedOTP = await RedisService.getValue(`password-reset:${email}`);

    if (!savedOTP || String(savedOTP) !== String(otp)) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await this._userRepo.findOneAndUpdate({
      filter: { email },
      data: { password: hashedPassword },
      options: { new: true },
    });

    await RedisService.deleteKey(`password-reset:${email}`);

    return res.status(200).json({
      message: "Password reset successfully",
    });
  };
}

export default new AuthService();

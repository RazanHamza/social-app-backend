import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
} from "../../config/security.js";

type TokenPayload = {
  id: string;
  email: string;
};

class TokenService {
  generateAccessToken = (payload: TokenPayload) => {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
  };

  generateRefreshToken = (payload: TokenPayload) => {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
  };

  verifyAccessToken = (token: string) => {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
  };

  verifyRefreshToken = (token: string) => {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
  };
}

export default new TokenService();
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import UserRepository from "../repositories/userRepositories";
import { CreateJWT } from "../utils/generateToken";
import { UserDoc } from "../interfaces/IUser";

dotenv.config();

const jwt = new CreateJWT();
const userRepository = new UserRepository();

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: UserDoc | null;
    }
  }
}

const userAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { access_token: accessToken, refresh_token: refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Token expired or not available" });
    }

    let token = accessToken;

    if (!token) {
      token = await refreshAccessToken(refreshToken);
      if (!token) {
        return res.status(401).json({ success: false, message: "Unable to refresh access token" });
      }
      const accessTokenMaxAge = 30 * 60 * 10000;
      res.cookie("access_token", token, {
        maxAge: accessTokenMaxAge,
        sameSite: "none",
        secure: true,
      });
    }

    const decoded = jwt.verifyToken(token);

    if (decoded?.data) {        
      const user = await userRepository.findUserById(decoded.data);
      if (user?.isBlocked) {
        return res.status(403).json({ success: false, message: "User is blocked by admin!" });
      } else {
        req.userId = decoded.data;
        req.user = user;
        return next();
      }
    } else {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  } catch (err: any) {
    console.error("Authentication error:", err);
    return res.status(500).json({ success: false, message: "Authentication failed!" });
  }
};

const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const decoded:any = jwt.verifyRefreshToken(refreshToken);

    if (!decoded?.data) {
      throw new Error("Invalid refresh token");
    }

    const newAccessToken = jwt.generateToken(decoded.data);
    return newAccessToken || null;
  } catch (error: any) {
    console.error("Refresh token error:", error.message);
    return null;
  }
};

export default userAuth;

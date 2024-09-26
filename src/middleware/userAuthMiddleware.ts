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
      return res.status(401).json({ success: false, message: "Refresh token not available" });
    }
    let token = accessToken;
    let decoded;

    // First, try to verify the access token
    decoded = jwt.verifyToken(token);

    if (!decoded) {
      // If the access token is invalid, attempt to refresh the token
      token = await refreshAccessToken(refreshToken);

      if (!token) {
        return res.status(401).json({ success: false, message: "Unable to refresh access token" });
      }
      let accessToken = token
      // Set the new access token in cookies
      const accessTokenMaxAge = 5 * 60 * 1000; // 5 minutes
      res.cookie("access_token", accessToken, {
        maxAge: accessTokenMaxAge,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
      // Try to verify the new access token
      decoded = jwt.verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ success: false, message: "Invalid token after refresh" });
      }
    }

    // Proceed if the token payload has valid user data
    if (decoded?.data) {
      const user = await userRepository.findUserById(decoded.data);      
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (user.isBlocked) {
        return res.json(user);
      }

      req.userId = decoded.data;
      req.user = user;
      next();
    } else {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(500).json({ success: false, message: "Authentication failed!" });
  }
};

const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const decoded = jwt.verifyRefreshToken(refreshToken);

    if (!decoded?.data) {
      throw new Error("Invalid refresh token");
    }

    const newAccessToken = jwt.generateToken(decoded.data);
    return newAccessToken || null;
  } catch (error) {
    console.error("Refresh token error");
    return null;
  }
};

export default userAuth;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const userRepositories_1 = __importDefault(require("../repositories/userRepositories"));
const generateToken_1 = require("../utils/generateToken");
dotenv_1.default.config();
const jwt = new generateToken_1.CreateJWT();
const userRepository = new userRepositories_1.default();
const userAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { access_token: accessToken, refresh_token: refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "Refresh token not available" });
        }
        let token = accessToken;
        let decoded;
        decoded = jwt.verifyToken(token);
        if (!decoded) {
            token = yield refreshAccessToken(refreshToken);
            if (!token) {
                return res.status(401).json({ success: false, message: "Unable to refresh access token" });
            }
            let accessToken = token;
            const accessTokenMaxAge = 5 * 60 * 1000; // 5 minutes
            res.cookie("access_token", accessToken, {
                maxAge: accessTokenMaxAge,
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
            });
            decoded = jwt.verifyToken(token);
            if (!decoded) {
                return res.status(401).json({ success: false, message: "Invalid token after refresh" });
            }
        }
        if (decoded === null || decoded === void 0 ? void 0 : decoded.data) {
            const user = yield userRepository.findUserById(decoded.data);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            if (user.isBlocked) {
                return res.json(user);
            }
            req.userId = decoded.data;
            req.user = user;
            next();
        }
        else {
            return res.status(401).json({ success: false, message: "Invalid token payload" });
        }
    }
    catch (err) {
        console.error("Authentication error:", err);
        return res.status(500).json({ success: false, message: "Authentication failed!" });
    }
});
const refreshAccessToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const decoded = jwt.verifyRefreshToken(refreshToken);
        if (!(decoded === null || decoded === void 0 ? void 0 : decoded.data)) {
            throw new Error("Invalid refresh token");
        }
        const newAccessToken = jwt.generateToken(decoded.data);
        return newAccessToken || null;
    }
    catch (error) {
        console.error("Refresh token error");
        return null;
    }
});
exports.default = userAuth;

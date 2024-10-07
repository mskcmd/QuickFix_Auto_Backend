"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateJWT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
class CreateJWT {
    generateToken(payload) {
        const secret = process.env.JWT_SECRET;
        if (!payload || !secret) {
            console.error("JWT_SECRET is not defined or payload is missing");
            return null;
        }
        try {
            const token = jsonwebtoken_1.default.sign({ data: payload }, secret, { expiresIn: "5m" });
            return token;
        }
        catch (error) {
            console.error("Error generating token:", error.message);
            return null;
        }
    }
    generateRefreshToken(payload) {
        const refreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!payload || !refreshSecret) {
            console.error("JWT_REFRESH_SECRET is not defined or payload is missing");
            return null;
        }
        try {
            return jsonwebtoken_1.default.sign({ data: payload }, refreshSecret, { expiresIn: "48h" });
        }
        catch (error) {
            console.error("Error generating refresh token:", error.message);
            return null;
        }
    }
    verifyToken(token) {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT secret is not defined");
        }
        try {
            if (!token) {
                return null;
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            return decoded;
        }
        catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new Error("Token expired");
            }
            throw new Error("Token verification failed");
        }
    }
    verifyRefreshToken(token) {
        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error("JWT refresh secret is not defined");
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
            return decoded;
        }
        catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new Error("Refresh token expired");
            }
            throw new Error("Refresh token verification failed");
        }
    }
}
exports.CreateJWT = CreateJWT;

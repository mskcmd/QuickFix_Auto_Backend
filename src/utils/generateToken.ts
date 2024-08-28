import { JwtPayload, Secret } from "jsonwebtoken";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export class CreateJWT {
    generateToken(payload: string | undefined): string | undefined {
        const secret = process.env.JWT_SECRET;
        if (payload && secret) {
            try {
                const token = jwt.sign({ data: payload }, secret as Secret, { expiresIn: '5m' });
                return token;
            } catch (error) {
                console.error("Error generating token:", error);
            }
        } else {
            console.error("JWT_SECRET is not defined or payload is missing");
        }
    }

    generateRefreshToken(payload: string | undefined): string | undefined {
        const refreshSecret = process.env.JWT_REFRESH_SECRET;
        if (payload && refreshSecret) {
            try {
                return jwt.sign({ data: payload }, refreshSecret as Secret, { expiresIn: '48h' });
            } catch (error) {
                console.error("Error generating refresh token:", error);
            }
        } else {
            console.error("JWT_REFRESH_SECRET is not defined or payload is missing");
        }
    }
}

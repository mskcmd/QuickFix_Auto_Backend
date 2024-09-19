// import { JwtPayload, Secret } from "jsonwebtoken";
// import dotenv from "dotenv";
// import jwt from "jsonwebtoken";

// dotenv.config();

// export class CreateJWT {
//   generateToken(payload: string | undefined): string | null {
//     const secret = process.env.JWT_SECRET;

//     if (!payload || !secret) {
//       console.error("JWT_SECRET is not defined or payload is missing");
//       return null;
//     }

//     try {
//       const token = jwt.sign({ data: payload }, secret as Secret, { expiresIn: "5m" });
//       return token;
//     } catch (error: any) {
//       console.error("Error generating token:", error.message);
//       return null;
//     }
//   }

//   generateRefreshToken(payload: string | undefined): string | null {
//     const refreshSecret = process.env.JWT_REFRESH_SECRET;

//     if (!payload || !refreshSecret) {
//       console.error("JWT_REFRESH_SECRET is not defined or payload is missing");
//       return null;
//     }

//     try {
//       return jwt.sign({ data: payload }, refreshSecret as Secret, { expiresIn: "48h" });
//     } catch (error: any) {
//       console.error("Error generating refresh token:", error.message);
//       return null;
//     }
//   }

//   verifyToken(token: string): JwtPayload {
//     if (!process.env.JWT_SECRET) {
//       throw new Error("JWT secret is not defined");
//     }

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
//       return decoded;
//     } catch (error: any) {
//       if (error.name === "TokenExpiredError") {
//         throw new Error("Token expired");
//       }
//       throw new Error("Token verification failed");
//     }
//   }

//   verifyRefreshToken(token: string): JwtPayload | null {
//     if (!process.env.JWT_REFRESH_SECRET) {
//       throw new Error("JWT refresh secret is not defined");
//     }

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as JwtPayload;
//       return decoded;
//     } catch (error: any) {
//       console.error("Refresh token verification failed:", error.message);
//       return null;
//     }
//   }
// }

import { JwtPayload, Secret } from "jsonwebtoken";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export class CreateJWT {
  generateToken(payload: string | undefined): string | null {
    const secret = process.env.JWT_SECRET;

    if (!payload || !secret) {
      console.error("JWT_SECRET is not defined or payload is missing");
      return null;
    }

    try {
      const token = jwt.sign({ data: payload }, secret as Secret, { expiresIn: "5m" });
      return token;
    } catch (error: any) {
      console.error("Error generating token:", error.message);
      return null;
    }
  }

  generateRefreshToken(payload: string | undefined): string | null {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!payload || !refreshSecret) {
      console.error("JWT_REFRESH_SECRET is not defined or payload is missing");
      return null;
    }

    try {
      return jwt.sign({ data: payload }, refreshSecret as Secret, { expiresIn: "48h" });
    } catch (error: any) {
      console.error("Error generating refresh token:", error.message);
      return null;
    }
  }

  verifyToken(token: string): JwtPayload {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT secret is not defined");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Token expired");
      }
      throw new Error("Token verification failed");
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT refresh secret is not defined");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as JwtPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Refresh token expired");
      }
      throw new Error("Refresh token verification failed");
    }
  }
}

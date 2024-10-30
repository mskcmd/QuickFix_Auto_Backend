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
const mechanicModel_1 = __importDefault(require("../models/mechanicModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
class OtpRepository {
    verifyUser(mechanicId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updatedUser = yield userModel_1.default.findByIdAndUpdate(mechanicId, { isVerified: true }, { new: true });
                console.log(updatedUser);
                if (updatedUser) {
                    console.log("User verified and isVerified field updated to true.");
                    return updatedUser;
                }
                else {
                    console.error("User not found.");
                    return null;
                }
            }
            catch (error) {
                console.error("Error verifying user:", error);
                throw new Error("Error verifying user.");
            }
        });
    }
    verifyMechanic(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updatedUser = yield mechanicModel_1.default.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
                if (updatedUser) {
                    console.log("User verified and isVerified field updated to true.");
                    return updatedUser;
                }
                else {
                    console.error("User not found.");
                    return null;
                }
            }
            catch (error) {
                console.error("Error verifying user:", error);
                throw new Error("Error verifying user.");
            }
        });
    }
}
exports.default = OtpRepository;

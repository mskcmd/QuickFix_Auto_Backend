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
const bcrypt_1 = __importDefault(require("bcrypt"));
const otpVerification_1 = require("../utils/otpVerification");
const generateToken_1 = require("../utils/generateToken");
class UserServices {
    constructor(userRepo, otpRepo) {
        this.createjwt = new generateToken_1.CreateJWT;
        this.userRepo = userRepo;
        this.otpRepo = otpRepo;
    }
    checkExistingEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield this.userRepo.findUserByEmail(email);
                return !!userData;
            }
            catch (error) {
                console.error("Error in checkExistingEmail:", error);
                throw new Error("Failed to check existing email. Please try again later.");
            }
        });
    }
    checkgoogleEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield this.userRepo.findUserByEmail(email);
                return userData;
            }
            catch (error) {
                console.error("Error in checkExistingEmail:", error);
                throw new Error("Failed to check existing email. Please try again later.");
            }
        });
    }
    checkExistingUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield this.userRepo.findUserById(userId);
                if (!userData) {
                    throw new Error("User not found");
                }
                return userData;
            }
            catch (error) {
                console.error("Error in checkExistingEmail:", error);
                throw new Error("Failed to check existing email. Please try again later.");
            }
        });
    }
    createUser(name, email, phone, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!name || !email || !phone || !password) {
                    return { status: false, message: "Missing required fields" };
                }
                const emailExists = yield this.checkExistingEmail(email);
                if (emailExists) {
                    return { status: false, message: "Email already exists" };
                }
                const hashpass = yield bcrypt_1.default.hash(password, 10);
                const otp = yield (0, otpVerification_1.sendVerifyMail)(name, email);
                const newUser = yield this.userRepo.createUser(name, email, phone, hashpass);
                return { status: true, newUser, otp, message: 'successful' };
            }
            catch (error) {
                console.error("Error in createUser:", error);
                return { status: false, message: "Failed to create user. Please try again later." };
            }
        });
    }
    veryfyOtp(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.otpRepo.verifyUser(userId);
                return { status: true, result, message: 'successful' };
            }
            catch (error) {
                console.log(error);
                throw new Error(`veryfyOtp failed: ${error.message}`);
            }
        });
    }
    googleToken(result) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                if (result) {
                    const token = this.createjwt.generateToken((_a = result === null || result === void 0 ? void 0 : result.newUser) === null || _a === void 0 ? void 0 : _a._id);
                    const refreshToken = this.createjwt.generateRefreshToken((_b = result === null || result === void 0 ? void 0 : result.newUser) === null || _b === void 0 ? void 0 : _b._id);
                    return {
                        data: {
                            data: {
                                succuss: true,
                                message: 'Authentication Successful !',
                                data: result === null || result === void 0 ? void 0 : result.newUser,
                                userId: (_c = result === null || result === void 0 ? void 0 : result.newUser) === null || _c === void 0 ? void 0 : _c._id,
                                token: token,
                                refreshToken: refreshToken
                            }
                        }
                    };
                }
            }
            catch (error) {
                console.log(error);
                throw new Error(`googleToken failed: ${error.message}`);
            }
        });
    }
    googleTokenlogin(result) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (result) {
                    const token = this.createjwt.generateToken(result === null || result === void 0 ? void 0 : result._id);
                    const refreshToken = this.createjwt.generateRefreshToken(result === null || result === void 0 ? void 0 : result._id);
                    return {
                        data: {
                            data: {
                                succuss: true,
                                message: 'Authentication Successful !',
                                data: result,
                                userId: result === null || result === void 0 ? void 0 : result._id,
                                token: token,
                                refreshToken: refreshToken
                            }
                        }
                    };
                }
            }
            catch (error) {
                console.log(error);
                throw new Error(`googleTokenlogin failed: ${error.message}`);
            }
        });
    }
    googleVerified(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield this.userRepo.googleVerified(userId);
                if (!userData) {
                    throw new Error("User not found");
                }
                return userData;
            }
            catch (error) {
                console.error("Error in checkExistingEmail:", error);
                throw new Error("Failed to check existing email. Please try again later.");
            }
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const result = yield this.userRepo.login(email, password);
                if ((result === null || result === void 0 ? void 0 : result.status) == true) {
                    const token = this.createjwt.generateToken((_a = result.user) === null || _a === void 0 ? void 0 : _a.id);
                    const refreshToken = this.createjwt.generateRefreshToken((_b = result.user) === null || _b === void 0 ? void 0 : _b.id);
                    return {
                        data: {
                            data: {
                                succuss: true,
                                message: 'Authentication Successful !',
                                data: result.user,
                                userId: (_c = result.user) === null || _c === void 0 ? void 0 : _c._id,
                                token: token,
                                refreshToken: refreshToken
                            }
                        }
                    };
                }
                else {
                    return {
                        result
                    };
                }
            }
            catch (error) {
                console.log(error);
                throw new Error(`login failed: ${error.message}`);
            }
        });
    }
    forgetService(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.userRepo.findUserByEmail(email);
                if (!result) {
                    return { success: false, message: 'User not found' };
                }
                if (!result.isVerified) {
                    return { success: false, message: 'User is not verified' };
                }
                return { success: true, result };
            }
            catch (error) {
                console.log(error);
                throw new Error('Error  forgetService');
            }
        });
    }
    resetPassword(userId, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId || !password) {
                    throw new Error('User ID and password are required');
                }
                const hashpass = yield bcrypt_1.default.hash(password, 10);
                const result = yield this.userRepo.resetPassword(hashpass, password);
                if (!result) {
                    throw new Error('Failed to reset password');
                }
                return { succuss: true, result, message: "Successfully changed password." };
            }
            catch (error) {
                console.error('Error in UserService.resetPassword:', error);
                throw error;
            }
        });
    }
    searchMechanics(lat, lon, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mechanics = yield this.userRepo.findMechanicsNearLocation(lat, lon, type);
                return mechanics;
            }
            catch (error) {
                console.log(error);
                throw new Error(`searchMechanics failed: ${error.message}`);
            }
        });
    }
    booking(bookingData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.userRepo.createBooking(bookingData);
            }
            catch (error) {
                console.error("Error in service:", error);
                throw error;
            }
        });
    }
    fetchBookData(id, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.userRepo.fetchBookData(id, type);
            }
            catch (error) {
                console.log(error);
                throw new Error(`fetchBookData failed: ${error.message}`);
            }
        });
    }
    updateProfile(userData, fileUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updatedData = Object.assign(Object.assign({}, userData), { image: fileUrl });
                return yield this.userRepo.updateProfile(updatedData);
            }
            catch (error) {
                console.error("Error in updateProfile service:", error);
                throw new Error("Failed to update profile");
            }
        });
    }
    getProfile(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.userRepo.findUserById(id);
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(`getProfile failed: ${error.message}`);
            }
        });
    }
    fetchPayment(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = this.userRepo.fetchPayment(id);
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(`fetchPayment failed: ${error.message}`);
            }
        });
    }
    feedback(rating, feedback, userId, mechId, paymentID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(rating, feedback, userId, mechId);
                const result = yield this.userRepo.feedback(rating, feedback, userId, mechId, paymentID);
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(`feedback failed: ${error.message}`);
            }
        });
    }
    updateFeedback(values, id, rating, feedback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.userRepo.updateFeedback(id, rating, feedback);
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(`updateFeedback failed: ${error.message}`);
            }
        });
    }
    feedBackCheck(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = this.userRepo.feedBackCheck(id);
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(`feedBackCheck failed: ${error.message}`);
            }
        });
    }
    fetchBlogs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userRepo.fetchBlogs();
                return response;
            }
            catch (error) {
                console.log(error);
                throw new Error(`fetchBlogs failed: ${error.message}`);
            }
        });
    }
    fetchAllBlogs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userRepo.fetchAllBlogs();
                return response;
            }
            catch (error) {
                console.log(error);
                throw new Error(`fetchAllBlogs failed: ${error.message}`);
            }
        });
    }
    fetchAllService() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userRepo.fetchAllService();
                return response;
            }
            catch (error) {
                console.log(error);
                throw new Error(`fetchAllService failed: ${error.message}`);
            }
        });
    }
    fetchAllshop(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userRepo.fetchAllshop(query);
                return response;
            }
            catch (error) {
                console.log(error);
                throw new Error(`fetchAllshop failed: ${error.message}`);
            }
        });
    }
    fetchFreelancer() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userRepo.fetchFreelancer();
                return response;
            }
            catch (error) {
                console.log(error);
                throw new Error(`fetchFreelancer failed: ${error.message}`);
            }
        });
    }
    bookingdata(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userRepo.bookingdata(id);
                return response;
            }
            catch (error) {
                console.log(error);
                throw new Error(`bookingdata failed: ${error.message}`);
            }
        });
    }
    reviewData(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userRepo.reviewData(id);
                return response;
            }
            catch (error) {
                console.log(error);
                throw new Error(`reviewData failed: ${error.message}`);
            }
        });
    }
    //chats
    allUsers(keyword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.userRepo.allUsers(keyword);
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(`allUsers failed: ${error.message}`);
            }
        });
    }
    createChat(senderId, receverId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chat = yield this.userRepo.createChat(senderId, receverId);
                return chat;
            }
            catch (error) {
                console.log(error);
                throw new Error(`createChat failed: ${error.message}`);
            }
        });
    }
    fetchChats(senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.userRepo.fetchChats(senderId);
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(`fetchChats failed: ${error.message}`);
            }
        });
    }
    sendMessage(content, chatId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.userRepo.sendMessage(content, chatId, senderId);
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(`sendMessage failed: ${error.message}`);
            }
        });
    }
    allMessagess(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.userRepo.getAllMessages(chatId);
                return result;
            }
            catch (error) {
                throw new Error(`allMessagess failed: ${error.message}`);
            }
        });
    }
}
exports.default = UserServices;

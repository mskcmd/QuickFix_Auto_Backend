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
const otpVerification_1 = require("../utils/otpVerification");
const bcrypt_1 = __importDefault(require("bcrypt"));
const generateToken_1 = require("../utils/generateToken");
class mechanicServices {
    constructor(mechanicRepo, otpRepo) {
        this.createjwt = new generateToken_1.CreateJWT;
        this.mechanicRepo = mechanicRepo;
        this.otpRepo = otpRepo;
    }
    checkExistingEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield this.mechanicRepo.findUserByEmail(email);
                return !!userData;
            }
            catch (error) {
                console.error("Error in checkExistingEmail:", error);
                throw new Error("Failed to check existing email. Please try again later.");
            }
        });
    }
    createMechanic(name, email, phone, password) {
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
                const newMechanic = yield this.mechanicRepo.createMechanic(name, email, phone, hashpass);
                return { status: true, newMechanic, otp, message: "successful" };
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    veryfyOtp(mechanicId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.otpRepo.verifyMechanic(mechanicId);
            return { status: true, result, message: "successful" };
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const result = yield this.mechanicRepo.login(email, password);
                if ((result === null || result === void 0 ? void 0 : result.status) == true) {
                    const mech_token = this.createjwt.generateToken((_a = result.mechanic) === null || _a === void 0 ? void 0 : _a.id);
                    const mech_refreshToken = this.createjwt.generateRefreshToken((_b = result.mechanic) === null || _b === void 0 ? void 0 : _b.id);
                    return {
                        data: {
                            data: {
                                succuss: true,
                                message: 'Authentication Successful !',
                                data: result.mechanic,
                                mechnicId: (_c = result.mechanic) === null || _c === void 0 ? void 0 : _c._id,
                                mech_token: mech_token,
                                mech_refreshToken: mech_refreshToken
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
            }
        });
    }
    forgetService(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.findUserByEmail(email);
                console.log(result);
                if (!result) {
                    return { success: false, message: 'User not found' };
                }
                if (!result.isVerified) {
                    return { success: false, message: 'User is not verified' };
                }
                return { success: true, result };
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    checkExistingUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield this.mechanicRepo.findUserById(userId);
                if (!userData) {
                    throw new Error("User not found");
                }
                return userData;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
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
                const result = yield this.mechanicRepo.resetPassword(hashpass, password);
                if (!result) {
                    throw new Error('Failed to reset password');
                }
                return { succuss: true, result };
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    registerMechData(uploadUrls, body) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.registerData(uploadUrls, body);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    getMechData(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.getmechData(id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    getDetailData(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.getDetailData(id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    fetchUsers(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.fetchUsers(id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    statusUpdate(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.statusUpdate(id, status);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    addService(serviceData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.addService(serviceData);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    fetchService(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.fetchService(id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    searchUsers(keyword, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.searchUsers(keyword, id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    searchServices(keyword, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.searchServices(keyword, id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    createBill(userId, name, vehicleNumber, services, subtotal, gst, total, mechId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.createBill(userId, name, vehicleNumber, services, subtotal, gst, total, mechId);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    createBlog(blogData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.createBlog(blogData);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    fetchBlog(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.fetchBlog(id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    deleteBlog(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.deleteBlog(id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    fetchEditBlog(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.fetchEditBlog(id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    editBlog(blogData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.editBlog(blogData);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    paymentFetch(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.paymentFetch(id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    createChat(senderId, receverId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chat = yield this.mechanicRepo.createChat(senderId, receverId);
                return chat;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    sendMessage(content, chatId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.sendMessage(content, chatId, senderId);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    allMessagess(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.getAllMessages(chatId);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    fetchChats(senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.fetchChats(senderId);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    fetchRevenue(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.fetchRevenue(id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    fetchuserGrowths(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.mechanicRepo.fetchUserGrowths(id);
                return result;
            }
            catch (error) {
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
}
exports.default = mechanicServices;

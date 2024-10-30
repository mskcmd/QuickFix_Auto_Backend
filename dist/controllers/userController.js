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
const s3UploadMiddleware_1 = require("../middleware/s3UploadMiddleware");
const paymentModel_1 = __importDefault(require("../models/paymentModel"));
class UserController {
    constructor(userService) {
        this.milliseconds = (h, m, s) => (h * 3600 + m * 60 + s) * 1000;
        this.userService = userService;
    }
    signup(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const { name, email, phone, password } = req.body;
                const result = yield this.userService.createUser(name, email, phone, password);
                req.session.otp = result.otp;
                req.session.userId = (_a = result.newUser) === null || _a === void 0 ? void 0 : _a._id;
                req.session.email = (_b = result.newUser) === null || _b === void 0 ? void 0 : _b.email;
                req.session.name = (_c = result.newUser) === null || _c === void 0 ? void 0 : _c.name;
                // Store the current time and OTP expiration time (1 minute later)
                const currentTime = Date.now();
                const otpExpirationTime = currentTime + 30 * 1000; // 1 minute in milliseconds
                req.session.otpTime = otpExpirationTime;
                if (result && result.status) {
                    res.json({
                        isUser: true,
                        success: true,
                        result,
                        message: result.message,
                    });
                }
                else {
                    res.json({ notSuccess: false, message: result.message });
                }
            }
            catch (error) {
                console.error("Error in UserController.signup:", error);
                next(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });
    }
    veryfyOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { otp } = req.body;
                const otpString = String(otp);
                const currentTime = Date.now();
                const otpExpirationTime = req.session.otpTime;
                // Check if OTP is expired
                if (!otpExpirationTime || currentTime > otpExpirationTime) {
                    res.json({ message: "OTP has expired", Isexpired: true });
                    return;
                }
                const userId = req.session.userId;
                if (otpString === req.session.otp) {
                    const result = yield this.userService.veryfyOtp(userId);
                    if (result && result.status) {
                        res.json({
                            isUser: true,
                            success: true,
                            result,
                            message: result.message,
                        });
                    }
                    else {
                        res.json({ notSuccess: false, message: result.message });
                    }
                }
                else {
                    res.json({ message: "OTP is wrong" });
                }
            }
            catch (error) {
                console.error("Error in UserController.verifyOtp:", error);
                res.status(500).json({ error: "Internal server error" });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const { email, password } = req.body;
                const result = yield this.userService.login(email, password);
                if (((_a = result === null || result === void 0 ? void 0 : result.result) === null || _a === void 0 ? void 0 : _a.isVerified) === false) {
                    res.json({ isverified: false, message: "User not verified", result });
                    return;
                }
                if (((_c = (_b = result === null || result === void 0 ? void 0 : result.data) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.succuss) === true) {
                    const access_token = result.data.data.token;
                    const refresh_token = result.data.data.refreshToken;
                    const accessTokenMaxAge = 5 * 60 * 1000; // 5 minutes
                    const refreshTokenMaxAge = 48 * 60 * 60 * 1000; // 48 hours
                    res
                        .status(200)
                        .cookie("access_token", access_token, {
                        maxAge: accessTokenMaxAge,
                        httpOnly: true,
                        sameSite: "none",
                        secure: true,
                    })
                        .cookie("refresh_token", refresh_token, {
                        maxAge: refreshTokenMaxAge,
                        httpOnly: true,
                        sameSite: "none",
                        secure: true,
                    })
                        .json({ success: true, data: result.data.data });
                }
                else {
                    res.json({
                        IsData: false,
                        message: "Invalid email or password",
                        result,
                    });
                }
            }
            catch (error) {
                console.error(error);
                res
                    .status(500)
                    .json({ success: false, message: "Internal server error" });
            }
        });
    }
    googlelogin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const { name, email, googlePhotoUrl } = req.body;
            const accessTokenMaxAge = 60 * 60 * 1000;
            const refreshTokenMaxAge = 48 * 60 * 60 * 1000;
            try {
                const user = yield this.userService.checkgoogleEmail(email);
                if (user) {
                    if (user.isBlocked) {
                        res.json({ status: false, message: "User not found." });
                    }
                    else {
                        const result = yield this.userService.googleTokenlogin(user);
                        const access_token = (_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.token;
                        const refresh_token = (_d = (_c = result === null || result === void 0 ? void 0 : result.data) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.refreshToken;
                        res
                            .status(200)
                            .cookie("access_token", access_token, {
                            maxAge: accessTokenMaxAge,
                            httpOnly: true,
                            sameSite: "none",
                            secure: true,
                        })
                            .cookie("refresh_token", refresh_token, {
                            maxAge: refreshTokenMaxAge,
                            httpOnly: true,
                            sameSite: "none",
                            secure: true,
                        })
                            .json({ success: true, data: result.data });
                    }
                }
                else {
                    var randomIndianPhoneNumber = '9' + Math.floor(100000000 + Math.random() * 900000000);
                    var password = Math.random().toString(36).slice(-4) + Math.random().toString(36).toUpperCase().slice(-4);
                    const result1 = yield this.userService.createUser(name, email, randomIndianPhoneNumber, password);
                    const id = (_e = result1 === null || result1 === void 0 ? void 0 : result1.newUser) === null || _e === void 0 ? void 0 : _e._id;
                    const isVerified = yield this.userService.googleVerified(id);
                    if (isVerified) {
                        const result = yield this.userService.googleToken(result1);
                        const access_token = (_g = (_f = result === null || result === void 0 ? void 0 : result.data) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.token;
                        const refresh_token = (_j = (_h = result === null || result === void 0 ? void 0 : result.data) === null || _h === void 0 ? void 0 : _h.data) === null || _j === void 0 ? void 0 : _j.refreshToken;
                        res
                            .status(200)
                            .cookie("access_token", access_token, {
                            maxAge: accessTokenMaxAge,
                            httpOnly: true,
                            sameSite: "none",
                            secure: true,
                        })
                            .cookie("refresh_token", refresh_token, {
                            maxAge: refreshTokenMaxAge,
                            httpOnly: true,
                            sameSite: "none",
                            secure: true,
                        })
                            .json({ success: true, data: result === null || result === void 0 ? void 0 : result.data });
                    }
                }
            }
            catch (error) {
            }
        });
    }
    resendOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const email = req.session.email;
                const name = req.session.name;
                if (!email || !name) {
                    res.status(400).json({ error: "Email or name is missing" });
                    return;
                }
                const otp = yield (0, otpVerification_1.sendVerifyMail)(name, email);
                const currentTime = Date.now();
                const otpExpirationTime = currentTime + 30 * 1000;
                req.session.otpTime = otpExpirationTime;
                req.session.otp = otp;
                res.status(200).json({ message: "OTP sent successfully", isOtp: true });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: "Failed to send OTP" });
            }
        });
    }
    forgetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const email = req.query.email;
                if (!email) {
                    res.status(400).json({ error: "Email is required" });
                    return;
                }
                const result = yield this.userService.forgetService(email);
                const name = (_a = result.result) === null || _a === void 0 ? void 0 : _a.name;
                if (result.success && name) {
                    const otp = yield (0, otpVerification_1.sendVerifyMail)(name, email);
                    const currentTime = Date.now();
                    const otpExpirationTime = currentTime + 30 * 1000;
                    req.session.otpTime = otpExpirationTime;
                    req.session.otp = otp;
                    res.json({ success: true, result });
                }
                else if (!name) {
                    res.status(400).json({ error: "User name is missing" });
                }
                else {
                    res.status(500).json({ error: "Failed to forget password" });
                }
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });
    }
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newPassword = req.body.password;
                const userId = req.body.userId;
                const result = yield this.userService.resetPassword(newPassword, userId);
                res.json({ result });
            }
            catch (error) {
                console.error("Error resetting password:", error);
                res.status(500).json({ error: "Internal server error" });
            }
        });
    }
    veryfyOtpreset(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { otp, userId } = req.query;
                if (typeof otp !== "string" || typeof userId !== "string") {
                    res.status(400).json({ error: "Invalid request parameters" });
                    return;
                }
                const otpString = String(otp);
                const currentTime = Date.now();
                const otpExpirationTime = req.session.otpTime;
                // Check if OTP is expired
                if (!otpExpirationTime || currentTime > otpExpirationTime) {
                    res.json({ message: "OTP has expired" });
                    return;
                }
                if (otpString === req.session.otp) {
                    const result = yield this.userService.checkExistingUser(userId);
                    res.json({ success: true, result });
                }
                else {
                    res.json({ message: "OTP is wrong" });
                }
            }
            catch (error) {
                console.error("Error in UserController.verifyOtp:", error);
                res.status(500).json({ error: "Internal server error" });
            }
        });
    }
    userLogout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                res
                    .cookie("access_token", "", {
                    maxAge: 0,
                })
                    .cookie("refresh_token", "", {
                    maxAge: 0,
                });
                res
                    .status(200)
                    .json({ success: true, message: "user logout - clearing cookie" });
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    searchMechanic(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { latitude, longitude, type } = req.query;
                if (!latitude || !longitude || !type) {
                    res.status(400).send("Missing parameters");
                    return;
                }
                // Convert query parameters to numbers
                const userLat = parseFloat(latitude);
                const userLon = parseFloat(longitude);
                // Use the service to get mechanics
                const result = yield this.userService.searchMechanics(userLat, userLon, type);
                res.json(result);
            }
            catch (error) {
                console.log(error);
                res.status(500).send("Server error");
            }
        });
    }
    mechBooking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bookingData = {
                    user: req.body.userId,
                    mechanic: req.body.mechId,
                    coordinates: [req.body.latitude, req.body.longitude],
                    bookingTime: new Date(req.body.dateTime),
                    serviceDetails: req.body.services.join(', '), // Join services array into a string
                    name: req.body.firstName,
                    mobileNumber: req.body.phoneNumber,
                    complainDescription: req.body.problem,
                    locationName: req.body.location, // Optional location field
                    status: 'Pending', // Default status
                };
                if (!bookingData.user ||
                    !bookingData.mechanic ||
                    !bookingData.coordinates ||
                    !bookingData.bookingTime ||
                    !bookingData.serviceDetails ||
                    !bookingData.name ||
                    !bookingData.mobileNumber) {
                    res
                        .status(400)
                        .json({ message: "All required fields must be provided" });
                    return;
                }
                const result = yield this.userService.booking(bookingData);
                res
                    .status(201)
                    .json({ success: true, message: "Booking created successfully", booking: result });
            }
            catch (error) {
                console.error("Error creating booking:", error);
                res
                    .status(500)
                    .json({ message: "An error occurred while creating the booking" });
            }
        });
    }
    fetchBookData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, type } = req.query;
            try {
                if (!id || !type) {
                    res.status(400).json({ error: "ID and type are required" });
                    return;
                }
                const response = yield this.userService.fetchBookData(id, type);
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error fetching book data:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
    }
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.userId) {
                    const result = yield this.userService.getProfile(req.userId);
                    if (result) {
                        res.status(200).json(result);
                    }
                    else {
                        res.status(404).json({ error: "Profile not found" });
                    }
                }
                else {
                    res.status(400).json({ error: "User ID is required" });
                }
            }
            catch (error) {
                console.error("Error fetching profile data:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
    }
    updateProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let fileUrl = null;
                if (req.file) {
                    fileUrl = yield (0, s3UploadMiddleware_1.uploadFile)(req.file);
                }
                const response = yield this.userService.updateProfile(req.body, fileUrl);
                res.status(200).json({ message: "Profile updated successfully", data: response });
            }
            catch (error) {
                console.error("Error in updateProfile controller:", error);
                res.status(500).json({ message: "Profile update failed" });
            }
        });
    }
    fetchPayment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                const result = yield this.userService.fetchPayment(id);
                res.json(result);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    updatePayment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { paymentId, status } = req.body;
                const result = yield paymentModel_1.default.findOneAndUpdate({ _id: paymentId, status: "pending" }, { status: status }, { new: true });
                if (!result) {
                    return res.status(404).json({ message: "Payment not found or already completed" });
                }
                res.json(result);
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: "An error occurred" });
            }
        });
    }
    feedBack(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { values, id, mechId, paymentId } = req.body;
                const { rating, feedback } = values;
                if (!rating || !feedback || !id || !mechId) {
                    throw new Error("One or more required fields are empty.");
                }
                const result = yield this.userService.feedback(rating, feedback, id, mechId, paymentId);
                res.json(result);
            }
            catch (error) {
                console.error("Error submitting feedback:", error);
                res.status(500).json({ message: "Error submitting feedback" });
            }
        });
    }
    updateFeedback(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { values, id } = req.body;
                const { rating, feedback } = values;
                if (!values || !id) {
                    throw new Error("One or more required fields are empty.");
                }
                const result = yield this.userService.updateFeedback(values, id, rating, feedback);
                res.json(result);
            }
            catch (error) {
                console.error("Error submitting feedback:", error);
                res.status(500).json({ message: "Error submitting feedback" });
            }
        });
    }
    feedBackCheck(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = req.query.id;
            try {
                if (!id) {
                    res.status(400).json({ error: "ID and type are required" });
                    return;
                }
                const response = yield this.userService.feedBackCheck(id);
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error fetching book data:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
    }
    fetchBlogs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userService.fetchBlogs();
                res.status(200).json(response);
            }
            catch (error) {
                console.error('Error fetching blogs:', error);
                res.status(500).json({ message: 'Failed to fetch blogs' });
            }
        });
    }
    fetchAllBlogs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userService.fetchAllBlogs();
                res.status(200).json(response);
            }
            catch (error) {
                console.error('Error fetching blogs:', error);
                res.status(500).json({ message: 'Failed to fetch blogs' });
            }
        });
    }
    fetchAllService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userService.fetchAllService();
                res.status(200).json(response);
            }
            catch (error) {
                console.error('Error fetching blogs:', error);
                res.status(500).json({ message: 'Failed to fetch blogs' });
            }
        });
    }
    fetchAllshop(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { query } = req.query;
                const response = yield this.userService.fetchAllshop(query);
                res.status(200).json(response);
            }
            catch (error) {
                console.error('Error fetching blogs:', error);
                res.status(500).json({ message: 'Failed to fetch blogs' });
            }
        });
    }
    fetchFreelancer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.userService.fetchFreelancer();
                res.status(200).json(response);
            }
            catch (error) {
                console.error('Error fetching blogs:', error);
                res.status(500).json({ message: 'Failed to fetch blogs' });
            }
        });
    }
    bookingdata(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                const response = yield this.userService.bookingdata(id);
                res.status(200).json(response);
            }
            catch (error) {
                console.error('Error fetching blogs:', error);
                res.status(500).json({ message: 'Failed to fetch blogs' });
            }
        });
    }
    reviewData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                const response = yield this.userService.reviewData(id);
                res.status(200).json(response);
            }
            catch (error) {
                console.error('Error fetching blogs:', error);
                res.status(500).json({ message: 'Failed to fetch blogs' });
            }
        });
    }
    allUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.userService.allUsers(req.query.search);
                res.json(result);
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: "Server Error" });
            }
        });
    }
    createChat(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { senderId, receiverId } = req.body;
                if (!senderId || !receiverId) {
                    res.sendStatus(400);
                    return;
                }
                const response = yield this.userService.createChat(senderId, receiverId);
                if (response) {
                    res.status(200).send(response);
                }
                else {
                    res.status(404).send("Chat not found");
                }
            }
            catch (error) {
                console.error("Server error:", error);
                res.status(500).send("Server error");
            }
        });
    }
    fetchChats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { senderId } = req.query;
                const result = yield this.userService.fetchChats(senderId);
                res.json(result);
            }
            catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to fetch chats" });
            }
        });
    }
    sendMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { content, chatId, senderId } = req.body;
                if (!content || !chatId) {
                    return res.sendStatus(400);
                }
                const result = yield this.userService.sendMessage(content, chatId, senderId);
                res.json(result);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    allMessagess(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chatId = req.params.chatId;
                const result = yield this.userService.allMessagess(chatId);
                res.json(result);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
exports.default = UserController;

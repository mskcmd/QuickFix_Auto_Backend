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
const userModel_1 = __importDefault(require("../models/userModel"));
class mechanicController {
    constructor(mechanicServices) {
        this.milliseconds = (h, m, s) => ((h * 3600 + m * 60 + s) * 1000);
        this.mechanicServices = mechanicServices;
    }
    mechanicSignup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const { name, email, phone, password } = req.body;
                const result = yield this.mechanicServices.createMechanic(name, email, phone, password);
                req.session.mechotp = result === null || result === void 0 ? void 0 : result.otp;
                req.session.mechanicId = (_a = result === null || result === void 0 ? void 0 : result.newMechanic) === null || _a === void 0 ? void 0 : _a._id;
                req.session.mechanicemail = (_b = result === null || result === void 0 ? void 0 : result.newMechanic) === null || _b === void 0 ? void 0 : _b.email;
                req.session.mechanicname = (_c = result === null || result === void 0 ? void 0 : result.newMechanic) === null || _c === void 0 ? void 0 : _c.name;
                const currentTime = Date.now();
                const otpExpirationTime = currentTime + 30 * 1000; // 1 minute in milliseconds
                req.session.mechanicotpTime = otpExpirationTime;
                if (result && result.status)
                    res.json({ succuss: true, result, message: result.message });
                else
                    res.json({ notsuccuss: false, message: result === null || result === void 0 ? void 0 : result.message });
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    veryfyOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { otp } = req.body;
            const otpString = String(otp);
            console.log(typeof (req.session.mechotp));
            console.log(req.session.mechotp);
            const mechanicId = req.session.mechanicId;
            if (otpString === req.session.mechotp) {
                const result = yield this.mechanicServices.veryfyOtp(mechanicId);
                console.log(result);
                if (result && result.status)
                    res.json({ isMechanic: true, succuss: true, result, message: result.message });
                else
                    res.json({ notsuccuss: false, message: result.message });
            }
            else {
                res.json({ message: "otp is rong" });
            }
        });
    }
    resendOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const email = req.session.mechanicemail;
                const name = req.session.mechanicname;
                if (!email || !name) {
                    res.status(400).json({ error: 'Email or name is missing' });
                    return;
                }
                const otp = yield (0, otpVerification_1.sendVerifyMail)(name, email);
                const currentTime = Date.now();
                const otpExpirationTime = currentTime + 30 * 1000;
                req.session.mechanicotpTime = otpExpirationTime;
                req.session.mechotp = otp;
                res.status(200).json({ message: 'OTP sent successfully' });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Failed to send OTP' });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const { email, password } = req.body;
                const result = yield this.mechanicServices.login(email, password);
                if (((_a = result === null || result === void 0 ? void 0 : result.result) === null || _a === void 0 ? void 0 : _a.isVerified) === false) {
                    res.json({ isverified: false, message: 'Mechnic not verified', result });
                    return;
                }
                if (((_c = (_b = result === null || result === void 0 ? void 0 : result.data) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.succuss) === true) {
                    const time = this.milliseconds(23, 30, 0);
                    const mech_access_token = result.data.data.mech_token;
                    const mech_refresh_token = result.data.data.mech_refreshToken;
                    const accessTokenMaxAge = 5 * 60 * 1000;
                    const refreshTokenMaxAge = 48 * 60 * 60 * 1000;
                    res.status(200).cookie('mech_access_token', mech_access_token, {
                        maxAge: accessTokenMaxAge,
                        sameSite: 'none',
                        secure: true
                    }).cookie("mech_refresh_token", mech_refresh_token, {
                        maxAge: refreshTokenMaxAge,
                        sameSite: "none",
                        secure: true
                    }).json({ success: true, data: result.data.data });
                }
                else {
                    res.json({ IsData: false, message: 'Invalid email or password', result });
                }
            }
            catch (error) {
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    forgetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const email = req.query.email;
                if (!email) {
                    res.status(400).json({ error: 'Email is required' });
                    return;
                }
                const result = yield this.mechanicServices.forgetService(email);
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
                    res.status(400).json({ error: 'User name is missing' });
                }
                else {
                    res.status(500).json({ error: 'Failed to forget password' });
                }
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    veryfyOtpreset(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { otp, userId } = req.query;
                if (typeof otp !== 'string' || typeof userId !== 'string') {
                    res.status(400).json({ error: 'Invalid request parameters' });
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
                    const result = yield this.mechanicServices.checkExistingUser(userId);
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
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newPassword = req.body.password;
                const userId = req.body.userId;
                const result = yield this.mechanicServices.resetPassword(newPassword, userId);
                res.json({ result });
            }
            catch (error) {
                console.error('Error resetting password:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    mech_register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const files = req.files;
                const uploadPromises = Object.keys(files).map((key) => __awaiter(this, void 0, void 0, function* () {
                    const file = files[key][0];
                    const fileUrl = yield (0, s3UploadMiddleware_1.uploadFile)(file);
                    return {
                        [key]: fileUrl
                    };
                }));
                const uploadResults = yield Promise.all(uploadPromises);
                const uploadUrls = uploadResults.reduce((acc, obj) => (Object.assign(Object.assign({}, acc), obj)), {});
                const result = yield this.mechanicServices.registerMechData(uploadUrls, req.body);
                res.status(201).json({
                    result,
                    status: true,
                    message: 'Successfully created'
                });
                return;
            }
            catch (error) {
                console.error('Error in mechanic register:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    getMechData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.Id;
                if (!id) {
                    res.status(400).json({ error: 'Missing mechanic ID' });
                    return;
                }
                const mechanicData = yield this.mechanicServices.getMechData(id);
                if (!mechanicData) {
                    res.status(404).json({ error: 'Mechanic not found' });
                    return;
                }
                res.json(mechanicData);
            }
            catch (error) {
                console.error("Error fetching mechanic data:", error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    getDetailData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.Id;
                if (!id) {
                    res.status(400).json({ error: 'Missing mechanic ID' });
                    return;
                }
                const mechanicData = yield this.mechanicServices.getDetailData(id);
                if (!mechanicData) {
                    res.status(404).json({ error: 'Mechanic not found' });
                    return;
                }
                res.json(mechanicData);
            }
            catch (error) {
                console.error("Error fetching mechanic data:", error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    mechLogout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                res.cookie('admin_access_token', '', {
                    maxAge: 0
                }).cookie('admin_refresh_token', '', {
                    maxAge: 0
                });
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    fetchUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = req.query.Id;
            try {
                if (!id) {
                    res.status(400).json({ error: 'Missing mechanic ID' });
                    return;
                }
                const mechanicData = yield this.mechanicServices.fetchUsers(id);
                if (!mechanicData) {
                    res.status(404).json({ error: 'Mechanic not found' });
                    return;
                }
                res.json(mechanicData);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    statusUpdate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const id = (_a = req.body.params) === null || _a === void 0 ? void 0 : _a.Id;
            const status = (_b = req.body.params) === null || _b === void 0 ? void 0 : _b.Status;
            try {
                if (!id || !status) {
                    res.status(400).json({ error: "Missing ID or Status" });
                    return;
                }
                const result = yield this.mechanicServices.statusUpdate(id, status);
                res.status(200).json({ message: "Status updated successfully" });
            }
            catch (error) {
                console.error("Error updating status:", error);
                res.status(500).json({ error: "Internal server error" });
            }
        });
    }
    addService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, details, price, id } = req.body;
                let fileUrl;
                if (req.file) {
                    fileUrl = yield (0, s3UploadMiddleware_1.uploadFile)(req.file);
                }
                const serviceData = {
                    id,
                    name,
                    details,
                    price,
                    fileUrl,
                };
                const result = yield this.mechanicServices.addService(serviceData);
                res.status(201).json(result);
            }
            catch (error) {
                console.error("Error adding service:", error);
                res.status(500).json({ message: 'Failed to add service', error });
            }
        });
    }
    fetchService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                const result = yield this.mechanicServices.fetchService(id);
                res.status(201).json(result);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    searchUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                const keyword = req.query.search;
                const result = yield this.mechanicServices.searchUsers(keyword, id);
                res.json(result);
            }
            catch (error) {
                console.error("Error in searchUsers:", error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        });
    }
    searchServices(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                const keyword = req.query.search;
                const result = yield this.mechanicServices.searchServices(keyword, id);
                res.json(result);
            }
            catch (error) {
                console.error("Error in searchUsers:", error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        });
    }
    createBill(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, name, vehicleNumber, services, subtotal, gst, total, mechId } = req.body;
                const result = yield this.mechanicServices.createBill(userId, name, vehicleNumber, services, subtotal, gst, total, mechId);
            }
            catch (error) {
                console.log("Error:", error);
            }
        });
    }
    createBlog(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, name, positionName, heading, description } = req.body;
                let fileUrl;
                if (req.file) {
                    fileUrl = yield (0, s3UploadMiddleware_1.uploadFile)(req.file);
                }
                const blogData = {
                    id, name, positionName, heading, description, fileUrl,
                };
                const result = yield this.mechanicServices.createBlog(blogData);
                res.status(201).json(result);
            }
            catch (error) {
                console.error("Error adding service:", error);
                res.status(500).json({ message: 'Failed to add service', error });
            }
        });
    }
    fetchBlog(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                const result = yield this.mechanicServices.fetchBlog(id);
                res.status(201).json(result);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    deleteBlog(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                const result = yield this.mechanicServices.deleteBlog(id);
                res.status(201).json(result);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    fetchEditBlog(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                const result = yield this.mechanicServices.fetchEditBlog(id);
                res.status(201).json(result);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    editBlog(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, name, positionName, heading, description, image } = req.body;
                let fileUrl;
                if (req.file) {
                    fileUrl = yield (0, s3UploadMiddleware_1.uploadFile)(req.file);
                }
                else {
                    fileUrl = image;
                }
                const blogData = {
                    id, name, positionName, heading, description, fileUrl,
                };
                const result = yield this.mechanicServices.editBlog(blogData);
                res.status(201).json(result);
            }
            catch (error) {
                console.error("Error adding service:", error);
                res.status(500).json({ message: 'Failed to add service', error });
            }
        });
    }
    paymentFetch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                const result = yield this.mechanicServices.paymentFetch(id);
                res.status(201).json(result);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    allUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(req.query.search);
                const keyword = req.query.search
                    ? {
                        $or: [
                            { name: { $regex: req.query.search, $options: "i" } },
                            { email: { $regex: req.query.search, $options: "i" } },
                        ],
                    }
                    : {};
                let users;
                users = yield userModel_1.default.find(keyword);
                res.json(users);
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
                const response = yield this.mechanicServices.createChat(senderId, receiverId);
                if (response) {
                    res.status(200).send(response);
                }
                else {
                    res.status(404).send("Chat not found");
                }
            }
            catch (error) {
                console.log(error);
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
                const result = yield this.mechanicServices.sendMessage(content, chatId, senderId);
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
                const result = yield this.mechanicServices.allMessagess(chatId);
                res.json(result);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    fetchChats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { senderId } = req.query;
                const result = yield this.mechanicServices.fetchChats(senderId);
                res.json(result);
            }
            catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to fetch chats" });
            }
        });
    }
    fetchRevenue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                if (!id) {
                    res.status(400).json({ message: "ID parameter is required" });
                    return;
                }
                const result = yield this.mechanicServices.fetchRevenue(id);
                res.status(200).json(result);
            }
            catch (error) {
                console.error("Error fetching revenue:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    fetchuserGrowths(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.id;
                if (!id) {
                    res.status(400).json({ message: "ID parameter is required" });
                    return;
                }
                const result = yield this.mechanicServices.fetchuserGrowths(id);
                res.status(200).json(result);
            }
            catch (error) {
                console.error("Error fetching revenue:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}
exports.default = mechanicController;

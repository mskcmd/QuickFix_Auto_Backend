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
Object.defineProperty(exports, "__esModule", { value: true });
class AdminController {
    constructor(adminServices) {
        this.milliseconds = (h, m, s) => ((h * 3600 + m * 60 + s) * 1000);
        this.adminServices = adminServices;
    }
    Login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { email, password } = req.body;
                const result = yield this.adminServices.Login(email, password);
                if (((_a = result === null || result === void 0 ? void 0 : result.data.data) === null || _a === void 0 ? void 0 : _a.succuss) === true) {
                    const time = this.milliseconds(23, 30, 0);
                    const admin_access_token = result.data.data.admin_token;
                    const admin_refresh_token = result.data.data.admin_refreshToken;
                    const accessTokenMaxAge = 5 * 60 * 1000;
                    const refreshTokenMaxAge = 48 * 60 * 60 * 1000;
                    res.status(200).cookie('admin_access_token', admin_access_token, {
                        maxAge: accessTokenMaxAge,
                        sameSite: 'none',
                        secure: true
                    }).cookie("admin_refresh_token", admin_refresh_token, {
                        maxAge: refreshTokenMaxAge,
                        sameSite: "none",
                        secure: true
                    }).json(result.data);
                }
                else {
                    res.status(404).json({ success: false, message: 'Authentication error' });
                }
            }
            catch (error) {
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    getUserhData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adminServices.getUserData();
                res.json(result);
            }
            catch (error) {
                console.error("Error fetching user data:", error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    getMechData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adminServices.getMechData();
                res.json(result);
            }
            catch (error) {
                console.error("Error fetching user data:", error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    adminLogout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                res.cookie('mech_access_token', '', {
                    maxAge: 0
                }).cookie('mech_refresh_token', '', {
                    maxAge: 0
                });
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    blockUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.userId;
                if (!id) {
                    res.status(400).json({ error: "User ID is required" });
                    return;
                }
                const result = yield this.adminServices.blockUser(id);
                if (result) {
                    res.status(200).json({
                        message: result.isBlocked ? "User blocked successfully" : "User unblocked successfully",
                        isBlocked: result.isBlocked
                    });
                }
                else {
                    res.status(404).json({ error: "User not found" });
                }
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: "Something went wrong" });
            }
        });
    }
    monthlyData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adminServices.monthlyData();
                res.json(result);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    blockMech(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.query.userId;
                if (!id) {
                    res.status(400).json({ error: "User ID is required" });
                    return;
                }
                const result = yield this.adminServices.blockMech(id);
                if (result) {
                    res.status(200).json({
                        message: result.isBlocked ? "User blocked successfully" : "User unblocked successfully",
                        isBlocked: result.isBlocked
                    });
                }
                else {
                    res.status(404).json({ error: "User not found" });
                }
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: "Something went wrong" });
            }
        });
    }
}
exports.default = AdminController;

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
const generateToken_1 = require("../utils/generateToken");
class AdminServices {
    constructor(adimnRepo) {
        this.createjwt = new generateToken_1.CreateJWT;
        this.adimnRepo = adimnRepo;
    }
    Login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const result = yield this.adimnRepo.login(email, password);
                console.log((result === null || result === void 0 ? void 0 : result.status) == true);
                if ((result === null || result === void 0 ? void 0 : result.status) == true) {
                    const admin_token = this.createjwt.generateToken((_a = result.admin) === null || _a === void 0 ? void 0 : _a.id);
                    const admin_refreshToken = this.createjwt.generateRefreshToken((_b = result.admin) === null || _b === void 0 ? void 0 : _b.id);
                    return {
                        data: {
                            data: {
                                succuss: true,
                                message: 'Authentication Successful !',
                                data: result.admin,
                                adminId: (_c = result.admin) === null || _c === void 0 ? void 0 : _c._id,
                                admin_token: admin_token,
                                admin_refreshToken: admin_refreshToken
                            }
                        }
                    };
                }
                else {
                    return {
                        data: {
                            succuss: false,
                        }
                    };
                }
            }
            catch (error) {
                throw new Error(`Login failed: ${error.message}`);
            }
        });
    }
    getUserData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adimnRepo.getUserData();
                return result;
            }
            catch (error) {
                throw new Error(`Failed to get user data: ${error.message}`);
            }
        });
    }
    getMechData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adimnRepo.getMechData();
                return result;
            }
            catch (error) {
                throw new Error(`Failed to get mechanic data: ${error.message}`);
            }
        });
    }
    blockUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adimnRepo.blockUser(id);
                return result;
            }
            catch (error) {
                throw new Error(`Failed to block user: ${error.message}`);
            }
        });
    }
    monthlyData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adimnRepo.getMonthlyData();
                return result;
            }
            catch (error) {
                throw new Error(`Failed to retrieve monthly data: ${error.message}`);
            }
        });
    }
    blockMech(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adimnRepo.blockMech(id);
                return result;
            }
            catch (error) {
                throw new Error(`Failed to block mechanic: ${error.message}`);
            }
        });
    }
}
exports.default = AdminServices;

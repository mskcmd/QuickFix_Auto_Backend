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
const adminModel_1 = __importDefault(require("../models/adminModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const mechanicModel_1 = __importDefault(require("../models/mechanicModel"));
class adminRepositories {
    constructor() {
        this.getUserData = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield userModel_1.default.find({}).select('-password');
                return users;
            }
            catch (error) {
                console.log(error);
                throw new Error(error.message || 'An error occurred');
            }
        });
        this.getMechData = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const mechanics = yield mechanicModel_1.default.find({})
                    .select('-password')
                    .populate("mechanicdataID");
                return mechanics;
            }
            catch (error) {
                console.log(error);
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const admin = yield adminModel_1.default.findOne({ email });
                if (!admin) {
                    return { status: false, message: "User not found." };
                }
                const isPasswordValid = yield bcrypt_1.default.compare(password, admin.password);
                if (!isPasswordValid) {
                    return { status: false, message: "Invalid password." };
                }
                return { status: true, admin };
            }
            catch (error) {
                console.error(error);
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    blockUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield userModel_1.default.findById(id);
                if (!user) {
                    return;
                }
                const updatedStatus = !user.isBlocked;
                user.isBlocked = updatedStatus;
                const result = yield user.save();
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    getMonthlyData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentYear = new Date().getFullYear();
                const monthlyData = yield Promise.all(monthNames.slice(0, 12).map((name, index) => __awaiter(this, void 0, void 0, function* () {
                    const startDate = new Date(currentYear, index, 1);
                    const endDate = new Date(currentYear, index + 1, 0);
                    const [userCount, mechanicCount] = yield Promise.all([
                        userModel_1.default.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
                        mechanicModel_1.default.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
                    ]);
                    return { name, users: userCount, mechanics: mechanicCount };
                })));
                return monthlyData;
            }
            catch (error) {
                console.error('Error fetching monthly data:', error);
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    blockMech(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mechanic = yield mechanicModel_1.default.findById(id);
                if (!mechanic) {
                    return;
                }
                const updatedStatus = !mechanic.isBlocked;
                mechanic.isBlocked = updatedStatus;
                const result = yield mechanic.save();
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
}
exports.default = adminRepositories;

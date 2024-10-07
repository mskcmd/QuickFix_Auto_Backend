"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = __importDefault(require("../controllers/adminController"));
const adminServics_1 = __importDefault(require("../services/adminServics"));
const adminRepositories_1 = __importDefault(require("../repositories/adminRepositories"));
const adminRoute = express_1.default.Router();
const adminRepositories = new adminRepositories_1.default();
const adminServices = new adminServics_1.default(adminRepositories);
const adminController = new adminController_1.default(adminServices);
adminRoute.get("/getUserData", adminController.getUserhData.bind(adminController));
adminRoute.get("/getMechData", adminController.getMechData.bind(adminController));
adminRoute.put("/userBlock", adminController.blockUser.bind(adminController));
adminRoute.get("/monthlyData", adminController.monthlyData.bind(adminController));
adminRoute.put("/blockMech", adminController.blockMech.bind(adminController));
exports.default = adminRoute;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mechanicController_1 = __importDefault(require("../controllers/mechanicController"));
const mechanicServices_1 = __importDefault(require("../services/mechanicServices"));
const mechanicRepositories_1 = __importDefault(require("../repositories/mechanicRepositories"));
const otpRepositories_1 = __importDefault(require("../repositories/otpRepositories"));
const s3UploadMiddleware_1 = __importStar(require("../middleware/s3UploadMiddleware"));
const mechanicRoute = express_1.default.Router();
const otpRepositories = new otpRepositories_1.default();
const mechanicRepositories = new mechanicRepositories_1.default();
const mechanicServices = new mechanicServices_1.default(mechanicRepositories, otpRepositories);
const mechanicController = new mechanicController_1.default(mechanicServices);
mechanicRoute.post('/register', s3UploadMiddleware_1.uploadFields, mechanicController.mech_register.bind(mechanicController));
mechanicRoute.get("/getData", mechanicController.getMechData.bind(mechanicController));
mechanicRoute.get("/getmechData", mechanicController.getDetailData.bind(mechanicController));
mechanicRoute.get("/users", mechanicController.fetchUsers.bind(mechanicController));
mechanicRoute.put("/statusUpdate", mechanicController.statusUpdate.bind(mechanicController));
mechanicRoute.post("/addService", s3UploadMiddleware_1.default, mechanicController.addService.bind(mechanicController));
mechanicRoute.get("/fetchService", mechanicController.fetchService.bind(mechanicController));
mechanicRoute.get("/searchUsers", mechanicController.searchUsers.bind(mechanicController));
mechanicRoute.get("/searchServices", mechanicController.searchServices.bind(mechanicController));
mechanicRoute.post("/CreateBill", mechanicController.createBill.bind(mechanicController));
mechanicRoute.post("/createBlog", s3UploadMiddleware_1.default, mechanicController.createBlog.bind(mechanicController));
mechanicRoute.get("/fetchBlog", mechanicController.fetchBlog.bind(mechanicController));
mechanicRoute.delete("/deleteBlog", mechanicController.deleteBlog.bind(mechanicController));
mechanicRoute.get("/fetchEditBlog", mechanicController.fetchEditBlog.bind(mechanicController));
mechanicRoute.post("/editBlog", s3UploadMiddleware_1.default, mechanicController.editBlog.bind(mechanicController));
mechanicRoute.get("/paymentFetch", mechanicController.paymentFetch.bind(mechanicController));
mechanicRoute.get("/usersdata", mechanicController.allUsers.bind(mechanicController));
mechanicRoute.post("/create", mechanicController.createChat.bind(mechanicController));
mechanicRoute.post("/sendMessage", mechanicController.sendMessage.bind(mechanicController));
mechanicRoute.get("/allMesssge/:chatId", mechanicController.allMessagess.bind(mechanicController));
mechanicRoute.get("/fetchChats", mechanicController.fetchChats.bind(mechanicController));
mechanicRoute.get("/fetchRevenue", mechanicController.fetchRevenue.bind(mechanicController));
mechanicRoute.get("/fetchuserGrowths", mechanicController.fetchuserGrowths.bind(mechanicController));
exports.default = mechanicRoute;

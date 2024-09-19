import express, { Router } from "express";
import MechanicController from "../controllers/mechanicController";
import MechanicServices from "../services/mechanicServices";
import MechanicRepositories from "../repositories/mechanicRepositories";
import OtpRepository from "../repositories/otpRepositories";
import uploadSingleImage, { uploadFields } from "../middleware/s3UploadMiddleware";
import userAuth from "../middleware/userAuthMiddleware";

const mechanicRoute: Router = express.Router()

const otpRepositories = new OtpRepository()
const mechanicRepositories = new MechanicRepositories()
const mechanicServices = new MechanicServices(mechanicRepositories, otpRepositories)
const mechanicController = new MechanicController(mechanicServices)

mechanicRoute.post('/register', uploadFields, mechanicController.mech_register.bind(mechanicController));
mechanicRoute.get("/getData", mechanicController.getMechData.bind(mechanicController))
mechanicRoute.get("/getmechData", mechanicController.getDetailData.bind(mechanicController))
mechanicRoute.get("/users", mechanicController.fetchUsers.bind(mechanicController))
mechanicRoute.put("/statusUpdate", mechanicController.statusUpdate.bind(mechanicController))
mechanicRoute.post("/addService", uploadSingleImage, mechanicController.addService.bind(mechanicController))
mechanicRoute.get("/fetchService", mechanicController.fetchService.bind(mechanicController))
mechanicRoute.get("/searchUsers", mechanicController.searchUsers.bind(mechanicController))
mechanicRoute.get("/searchServices", mechanicController.searchServices.bind(mechanicController))
mechanicRoute.post("/CreateBill", mechanicController.createBill.bind(mechanicController))
mechanicRoute.post("/createBlog", uploadSingleImage, mechanicController.createBlog.bind(mechanicController))
mechanicRoute.get("/fetchBlog", mechanicController.fetchBlog.bind(mechanicController))
mechanicRoute.delete("/deleteBlog", mechanicController.deleteBlog.bind(mechanicController))
mechanicRoute.get("/fetchEditBlog", mechanicController.fetchEditBlog.bind(mechanicController))
mechanicRoute.post("/editBlog", uploadSingleImage, mechanicController.editBlog.bind(mechanicController))
mechanicRoute.get("/paymentFetch", mechanicController.paymentFetch.bind(mechanicController))

mechanicRoute.get("/usersdata", mechanicController.allUsers.bind(mechanicController))
mechanicRoute.post("/create", mechanicController.createChat.bind(mechanicController))
mechanicRoute.post("/sendMessage", mechanicController.sendMessage.bind(mechanicController))



export default mechanicRoute
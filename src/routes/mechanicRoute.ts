import express,{Router} from "express";
import MechanicController from "../controllers/mechanicController";
import MechanicServices from "../services/mechanicServices";
import MechanicRepositories from "../repositories/mechanicRepositories";
import OtpRepository from "../repositories/otpRepositories";
import uploadSingleImage, { uploadFields } from "../middleware/s3UploadMiddleware";
import userAuth from "../middleware/userAuthMiddleware";

const mechanicRoute:Router = express.Router()

const otpRepositories = new OtpRepository()
const mechanicRepositories = new MechanicRepositories()
const mechanicServices = new MechanicServices(mechanicRepositories,otpRepositories)
const mechanicController = new MechanicController(mechanicServices)

mechanicRoute.post('/register', uploadFields, mechanicController.mech_register.bind(mechanicController));
mechanicRoute.get("/getData",userAuth,mechanicController.getMechData.bind(mechanicController))
mechanicRoute.get("/getmechData",userAuth,mechanicController.getDetailData.bind(mechanicController))
mechanicRoute.get("/users",mechanicController.fetchUsers.bind(mechanicController))
mechanicRoute.put("/statusUpdate",mechanicController.statusUpdate.bind(mechanicController))
mechanicRoute.post("/addService",uploadSingleImage,mechanicController.addService.bind(mechanicController))
mechanicRoute.get("/fetchService",mechanicController.fetchService.bind(mechanicController))

export default mechanicRoute
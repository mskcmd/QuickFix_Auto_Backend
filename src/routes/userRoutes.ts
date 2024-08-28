import express,{Router} from "express";
import UserController from "../controllers/userController";
import UserServices from "../services/userServices";
import UserRepository from "../repositories/userRepositories";
import OtpRepository from "../repositories/otpRepositories";
import  uploadSingleImage  from "../middleware/s3UploadMiddleware";


const userRoute:Router = express.Router()

const otpRepositories = new OtpRepository()
const userRepository = new UserRepository()
const useServices = new UserServices(userRepository,otpRepositories)
const userController = new UserController(useServices)


userRoute.post("/booking",userController.mechBooking.bind(userController))
userRoute.get("/fetchBookData",userController.fetchBookData.bind(userController))
userRoute.post("/updateProfle",uploadSingleImage,userController.updateProfile.bind(userController))













export default userRoute
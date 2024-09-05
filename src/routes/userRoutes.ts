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
import userAuth from "../middleware/userAuthMiddleware";


userRoute.post("/booking",userAuth,userController.mechBooking.bind(userController))
userRoute.get("/fetchBookData",userAuth,userController.fetchBookData.bind(userController))
userRoute.post("/updateProfle",userAuth,uploadSingleImage,userController.updateProfile.bind(userController))

userRoute.post("/chat/create",userController.createChat.bind(userController))
userRoute.get("/chat/fetchChats",userController.fetchChats.bind(userController))
userRoute.get("/chat/allUsers",userController.allUsers.bind(userController))

userRoute.post("/chat/sendMessage",userController.sendMessage.bind(userController))
userRoute.get("/chat/allMesssge/:chatId",userController.allMessagess.bind(userController))





export default userRoute
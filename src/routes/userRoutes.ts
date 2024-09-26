import express, { Router } from "express";
import UserController from "../controllers/userController";
import UserServices from "../services/userServices";
import UserRepository from "../repositories/userRepositories";
import OtpRepository from "../repositories/otpRepositories";
import uploadSingleImage from "../middleware/s3UploadMiddleware";
import userAuth from "../middleware/userAuthMiddleware";
import PaymentController from "../controllers/paymentController";
import PaymentServics from "../services/paymentServics";
import PaymentRepositories from "../repositories/paymentRepositories";


const userRoute: Router = express.Router()

const otpRepositories = new OtpRepository()
const userRepository = new UserRepository()
const useServices = new UserServices(userRepository, otpRepositories)
const userController = new UserController(useServices)

const paymentRepositories = new PaymentRepositories()
const paymentService = new PaymentServics(paymentRepositories)
const paymentController = new PaymentController(paymentService)

userRoute.post("/booking", userController.mechBooking.bind(userController))
userRoute.get("/fetchBookData", userController.fetchBookData.bind(userController))
userRoute.post("/updateProfle", uploadSingleImage, userController.updateProfile.bind(userController))
userRoute.get("/getProfile",userAuth, userController.getProfile.bind(userController))


userRoute.get("/chat/allUsers", userController.allUsers.bind(userController))
userRoute.post("/chat/create",userController.createChat.bind(userController))
userRoute.get("/chat/fetchChats",userController.fetchChats.bind(userController))
userRoute.post("/chat/sendMessage",userController.sendMessage.bind(userController))
userRoute.get("/chat/allMesssge/:chatId", userController.allMessagess.bind(userController))


userRoute.get("/fetchPayment", userController.fetchPayment.bind(userController))
userRoute.post("/create-checkout-session", paymentController.createCheckoutSession.bind(paymentController))
userRoute.post("/webhook",
    express.raw({ type: 'application/json' }),
    paymentController.webhook.bind(paymentController)
);
userRoute.post("/update-payment-status", userController.updatePayment.bind(userController))
userRoute.post("/feedback",userAuth, userController.feedBack.bind(userController))
userRoute.get("/feedbackcheck",userAuth, userController.feedBackCheck.bind(userController))
userRoute.get("/fetchblogs",userController.fetchBlogs.bind(userController))
userRoute.get("/fetchallblogs",userController.fetchAllBlogs.bind(userController))
userRoute.get("/fetchAllService",userController.fetchAllService.bind(userController))
userRoute.get("/fetchAllshop",userController.fetchAllshop.bind(userController))
userRoute.get("/fetchFreelancer",userController.fetchFreelancer.bind(userController))

export default userRoute
import express,{Router} from "express";
import AdminController from "../controllers/adminController";
import AdminServics from "../services/adminServics";
import AdminRepositories from "../repositories/adminRepositories";

const adminRoute:Router = express.Router()


const adminRepositories = new AdminRepositories()
const adminServices = new AdminServics(adminRepositories)
const adminController = new AdminController(adminServices)

adminRoute.get("/getUserData",adminController.getUserhData.bind(adminController))
adminRoute.get("/getMechData",adminController.getMechData.bind(adminController))
adminRoute.put("/userBlock",adminController.blockUser.bind(adminController))
adminRoute.get("/monthlyData",adminController.monthlyData.bind(adminController))
adminRoute.put("/blockMech",adminController.blockMech.bind(adminController))





export default adminRoute
import { Request, Response } from "express";
import UserServices from "../services/userServices";
import { CustomRequest, IBookingData, UserDoc } from "../interfaces/IUser";
import { sendVerifyMail } from "../utils/otpVerification";
import { IBooking } from "../models/mechanikBookingModel";
import { uploadFile } from "../middleware/s3UploadMiddleware";
import Chat from "../models/chatModel";
import User from "../models/userModel";

class UserController {
  private userService: UserServices;

  milliseconds = (h: number, m: number, s: number) =>
    (h * 3600 + m * 60 + s) * 1000;

  constructor(userService: UserServices) {
    this.userService = userService;
  }

  async signup(req: Request, res: Response): Promise<void> {
    try {
      console.log("All data", req.body);
      const { name, email, phone, password }: UserDoc = req.body;
      const result = await this.userService.createUser(
        name,
        email,
        phone,
        password
      );
      req.session.otp = result.otp;
      req.session.userId = result.newUser?._id as string;
      req.session.email = result.newUser?.email as string;
      req.session.name = result.newUser?.name as string;

      // Store the current time and OTP expiration time (1 minute later)
      const currentTime = Date.now();
      const otpExpirationTime = currentTime + 30 * 1000; // 1 minute in milliseconds
      req.session.otpTime = otpExpirationTime;

      if (result && result.status) {
        res.json({
          isUser: true,
          success: true,
          result,
          message: result.message,
        });
      } else {
        res.json({ notSuccess: false, message: result.message });
      }
    } catch (error) {
      console.error("Error in UserController.signup:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async veryfyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { otp } = req.body;
      const otpString = String(otp);
      const currentTime = Date.now();
      const otpExpirationTime = req.session.otpTime;

      // Check if OTP is expired
      if (!otpExpirationTime || currentTime > otpExpirationTime) {
        res.json({ message: "OTP has expired", Isexpired: true });
        return;
      }

      const userId: any = req.session.userId;
      if (otpString === req.session.otp) {
        const result = await this.userService.veryfyOtp(userId);
        console.log("userdata", result);
        if (result && result.status) {
          res.json({
            isUser: true,
            success: true,
            result,
            message: result.message,
          });
        } else {
          res.json({ notSuccess: false, message: result.message });
        }
      } else {
        res.json({ message: "OTP is wrong" });
      }
    } catch (error) {
      console.error("Error in UserController.verifyOtp:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      console.log(email, password);
      const result = await this.userService.login(email, password);
      if (result?.result?.isVerified === false) {
        res.json({ isverified: false, message: "User not verified", result });
        return;
      }
      if (result?.data?.data?.succuss === true) {
        const access_token = result.data.data.token;
        const refresh_token = result.data.data.refreshToken;
        const accessTokenMaxAge = 5 * 60 * 1000; // 5 minutes
        const refreshTokenMaxAge = 48 * 60 * 60 * 1000; // 48 hours
        res
          .status(200)
          .cookie("access_token", access_token, {
            maxAge: accessTokenMaxAge,
            httpOnly: true,
            sameSite: "none",
            secure: true,
          })
          .cookie("refresh_token", refresh_token, {
            maxAge: refreshTokenMaxAge,
            httpOnly: true,
            sameSite: "none",
            secure: true,
          })
          .json({ success: true, data: result.data.data });
      } else {
        res.json({
          IsData: false,
          message: "Invalid email or password",
          result,
        });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const email = req.session.email;
      const name = req.session.name;
      console.log(email, name);

      if (!email || !name) {
        res.status(400).json({ error: "Email or name is missing" });
        return;
      }
      const otp: string = await sendVerifyMail(name, email);
      const currentTime = Date.now();
      const otpExpirationTime = currentTime + 30 * 1000;
      req.session.otpTime = otpExpirationTime;
      req.session.otp = otp;
      res.status(200).json({ message: "OTP sent successfully", isOtp: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  }

  async forgetPassword(req: Request, res: Response): Promise<void> {
    try {
      const email = req.query.email as string;
      console.log(email);

      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      const result = await this.userService.forgetService(email);
      console.log(result);

      console.log("email check", result.result?.name);
      const name = result.result?.name;
      if (result.success && name) {
        const otp: string = await sendVerifyMail(name, email);
        const currentTime = Date.now();
        const otpExpirationTime = currentTime + 30 * 1000;
        req.session.otpTime = otpExpirationTime;
        req.session.otp = otp;
        res.json({ success: true, result });
      } else if (!name) {
        res.status(400).json({ error: "User name is missing" });
      } else {
        res.status(500).json({ error: "Failed to forget password" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const newPassword = req.body.password;
      const userId = req.body.userId;

      console.log("Received newPassword:", newPassword);
      console.log("Received userId:", userId);

      const result = await this.userService.resetPassword(newPassword, userId);
      res.json({ result });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async veryfyOtpreset(req: Request, res: Response): Promise<void> {
    try {
      const { otp, userId } = req.query;
      console.log("gf", req.query);

      if (typeof otp !== "string" || typeof userId !== "string") {
        res.status(400).json({ error: "Invalid request parameters" });
        return;
      }

      const otpString = String(otp);
      const currentTime = Date.now();
      const otpExpirationTime = req.session.otpTime;

      // Check if OTP is expired
      if (!otpExpirationTime || currentTime > otpExpirationTime) {
        res.json({ message: "OTP has expired" });
        return;
      }

      if (otpString === req.session.otp) {
        console.log("good");
        const result = await this.userService.checkExistingUser(userId);
        res.json({ success: true, result });
      } else {
        res.json({ message: "OTP is wrong" });
      }
    } catch (error) {
      console.error("Error in UserController.verifyOtp:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async userLogout(req: Request, res: Response): Promise<void> {
    try {
      res
        .cookie("access_token", "", {
          maxAge: 0,
        })
        .cookie("refresh_token", "", {
          maxAge: 0,
        });
      res
        .status(200)
        .json({ success: true, message: "user logout - clearing cookie" });
    } catch (error) {
      console.log(error);
    }
  }

  async searchMechanic(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, type } = req.query;

      if (!latitude || !longitude || !type) {
        res.status(400).send("Missing parameters");
        return;
      }

      // Convert query parameters to numbers
      const userLat = parseFloat(latitude as string);
      const userLon = parseFloat(longitude as string);
      console.log(userLat, userLat);

      // Use the service to get mechanics
      const result = await this.userService.searchMechanics(
        userLat,
        userLon,
        type as string
      );

      res.json(result);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  }

  async mechBooking(req: Request, res: Response): Promise<void> {
    console.log("bookingg", req.body);
    try {
      const bookingData: IBooking = {
        user: req.body.userId,
        mechanic: req.body.mechId,
        coordinates: [req.body.latitude, req.body.longitude],
        bookingTime: new Date(req.body.dateTime),
        serviceDetails: req.body.services.join(', '),  // Join services array into a string
        name: req.body.firstName,
        mobileNumber: req.body.phoneNumber,
        complainDescription: req.body.problem,
        locationName: req.body.location,  // Optional location field
        status: 'Pending',                // Default status
      } as IBooking;

      if (
        !bookingData.user ||
        !bookingData.mechanic ||
        !bookingData.coordinates ||
        !bookingData.bookingTime ||
        !bookingData.serviceDetails ||
        !bookingData.name ||
        !bookingData.mobileNumber
      ) {
        res
          .status(400)
          .json({ message: "All required fields must be provided" });
        return;
      }

      const result = await this.userService.booking(bookingData);
      res
        .status(201)
        .json({ success: true, message: "Booking created successfully", booking: result });
    } catch (error) {
      console.error("Error creating booking:", error);
      res
        .status(500)
        .json({ message: "An error occurred while creating the booking" });
    }
  }

  async fetchBookData(req: Request, res: Response): Promise<void> {
    const { id, type } = req.query;
    try {
      if (!id || !type) {
        res.status(400).json({ error: "ID and type are required" });
        return;
      }
      const response = await this.userService.fetchBookData(id as string, type as string);
      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching book data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      let fileUrl = null;
      if (req.file) {
        fileUrl = await uploadFile(req.file);
      }
      const response = await this.userService.updateProfile(req.body, fileUrl);
      res.status(200).json({ message: "Profile updated successfully", data: response });
    } catch (error) {
      console.error("Error in updateProfile controller:", error);
      res.status(500).json({ message: "Profile update failed" });
    }
  }

  async createChat(req: any, res: Response): Promise<void> {
    try {
      const { userId, current_userId }: any = req.body;

      if (!userId) {
        console.log("UserId param not sent with request");
        res.sendStatus(400);
        return;
      }

      let isChat: any = await Chat.find({
        isGroupChat: false,
        $and: [
          { users: { $elemMatch: { $eq:current_userId } } },
          { users: { $elemMatch: { $eq: userId } } },
        ],
      })
        .populate("users", "-password")
        .populate("latestMessage")
        .exec();

      isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name email imageUrl",
      });

      if (isChat.length > 0) {
        res.send(isChat[0]);
      } else {
        const chatData = {
          chatName: "sender",
          isGroupChat: false,
          users: [current_userId, userId],
        };

        try {
          const createdChat = await Chat.create(chatData);
          const fullChat = await Chat.findOne({ _id: createdChat._id })
            .populate("users", "-password")
            .populate("latestMessage")
            .exec();

          res.status(200).send(fullChat);
        } catch (error) {
          console.error("Error in chat creation:", error);
          res.status(400).send("Failed to create the chat");
        }
      }
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).send("Server error");
    }
  }
  







}

export default UserController;

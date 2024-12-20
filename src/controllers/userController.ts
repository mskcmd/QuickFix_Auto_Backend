import { Request, Response, NextFunction } from "express";
import UserServices from "../services/userServices";
import { UserDoc } from "../interfaces/IUser";
import { sendVerifyMail } from "../utils/otpVerification";
import { IBooking } from "../models/mechanikBookingModel";
import { uploadFile } from "../middleware/s3UploadMiddleware";
import Payment from "../models/paymentModel";

class UserController {
  private userService: UserServices;



  milliseconds = (h: number, m: number, s: number) =>
    (h * 3600 + m * 60 + s) * 1000;

  constructor(userService: UserServices) {
    this.userService = userService;
  }

  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      next(error);
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
      console.log(req.body)
      const { email, password } = req.body;
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

  async googlelogin(req: Request, res: Response): Promise<void> {
    const { name, email, googlePhotoUrl } = req.body
    const accessTokenMaxAge = 60 * 60 * 1000;
    const refreshTokenMaxAge = 48 * 60 * 60 * 1000;
    try {
      const user: any = await this.userService.checkgoogleEmail(email);
      if (user) {
        if (user.isBlocked) {
          res.json({ status: false, message: "User not found." })
        } else {
          const result: any = await this.userService.googleTokenlogin(user);
          const access_token = result?.data?.data?.token;
          const refresh_token = result?.data?.data?.refreshToken;
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
            .json({ success: true, data: result.data });
        }
      } else {
        var randomIndianPhoneNumber: any = '9' + Math.floor(100000000 + Math.random() * 900000000);
        var password = Math.random().toString(36).slice(-4) + Math.random().toString(36).toUpperCase().slice(-4);
        const result1 = await this.userService.createUser(
          name,
          email,
          randomIndianPhoneNumber,
          password
        );
        const id: any = result1?.newUser?._id
        const isVerified: any = await this.userService.googleVerified(id);
        if (isVerified) {
          const result: any = await this.userService.googleToken(result1);
          const access_token = result?.data?.data?.token;
          const refresh_token = result?.data?.data?.refreshToken;
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
            .json({ success: true, data: result?.data });
        }
      }
    } catch (error) {

    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const email = req.session.email;
      const name = req.session.name;

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
      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      const result = await this.userService.forgetService(email);
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

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (req.userId) {
        const result = await this.userService.getProfile(req.userId);
        if (result) {
          res.status(200).json(result);
        } else {
          res.status(404).json({ error: "Profile not found" });
        }
      } else {
        res.status(400).json({ error: "User ID is required" });
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
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

  async fetchPayment(req: Request, res: Response): Promise<any> {
    try {
      const id: any = req.query.id
      const result = await this.userService.fetchPayment(id)
      res.json(result)
    } catch (error) {
      console.log(error);
    }
  }

  async updatePayment(req: Request, res: Response): Promise<any> {
    try {
      const { paymentId, status } = req.body;
      const result = await Payment.findOneAndUpdate(
        { _id: paymentId, status: "pending" },
        { status: status },
        { new: true }
      );
      if (!result) {
        return res.status(404).json({ message: "Payment not found or already completed" });
      }
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred" });
    }
  }

  async feedBack(req: Request, res: Response): Promise<any> {
    try {
      const { values, id, mechId, paymentId } = req.body;
      const { rating, feedback } = values;
      if (!rating || !feedback || !id || !mechId) {
        throw new Error("One or more required fields are empty.");
      }
      const result = await this.userService.feedback(rating, feedback, id, mechId, paymentId);
      res.json(result);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: "Error submitting feedback" });
    }
  }

  async updateFeedback(req: Request, res: Response): Promise<any> {
    try {
      const { values, id } = req.body;
      const { rating, feedback } = values;
      if (!values || !id) {
        throw new Error("One or more required fields are empty.");
      }

      const result = await this.userService.updateFeedback(values, id, rating, feedback);
      res.json(result);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: "Error submitting feedback" });
    }
  }

  async feedBackCheck(req: Request, res: Response): Promise<void> {
    const id = req.query.id as string;
    try {

      if (!id) {
        res.status(400).json({ error: "ID and type are required" });
        return;
      }
      const response = await this.userService.feedBackCheck(id);
      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching book data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async fetchBlogs(req: Request, res: Response): Promise<void> {
    try {
      const response = await this.userService.fetchBlogs();
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Failed to fetch blogs' });
    }
  }

  async fetchAllBlogs(req: Request, res: Response): Promise<void> {
    try {
      const response = await this.userService.fetchAllBlogs();
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Failed to fetch blogs' });
    }
  }

  async fetchAllService(req: Request, res: Response): Promise<void> {
    try {
      const response = await this.userService.fetchAllService();
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Failed to fetch blogs' });
    }
  }

  async fetchAllshop(req: Request, res: Response): Promise<void> {
    try {
      const { query }: any = req.query
      const response = await this.userService.fetchAllshop(query);
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Failed to fetch blogs' });
    }
  }

  async fetchFreelancer(req: Request, res: Response): Promise<void> {
    try {
      const response = await this.userService.fetchFreelancer();
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Failed to fetch blogs' });
    }
  }

  async bookingdata(req: Request, res: Response): Promise<void> {
    try {
      const id: any = req.query.id
      const response = await this.userService.bookingdata(id);
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Failed to fetch blogs' });
    }
  }

  async reviewData(req: Request, res: Response): Promise<void> {
    try {
      const id: any = req.query.id
      const response = await this.userService.reviewData(id);
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Failed to fetch blogs' });
    }
  }

  async allUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.userService.allUsers(req.query.search)
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }

  async createChat(req: any, res: Response): Promise<void> {
    try {

      const { senderId, receiverId }: { senderId: string; receiverId: string } = req.body;
      if (!senderId || !receiverId) {
        res.sendStatus(400);
        return;
      }
      const response = await this.userService.createChat(senderId, receiverId);
      if (response) {
        res.status(200).send(response);
      } else {
        res.status(404).send("Chat not found");
      }
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).send("Server error");
    }
  }

  async fetchChats(req: any, res: Response): Promise<void> {
    try {
      const { senderId } = req.query as { senderId: string };
      const result = await this.userService.fetchChats(senderId)
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Failed to fetch chats" });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<any> {
    try {
      const { content, chatId, senderId } = req.body;
      if (!content || !chatId) {
        return res.sendStatus(400);
      }
      const result = await this.userService.sendMessage(content, chatId, senderId)
      res.json(result);
    } catch (error) {
      console.log(error);
    }
  }

  async allMessagess(req: Request, res: Response): Promise<any> {
    try {
      const chatId: any = req.params.chatId
      const result = await this.userService.allMessagess(chatId)
      res.json(result);
    } catch (error) {
      console.log(error);
    }
  }
}

export default UserController;

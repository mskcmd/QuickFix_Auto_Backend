import { IBookingData, UserDoc } from "../interfaces/IUser";
import { Request, Response } from 'express';
import UserRepositories from "../repositories/userRepositories";
import bcrypt from "bcrypt"
import { sendVerifyMail } from "../utils/otpVerification";
import OtpRepository from "../repositories/otpRepositories";
import { CreateJWT } from "../utils/generateToken";
import { IBooking } from "../models/mechanikBookingModel";

class UserServices {
    private userRepo: UserRepositories;
    private otpRepo: OtpRepository;
    private createjwt: CreateJWT = new CreateJWT;

    constructor(userRepo: UserRepositories, otpRepo: OtpRepository) {
        this.userRepo = userRepo;
        this.otpRepo = otpRepo;

    }

    async checkExistingEmail(email: string): Promise<boolean> {
        try {
            const userData: UserDoc | null = await this.userRepo.findUserByEmail(email);
            return !!userData;
        } catch (error) {
            console.error("Error in checkExistingEmail:", error);
            throw new Error("Failed to check existing email. Please try again later.");
        }
    }

    async checkgoogleEmail(email: string): Promise<any> {
        try {
            const userData: any | null = await this.userRepo.findUserByEmail(email);
            return userData;
        } catch (error) {
            console.error("Error in checkExistingEmail:", error);
            throw new Error("Failed to check existing email. Please try again later.");
        }
    }

    async checkExistingUser(userId: string) {
        try {
            const userData: UserDoc | null = await this.userRepo.findUserById(userId);

            if (!userData) {
                throw new Error("User not found");
            }
            return userData;
        } catch (error) {
            console.error("Error in checkExistingEmail:", error);
            throw new Error("Failed to check existing email. Please try again later.");
        }
    }

    async createUser(
        name: string,
        email: string,
        phone: string,
        password: string
    ) {
        try {
            if (!name || !email || !phone || !password) {
                return { status: false, message: "Missing required fields" };
            }
            const emailExists = await this.checkExistingEmail(email);
            if (emailExists) {
                return { status: false, message: "Email already exists" };
            }
            const hashpass: string = await bcrypt.hash(password, 10)
            const otp: string = await sendVerifyMail(name, email)
            const newUser = await this.userRepo.createUser(name, email, phone, hashpass);
            return { status: true, newUser, otp, message: 'successful' };
        } catch (error) {
            console.error("Error in createUser:", error);
            return { status: false, message: "Failed to create user. Please try again later." };
        }
    }

    async veryfyOtp(userId: string) {
        try {
            const result = await this.otpRepo.verifyUser(userId)
            return { status: true, result, message: 'successful' };
        } catch (error) {
            console.log(error);
            throw new Error(`veryfyOtp failed: ${(error as Error).message}`);
        }

    }

    async googleToken(result: any) {
        try {
            if (result) {
                const token = this.createjwt.generateToken(result?.newUser?._id);
                const refreshToken = this.createjwt.generateRefreshToken(result?.newUser?._id)
                return {
                    data: {
                        data: {
                            succuss: true,
                            message: 'Authentication Successful !',
                            data: result?.newUser,
                            userId: result?.newUser?._id,
                            token: token,
                            refreshToken: refreshToken
                        }
                    }
                }
            }
        } catch (error) {
            console.log(error);
            throw new Error(`googleToken failed: ${(error as Error).message}`);
        }
    }

    async googleTokenlogin(result: any) {
        try {
            if (result) {
                const token = this.createjwt.generateToken(result?._id);
                const refreshToken = this.createjwt.generateRefreshToken(result?._id)
                return {
                    data: {
                        data: {
                            succuss: true,
                            message: 'Authentication Successful !',
                            data: result,
                            userId: result?._id,
                            token: token,
                            refreshToken: refreshToken
                        }
                    }
                }
            }
        } catch (error) {
            console.log(error);
            throw new Error(`googleTokenlogin failed: ${(error as Error).message}`);
        }
    }

    async googleVerified(userId: string) {
        try {
            const userData: any = await this.userRepo.googleVerified(userId);
            if (!userData) {
                throw new Error("User not found");
            }
            return userData;
        } catch (error) {
            console.error("Error in checkExistingEmail:", error);
            throw new Error("Failed to check existing email. Please try again later.");
        }
    }

    async login(email: string, password: string) {
        try {
            const result = await this.userRepo.login(email, password)
            if (result?.status == true) {
                const token = this.createjwt.generateToken(result.user?.id);
                const refreshToken = this.createjwt.generateRefreshToken(result.user?.id)
                return {
                    data: {
                        data: {
                            succuss: true,
                            message: 'Authentication Successful !',
                            data: result.user,
                            userId: result.user?._id,
                            token: token,
                            refreshToken: refreshToken
                        }
                    }
                }
            } else {
                return {
                    result
                }
            }
        } catch (error) {
            console.log(error);
            throw new Error(`login failed: ${(error as Error).message}`);
        }
    }

    async forgetService(email: string) {
        try {

            const result = await this.userRepo.findUserByEmail(email);

            if (!result) {
                return { success: false, message: 'User not found' };
            }
            if (!result.isVerified) {
                return { success: false, message: 'User is not verified' };
            }
            return { success: true, result };
        } catch (error) {
            console.log(error);
            throw new Error('Error  forgetService');
        }
    }

    async resetPassword(userId: string, password: string) {
        try {
            if (!userId || !password) {
                throw new Error('User ID and password are required');
            }

            const hashpass: string = await bcrypt.hash(password, 10);
            const result = await this.userRepo.resetPassword(hashpass, password);

            if (!result) {
                throw new Error('Failed to reset password');
            }
            return { succuss: true, result, message: "Successfully changed password." }
        } catch (error) {
            console.error('Error in UserService.resetPassword:', error);
            throw error;
        }
    }

    async searchMechanics(lat: number, lon: number, type: string) {
        try {
            const mechanics = await this.userRepo.findMechanicsNearLocation(lat, lon, type);
            return mechanics
        } catch (error) {
            console.log(error);
            throw new Error(`searchMechanics failed: ${(error as Error).message}`);
        }
    }

    async booking(bookingData: IBooking): Promise<IBooking> {
        try {
            return await this.userRepo.createBooking(bookingData);
        } catch (error) {
            console.error("Error in service:", error);
            throw error;
        }
    }

    async fetchBookData(id: string, type: string): Promise<any> {
        try {
            return await this.userRepo.fetchBookData(id, type);
        } catch (error) {
            console.log(error);
            throw new Error(`fetchBookData failed: ${(error as Error).message}`);
        }
    }

    async updateProfile(userData: any, fileUrl: string | null): Promise<any> {
        try {
            const updatedData = {
                ...userData,
                image: fileUrl,
            };
            return await this.userRepo.updateProfile(updatedData);
        } catch (error) {
            console.error("Error in updateProfile service:", error);
            throw new Error("Failed to update profile");
        }
    }

    async getProfile(id: string) {
        try {
            const result = await this.userRepo.findUserById(id);
            return result
        } catch (error) {
            console.log(error);
            throw new Error(`getProfile failed: ${(error as Error).message}`);
        }
    }

    async fetchPayment(id: string): Promise<any> {
        try {
            const result = this.userRepo.fetchPayment(id)
            return result
        } catch (error) {
            console.log(error);
            throw new Error(`fetchPayment failed: ${(error as Error).message}`);
        }
    }

    async feedback(rating: number, feedback: string, userId: string, mechId: string, paymentID: string): Promise<any> {
        try {
            console.log(rating, feedback, userId, mechId);
            const result = await this.userRepo.feedback(rating, feedback, userId, mechId, paymentID)
            return result
        } catch (error) {
            console.log(error);
            throw new Error(`feedback failed: ${(error as Error).message}`);
        }
    }

    async updateFeedback(values: any, id: string, rating: string, feedback: string): Promise<any> {
        try {
            const result = await this.userRepo.updateFeedback(id, rating, feedback)
            return result
        } catch (error) {
            console.log(error);
            throw new Error(`updateFeedback failed: ${(error as Error).message}`);
        }
    }

    async feedBackCheck(id: string): Promise<any> {
        try {
            const result = this.userRepo.feedBackCheck(id)
            return result
        } catch (error) {
            console.log(error);
            throw new Error(`feedBackCheck failed: ${(error as Error).message}`);
        }
    }

    async fetchBlogs(): Promise<any> {
        try {
            const response = await this.userRepo.fetchBlogs()
            return response
        } catch (error) {
            console.log(error);
            throw new Error(`fetchBlogs failed: ${(error as Error).message}`);
        }
    }

    async fetchAllBlogs(): Promise<any> {
        try {
            const response = await this.userRepo.fetchAllBlogs()
            return response
        } catch (error) {
            console.log(error);
            throw new Error(`fetchAllBlogs failed: ${(error as Error).message}`);
        }
    }

    async fetchAllService(): Promise<any> {
        try {
            const response = await this.userRepo.fetchAllService()
            return response
        } catch (error) {
            console.log(error);
            throw new Error(`fetchAllService failed: ${(error as Error).message}`);
        }
    }

    async fetchAllshop(query: string): Promise<any> {
        try {
            const response = await this.userRepo.fetchAllshop(query)
            return response
        } catch (error) {
            console.log(error);
            throw new Error(`fetchAllshop failed: ${(error as Error).message}`);
        }
    }

    async fetchFreelancer(): Promise<any> {
        try {
            const response = await this.userRepo.fetchFreelancer()
            return response
        } catch (error) {
            console.log(error);
            throw new Error(`fetchFreelancer failed: ${(error as Error).message}`);
        }
    }

    async bookingdata(id: string): Promise<any> {
        try {
            const response = await this.userRepo.bookingdata(id)
            return response
        } catch (error) {
            console.log(error);
            throw new Error(`bookingdata failed: ${(error as Error).message}`);
        }
    }

    async reviewData(id: string): Promise<any> {
        try {
            const response = await this.userRepo.reviewData(id)
            return response
        } catch (error) {
            console.log(error);
            throw new Error(`reviewData failed: ${(error as Error).message}`);
        }
    }
    //chats

    async allUsers(keyword: any): Promise<any> {
        try {
            const result = await this.userRepo.allUsers(keyword)
            return result
        } catch (error) {
            console.log(error);
            throw new Error(`allUsers failed: ${(error as Error).message}`);

        }
    }

    async createChat(senderId: string, receverId: string): Promise<any> {
        try {
            const chat = await this.userRepo.createChat(senderId, receverId);
            return chat;
        } catch (error) {
            console.log(error);
            throw new Error(`createChat failed: ${(error as Error).message}`);
        }
    }

    async fetchChats(senderId: string) {
        try {
            const result = await this.userRepo.fetchChats(senderId)
            return result
        } catch (error) {
            console.log(error);
            throw new Error(`fetchChats failed: ${(error as Error).message}`);


        }
    }

    async sendMessage(content: string, chatId: string, senderId: string) {
        try {
            const result = await this.userRepo.sendMessage(content, chatId, senderId)
            return result
        } catch (error) {
            console.log(error);
            throw new Error(`sendMessage failed: ${(error as Error).message}`);


        }
    }

    async allMessagess(chatId: string) {
        try {
            const result = await this.userRepo.getAllMessages(chatId)
            return result
        } catch (error) {
            throw new Error(`allMessagess failed: ${(error as Error).message}`);

        }
    }



}

export default UserServices;

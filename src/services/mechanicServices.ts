import MechnicRepositories from "../repositories/mechanicRepositories";
import OtpRepository from "../repositories/otpRepositories";
import { IBlog, IMechanicData, IService, MechnicDoc } from "../interfaces/IMechanic";
import { sendVerifyMail } from "../utils/otpVerification";
import bcrypt from "bcrypt";
import { CreateJWT } from "../utils/generateToken";

class mechanicServices {
    private mechanicRepo: MechnicRepositories;
    private otpRepo: OtpRepository;
    private createjwt: CreateJWT = new CreateJWT;


    constructor(mechanicRepo: MechnicRepositories, otpRepo: OtpRepository) {
        this.mechanicRepo = mechanicRepo;
        this.otpRepo = otpRepo;
    }

    async checkExistingEmail(email: string): Promise<boolean> {
        try {
            const userData: MechnicDoc | null =
                await this.mechanicRepo.findUserByEmail(email);
            return !!userData;
        } catch (error) {
            console.error("Error in checkExistingEmail:", error);
            throw new Error(
                "Failed to check existing email. Please try again later."
            );
        }
    }

    async createMechanic(
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
                return { status: false, message: "Email already exists ff" };
            }
            const hashpass: string = await bcrypt.hash(password, 10);
            const otp: string = await sendVerifyMail(name, email);
            const newMechanic = await this.mechanicRepo.createMechanic(
                name,
                email,
                phone,
                hashpass
            );
            return { status: true, newMechanic, otp, message: "successful" };
        } catch (error) {
            console.log(error);
        }
    }

    async veryfyOtp(mechanicId: string) {
        const result = await this.otpRepo.verifyMechanic(mechanicId);
        return { status: true, result, message: "successful" };
    }

    async login(email: string, password: string) {
        try {
            const result = await this.mechanicRepo.login(email, password)

            if (result?.status == true) {
                const mech_token = this.createjwt.generateToken(result.mechanic?.id);
                const mech_refreshToken = this.createjwt.generateRefreshToken(result.mechanic?.id)
                return {
                    data: {
                        data: {
                            succuss: true,
                            message: 'Authentication Successful !',
                            data: result.mechanic,
                            mechnicId: result.mechanic?._id,
                            mech_token: mech_token,
                            mech_refreshToken: mech_refreshToken
                        }
                    }
                }
            } else {
                return {
                    result
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    async forgetService(email: string) {
        try {

            const result = await this.mechanicRepo.findUserByEmail(email);
            console.log(result);

            if (!result) {
                return { success: false, message: 'User not found' };
            }
            if (!result.isVerified) {
                return { success: false, message: 'User is not verified' };
            }
            return { success: true, result };
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async checkExistingUser(userId: string) {
        try {
            const userData: MechnicDoc | null = await this.mechanicRepo.findUserById(userId);

            if (!userData) {
                throw new Error("User not found");
            }
            return userData;
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async resetPassword(userId: string, password: string) {
        try {
            if (!userId || !password) {
                throw new Error('User ID and password are required');
            }

            const hashpass: string = await bcrypt.hash(password, 10);
            const result = await this.mechanicRepo.resetPassword(hashpass, password);

            if (!result) {
                throw new Error('Failed to reset password');
            }
            return { succuss: true, result }
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async registerMechData(uploadUrls: Record<string, string>, body: any): Promise<IMechanicData> {
        try {
            const result = await this.mechanicRepo.registerData(uploadUrls, body);
            return result;
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }


    async getMechData(id: string): Promise<any> {
        try {
            const result = await this.mechanicRepo.getmechData(id);
            return result;
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async getDetailData(id: string): Promise<any> {
        try {
            const result = await this.mechanicRepo.getDetailData(id);
            return result;
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async fetchUsers(id: string): Promise<any> {
        try {
            const result = await this.mechanicRepo.fetchUsers(id);
            return result;

        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async statusUpdate(id: string, status: string): Promise<any> {
        try {
            const result = await this.mechanicRepo.statusUpdate(id, status)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async addService(serviceData: IService): Promise<IService | null> {
        try {
            const result = await this.mechanicRepo.addService(serviceData);
            return result;
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async fetchService(id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.fetchService(id)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async searchUsers(keyword: string, id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.searchUsers(keyword, id)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async searchServices(keyword: string, id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.searchServices(keyword, id)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async createBill(userId: any, name: any, vehicleNumber: any, services: any, subtotal: any, gst: any, total: any, mechId: any): Promise<void> {
        try {
            const result = await this.mechanicRepo.createBill(userId, name, vehicleNumber, services, subtotal, gst, total, mechId)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async createBlog(blogData: IBlog): Promise<IBlog | null> {
        try {
            const result = await this.mechanicRepo.createBlog(blogData);
            return result;
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async fetchBlog(id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.fetchBlog(id)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async deleteBlog(id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.deleteBlog(id)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async fetchEditBlog(id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.fetchEditBlog(id)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');
        }
    }

    async editBlog(blogData: IBlog): Promise<IBlog | null> {
        try {
            const result = await this.mechanicRepo.editBlog(blogData);
            return result;
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async paymentFetch(id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.paymentFetch(id)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async createChat(senderId: string, receverId: string): Promise<any> {
        try {
            const chat = await this.mechanicRepo.createChat(senderId, receverId);
            return chat;
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async sendMessage(content: string, chatId: string, senderId: string) {
        try {
            const result = await this.mechanicRepo.sendMessage(content, chatId, senderId)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async allMessagess(chatId: string) {
        try {
            const result = await this.mechanicRepo.getAllMessages(chatId)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async fetchChats(senderId: string) {
        try {
            const result = await this.mechanicRepo.fetchChats(senderId)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async fetchRevenue(id: string) {
        try {
            const result = await this.mechanicRepo.fetchRevenue(id)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async fetchuserGrowths(id: string) {
        try {
            const result = await this.mechanicRepo.fetchUserGrowths(id)
            return result
        } catch (error) {
            throw new Error((error as Error).message || 'An error fetchuserGrowths');

        }
    }

    async fetchMechData(id:string){
        try {
            const result = await this.mechanicRepo.fetchMechData(id)
            return result
        } catch (error) {
            throw new Error ((error as Error).message|| "An Erorr in fetchMechData")
        }

    }

}


export default mechanicServices;

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
                return { status: false, message: "Email already exists" };
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
        console.log("myyxyyy", result);
        return { status: true, result, message: "successful" };
    }

    async login(email: string, password: string) {
        try {
            const result = await this.mechanicRepo.login(email, password)
            console.log("re", result);

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
            console.log("sds", email);

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
            console.log(error);
            throw new Error('Error forgetting password');
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
            console.error("Error in checkExistingEmail:", error);
            throw new Error("Failed to check existing email. Please try again later.");
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
            console.error('Error in UserService.resetPassword:', error);
            throw error;
        }
    }

    async registerMechData(uploadUrls: Record<string, string>, body: any): Promise<IMechanicData> {
        try {
            console.log("hs", uploadUrls, body);
            const result = await this.mechanicRepo.registerData(uploadUrls, body);
            return result;
        } catch (error) {
            console.error('Error in registerMechData:', error);
            throw new Error('Failed to register mechanic data');
        }
    }


    async getMechData(id: string): Promise<any> {
        try {
            const result = await this.mechanicRepo.getmechData(id);
            return result;
        } catch (error) {
            console.error("Error in service layer:", error);
            throw new Error('Failed to fetch mechanic data');
        }
    }

    async getDetailData(id: string): Promise<any> {
        try {
            const result = await this.mechanicRepo.getDetailData(id);
            return result;
        } catch (error) {
            console.error("Error in service layer:", error);
            throw new Error('Failed to fetch mechanic data');
        }
    }

    async fetchUsers(id: string): Promise<any> {
        try {
            const result = await this.mechanicRepo.fetchUsers(id);
            return result;

        } catch (error) {
            console.log(error);

        }
    }

    async statusUpdate(id: string, status: string): Promise<any> {
        try {
            const result = await this.mechanicRepo.statusUpdate(id, status)
            return result
        } catch (error) {
            console.log(error);

        }
    }

    async addService(serviceData: IService): Promise<IService | null> {
        try {
            const result = await this.mechanicRepo.addService(serviceData);
            return result;
        } catch (error) {
            console.error("Error adding service:", error);
            return null;
        }
    }

    async fetchService(id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.fetchService(id)
            return result
        } catch (error) {
            console.log(error);

        }
    }

    async searchUsers(keyword: string, id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.searchUsers(keyword, id)
            return result
        } catch (error) {
            console.log(error);

        }
    }

    async searchServices(keyword: string, id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.searchServices(keyword, id)
            return result
        } catch (error) {
            console.log(error);

        }
    }

    async createBill(userId: any, name: any, vehicleNumber: any, services: any, subtotal: any, gst: any, total: any, mechId: any): Promise<void> {
        try {
            const result = await this.mechanicRepo.createBill(userId, name, vehicleNumber, services, subtotal, gst, total, mechId)
            return result
        } catch (error) {
            console.log(error);

        }
    }

    async createBlog(blogData: IBlog): Promise<IBlog | null> {
        try {
            const result = await this.mechanicRepo.createBlog(blogData);
            return result;
        } catch (error) {
            console.error("Error adding service:", error);
            return null;
        }
    }

    async fetchBlog(id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.fetchBlog(id)
            return result
        } catch (error) {
            console.log(error);

        }
    }

    async deleteBlog(id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.deleteBlog(id)
            return result
        } catch (error) {
            console.log(error);

        }
    }

    async fetchEditBlog(id: string): Promise<void> {
        try {
            const result = await this.mechanicRepo.fetchEditBlog(id)
            return result
        } catch (error) {
            console.log(error);
        }
    }

    async editBlog(blogData: IBlog): Promise<IBlog | null> {
        try {
            const result = await this.mechanicRepo.editBlog(blogData);
            return result;
        } catch (error) {
            console.error("Error adding service:", error);
            return null;
        }
    }



}


export default mechanicServices;

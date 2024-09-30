import AdminRepositories from "../repositories/adminRepositories";
import { CreateJWT } from "../utils/generateToken";

class AdminServices {
    private adimnRepo: AdminRepositories;
    private createjwt: CreateJWT = new CreateJWT;


    constructor(adimnRepo: AdminRepositories) {
        this.adimnRepo = adimnRepo;

    }

    async Login(email: string, password: string) {
        try {
            const result = await this.adimnRepo.login(email, password)
            console.log("yy", result)

            console.log(result?.status == true);
            if (result?.status == true) {
                console.log("qyy", result)

                const admin_token = this.createjwt.generateToken(result.admin?.id);
                const admin_refreshToken = this.createjwt.generateRefreshToken(result.admin?.id)
                console.log("jhk", admin_token, admin_refreshToken)

                return {
                    data: {
                        data: {
                            succuss: true,
                            message: 'Authentication Successful !',
                            data: result.admin,
                            adminId: result.admin?._id,
                            admin_token: admin_token,
                            admin_refreshToken: admin_refreshToken
                        }
                    }
                }
            } else {
                return {
                    data: {
                        succuss: false,
                    }
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    async getUserData(): Promise<void> {
        try {
            const result = await this.adimnRepo.getUserData()
            return result

        } catch (error) {
            console.log(error);
        }
    }

    async getMechData(): Promise<void> {
        try {
            const result = await this.adimnRepo.getMechData()
            return result
        } catch (error) {
            console.log(error);
        }
    }

    async blockUser(id: string): Promise<any> {
        try {
            const result = await this.adimnRepo.blockUser(id)
            return result
        } catch (error) {
            console.log(error);
        }
    }

    async monthlyData() {
        try {
            const result = await this.adimnRepo.getMonthlyData()
            return result
        } catch (error) {
            console.log(error);

        }
    }

    async blockMech(id: string): Promise<any> {
        try {
            const result = await this.adimnRepo.blockMech(id)
            return result
        } catch (error) {
            console.log(error);
        }
    }

}




export default AdminServices
import Mechanic from "../models/mechanicModel";
import User from "../models/userModel";

class OtpRepository {
    async verifyUser(mechanicId: string) {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                mechanicId,
                { isVerified: true },
                { new: true }
            );
            console.log(updatedUser);
            if (updatedUser) {
                console.log("User verified and isVerified field updated to true.");
                return updatedUser;
            } else {
                console.error("User not found.");
                return null;
            }
        } catch (error) {
            console.error("Error verifying user:", error);
            throw new Error("Error verifying user.");
        }
    }
    async verifyMechanic(userId: string) {
        try {
            const updatedUser = await Mechanic.findByIdAndUpdate(
                userId,
                { isVerified: true },
                { new: true }
            );

            if (updatedUser) {
                console.log("User verified and isVerified field updated to true.");
                return updatedUser;
            } else {
                console.error("User not found.");
                return null;
            }
        } catch (error) {
            console.error("Error verifying user:", error);
            throw new Error("Error verifying user.");
        }
    }
}

export default OtpRepository;

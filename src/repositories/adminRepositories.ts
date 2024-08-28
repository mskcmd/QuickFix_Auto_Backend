import bcrypt from 'bcrypt';
import Admin from "../models/adminModel";
import User from '../models/userModel';
import Mechanic from '../models/mechanicModel';


class adminRepositories {
  async login(email: string, password: string) {
    try {
      const admin = await Admin.findOne({ email });
      
      if (!admin) {
        return { status: false, message: "User not found." };

      }
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return { status: false, message: "Invalid password." };
      }
      return { status: true, admin };
    } catch (error) {
      console.error(error);
    }
  }
  getUserData = async (): Promise<any> => {
    try {
      const users = await User.find({}).select('-password');
      console.log("m",users);
      return users
      
    } catch (error) {
      console.log(error);
    }
  };
  getMechData = async (): Promise<any> => {
    try {
      const mechanics = await Mechanic.find({})
      .select('-password')
      .populate("mechanicdataID");

    console.log("m", mechanics);
    return mechanics;
      
    } catch (error) {
      console.log(error);
    }
  };

}

export default adminRepositories
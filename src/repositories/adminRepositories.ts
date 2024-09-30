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

      return mechanics;

    } catch (error) {
      console.log(error);
    }
  };

  async blockUser(id: string) {
    try {
      const user = await User.findById(id);
      if (!user) {
        console.log("User not found");
        return;
      }
      const updatedStatus = !user.isBlocked;
      user.isBlocked = updatedStatus;
      const result = await user.save();
      return result
    } catch (error) {
      console.log(error);
    }
  }


  async getMonthlyData() {
    try {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();

      const monthlyData = await Promise.all(
        monthNames.slice(0, 12).map(async (name, index) => {
          const startDate = new Date(currentYear, index, 1);
          const endDate = new Date(currentYear, index + 1, 0);

          const [userCount, mechanicCount] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
            Mechanic.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
          ]);

          return { name, users: userCount, mechanics: mechanicCount };
        })
      );

      console.log(monthlyData);
      return monthlyData;
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      throw error;
    }
  }

  async blockMech(id: string) {
    try {
      const mechanic = await Mechanic.findById(id);
      if (!mechanic) {
        console.log("Mechanic not found");
        return;
      }
      const updatedStatus = !mechanic.isBlocked;
      mechanic.isBlocked = updatedStatus;
      const result = await mechanic.save();
      return result
    } catch (error) {
      console.log(error);
    }
  }

}

export default adminRepositories
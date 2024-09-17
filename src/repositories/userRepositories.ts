// repositories/userRepositories.ts
import User from "../models/userModel";
import { IBookingData, UseLog, UserDoc } from "../interfaces/IUser";
import bcrypt from 'bcrypt';
import Admin from "../models/adminModel";
import mongoose, { Model, Document } from 'mongoose';
import MechanicData from "../models/mechanicdataModel";
import Booking, { IBooking } from "../models/mechanikBookingModel";
import Mechanic from "../models/mechanicModel";
import { MechnicDoc } from "../interfaces/IMechanic";
import Chat from "../models/chatModel";
import Payment from "../models/paymentModel";
import FeedBack from "../models/feedbackModel";
import Blog from "../models/blogModel";


class UserRepository {
  [x: string]: any;

  // Helper function to determine the model based on ID
  private async getModelById(id: string): Promise<Model<any> | null> {
    const models = [User, Mechanic, Admin] as Model<any>[];

    for (const model of models) {
      const document = await model.findById(id).exec();
      if (document) return model;
    }
    return null;
  }


  async findUserByEmail(email: string): Promise<UserDoc | null> {
    try {
      const userData: UserDoc | null = await User.findOne({ email }).exec();
      return userData;
    } catch (error) {
      console.error("Error in findUserByEmail:", error);
      throw error;
    }
  }

  async googleVerified(id: string): Promise<any> {
    try {
      const result = await User.updateOne(
        { _id: id },
        { $set: { isVerified: true } }
      );
      return result;

    } catch (error) {
      console.error("Error in googleVerified:", error);
      throw error;
    }
  }


  async findUserById(userId: string): Promise<UserDoc | null> {
    try {
      const userData: UserDoc | null = await User.findOne({ _id: userId }).exec();
      return userData;
    } catch (error) {
      console.error("Error in findUserById:", error);
      throw error;
    }
  }

  async createUser(name: string, email: string, phone: string, password: string): Promise<UserDoc | undefined> {
    try {
      const newUser = new User({ name, email, phone, password });
      const result = await newUser.save();
      return result
    } catch (error) {
      console.log(error);

    }
  }

  async login(email: string, password: string) {
    try {
      // Find the user and exclude the password field for the user object returned
      const user = await User.findOne({ email }).select('-password');
      console.log("user", user);

      if (!user) {
        return { status: false, message: "User not found." };
      }
      if (!user.isVerified) {
        return { isVerified: false, message: "User not verified." };
      }

      const userWithPassword = await User.findOne({ email }).select('+password');
      if (!userWithPassword) {
        return { status: false, message: "User not found for password validation." };
      }

      const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
      if (!isPasswordValid) {
        return { status: false, message: "Invalid password." };
      }

      return { status: true, user };
    } catch (error) {
      console.error(error);
      return { status: false, message: "An error occurred during login." };
    }
  }

  async resetPassword(password: string, userId: string) {
    try {

      if (!userId || !password) {
        throw new Error('User ID and password are required');
      }
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      const objectId = new mongoose.Types.ObjectId(userId);
      const userData: UserDoc | null = await User.findById(objectId).exec();

      if (!userData) {
        throw new Error('User not found');
      }
      const hashpass: string = await bcrypt.hash(password, 10);
      userData.password = hashpass; // Assuming userData has a password field
      const result = await userData.save();
      console.log('Password reset successful for user:', userId);
      return result
    } catch (error) {
      console.error('Error in UserService.resetPassword:', error);
      throw error;
    }
  }


  async findMechanicsNearLocation(lat: number, lon: number, type: string, maxDistance: number = 5000) {
    try {
      const query = type === 'all' ? {} : { type: type };

      const mechanics = await MechanicData.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lon, lat] },
            distanceField: 'distance',
            maxDistance: maxDistance,
            spherical: true,
            query: query
          }
        },
        {
          $project: {
            _id: 1,
            mechanicID: 1,
            type: 1,
            licenseNumber: 1,
            yearsOfExperience: 1,
            specialization: 1,
            district: 1,
            location: 1,
            locationName: 1,
            services: 1,
            workingHours: 1,
            description: 1,
            profileImages: 1,
            certificate: 1,
            distance: 1,
            distanceKm: { $divide: ['$distance', 1000] },
            walkingTime: { $divide: ['$distance', 5000 / 60] }, // 5 km/h
            bikingTime: { $divide: ['$distance', 15000 / 60] }, // 15 km/h
            drivingTime: { $divide: ['$distance', 40000 / 60] } // 40 km/h
          }
        }
      ]);

      // const MData: MechnicDoc | null = await Mechanic.findOne({ mechanics. }).exec();


      const formattedMechanics = await Promise.all(
        mechanics.map(async mechanic => {
          try {
            // Fetch only specific fields from Mechanic model
            const mechData = await Mechanic.findOne({ _id: mechanic.mechanicID })
              .select('name email phone') // Only retrieve name, email, and phone
              .exec();

            // Format and return the data
            return {
              ...mechanic,
              mechData: mechData || null,
              distanceKm: Number(mechanic.distanceKm.toFixed(2)),
              walkingTime: Number(mechanic.walkingTime.toFixed(2)),
              bikingTime: Number(mechanic.bikingTime.toFixed(2)),
              drivingTime: Number(mechanic.drivingTime.toFixed(2))
            };
          } catch (error) {
            console.error(`Error fetching mechData for mechanicID ${mechanic.mechanicID}:`, error);
            return {
              ...mechanic,
              mechData: null, // Handle the error case
              distanceKm: Number(mechanic.distanceKm.toFixed(2)),
              walkingTime: Number(mechanic.walkingTime.toFixed(2)),
              bikingTime: Number(mechanic.bikingTime.toFixed(2)),
              drivingTime: Number(mechanic.drivingTime.toFixed(2))
            };
          }
        })
      );


      console.log(`Found ${formattedMechanics.length} mechanics within ${maxDistance / 1000} km radius`);
      console.log(formattedMechanics);

      return formattedMechanics;
    } catch (error) {
      console.error("Error finding mechanics:", error);
      throw error;
    }
  }

  async createBooking(bookingData: IBooking): Promise<IBooking> {
    const newBooking = new Booking(bookingData);
    return await newBooking.save();
  }

  async fetchBookData(id: string, type: string): Promise<any> {
    try {
      let bookData;

      if (type === "All") {
        bookData = await Booking.find({ user: id })
          .populate({
            path: 'mechanic',
            select: '-password -isBlocked -isUser -isVerified -createdAt -updatedAt'
          })
          .exec();

      } else {
        bookData = await Booking.find({ status: type, user: id })
          .populate({
            path: 'mechanic',
            select: '-password -isBlocked -isUser -isVerified -createdAt -updatedAt'
          })
          .exec();
      }

      return bookData;

    } catch (error) {
      console.error("Error fetching book data:", error);
      throw new Error("Failed to fetch book data"); // Rethrow or handle the error appropriately
    }
  }

  async updateProfile(updatedData: any): Promise<any> {
    try {
      const userId = updatedData.id;
      console.log("Updated Data:", updatedData);
      const updatedProfile = await User.findByIdAndUpdate(
        userId,
        {
          name: updatedData.name,
          phone: updatedData.phone,
          imageUrl: updatedData.image,
        },
        { new: true }
      );
      if (!updatedProfile) {
        throw new Error("User not found");
      }

      return updatedProfile;
    } catch (error) {
      console.error("Error in updateProfile repository:", error);
      throw new Error("Failed to update profile in the database");
    }
  }

  async createChat(senderId: string, receverId: string): Promise<any> {
    try {
      let isChat: any = await Chat.find({
        isGroupChat: false,
        $and: [
          { users: { $elemMatch: { $eq: senderId } } },
          { users: { $elemMatch: { $eq: receverId } } },
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
        return isChat[0];
      } else {
        const chatData = {
          chatName: "sender",
          isGroupChat: false,
          users: [senderId, receverId],
        };

        const createdChat = await Chat.create(chatData);
        const fullChat = await Chat.findOne({ _id: createdChat._id })
          .populate("users", "-password")
          .populate("latestMessage")
          .exec();

        return fullChat;
      }
    } catch (error) {
      console.error("Error in repository:", error);
      throw new Error("Failed to create or retrieve chat");
    }
  }

  async fetchPayment(id: string): Promise<any> {
    try {
      console.log("Fetching payment for user:", id);

      const paymentData = await Payment.find({ user: id })
        .sort({ createdAt: -1 })
        .populate({
          path: 'mechanic',
          select: 'name _id email phone mechanicdataID'
        })
        .populate('services');

      console.log("fetchPayment", paymentData);
      return paymentData;

    } catch (error) {
      console.error("Error fetching payments:", error);
      throw error; // Re-throw the error to handle it outside if needed
    }
  }


  async feedback(rating: number, feedbackText: string, userId: string, mechId: string, paymentID: string) {
    try {
      const newFeedback = new FeedBack({
        rating,
        feedback: feedbackText,
        user: userId,
        mechanic: mechId,
        payment: paymentID
      });
      const result = await newFeedback.save();
      return result;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  }

  async feedBackCheck(id: string): Promise<any> {
    try {
      console.log("Fetching feedback for user:", id);
      const feedback = await FeedBack.find({ payment: id });

      if (feedback.length > 0) {
        return { status: true, feedback };
      } else {
        return { status: false, message: "No feedback found for this user." };
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      throw error;
    }
  }

  async fetchBlogs(): Promise<any> {
    try {
      const response = await Blog.find();
      const shuffledBlogs = response.sort(() => 0.5 - Math.random());
      const randomBlogs = shuffledBlogs.slice(0, 3);
      console.log("Random Blogs:", randomBlogs);
      return randomBlogs
    } catch (error) {
      console.log(error);
    }
  }

  async fetchAllBlogs(): Promise<any> {
    try {
      const response = await Blog.find();
      console.log("Random Blogs:", response);
      return response
    } catch (error) {
      console.log(error);
    }
  }




}

export default UserRepository;

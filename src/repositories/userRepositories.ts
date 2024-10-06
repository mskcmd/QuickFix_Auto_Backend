// repositories/userRepositories.ts
import User from "../models/userModel";
import { IBookingData, UseLog, UserDoc } from "../interfaces/IUser";
import bcrypt from "bcrypt";
import Admin from "../models/adminModel";
import mongoose, { Model, Document } from "mongoose";
import MechanicData from "../models/mechanicdataModel";
import Booking, { IBooking } from "../models/mechanikBookingModel";
import Mechanic from "../models/mechanicModel";
import Payment from "../models/paymentModel";
import FeedBack from "../models/feedbackModel";
import Blog from "../models/blogModel";
import Chat2 from "../models/chatModel2";
import Message from "../models/messageModel2";
import Service from "../models/serviceModel";

class UserRepository {
  [x: string]: any;

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
      const userData: UserDoc | null = await User.findOne({
        _id: userId,
      }).exec();
      return userData;
    } catch (error) {
      console.error("Error in findUserById:", error);
      throw error;
    }
  }

  async createUser(
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<UserDoc | undefined> {
    try {
      const newUser = new User({ name, email, phone, password });
      const result = await newUser.save();
      return result;
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      // Find the user and exclude the password field for the user object returned
      const user = await User.findOne({ email }).select("-password");

      if (!user) {
        return { status: false, message: "User not found." };
      }
      if (!user.isVerified) {
        return { isVerified: false, message: "User not verified." };
      }

      const userWithPassword = await User.findOne({ email }).select(
        "+password"
      );
      if (!userWithPassword) {
        return {
          status: false,
          message: "User not found for password validation.",
        };
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        userWithPassword.password
      );
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
        throw new Error("User ID and password are required");
      }
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }
      const objectId = new mongoose.Types.ObjectId(userId);
      const userData: UserDoc | null = await User.findById(objectId).exec();

      if (!userData) {
        throw new Error("User not found");
      }
      const hashpass: string = await bcrypt.hash(password, 10);
      userData.password = hashpass; // Assuming userData has a password field
      const result = await userData.save();
      return result;
    } catch (error) {
      console.error("Error in UserService.resetPassword:", error);
      throw error;
    }
  }

  async findMechanicsNearLocation(
    lat: number,
    lon: number,
    type: string,
    maxDistance: number = 5000
  ) {
    try {
      const query = type === "all" ? {} : { type: type };

      const mechanics = await MechanicData.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lon, lat] },
            distanceField: "distance",
            maxDistance: maxDistance,
            spherical: true,
            query: query,
          },
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
            distanceKm: { $divide: ["$distance", 1000] },
            walkingTime: { $divide: ["$distance", 5000 / 60] }, // 5 km/h
            bikingTime: { $divide: ["$distance", 15000 / 60] }, // 15 km/h
            drivingTime: { $divide: ["$distance", 40000 / 60] }, // 40 km/h
          },
        },
      ]);

      // const MData: MechnicDoc | null = await Mechanic.findOne({ mechanics. }).exec();

      const formattedMechanics = await Promise.all(
        mechanics.map(async (mechanic) => {
          try {
            const mechData = await Mechanic.findOne({
              _id: mechanic.mechanicID,
            })
              .select("name email phone")
              .exec();

            const averageRating = await FeedBack.aggregate([
              { $match: { mechanic: mechanic.mechanicID } },
              {
                $group: {
                  _id: "$mechanic",
                  averageRating: { $avg: "$rating" },
                },
              },
            ]);

            return {
              ...mechanic,
              averageRating: averageRating,
              mechData: mechData || null,
              distanceKm: Number(mechanic.distanceKm.toFixed(2)),
              walkingTime: Number(mechanic.walkingTime.toFixed(2)),
              bikingTime: Number(mechanic.bikingTime.toFixed(2)),
              drivingTime: Number(mechanic.drivingTime.toFixed(2)),
            };
          } catch (error) {
            return {
              ...mechanic,
              mechData: null, // Handle the error case
              distanceKm: Number(mechanic.distanceKm.toFixed(2)),
              walkingTime: Number(mechanic.walkingTime.toFixed(2)),
              bikingTime: Number(mechanic.bikingTime.toFixed(2)),
              drivingTime: Number(mechanic.drivingTime.toFixed(2)),
            };
          }
        })
      );

      return formattedMechanics;
    } catch (error) {
      console.error("Error finding mechanics:", error);
      throw error;
    }
  }

  async createBooking(bookingData: IBooking): Promise<IBooking> {
    try {
      const newBooking = new Booking(bookingData);
      return await newBooking.save();
    } catch (error) {
      console.error("Error in createBooking:", error);
      throw error;
    }
  }

  async fetchBookData(id: string, type: string): Promise<any> {
    try {
      let bookData;

      if (type === "All") {
        bookData = await Booking.find({ user: id })
          .populate({
            path: "mechanic",
            select:
              "-password -isBlocked -isUser -isVerified -createdAt -updatedAt",
          })
          .exec();
      } else {
        bookData = await Booking.find({ status: type, user: id })
          .populate({
            path: "mechanic",
            select:
              "-password -isBlocked -isUser -isVerified -createdAt -updatedAt",
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

  async fetchPayment(id: string): Promise<any> {
    try {
      const paymentData = await Payment.find({ user: id })
        .sort({ createdAt: -1 })
        .populate({
          path: "mechanic",
          select: "name _id email phone mechanicdataID",
        })
        .populate("services");

      console.log("fetchPayment", paymentData);
      return paymentData;
    } catch (error) {
      console.error("Error fetching payments:", error);
      throw error; // Re-throw the error to handle it outside if needed
    }
  }

  async feedback(
    rating: number,
    feedbackText: string,
    userId: string,
    mechId: string,
    paymentID: string
  ) {
    try {
      const newFeedback = new FeedBack({
        rating,
        feedback: feedbackText,
        user: userId,
        mechanic: mechId,
        payment: paymentID,
      });
      const result = await newFeedback.save();
      return result;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  }

  async updateFeedback(id: string, rating: string, feedback: string) {
    try {
      const result = await FeedBack.findByIdAndUpdate(
        id,
        {
          rating: rating,
          feedback: feedback,
        },
        {
          new: true,
        }
      );

      if (!result) {
        throw new Error("User not found");
      }
      return result;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  }

  async feedBackCheck(id: string): Promise<any> {
    try {
      const feedback = await FeedBack.find({ payment: id });

      if (feedback) {
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
      return randomBlogs;
    } catch (error) {
      console.error("Error in fetchBlogs:", error);
      throw error;
    }
  }

  async fetchAllBlogs(): Promise<any> {
    try {
      const response = await Blog.find();
      return response;
    } catch (error) {
      console.error("Error in fetchAllBlogs:", error);
      throw error;
    }
  }

  async fetchAllService(): Promise<{ new: any[]; popular: any[] }> {
    try {
      // Fetch the 10 newest services, sorted by creation date
      const newServices = await Service.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select(
          "_id serviceName serviceDetails price imageUrl createdAt mechanic"
        );

      // Lookup mechanic's name for the new services
      const newServicesWithMechanic = await Service.aggregate([
        { $match: { _id: { $in: newServices.map((service) => service._id) } } },
        {
          $lookup: {
            from: "mechanics", // Collection containing mechanic information
            localField: "mechanic", // Field in Service that refers to the mechanic ID
            foreignField: "_id", // Field in the Mechanics collection that matches the mechanic ID
            as: "mechanicDetails", // Resulting field containing the mechanic's details
          },
        },
        { $unwind: "$mechanicDetails" }, // Unwind to get mechanic details as an object
        {
          $project: {
            _id: 1,
            serviceName: 1,
            serviceDetails: 1,
            price: 1,
            imageUrl: 1,
            createdAt: 1,
            mechanicName: "$mechanicDetails.name", // Extract the mechanic's name
          },
        },
      ]);

      // Fetch the 10 most popular services based on the count of occurrences in payments
      const popularServices = await Payment.aggregate([
        { $unwind: "$services" },
        { $group: { _id: "$services", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "services",
            localField: "_id",
            foreignField: "_id",
            as: "serviceDetails",
          },
        },
        { $unwind: "$serviceDetails" },
        {
          $lookup: {
            from: "mechanics",
            localField: "serviceDetails.mechanic",
            foreignField: "_id",
            as: "mechanicDetails",
          },
        },
        { $unwind: "$mechanicDetails" },
        {
          $project: {
            _id: "$serviceDetails._id",
            serviceName: "$serviceDetails.serviceName",
            serviceDetails: "$serviceDetails.serviceDetails",
            price: "$serviceDetails.price",
            imageUrl: "$serviceDetails.imageUrl",
            createdAt: "$serviceDetails.createdAt",
            mechanicName: "$mechanicDetails.name", // Include the mechanic's name
          },
        },
      ]);
      return {
        new: newServicesWithMechanic,
        popular: popularServices,
      };
    } catch (error) {
      console.error("Error fetching services:", error);
      throw new Error("Failed to fetch services");
    }
  }

  async fetchAllshop(serviceName: string) {
    try {
      const result = await Service.aggregate([
        {
          $match: { serviceName: serviceName },
        },
        {
          $lookup: {
            from: "mechanics",
            localField: "mechanic",
            foreignField: "_id",
            as: "mechanicDetails",
          },
        },
        { $unwind: "$mechanicDetails" },
        {
          $lookup: {
            from: "mechanicdatas",
            localField: "mechanicDetails.mechanicdataID",
            foreignField: "_id",
            as: "mechanicData",
          },
        },
        { $unwind: "$mechanicData" },
        {
          $project: {
            _id: 0,
            "mechanicDetails.name": 1,
            mechanicData: 1,
          },
        },
      ]);

      return result;
    } catch (error) {
      console.error("Error fetching services:", error);
      throw new Error("Failed to fetch services");
    }
  }

  async bookingdata(id: string): Promise<any> {
    try {
      const result: any = await MechanicData.find({ _id: id });
      if (result.length > 0) {
        const mechId = result[0].mechanicID;
        const result1 = await Mechanic.find({ _id: mechId });
        const name = result1[0].name;
        const yearsOfExperience = result[0].yearsOfExperience;
        const specialization = result[0].specialization;
        const profileImages = result[0].profileImages[0];
        const services = result[0].services;
        let arr = [
          mechId,
          name,
          yearsOfExperience,
          specialization,
          profileImages,
          services,
        ];
        return arr;
      } else {
        throw new Error("No data found for the given ID");
      }
    } catch (error) {
      console.error("Error in bookingdata:", error);
      throw error;
    }
  }

  async reviewData(id: string): Promise<any> {
    try {
      const feedbackWithUserDetails = await FeedBack.aggregate([
        {
          $match: { mechanic: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: "users", // Collection name for users
            localField: "user", // Field from the feedback documents
            foreignField: "_id", // Field from the users collection
            as: "userDetails", // Output array name
          },
        },
        {
          $unwind: {
            path: "$userDetails", // Unwind the userDetails array
          },
        },
        {
          $project: {
            _id: 1,
            feedback: 1,
            rating: 1,
            date: 1,
            "userDetails.name": 1, // Select fields from userDetails
            "userDetails.email": 1,
            "userDetails.imageUrl": 1,
          },
        },
      ]);

      return feedbackWithUserDetails;
    } catch (error) {
      console.error("Error in reviewData:", error);
      throw error;
    }
  }

  async fetchFreelancer() {
    try {
      const result = await MechanicData.find({ type: "freelancer" });
      return result;
    } catch (error) {
      console.error("Error fetching services:", error);
      throw new Error("Failed to fetch services");
    }
  }

  //Chat
  async allUsers(keyword: string): Promise<any> {
    try {
      const searchQuery = keyword
        ? {
          $or: [
            { name: { $regex: keyword, $options: "i" } },
            { email: { $regex: keyword, $options: "i" } },
          ],
        }
        : {};

      const users = await Mechanic.find(searchQuery);
      return users;
    } catch (error) {
      console.error("Error in allUsers:", error);
      throw error;
    }
  }

  async createChat(senderId: any, receiverId: any): Promise<any> {
    try {
      let chat: any | null = await Chat2.findOne({
        users: { $all: [senderId, receiverId] },
      });

      if (chat) {
        const populatedChat = await Chat2.aggregate([
          { $match: { _id: chat._id } },
          {
            $lookup: {
              from: "users", // Collection name for users
              localField: "users",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $lookup: {
              from: "mechanics", // Collection name for mechanics
              localField: "users",
              foreignField: "_id",
              as: "mechanicDetails",
            },
          },
          {
            $project: {
              _id: 1,
              isGroupChat: 1,
              users: 1,
              userDetails: 1,
              mechanicDetails: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ]);
        return populatedChat[0]; // Return the first result
      }

      const newChat = new Chat2({
        users: [senderId, receiverId],
        isGroupChat: false,
      });

      chat = await newChat.save();

      const populatedNewChat = await Chat2.aggregate([
        { $match: { _id: chat._id } },
        {
          $lookup: {
            from: "users",
            localField: "users",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "mechanics",
            localField: "users",
            foreignField: "_id",
            as: "mechanicDetails",
          },
        },
        {
          $project: {
            _id: 1,
            isGroupChat: 1,
            users: 1,
            userDetails: 1,
            mechanicDetails: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      return populatedNewChat[0];
    } catch (error) {
      console.error("Error in createChat:", error);
      throw error;
    }
  }

  async fetchChats(senderId: string) {
    try {
      let chats = await Chat2.aggregate([
        {
          $match: {
            users: {
              $elemMatch: { $eq: new mongoose.Types.ObjectId(senderId) },
            },
          },
        },
        {
          $lookup: {
            from: "mechanics",
            localField: "users.0",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "users.1",
            foreignField: "_id",
            as: "mechanicDetails",
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "latestMessage",
            foreignField: "_id",
            as: "latestMessageDetails",
          },
        },
        { $unwind: "$userDetails" },
        { $unwind: "$mechanicDetails" },
        { $unwind: "$latestMessageDetails" },
        {
          $project: {
            "userDetails.password": 0,
            "userDetails.isVerified": 0,
            "mechanicDetails.isVerified": 0,
            "mechanicDetails.isMechanic": 0,
            "mechanicDetails.isCompleted": 0,
            "mechanicDetails.password": 0,
            "userDetails.__v": 0,
            "mechanicDetails.__v": 0,
          },
        },
      ]);
      return chats;
    } catch (error) {
      console.error("Error in fetchChats:", error);
      throw error;
    }
  }

  async sendMessage(content: string, chatId: string, senderId: string) {
    try {
      let newMessage: any = await Message.create({
        sender: senderId,
        content: content,
        chat: chatId,
      });

      // Update the latest message in the chat
      await Chat2.findByIdAndUpdate(chatId, {
        latestMessage: newMessage._id,
      });

      // Find the newly created message and populate sender and chat data using aggregation
      let populatedMessage = await Message.aggregate([
        {
          $match: {
            _id: newMessage._id,
          },
        },
        {
          $lookup: {
            from: "users", // Database/collection for mechanics (sender)
            localField: "sender",
            foreignField: "_id",
            as: "senderInfo", // Populate sender data
          },
        },
        {
          $unwind: "$senderInfo", // Unwind sender data
        },
        {
          $lookup: {
            from: "chats", // Database/collection for chats
            localField: "chat",
            foreignField: "_id",
            as: "chatInfo", // Populate chat data
          },
        },
        {
          $unwind: "$chatInfo", // Unwind chat data
        },
        {
          $lookup: {
            from: "mechanics", // Users collection to populate user and mechanic
            localField: "chatInfo.users",
            foreignField: "_id",
            as: "chatInfo.usersDetails", // Populate user and mechanic details
          },
        },
        // Project to exclude sensitive fields
        {
          $project: {
            "senderInfo.password": 0,
            "senderInfo.isBlocked": 0,
            "chatInfo.usersDetails.password": 0,
            "chatInfo.usersDetails.isBlocked": 0,
            "chatInfo.usersDetails.isUser": 0, // Add more if needed
          },
        },
      ]);
      return populatedMessage[0]; // Return the populated message document without sensitive data
    } catch (error) {
      console.error("Error in sendMessage:", error);
      throw error;
    }
  }

  async getAllMessages(chatId: string) {
    try {
      const messages = await Message.aggregate([
        {
          $match: { chat: new mongoose.Types.ObjectId(chatId) },
        },
        {
          $lookup: {
            from: "users", // Assuming your mechanics collection is named "mechanics"
            localField: "sender",
            foreignField: "_id",
            as: "senderDetails",
          },
        },
        {
          $unwind: {
            path: "$senderDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            content: 1,
            chat: 1,
            createdAt: 1,
            updatedAt: 1,
            sender: {
              _id: "$senderDetails._id",
              name: "$senderDetails.name",
              email: "$senderDetails.email",
            },
          },
        },
        {
          $sort: { createdAt: 1 },
        },
      ]);
      return messages;
    } catch (error) {
      console.error("Error in getAllMessages:", error);
      throw error;
    }
  }
}

export default UserRepository;

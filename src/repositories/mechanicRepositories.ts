import mongoose from "mongoose";
import { IBlog, IMechanicData, IService, MechnicDoc } from "../interfaces/IMechanic";
import Mechanic from "../models/mechanicModel";
import MechanicData from "../models/mechanicdataModel";
import { Types } from 'mongoose';
import Service from "../models/serviceModel";
import Chat2 from "../models/chatModel2";
import bcrypt from 'bcrypt';
import { deleteFileFromS3 } from "../middleware/s3UploadMiddleware";
import Booking from "../models/mechanikBookingModel";
import Payment from "../models/paymentModel";
import Blog from "../models/blogModel";
import Message from '../models/messageModel2';
import { error } from "console";

class mechanicRepositories {

    async findUserByEmail(email: string): Promise<MechnicDoc | null> {
        try {
            const userData: MechnicDoc | null = await Mechanic.findOne({ email }).exec();
            return userData;
        } catch (error) {
            console.error("Error in findUserByEmail:", error);
            throw error;
        }
    }

    async createMechanic(name: string, email: string, phone: string, password: string): Promise<MechnicDoc | undefined> {
        try {
            const newMechanic = new Mechanic({ name, email, phone, password });
            const mechanic = await newMechanic.save();
            return mechanic;
        } catch (error) {
            console.log(error);
            throw new Error((error as Error).message || 'An error createMechanic');

        }
    }

    async login(email: string, password: string) {
        try {
            const mechanic = await Mechanic.findOne({ email }).select('-password');
            if (!mechanic) {
                return { status: false, message: "mechanic not found." };
            }
            if (!mechanic.isVerified) {
                return { isVerified: false, message: "mechanic not verified." };
            }

            const mechanicWithPassword = await Mechanic.findOne({ email }).select('+password');
            if (!mechanicWithPassword) {
                return { status: false, message: "mechanic not found for password validation." };
            }

            const isPasswordValid = await bcrypt.compare(password, mechanicWithPassword.password);
            if (!isPasswordValid) {
                return { status: false, message: "Invalid password." };
            }

            return { status: true, mechanic };
        } catch (error) {
            console.error(error);
            return { status: false, message: "An error occurred during login." };
        }
    }

    async findUserById(userId: string): Promise<MechnicDoc | null> {
        try {
            const userData: MechnicDoc | null = await Mechanic.findOne({ _id: userId }).exec();
            return userData;
        } catch (error) {
            console.error("Error in findUserById:", error);
            throw error;
        }
    }

    async resetPassword(password: string, userId: string) {
        try {

            if (!userId || !password) {
                throw new Error('User ID and password are required');
            }
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid user ID');
            }
            const objectId = new mongoose.Types.ObjectId(userId);
            const userData: MechnicDoc | null = await Mechanic.findById(objectId).exec();

            if (!userData) {
                throw new Error('User not found');
            }
            const hashpass: string = await bcrypt.hash(password, 10);
            userData.password = hashpass;
            const result = await userData.save();
            return result
        } catch (error) {
            console.error('Error in UserService.resetPassword:', error);
            throw error;
        }
    }

    async registerData(uploadUrls: Record<string, string>, body: any): Promise<IMechanicData> {

        try {

            const formatImage = (url: string): { url: string; contentType: string } => ({
                url,
                contentType: 'image/jpeg',
            });

            const profileImages = [
                uploadUrls.profileImage0,
                uploadUrls.profileImage1,
                uploadUrls.profileImage2,
                uploadUrls.profileImage3,
            ]
                .filter(Boolean)
                .map(formatImage);

            const mechanicID = Types.ObjectId.createFromHexString(body.ID);

            // Parse and validate coordinates
            const longitude = parseFloat(body.longitude);
            const latitude = parseFloat(body.latitude);

            if (isNaN(longitude) || isNaN(latitude)) {
                throw new Error('Invalid coordinates provided. Longitude and latitude must be valid numbers.');
            }

            // Parse working hours
            const workingHours = body.workingHours.map((schedule: any) => ({
                days: schedule.days, // Expecting an array of strings representing days
                startTime: schedule.startTime, // Expecting a string representing start time
                endTime: schedule.endTime, // Expecting a string representing end time
            }));

            // Create mechanic data instance
            const mechanicData = new MechanicData({
                mechanicID: mechanicID,
                type: body.type,
                licenseNumber: body.licenseNumber,
                yearsOfExperience: body.yearsOfExperience,
                specialization: body.specialization,
                district: body.district,
                location: {
                    type: "Point",
                    coordinates: [longitude, latitude], // Ensure this is an array of numbers
                },
                locationName: body.locationName,
                services: body.services,
                description: body.description,
                profileImages: profileImages,
                certificate: uploadUrls.certificate
                    ? formatImage(uploadUrls.certificate)
                    : null,
                workingHours: workingHours,
            });

            // Save mechanic data
            const result = await mechanicData.save();
            if (result) {
                await Mechanic.findOneAndUpdate(
                    { _id: mechanicID },
                    {
                        isCompleted: true,
                        mechanicdataID: result._id,
                    },
                    { new: true }
                );
            }

            return mechanicData;
        } catch (error) {
            console.error('Error in registerData:', error);
            const imagesToDelete = [
                uploadUrls.certificate,
                uploadUrls.profileImage0,
                uploadUrls.profileImage1,
                uploadUrls.profileImage2,
                uploadUrls.profileImage3,
            ].filter(Boolean);

            // Clean up uploaded images if the registration fails
            await Promise.all(imagesToDelete.map(deleteFileFromS3));
            throw new Error('Failed to register mechanic data');
        }
    }

    async getmechData(id: string): Promise<any> {
        try {
            const objectId = new mongoose.Types.ObjectId(id);
            const result = await Mechanic.find({ _id: objectId });
            return result;
        } catch (error) {
            console.error("Error in repository layer:", error);
            throw new Error('Database query failed');
        }
    }

    async getDetailData(id: string): Promise<any> {
        try {
            const objectId = new mongoose.Types.ObjectId(id);
            const result = await Mechanic.aggregate([
                { $match: { _id: objectId } },
                {
                    $lookup: {
                        from: "mechanicdatas",
                        localField: "mechanicdataID",
                        foreignField: "_id",
                        as: "mechanicData"
                    }
                },
                { $unwind: "$mechanicData" },
                {
                    $project: {
                        password: 0,
                        "mechanicData.password": 0
                    }
                }
            ]);
            return result
        } catch (error) {
            console.error("Error in repository layer:", error);
            throw new Error('Database query failed');
        }
    }

    async fetchUsers(id: string): Promise<any> {
        try {
            const bookings = await Booking.find({ mechanic: id })
                .populate({
                    path: 'user',
                    select: '-password -isBlocked -isUser -isVerified -createdAt -updatedAt'
                })
                .sort({ bookingTime: -1 }) // Sort by bookingTime in descending order
                .exec();

            return bookings;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            throw error;
        }
    }

    async statusUpdate(id: string, status: string): Promise<any> {
        try {
            const objectId = new mongoose.Types.ObjectId(id);

            // Update the status field using $set
            const result = await Booking.updateOne(
                { _id: objectId }, // Filter criteria
                { $set: { status: status } } // Update operation
            );

            if (result.modifiedCount > 0) {
                console.log("Status updated successfully.");
            } else {
                console.log("No document found or status unchanged.");
            }
            return result
        } catch (error) {
            console.log("Error updating status:", error);
        }



    }

    async nameExists(serviceName: string, fileUrl: string): Promise<boolean> {
        const existingService = await Service.findOne({ serviceName });
        try {
            if (existingService) {
                await deleteFileFromS3(fileUrl);
            }
        } catch (deleteError) {
            console.error("Error deleting image from S3:", deleteError);
            throw new Error((error as unknown as Error).message || 'An error occurred');

        }
        return !!existingService;
    }

    async addService(serviceData: IService): Promise<any> {
        try {
            const { name, details, price, fileUrl, id } = serviceData;
            let img: any = serviceData.fileUrl
            // const isNameExist = await this.nameExists(name, img);
            // if (isNameExist) {
            //     console.log("Service name already exists.");
            //     return { error: "Service name already exists." };
            // }
            const newService = new Service({
                mechanic: id,
                serviceName: name,
                serviceDetails: details,
                price: price,
                imageUrl: fileUrl
            });
            const savedService = await newService.save();
            return { message: 'Service added successfully', savedService }
        } catch (error) {
            console.error("Error in repository:", error);
            const imageUrl: any = serviceData.fileUrl;
            try {
                await deleteFileFromS3(imageUrl);
            } catch (deleteError) {
                console.error("Error deleting image from S3:", deleteError);
                throw new Error((error as Error).message || 'An error occurred');

            }

            return null;
        }
    }

    async fetchService(id: String): Promise<any> {
        try {
            const result = await Service.find({ mechanic: id })
            return result
        } catch (error) {
            console.log(error);
            throw new Error((error as Error).message || 'An error occurred');

        }
    }

    async searchUsers(keyword: string, id: string): Promise<any> {
        try {
            const result = await Booking.find({ mechanic: id })
                .populate({
                    path: 'user',
                    select: '-password'
                });

            const seenUserIds: any = new Set();
            const filteredUsers = result
                .filter(booking => {
                    const user: any = booking.user;
                    const regex = new RegExp(keyword, 'i');
                    return regex.test(user?.name);
                })
                .map(booking => booking.user)
                .filter(user => {
                    const userId = (user as any)._id;  // Casting to 'any' to access '_id'
                    if (!seenUserIds.has(userId.toString())) {
                        seenUserIds.add(userId.toString());
                        return true;
                    }
                    return false;
                });

            return filteredUsers;

        } catch (error) {
            console.error(error);
            throw new Error("Failed to fetch users");
        }
    }

    async searchServices(keyword: string, mechanicId: String): Promise<any> {
        try {
            const services = await Service.find({ mechanic: mechanicId });

            const filteredServices = services.filter(service => {
                const regex: any = new RegExp(keyword, 'i');
                return regex.test(service.serviceName);
            });

            return filteredServices;
        } catch (error) {
            console.error('Error searchServices:', error);
            throw error;
        }
    }

    async createBill(userId: string, name: string, vehicleNumber: any, services: any, subtotal: any, gst: any, total: any, mechId: any): Promise<any> {
        try {

            const servicePayment = new Payment({
                gst: gst,
                mechanic: mechId,
                name: name,
                services: services,
                subtotal: subtotal,
                total: total,
                user: userId,
                vehicleNumber: vehicleNumber
            })

            const result = await servicePayment.save()


        } catch (error) {
            console.error('Error createBill:', error);
            throw error;
        }
    }

    async createBlog(blogData: IBlog): Promise<any> {
        try {
            const { id, name, positionName, heading, description, fileUrl } = blogData;

            const newBlog = new Blog({
                mechanic: id,
                name: name,
                positionName: positionName,
                heading: heading,
                description: description,
                imageUrl: fileUrl
            });
            const savedBlog = await newBlog.save();
            return { message: 'Blog added successfully', savedBlog }
        } catch (error) {
            console.error("Error in repository:", error);
            const imageUrl: any = blogData.fileUrl;
            try {
                await deleteFileFromS3(imageUrl);
            } catch (deleteError) {
                console.error("Error deleting image from S3:", deleteError);
            }

            return null;
        }
    }

    async fetchBlog(id: String): Promise<any> {
        try {
            const result = await Blog.find({ mechanic: id })
            return result
        } catch (error) {
            console.error('Error fetchBlog:', error);
            throw error;
        }
    }

    async deleteBlog(id: String): Promise<any> {
        try {
            const result = await Blog.find({ _id: id })
            let img = result[0].imageUrl
            await deleteFileFromS3(img);
            const result1 = await Blog.deleteOne({ _id: id });
            return result1
        } catch (error) {
            console.error('Error deleteBlog:', error);
            throw error;
        }
    }

    async fetchEditBlog(id: String): Promise<any> {
        try {
            const result = await Blog.find({ _id: id })
            return result
        } catch (error) {
            console.error('Error fetchEditBlog:', error);
            throw error;

        }
    }

    async editBlog(blogData: IBlog): Promise<any> {
        try {
            const { id, name, positionName, heading, description, fileUrl } = blogData;

            // Find the existing blog by ID
            const existingBlog = await Blog.findById(id);
            if (!existingBlog) {
                return { message: 'Blog not found', savedBlog: null };
            }

            // If the image URL is updated, delete the old image from S3
            if (fileUrl && existingBlog.imageUrl && existingBlog.imageUrl !== fileUrl) {
                try {
                    await deleteFileFromS3(existingBlog.imageUrl);
                } catch (deleteError) {
                    console.error("Error deleting image from S3:", deleteError);
                }
            }

            // Update the blog data
            existingBlog.name = name || existingBlog.name;
            existingBlog.positionName = positionName || existingBlog.positionName;
            existingBlog.heading = heading || existingBlog.heading;
            existingBlog.description = description || existingBlog.description;
            existingBlog.imageUrl = fileUrl || existingBlog.imageUrl;

            // Save the updated blog
            const updatedBlog = await existingBlog.save();

            return { message: 'Blog updated successfully', updatedBlog };
        } catch (error) {
            console.error("Error in repository:", error);

            // Attempt to delete the image from S3 if an error occurs
            const imageUrl: any = blogData.fileUrl;
            try {
                await deleteFileFromS3(imageUrl);
            } catch (deleteError) {
                console.error("Error deleting image from S3:", deleteError);
            }

            return null;
        }
    }

    async paymentFetch(id: String): Promise<any> {
        try {
            const paymentData = await Payment.find({ mechanic: id })
                .sort({ createdAt: -1 })
                .populate({
                    path: 'user',
                    select: 'name _id email phone '
                })
                .populate('services');

            return paymentData;
        } catch (error) {
            console.error('Error paymentFetch :', error);
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

            // If chat does not exist, create a new chat
            const newChat = new Chat2({
                users: [senderId, receiverId],
                isGroupChat: false,
            });

            chat = await newChat.save();

            // Aggregate user details after creating the new chat
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


            return populatedNewChat[0]; // Return the first result
        } catch (error) {
            console.error("Error in repository:", error);
            throw error;
        }
    }

    async sendMessage(content: string, chatId: string, senderId: string) {
        try {

            // Create the new message
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
                        from: "mechanics", // Database/collection for mechanics (sender)
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
                        from: "users", // Users collection to populate user and mechanic
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
                    }
                }
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
                    $match: { chat: new mongoose.Types.ObjectId(chatId) }
                },
                {
                    $lookup: {
                        from: "mechanics", // Assuming your mechanics collection is named "mechanics"
                        localField: "sender",
                        foreignField: "_id",
                        as: "senderDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$senderDetails",
                        preserveNullAndEmptyArrays: true
                    }
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
                        }
                    }
                },
                {
                    $sort: { createdAt: 1 }
                }
            ]);
            return messages;
        } catch (error) {
            console.error('Error in getAllMessages:', error);
            throw error;
        }
    }

    async fetchChats(senderId: string) {

        try {
            let chats = await Chat2.aggregate([
                {
                    $match: {
                        users: { $elemMatch: { $eq: new mongoose.Types.ObjectId(senderId) } }
                    }
                },
                {
                    $lookup: {
                        from: "mechanics",
                        localField: "users.0",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $lookup: {
                        from: "users",  // Assuming mechanics collection is named 'mechanics'
                        localField: "users.1",  // Second user (mechanic) in the array
                        foreignField: "_id",
                        as: "mechanicDetails"
                    }
                },
                {
                    $lookup: {
                        from: "messages",  // Assuming messages collection is named 'messages'
                        localField: "latestMessage",
                        foreignField: "_id",
                        as: "latestMessageDetails"
                    }
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
                        "mechanicDetails.__v": 0
                    }
                }
            ]);
            return chats
        } catch (error) {
            console.error('Error fetchChats revenue:', error);
            throw error;
        }
    }

    async fetchRevenue(mechanicId: string) {
        try {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1);
            const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

            const payments: any = await Payment.find({
                mechanic: mechanicId,
                status: 'Completed',
                createdAt: { $gte: startOfYear, $lte: endOfYear }
            });

            const monthlyRevenue = Array(12).fill(0);

            payments.forEach((payment: { createdAt: { getMonth: () => any; }; total: any; }) => {
                const month: any = payment.createdAt.getMonth();
                monthlyRevenue[month] += payment.total;
            });
            return monthlyRevenue;
        } catch (error) {
            console.error('Error fetching revenue:', error);
            throw error;
        }
    }

    async fetchUserGrowths(mechanicId: any) {

        try {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1);
            const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

            const bookings = await Booking.aggregate([
                {
                    $match: {
                        mechanic: new mongoose.Types.ObjectId(mechanicId),
                        bookingTime: { $gte: startOfYear, $lte: endOfYear }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                },
                {
                    $unwind: '$userDetails'
                },
                {
                    $group: {
                        _id: { $month: '$bookingTime' },
                        uniqueUsers: { $addToSet: '$user' }
                    }
                },
                {
                    $project: {
                        month: '$_id',
                        userCount: { $size: '$uniqueUsers' }
                    }
                },
                {
                    $sort: { month: 1 }
                }
            ]);

            // Initialize an array with 12 zeros
            const monthlyUserGrowth = Array(12).fill(0);

            // Fill in the actual data
            bookings.forEach(booking => {
                monthlyUserGrowth[booking.month - 1] = booking.userCount;
            });
            return monthlyUserGrowth;
        } catch (error) {
            console.error('Error fetching user growth:', error);
            throw error;
        }
    }

    async fetchMechData(id: string) {
        try {
            const mechData = await Mechanic.find({ _id: id });
            if (!mechData || mechData.length === 0) {
                throw new Error('Mechanic not found');
            }
    
            const mechId = mechData[0].mechanicdataID;
            const mechDataAllData:any = await MechanicData.find({ _id: mechId });
            if (!mechDataAllData || mechDataAllData.length === 0) {
                throw new Error('Mechanic details not found');
            }
    
            // Extract only needed fields from mechData
            const basicInfo = {
                _id: mechData[0]._id,
                name: mechData[0].name,
                email: mechData[0].email,
                phone: mechData[0].phone,
                mechanicdataID: mechData[0].mechanicdataID
            };
    
            // Combine with mechanic details
            const combinedData = {
                ...basicInfo,
                location: mechDataAllData[0].location,
                certificate: mechDataAllData[0].certificate,
                type: mechDataAllData[0].type,
                licenseNumber: mechDataAllData[0].licenseNumber,
                yearsOfExperience: mechDataAllData[0].yearsOfExperience,
                specialization: mechDataAllData[0].specialization,
                district: mechDataAllData[0].district,
                locationName: mechDataAllData[0].locationName,
                services: mechDataAllData[0].services,
                description: mechDataAllData[0].description,
                profileImages: mechDataAllData[0].profileImages,
                workingHours: mechDataAllData[0].workingHours
            };
                
            return combinedData;

        } catch (error) {
            console.error('Error fetching fetchMechData:', error);
            throw error;
        }

    }


}

export default mechanicRepositories
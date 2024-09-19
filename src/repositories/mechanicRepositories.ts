import mongoose from "mongoose";
import { IBlog, IChat, IMechanicData, IService, MechnicDoc } from "../interfaces/IMechanic";
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

        }
    }

    async login(email: string, password: string) {
        try {
            const mechanic = await Mechanic.findOne({ email }).select('-password');
            console.log("user", mechanic);

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
            console.log('Password reset successful for user:', userId);
            return result
        } catch (error) {
            console.error('Error in UserService.resetPassword:', error);
            throw error;
        }
    }

    async registerData(uploadUrls: Record<string, string>, body: any): Promise<IMechanicData> {
        console.log("ff,", body);

        try {
            console.log("Processing data...");

            // Utility function to format images
            const formatImage = (url: string): { url: string; contentType: string } => ({
                url,
                contentType: 'image/jpeg',
            });

            // Collect profile images
            const profileImages = [
                uploadUrls.profileImage0,
                uploadUrls.profileImage1,
                uploadUrls.profileImage2,
                uploadUrls.profileImage3,
            ]
                .filter(Boolean)
                .map(formatImage);

            // Parse mechanic ID
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
                .exec();
            console.log(bookings);

            return bookings;

        } catch (error) {

        }
    }

    async statusUpdate(id: string, status: string): Promise<any> {
        try {
            const objectId = new mongoose.Types.ObjectId(id);
            console.log("Converted ObjectId:", objectId);

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
        }
        return !!existingService;
    }

    async addService(serviceData: IService): Promise<any> {
        try {
            const { name, details, price, fileUrl, id } = serviceData;
            let img: any = serviceData.fileUrl
            const isNameExist = await this.nameExists(name, img);
            if (isNameExist) {
                console.log("Service name already exists.");
                return { error: "Service name already exists." };
            }
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
            }

            return null;
        }
    }

    async fetchService(id: String): Promise<any> {
        try {
            const result = await Service.find({ mechanic: id })
            console.log(result);
            return result
        } catch (error) {
            console.log(error);

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

            console.log("Filtered Users:", filteredUsers);
            return filteredUsers;

        } catch (error) {
            console.log(error);
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

            console.log("Filtered Services:", filteredServices);
            return filteredServices;
        } catch (error) {
            console.log(error);

        }
    }

    async createBill(userId: any, name: any, vehicleNumber: any, services: any, subtotal: any, gst: any, total: any, mechId: any): Promise<any> {
        try {
            console.log("User ID:", userId);
            console.log("Name:", name);
            console.log("Vehicle Number:", vehicleNumber);
            console.log("Services:", services);
            console.log("Subtotal:", subtotal);
            console.log("GST:", gst);
            console.log("Total:", total);
            console.log("Mechanic ID:", mechId);

            // const result = await Payment.

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
            console.log(error);

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
            console.log(result);
            return result
        } catch (error) {
            console.log(error);

        }
    }

    async deleteBlog(id: String): Promise<any> {
        try {
            console.log("id", id);
            const result = await Blog.find({ _id: id })
            console.log(result[0].imageUrl);
            let img = result[0].imageUrl
            await deleteFileFromS3(img);
            const result1 = await Blog.deleteOne({ _id: id });
            return result1
        } catch (error) {
            console.log(error);

        }
    }

    async fetchEditBlog(id: String): Promise<any> {
        try {
            console.log("id", id);
            const result = await Blog.find({ _id: id })
            console.log("ssss", result);
            return result
        } catch (error) {
            console.log(error);

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

            console.log("fetchPayment", paymentData);
            return paymentData;
        } catch (error) {
            console.log(error);

        }
    }

    async createChat(senderId: any, receiverId: any): Promise<any> {
        try {
            console.log("lok", senderId, receiverId);

            let chat: any | null = await Chat2.findOne({
                users: { $all: [senderId, receiverId] },
            });

            // If chat exists, aggregate and return it
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
                console.log("Return the first result", populatedChat[0]);
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

            console.log(populatedNewChat[0]);

            return populatedNewChat[0]; // Return the first result
        } catch (error) {
            console.error("Error in repository:", error);
        }
    }

    // async sendMessage(content: string, chatId: string, senderId: string) {
    //     try {
    //         console.log("Sending message:", content, chatId, senderId);

    //         // Create the new message
    //         let newMessage: any = await Message.create({
    //             sender: senderId,
    //             content: content,
    //             chat: chatId,
    //         });

    //         console.log("New message created:", newMessage);

    //         // Update the latest message in the chat
    //         await Chat2.findByIdAndUpdate(chatId, {
    //             latestMessage: newMessage._id,
    //         });

    //         // Find the newly created message and populate sender and chat data using aggregation
    //         let populatedMessage = await Message.aggregate([
    //             {
    //                 $match: {
    //                     _id: newMessage._id,
    //                 },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "mechanics", // Database/collection for mechanics (sender)
    //                     localField: "sender",
    //                     foreignField: "_id",
    //                     as: "senderInfo", // Populate sender data
    //                 },
    //             },
    //             {
    //                 $unwind: "$senderInfo", // Unwind sender data if it's an array
    //             },
    //             {
    //                 $lookup: {
    //                     from: "chats", // Database/collection for chats
    //                     localField: "chat",
    //                     foreignField: "_id",
    //                     as: "chatInfo", // Populate chat data
    //                 },
    //             },
    //             {
    //                 $unwind: "$chatInfo", // Unwind chat data if it's an array
    //             },
    //             {
    //                 $lookup: {
    //                     from: "users", // Users collection to populate user and mechanic
    //                     localField: "chatInfo.users",
    //                     foreignField: "_id",
    //                     as: "chatInfo.usersDetails", // Populate user and mechanic details
    //                 },
    //             },
    //         ]);

    //         console.log("Populated message:", populatedMessage);

    //         return populatedMessage; // Return the populated message document
    //     } catch (error) {
    //         console.error("Error in sendMessage:", error);
    //         throw error;
    //     }
    // }

    async sendMessage(content: string, chatId: string, senderId: string) {
        try {
            console.log("Sending message:", content, chatId, senderId);
    
            // Create the new message
            let newMessage: any = await Message.create({
                sender: senderId,
                content: content,
                chat: chatId,
            });
    
            console.log("New message created:", newMessage);
    
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
    
            console.log("Populated message:", populatedMessage);
    
            return populatedMessage[0]; // Return the populated message document without sensitive data
        } catch (error) {
            console.error("Error in sendMessage:", error);
            throw error;
        }
    }
    


}

export default mechanicRepositories
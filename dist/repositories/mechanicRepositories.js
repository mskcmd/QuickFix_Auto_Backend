"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mechanicModel_1 = __importDefault(require("../models/mechanicModel"));
const mechanicdataModel_1 = __importDefault(require("../models/mechanicdataModel"));
const mongoose_2 = require("mongoose");
const serviceModel_1 = __importDefault(require("../models/serviceModel"));
const chatModel2_1 = __importDefault(require("../models/chatModel2"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const s3UploadMiddleware_1 = require("../middleware/s3UploadMiddleware");
const mechanikBookingModel_1 = __importDefault(require("../models/mechanikBookingModel"));
const paymentModel_1 = __importDefault(require("../models/paymentModel"));
const blogModel_1 = __importDefault(require("../models/blogModel"));
const messageModel2_1 = __importDefault(require("../models/messageModel2"));
const console_1 = require("console");
class mechanicRepositories {
    findUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield mechanicModel_1.default.findOne({ email }).exec();
                return userData;
            }
            catch (error) {
                console.error("Error in findUserByEmail:", error);
                throw error;
            }
        });
    }
    createMechanic(name, email, phone, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newMechanic = new mechanicModel_1.default({ name, email, phone, password });
                const mechanic = yield newMechanic.save();
                return mechanic;
            }
            catch (error) {
                console.log(error);
                throw new Error(error.message || 'An error createMechanic');
            }
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mechanic = yield mechanicModel_1.default.findOne({ email }).select('-password');
                if (!mechanic) {
                    return { status: false, message: "mechanic not found." };
                }
                if (!mechanic.isVerified) {
                    return { isVerified: false, message: "mechanic not verified." };
                }
                const mechanicWithPassword = yield mechanicModel_1.default.findOne({ email }).select('+password');
                if (!mechanicWithPassword) {
                    return { status: false, message: "mechanic not found for password validation." };
                }
                const isPasswordValid = yield bcrypt_1.default.compare(password, mechanicWithPassword.password);
                if (!isPasswordValid) {
                    return { status: false, message: "Invalid password." };
                }
                return { status: true, mechanic };
            }
            catch (error) {
                console.error(error);
                return { status: false, message: "An error occurred during login." };
            }
        });
    }
    findUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield mechanicModel_1.default.findOne({ _id: userId }).exec();
                return userData;
            }
            catch (error) {
                console.error("Error in findUserById:", error);
                throw error;
            }
        });
    }
    resetPassword(password, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId || !password) {
                    throw new Error('User ID and password are required');
                }
                if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    throw new Error('Invalid user ID');
                }
                const objectId = new mongoose_1.default.Types.ObjectId(userId);
                const userData = yield mechanicModel_1.default.findById(objectId).exec();
                if (!userData) {
                    throw new Error('User not found');
                }
                const hashpass = yield bcrypt_1.default.hash(password, 10);
                userData.password = hashpass;
                const result = yield userData.save();
                return result;
            }
            catch (error) {
                console.error('Error in UserService.resetPassword:', error);
                throw error;
            }
        });
    }
    registerData(uploadUrls, body) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const formatImage = (url) => ({
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
                const mechanicID = mongoose_2.Types.ObjectId.createFromHexString(body.ID);
                // Parse and validate coordinates
                const longitude = parseFloat(body.longitude);
                const latitude = parseFloat(body.latitude);
                if (isNaN(longitude) || isNaN(latitude)) {
                    throw new Error('Invalid coordinates provided. Longitude and latitude must be valid numbers.');
                }
                // Parse working hours
                const workingHours = body.workingHours.map((schedule) => ({
                    days: schedule.days, // Expecting an array of strings representing days
                    startTime: schedule.startTime, // Expecting a string representing start time
                    endTime: schedule.endTime, // Expecting a string representing end time
                }));
                // Create mechanic data instance
                const mechanicData = new mechanicdataModel_1.default({
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
                const result = yield mechanicData.save();
                if (result) {
                    yield mechanicModel_1.default.findOneAndUpdate({ _id: mechanicID }, {
                        isCompleted: true,
                        mechanicdataID: result._id,
                    }, { new: true });
                }
                return mechanicData;
            }
            catch (error) {
                console.error('Error in registerData:', error);
                const imagesToDelete = [
                    uploadUrls.certificate,
                    uploadUrls.profileImage0,
                    uploadUrls.profileImage1,
                    uploadUrls.profileImage2,
                    uploadUrls.profileImage3,
                ].filter(Boolean);
                // Clean up uploaded images if the registration fails
                yield Promise.all(imagesToDelete.map(s3UploadMiddleware_1.deleteFileFromS3));
                throw new Error('Failed to register mechanic data');
            }
        });
    }
    getmechData(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const objectId = new mongoose_1.default.Types.ObjectId(id);
                const result = yield mechanicModel_1.default.find({ _id: objectId });
                return result;
            }
            catch (error) {
                console.error("Error in repository layer:", error);
                throw new Error('Database query failed');
            }
        });
    }
    getDetailData(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const objectId = new mongoose_1.default.Types.ObjectId(id);
                const result = yield mechanicModel_1.default.aggregate([
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
                return result;
            }
            catch (error) {
                console.error("Error in repository layer:", error);
                throw new Error('Database query failed');
            }
        });
    }
    fetchUsers(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bookings = yield mechanikBookingModel_1.default.find({ mechanic: id })
                    .populate({
                    path: 'user',
                    select: '-password -isBlocked -isUser -isVerified -createdAt -updatedAt'
                })
                    .sort({ bookingTime: -1 }) // Sort by bookingTime in descending order
                    .exec();
                return bookings;
            }
            catch (error) {
                console.error('Error fetching bookings:', error);
                throw error;
            }
        });
    }
    statusUpdate(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const objectId = new mongoose_1.default.Types.ObjectId(id);
                // Update the status field using $set
                const result = yield mechanikBookingModel_1.default.updateOne({ _id: objectId }, // Filter criteria
                { $set: { status: status } } // Update operation
                );
                if (result.modifiedCount > 0) {
                    console.log("Status updated successfully.");
                }
                else {
                    console.log("No document found or status unchanged.");
                }
                return result;
            }
            catch (error) {
                console.log("Error updating status:", error);
            }
        });
    }
    nameExists(serviceName, fileUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingService = yield serviceModel_1.default.findOne({ serviceName });
            try {
                if (existingService) {
                    yield (0, s3UploadMiddleware_1.deleteFileFromS3)(fileUrl);
                }
            }
            catch (deleteError) {
                console.error("Error deleting image from S3:", deleteError);
                throw new Error(console_1.error.message || 'An error occurred');
            }
            return !!existingService;
        });
    }
    addService(serviceData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, details, price, fileUrl, id } = serviceData;
                let img = serviceData.fileUrl;
                // const isNameExist = await this.nameExists(name, img);
                // if (isNameExist) {
                //     console.log("Service name already exists.");
                //     return { error: "Service name already exists." };
                // }
                const newService = new serviceModel_1.default({
                    mechanic: id,
                    serviceName: name,
                    serviceDetails: details,
                    price: price,
                    imageUrl: fileUrl
                });
                const savedService = yield newService.save();
                return { message: 'Service added successfully', savedService };
            }
            catch (error) {
                console.error("Error in repository:", error);
                const imageUrl = serviceData.fileUrl;
                try {
                    yield (0, s3UploadMiddleware_1.deleteFileFromS3)(imageUrl);
                }
                catch (deleteError) {
                    console.error("Error deleting image from S3:", deleteError);
                    throw new Error(error.message || 'An error occurred');
                }
                return null;
            }
        });
    }
    fetchService(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield serviceModel_1.default.find({ mechanic: id });
                return result;
            }
            catch (error) {
                console.log(error);
                throw new Error(error.message || 'An error occurred');
            }
        });
    }
    searchUsers(keyword, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield mechanikBookingModel_1.default.find({ mechanic: id })
                    .populate({
                    path: 'user',
                    select: '-password'
                });
                const seenUserIds = new Set();
                const filteredUsers = result
                    .filter(booking => {
                    const user = booking.user;
                    const regex = new RegExp(keyword, 'i');
                    return regex.test(user === null || user === void 0 ? void 0 : user.name);
                })
                    .map(booking => booking.user)
                    .filter(user => {
                    const userId = user._id; // Casting to 'any' to access '_id'
                    if (!seenUserIds.has(userId.toString())) {
                        seenUserIds.add(userId.toString());
                        return true;
                    }
                    return false;
                });
                return filteredUsers;
            }
            catch (error) {
                console.error(error);
                throw new Error("Failed to fetch users");
            }
        });
    }
    searchServices(keyword, mechanicId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const services = yield serviceModel_1.default.find({ mechanic: mechanicId });
                const filteredServices = services.filter(service => {
                    const regex = new RegExp(keyword, 'i');
                    return regex.test(service.serviceName);
                });
                return filteredServices;
            }
            catch (error) {
                console.error('Error searchServices:', error);
                throw error;
            }
        });
    }
    createBill(userId, name, vehicleNumber, services, subtotal, gst, total, mechId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const servicePayment = new paymentModel_1.default({
                    gst: gst,
                    mechanic: mechId,
                    name: name,
                    services: services,
                    subtotal: subtotal,
                    total: total,
                    user: userId,
                    vehicleNumber: vehicleNumber
                });
                const result = yield servicePayment.save();
            }
            catch (error) {
                console.error('Error createBill:', error);
                throw error;
            }
        });
    }
    createBlog(blogData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, name, positionName, heading, description, fileUrl } = blogData;
                const newBlog = new blogModel_1.default({
                    mechanic: id,
                    name: name,
                    positionName: positionName,
                    heading: heading,
                    description: description,
                    imageUrl: fileUrl
                });
                const savedBlog = yield newBlog.save();
                return { message: 'Blog added successfully', savedBlog };
            }
            catch (error) {
                console.error("Error in repository:", error);
                const imageUrl = blogData.fileUrl;
                try {
                    yield (0, s3UploadMiddleware_1.deleteFileFromS3)(imageUrl);
                }
                catch (deleteError) {
                    console.error("Error deleting image from S3:", deleteError);
                }
                return null;
            }
        });
    }
    fetchBlog(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield blogModel_1.default.find({ mechanic: id });
                return result;
            }
            catch (error) {
                console.error('Error fetchBlog:', error);
                throw error;
            }
        });
    }
    deleteBlog(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield blogModel_1.default.find({ _id: id });
                let img = result[0].imageUrl;
                yield (0, s3UploadMiddleware_1.deleteFileFromS3)(img);
                const result1 = yield blogModel_1.default.deleteOne({ _id: id });
                return result1;
            }
            catch (error) {
                console.error('Error deleteBlog:', error);
                throw error;
            }
        });
    }
    fetchEditBlog(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield blogModel_1.default.find({ _id: id });
                return result;
            }
            catch (error) {
                console.error('Error fetchEditBlog:', error);
                throw error;
            }
        });
    }
    editBlog(blogData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, name, positionName, heading, description, fileUrl } = blogData;
                // Find the existing blog by ID
                const existingBlog = yield blogModel_1.default.findById(id);
                if (!existingBlog) {
                    return { message: 'Blog not found', savedBlog: null };
                }
                // If the image URL is updated, delete the old image from S3
                if (fileUrl && existingBlog.imageUrl && existingBlog.imageUrl !== fileUrl) {
                    try {
                        yield (0, s3UploadMiddleware_1.deleteFileFromS3)(existingBlog.imageUrl);
                    }
                    catch (deleteError) {
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
                const updatedBlog = yield existingBlog.save();
                return { message: 'Blog updated successfully', updatedBlog };
            }
            catch (error) {
                console.error("Error in repository:", error);
                // Attempt to delete the image from S3 if an error occurs
                const imageUrl = blogData.fileUrl;
                try {
                    yield (0, s3UploadMiddleware_1.deleteFileFromS3)(imageUrl);
                }
                catch (deleteError) {
                    console.error("Error deleting image from S3:", deleteError);
                }
                return null;
            }
        });
    }
    paymentFetch(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paymentData = yield paymentModel_1.default.find({ mechanic: id })
                    .sort({ createdAt: -1 })
                    .populate({
                    path: 'user',
                    select: 'name _id email phone '
                })
                    .populate('services');
                return paymentData;
            }
            catch (error) {
                console.error('Error paymentFetch :', error);
                throw error;
            }
        });
    }
    createChat(senderId, receiverId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let chat = yield chatModel2_1.default.findOne({
                    users: { $all: [senderId, receiverId] },
                });
                if (chat) {
                    const populatedChat = yield chatModel2_1.default.aggregate([
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
                const newChat = new chatModel2_1.default({
                    users: [senderId, receiverId],
                    isGroupChat: false,
                });
                chat = yield newChat.save();
                // Aggregate user details after creating the new chat
                const populatedNewChat = yield chatModel2_1.default.aggregate([
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
            }
            catch (error) {
                console.error("Error in repository:", error);
                throw error;
            }
        });
    }
    sendMessage(content, chatId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create the new message
                let newMessage = yield messageModel2_1.default.create({
                    sender: senderId,
                    content: content,
                    chat: chatId,
                });
                // Update the latest message in the chat
                yield chatModel2_1.default.findByIdAndUpdate(chatId, {
                    latestMessage: newMessage._id,
                });
                // Find the newly created message and populate sender and chat data using aggregation
                let populatedMessage = yield messageModel2_1.default.aggregate([
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
            }
            catch (error) {
                console.error("Error in sendMessage:", error);
                throw error;
            }
        });
    }
    getAllMessages(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const messages = yield messageModel2_1.default.aggregate([
                    {
                        $match: { chat: new mongoose_1.default.Types.ObjectId(chatId) }
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
            }
            catch (error) {
                console.error('Error in getAllMessages:', error);
                throw error;
            }
        });
    }
    fetchChats(senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let chats = yield chatModel2_1.default.aggregate([
                    {
                        $match: {
                            users: { $elemMatch: { $eq: new mongoose_1.default.Types.ObjectId(senderId) } }
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
                            from: "users", // Assuming mechanics collection is named 'mechanics'
                            localField: "users.1", // Second user (mechanic) in the array
                            foreignField: "_id",
                            as: "mechanicDetails"
                        }
                    },
                    {
                        $lookup: {
                            from: "messages", // Assuming messages collection is named 'messages'
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
                return chats;
            }
            catch (error) {
                console.error('Error fetchChats revenue:', error);
                throw error;
            }
        });
    }
    fetchRevenue(mechanicId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const startOfYear = new Date(new Date().getFullYear(), 0, 1);
                const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
                const payments = yield paymentModel_1.default.find({
                    mechanic: mechanicId,
                    status: 'Completed',
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                });
                const monthlyRevenue = Array(12).fill(0);
                payments.forEach((payment) => {
                    const month = payment.createdAt.getMonth();
                    monthlyRevenue[month] += payment.total;
                });
                return monthlyRevenue;
            }
            catch (error) {
                console.error('Error fetching revenue:', error);
                throw error;
            }
        });
    }
    fetchUserGrowths(mechanicId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const startOfYear = new Date(new Date().getFullYear(), 0, 1);
                const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
                const bookings = yield mechanikBookingModel_1.default.aggregate([
                    {
                        $match: {
                            mechanic: new mongoose_1.default.Types.ObjectId(mechanicId),
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
            }
            catch (error) {
                console.error('Error fetching user growth:', error);
                throw error;
            }
        });
    }
    fetchMechData(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mechData = yield mechanicModel_1.default.find({ _id: id });
                if (!mechData || mechData.length === 0) {
                    throw new Error('Mechanic not found');
                }
                const mechId = mechData[0].mechanicdataID;
                const mechDataAllData = yield mechanicdataModel_1.default.find({ _id: mechId });
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
                const combinedData = Object.assign(Object.assign({}, basicInfo), { location: mechDataAllData[0].location, certificate: mechDataAllData[0].certificate, type: mechDataAllData[0].type, licenseNumber: mechDataAllData[0].licenseNumber, yearsOfExperience: mechDataAllData[0].yearsOfExperience, specialization: mechDataAllData[0].specialization, district: mechDataAllData[0].district, locationName: mechDataAllData[0].locationName, services: mechDataAllData[0].services, description: mechDataAllData[0].description, profileImages: mechDataAllData[0].profileImages, workingHours: mechDataAllData[0].workingHours });
                return combinedData;
            }
            catch (error) {
                console.error('Error fetching fetchMechData:', error);
                throw error;
            }
        });
    }
}
exports.default = mechanicRepositories;

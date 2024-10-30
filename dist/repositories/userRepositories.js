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
// repositories/userRepositories.ts
const userModel_1 = __importDefault(require("../models/userModel"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const adminModel_1 = __importDefault(require("../models/adminModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const mechanicdataModel_1 = __importDefault(require("../models/mechanicdataModel"));
const mechanikBookingModel_1 = __importDefault(require("../models/mechanikBookingModel"));
const mechanicModel_1 = __importDefault(require("../models/mechanicModel"));
const paymentModel_1 = __importDefault(require("../models/paymentModel"));
const feedbackModel_1 = __importDefault(require("../models/feedbackModel"));
const blogModel_1 = __importDefault(require("../models/blogModel"));
const chatModel2_1 = __importDefault(require("../models/chatModel2"));
const messageModel2_1 = __importDefault(require("../models/messageModel2"));
const serviceModel_1 = __importDefault(require("../models/serviceModel"));
class UserRepository {
    getModelById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const models = [userModel_1.default, mechanicModel_1.default, adminModel_1.default];
            for (const model of models) {
                const document = yield model.findById(id).exec();
                if (document)
                    return model;
            }
            return null;
        });
    }
    findUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield userModel_1.default.findOne({ email }).exec();
                return userData;
            }
            catch (error) {
                console.error("Error in findUserByEmail:", error);
                throw error;
            }
        });
    }
    googleVerified(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield userModel_1.default.updateOne({ _id: id }, { $set: { isVerified: true } });
                return result;
            }
            catch (error) {
                console.error("Error in googleVerified:", error);
                throw error;
            }
        });
    }
    findUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield userModel_1.default.findOne({
                    _id: userId,
                }).exec();
                return userData;
            }
            catch (error) {
                console.error("Error in findUserById:", error);
                throw error;
            }
        });
    }
    createUser(name, email, phone, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newUser = new userModel_1.default({ name, email, phone, password });
                const result = yield newUser.save();
                return result;
            }
            catch (error) {
                console.error("Error in createUser:", error);
                throw error;
            }
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find the user and exclude the password field for the user object returned
                const user = yield userModel_1.default.findOne({ email }).select("-password");
                if (!user) {
                    return { status: false, message: "User not found." };
                }
                if (!user.isVerified) {
                    return { isVerified: false, message: "User not verified." };
                }
                const userWithPassword = yield userModel_1.default.findOne({ email }).select("+password");
                if (!userWithPassword) {
                    return {
                        status: false,
                        message: "User not found for password validation.",
                    };
                }
                const isPasswordValid = yield bcrypt_1.default.compare(password, userWithPassword.password);
                if (!isPasswordValid) {
                    return { status: false, message: "Invalid password." };
                }
                return { status: true, user };
            }
            catch (error) {
                console.error(error);
                return { status: false, message: "An error occurred during login." };
            }
        });
    }
    resetPassword(password, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId || !password) {
                    throw new Error("User ID and password are required");
                }
                // Validate ObjectId
                if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    throw new Error("Invalid user ID");
                }
                const objectId = new mongoose_1.default.Types.ObjectId(userId);
                const userData = yield userModel_1.default.findById(objectId).exec();
                if (!userData) {
                    throw new Error("User not found");
                }
                const hashpass = yield bcrypt_1.default.hash(password, 10);
                userData.password = hashpass; // Assuming userData has a password field
                const result = yield userData.save();
                return result;
            }
            catch (error) {
                console.error("Error in UserService.resetPassword:", error);
                throw error;
            }
        });
    }
    findMechanicsNearLocation(lat_1, lon_1, type_1) {
        return __awaiter(this, arguments, void 0, function* (lat, lon, type, maxDistance = 5000) {
            try {
                const query = type === "all" ? {} : { type: type };
                const mechanics = yield mechanicdataModel_1.default.aggregate([
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
                const formattedMechanics = yield Promise.all(mechanics.map((mechanic) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const mechData = yield mechanicModel_1.default.findOne({
                            _id: mechanic.mechanicID,
                        })
                            .select("name email phone")
                            .exec();
                        const averageRating = yield feedbackModel_1.default.aggregate([
                            { $match: { mechanic: mechanic.mechanicID } },
                            {
                                $group: {
                                    _id: "$mechanic",
                                    averageRating: { $avg: "$rating" },
                                },
                            },
                        ]);
                        return Object.assign(Object.assign({}, mechanic), { averageRating: averageRating, mechData: mechData || null, distanceKm: Number(mechanic.distanceKm.toFixed(2)), walkingTime: Number(mechanic.walkingTime.toFixed(2)), bikingTime: Number(mechanic.bikingTime.toFixed(2)), drivingTime: Number(mechanic.drivingTime.toFixed(2)) });
                    }
                    catch (error) {
                        return Object.assign(Object.assign({}, mechanic), { mechData: null, distanceKm: Number(mechanic.distanceKm.toFixed(2)), walkingTime: Number(mechanic.walkingTime.toFixed(2)), bikingTime: Number(mechanic.bikingTime.toFixed(2)), drivingTime: Number(mechanic.drivingTime.toFixed(2)) });
                    }
                })));
                return formattedMechanics;
            }
            catch (error) {
                console.error("Error finding mechanics:", error);
                throw error;
            }
        });
    }
    createBooking(bookingData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newBooking = new mechanikBookingModel_1.default(bookingData);
                return yield newBooking.save();
            }
            catch (error) {
                console.error("Error in createBooking:", error);
                throw error;
            }
        });
    }
    fetchBookData(id, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let bookData;
                if (type === "All") {
                    bookData = yield mechanikBookingModel_1.default.find({ user: id })
                        .populate({
                        path: "mechanic",
                        select: "-password -isBlocked -isUser -isVerified -createdAt -updatedAt",
                    })
                        .exec();
                }
                else {
                    bookData = yield mechanikBookingModel_1.default.find({ status: type, user: id })
                        .populate({
                        path: "mechanic",
                        select: "-password -isBlocked -isUser -isVerified -createdAt -updatedAt",
                    })
                        .exec();
                }
                return bookData;
            }
            catch (error) {
                console.error("Error fetching book data:", error);
                throw new Error("Failed to fetch book data"); // Rethrow or handle the error appropriately
            }
        });
    }
    updateProfile(updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = updatedData.id;
                const updatedProfile = yield userModel_1.default.findByIdAndUpdate(userId, {
                    name: updatedData.name,
                    phone: updatedData.phone,
                    imageUrl: updatedData.image,
                }, { new: true });
                if (!updatedProfile) {
                    throw new Error("User not found");
                }
                return updatedProfile;
            }
            catch (error) {
                console.error("Error in updateProfile repository:", error);
                throw new Error("Failed to update profile in the database");
            }
        });
    }
    fetchPayment(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paymentData = yield paymentModel_1.default.find({ user: id })
                    .sort({ createdAt: -1 })
                    .populate({
                    path: "mechanic",
                    select: "name _id email phone mechanicdataID",
                })
                    .populate("services");
                console.log("fetchPayment", paymentData);
                return paymentData;
            }
            catch (error) {
                console.error("Error fetching payments:", error);
                throw error; // Re-throw the error to handle it outside if needed
            }
        });
    }
    feedback(rating, feedbackText, userId, mechId, paymentID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newFeedback = new feedbackModel_1.default({
                    rating,
                    feedback: feedbackText,
                    user: userId,
                    mechanic: mechId,
                    payment: paymentID,
                });
                const result = yield newFeedback.save();
                return result;
            }
            catch (error) {
                console.error("Error submitting feedback:", error);
                throw error;
            }
        });
    }
    updateFeedback(id, rating, feedback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield feedbackModel_1.default.findByIdAndUpdate(id, {
                    rating: rating,
                    feedback: feedback,
                }, {
                    new: true,
                });
                if (!result) {
                    throw new Error("User not found");
                }
                return result;
            }
            catch (error) {
                console.error("Error submitting feedback:", error);
                throw error;
            }
        });
    }
    feedBackCheck(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const feedback = yield feedbackModel_1.default.find({ payment: id });
                if (feedback) {
                    return { status: true, feedback };
                }
                else {
                    return { status: false, message: "No feedback found for this user." };
                }
            }
            catch (error) {
                console.error("Error fetching feedback:", error);
                throw error;
            }
        });
    }
    fetchBlogs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield blogModel_1.default.find();
                const shuffledBlogs = response.sort(() => 0.5 - Math.random());
                const randomBlogs = shuffledBlogs.slice(0, 3);
                return randomBlogs;
            }
            catch (error) {
                console.error("Error in fetchBlogs:", error);
                throw error;
            }
        });
    }
    fetchAllBlogs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield blogModel_1.default.find();
                return response;
            }
            catch (error) {
                console.error("Error in fetchAllBlogs:", error);
                throw error;
            }
        });
    }
    fetchAllService() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Fetch the 10 newest services, sorted by creation date
                const newServices = yield serviceModel_1.default.find()
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .select("_id serviceName serviceDetails price imageUrl createdAt mechanic");
                // Lookup mechanic's name for the new services
                const newServicesWithMechanic = yield serviceModel_1.default.aggregate([
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
                const popularServices = yield paymentModel_1.default.aggregate([
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
            }
            catch (error) {
                console.error("Error fetching services:", error);
                throw new Error("Failed to fetch services");
            }
        });
    }
    fetchAllshop(serviceName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield serviceModel_1.default.aggregate([
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
            }
            catch (error) {
                console.error("Error fetching services:", error);
                throw new Error("Failed to fetch services");
            }
        });
    }
    bookingdata(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield mechanicdataModel_1.default.find({ _id: id });
                if (result.length > 0) {
                    const mechId = result[0].mechanicID;
                    const result1 = yield mechanicModel_1.default.find({ _id: mechId });
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
                }
                else {
                    throw new Error("No data found for the given ID");
                }
            }
            catch (error) {
                console.error("Error in bookingdata:", error);
                throw error;
            }
        });
    }
    reviewData(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const feedbackWithUserDetails = yield feedbackModel_1.default.aggregate([
                    {
                        $match: { mechanic: new mongoose_1.default.Types.ObjectId(id) },
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
            }
            catch (error) {
                console.error("Error in reviewData:", error);
                throw error;
            }
        });
    }
    fetchFreelancer() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield mechanicdataModel_1.default.find({ type: "freelancer" });
                return result;
            }
            catch (error) {
                console.error("Error fetching services:", error);
                throw new Error("Failed to fetch services");
            }
        });
    }
    //Chat
    allUsers(keyword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchQuery = keyword
                    ? {
                        $or: [
                            { name: { $regex: keyword, $options: "i" } },
                            { email: { $regex: keyword, $options: "i" } },
                        ],
                    }
                    : {};
                const users = yield mechanicModel_1.default.find(searchQuery);
                return users;
            }
            catch (error) {
                console.error("Error in allUsers:", error);
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
                const newChat = new chatModel2_1.default({
                    users: [senderId, receiverId],
                    isGroupChat: false,
                });
                chat = yield newChat.save();
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
                return populatedNewChat[0];
            }
            catch (error) {
                console.error("Error in createChat:", error);
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
                            users: {
                                $elemMatch: { $eq: new mongoose_1.default.Types.ObjectId(senderId) },
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
            }
            catch (error) {
                console.error("Error in fetchChats:", error);
                throw error;
            }
        });
    }
    sendMessage(content, chatId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
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
                        $match: { chat: new mongoose_1.default.Types.ObjectId(chatId) },
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
            }
            catch (error) {
                console.error("Error in getAllMessages:", error);
                throw error;
            }
        });
    }
}
exports.default = UserRepository;

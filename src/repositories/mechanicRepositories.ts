import mongoose from "mongoose";
import { IMechanicData, MechnicDoc } from "../interfaces/IMechanic";
import Mechanic from "../models/mechanicModel";
import MechanicData from "../models/mechanicdataModel";
import { Types } from 'mongoose';

import bcrypt from 'bcrypt';
import { deleteFileFromS3 } from "../middleware/s3UploadMiddleware";
import Booking from "../models/mechanikBookingModel";

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

}

export default mechanicRepositories
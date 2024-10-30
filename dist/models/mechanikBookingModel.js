"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Create the Booking schema
const bookingSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    mechanic: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Mechanic',
        required: true,
    },
    coordinates: {
        type: [Number],
        required: true,
    },
    bookingTime: {
        type: Date,
        required: true,
    },
    locationName: {
        type: String,
    },
    district: {
        type: String,
    },
    serviceDetails: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Ongoing', 'Upcoming', 'Cancelled'],
        default: 'Pending',
    },
    name: {
        type: String,
        required: true,
    },
    mobileNumber: {
        type: String,
        required: true,
    },
    complainDescription: {
        type: String,
    },
});
const Booking = (0, mongoose_1.model)('Booking', bookingSchema);
exports.default = Booking;

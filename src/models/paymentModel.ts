import mongoose, { Model, Schema } from "mongoose";
import { ServiceOrder } from "../interfaces/IMechanic";

const paymentSchema = new Schema<ServiceOrder>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    mechanic: {
        type: Schema.Types.ObjectId,
        ref: 'Mechanic',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    gst: {
        type: Number,
        required: true,
    },
    subtotal: {
        type: Number,
        required: true,
    },
    services: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service"
        },
    ],
    vehicleNumber: {
        type: String,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],  // Optional validation for status
        default: "pending",
    },
    upiId: {
        type: String,
        required: false,
    },
    bank: {
        type: String,
        required: false,
    }
}, {
    timestamps: true,  // Automatically adds `createdAt` and `updatedAt` fields
});

const Payment: Model<ServiceOrder> = mongoose.model("Payment", paymentSchema);
export default Payment;

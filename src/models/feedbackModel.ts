import mongoose, { Schema, model } from "mongoose";

const feedbackSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    mechanic: {
        type: Schema.Types.ObjectId,
        ref: "Mechanic",
        required: true,
    },
    payment: {
        type: Schema.Types.ObjectId,
        ref: "Payment",
        required: true,
    },
    feedback: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const FeedBack = model("FeedBack", feedbackSchema);
export default FeedBack;

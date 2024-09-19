import mongoose, { Document, Schema, Model } from "mongoose";

interface IChat extends Document {
    chatName: string;
    isGroupChat: boolean;
    users: mongoose.Schema.Types.ObjectId[];
    latestMessage: mongoose.Schema.Types.ObjectId;
    groupAdmin: mongoose.Schema.Types.ObjectId;
}

const chatSchema: Schema<IChat> = new Schema(
    {
        chatName: { type: String, trim: true },
        isGroupChat: { type: Boolean, default: false },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
            },
        ],
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
    },
    {
        timestamps: true,
    }
);

// Check if the model is already compiled to avoid OverwriteModelError
const Chat2: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);

export default Chat2;

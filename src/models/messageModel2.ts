import mongoose, { Document, Schema, Model } from "mongoose";

interface IMessage extends Document {
    sender: mongoose.Schema.Types.ObjectId;
    content: string;
    chat: mongoose.Schema.Types.ObjectId;
}

const messageSchema: Schema<IMessage> = new Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId },
        content: { type: String, trim: true },
        chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    },
    {
        timestamps: true,
    }
);

// Check if the model already exists before creating it
const Message2: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);

export default Message2;
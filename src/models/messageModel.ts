import mongoose, { Document, Schema, Model, model } from "mongoose";

interface IMessage extends Document {
  sender: mongoose.Schema.Types.ObjectId;
  content: string;
  chat: mongoose.Schema.Types.ObjectId;
}

const messageSchema: Schema<IMessage> = new Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  },
  {
    timestamps: true,
  }
);

const Message: Model<IMessage> = model("Message", messageSchema);

export default Message;

import mongoose, { Document, Schema, Model, model } from "mongoose";

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
        ref: "User"
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

const Chat: Model<IChat> = model("Chat", chatSchema);

export default Chat;

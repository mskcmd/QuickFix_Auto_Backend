// models/User.ts
import mongoose, { Schema, Model } from "mongoose";
import { UserDoc } from "../interfaces/IUser";

const userSchema = new Schema<UserDoc>({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isUser: {
    type: Boolean,
    default: true
  },
  isBlocked: { // Fixed field name
    type: Boolean,
    default: false // Assuming default value is false
  }
}, {
  timestamps: true 
});

const User: Model<UserDoc> = mongoose.model("User", userSchema);
export default User;

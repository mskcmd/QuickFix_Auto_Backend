import mongoose, { Document, Schema } from 'mongoose';

interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  phone:string;
  isAdmin: boolean;
}

const adminSchema: Schema<IAdmin> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
        type: String,
        required: true
      },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);

// Create the Admin model
const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

export default Admin;

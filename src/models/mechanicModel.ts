// models/User.ts
import mongoose, { Schema, Model } from "mongoose";
import { MechnicDoc } from "../interfaces/IMechanic";

const mechanicSchema = new Schema<MechnicDoc>({
  name: {
    type: String
  },
  email: {
    type: String,
    unique: true
  },
  phone: {
    type: String
  },
  password: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isMechanic: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  mechanicdataID: { 
    type: Schema.Types.ObjectId,
    ref: 'MechanicData',
    default: null  
  },
  isSubscriber: {  
    type: Boolean,
    default: false
  },
  isBlocked: {  
    type: Boolean,
    default: false
  },
});

const Mechanic: Model<MechnicDoc> = mongoose.model("Mechanic", mechanicSchema);
export default Mechanic;

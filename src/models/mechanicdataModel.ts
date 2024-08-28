import mongoose, { Model, Schema, Types } from "mongoose";
import { IMechanicData } from "../interfaces/IMechanic";

// Define the schema
const MechanicDataSchema: Schema = new Schema({
  mechanicID: { 
    type: Schema.Types.ObjectId,
    ref: "Mechanic",
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  licenseNumber: {
    type: String,
    required: true,
  },
  yearsOfExperience: {
    type: Number,
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  district: {
    type: String,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  locationName: {
    type: String,
    required: true,
  },
  services: [{
    type: String,
  }],
  description: {
    type: String,
    required: true,
  },
  profileImages: [{
    url: { type: String },
    contentType: { type: String },
  }],
  certificate: {
    url: { type: String },
    contentType: { type: String },
  },
  workingHours: [{
    days: [String],
    startTime: String,
    endTime: String
  }]
}, { timestamps: true });

// Create a 2dsphere index on the location field for geospatial queries
MechanicDataSchema.index({ location: '2dsphere' });

// Create the model
const MechanicData: Model<IMechanicData> = mongoose.model<IMechanicData>("MechanicData", MechanicDataSchema);

export default MechanicData;

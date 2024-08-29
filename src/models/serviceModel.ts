import mongoose, { Schema, Model, Document } from "mongoose";



export interface IService extends Document {
  mechanic?: mongoose.Schema.Types.ObjectId;
  serviceName?: string;
  serviceDetails?: string;
  price?: number;
  imageUrl?: string;
}

const ServiceSchema = new Schema<IService>({
  mechanic: {
    type: Schema.Types.ObjectId,
    ref: 'Mechanic',
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  serviceDetails: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  }
}, {
  timestamps: true, 
});

const Service: Model<IService> = mongoose.model<IService>('Service', ServiceSchema);

export default Service;

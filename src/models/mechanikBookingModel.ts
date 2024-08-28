import { Schema, model, Document } from 'mongoose';

// Define the interface for the Booking model
export interface IBooking extends Document {
  user: Schema.Types.ObjectId;       // Reference to the User model
  mechanic: Schema.Types.ObjectId;   // Reference to the Mechanic model
  coordinates: [number, number];     // Directly store coordinates
  bookingTime: Date;                 // Time when the booking was made
  serviceDetails: string;            // Description of the service booked
  status: string;                    // Status of the booking (e.g., 'Pending', 'Completed')
  name: string;                      // Name of the person who made the booking
  mobileNumber: string;              // Mobile number of the person who made the booking
  complainDescription?: string;      // Optional field for additional complaints or descriptions
  district?: string;                 // Optional district field
  locationName?: string;             // Optional location name field
}

// Create the Booking schema
const bookingSchema = new Schema<IBooking>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mechanic: {
    type: Schema.Types.ObjectId,
    ref: 'Mechanic',
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
  bookingTime: {
    type: Date,
    required: true,
  },
  locationName: {
    type: String,
  },
  district: {
    type: String,
  },
  serviceDetails: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed','Ongoing','Upcoming','Cancelled'],
    default: 'Pending',
  },
  name: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  complainDescription: {
    type: String,
  },
});

const Booking = model<IBooking>('Booking', bookingSchema);

export default Booking;

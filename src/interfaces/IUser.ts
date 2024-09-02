import { Document, Schema } from 'mongoose';

export interface UserDoc extends Document{
  name: string;
  email: string;
  phone: string;
  password: string;
  isVerified?: boolean;
  isUser?:boolean;
  isBlocked?:boolean;
  imageUrl?:string
}
export interface UseLog {
  email:string;
  password:string
}
// types.ts
import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    otp: string;
    userId: string;
    otpTime:number;
    email:string;
    name:string;
  }
}


export interface IBookingData {
  user?: Schema.Types.ObjectId;
  mechanic?: Schema.Types.ObjectId;
  coordinates?: [number, number];
  bookingTime?: Date;
  serviceDetails?: string;
  status?: string;
  name?: string;
  mobileNumber?: string;
  complainDescription?: string;
  district?:string
  locationName?:string
}

export interface IBooking extends IBookingData, Document {}

export interface CustomRequest extends Request {
  user: {
    _id: string;
  };
}
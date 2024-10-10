import mongoose from "mongoose"


const dbURI:string = process.env.MONGODB_URI  || "";

export async function connectDB(): Promise<void> {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}
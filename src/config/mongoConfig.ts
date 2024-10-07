import mongoose from "mongoose"


const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickFix_auto';

export async function connectDB(): Promise<void> {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);    
    }
}
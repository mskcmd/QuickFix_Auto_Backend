import mongoose from "mongoose"

const dbURI = 'mongodb://localhost:27017/quickFix_auto';

export async function connectDB():Promise<void> {
    try {
        await mongoose.connect(`${dbURI}?useNewUrlParser=true`,{})
        console.log("Connected to MongoDb")
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);    
    }
}

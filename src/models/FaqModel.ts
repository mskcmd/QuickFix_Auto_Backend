import mongoose, { Document, Schema } from "mongoose";

// Define an interface for the FAQ document
interface IFaq extends Document {
    userId: string;
    prompt: string;
    answer: string;
    timestamp: Date;
}

// Create a schema for the FAQ model
const faqSchema: Schema = new Schema({
    userId: { type: String },
    prompt: { type: String },
    answer: { type: String },
    timestamp: { type: Date, default: Date.now },
});

// Create the Faq model
const Faq = mongoose.model<IFaq>('Faq', faqSchema);

export default Faq;

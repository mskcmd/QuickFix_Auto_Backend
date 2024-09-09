import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Blog document
interface IBlog extends Document {
    mechanic: mongoose.Types.ObjectId;
    name: string;
    positionName: string;
    heading: string;
    description: string;
    imageUrl: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Create the Blog schema
const blogSchema: Schema<IBlog> = new Schema(
    {
        mechanic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Mechanic',  // Reference to the Mechanic model
            required: true
        },
        name: {
            type: String,
            required: true
        },
        positionName: {
            type: String,
            required: true
        },
        heading: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            required: false
        }
    },
    { timestamps: true } // Enable timestamps to track createdAt and updatedAt
);

// Create the Blog model
const Blog = mongoose.model<IBlog>('Blog', blogSchema);

export default Blog;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Define the schema
const MechanicDataSchema = new mongoose_1.Schema({
    mechanicID: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const MechanicData = mongoose_1.default.model("MechanicData", MechanicDataSchema);
exports.default = MechanicData;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.deleteFileFromS3 = exports.uploadFields = void 0;
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
dotenv_1.default.config();
// Multer configuration
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
});
const uploadSingleImage = upload.single('image');
exports.default = uploadSingleImage;
exports.uploadFields = upload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'profileImage0', maxCount: 1 },
    { name: 'profileImage1', maxCount: 1 },
    { name: 'profileImage2', maxCount: 1 },
    { name: 'profileImage3', maxCount: 1 }
]);
// Configure AWS
aws_sdk_1.default.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
// Create an S3 client
const s3 = new aws_sdk_1.default.S3();
// Function to upload a file to S3
const uploadFile = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `uploads/${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read', // Uncomment this if you want to make the file publicly readable
    };
    try {
        const data = yield s3.upload(params).promise();
        const url = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${data.Key}`;
        return url; // URL of the uploaded file
    }
    catch (error) {
        console.error('S3 upload error:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to upload file: ${error.message}`);
        }
        else {
            throw new Error('An unknown error occurred during file upload');
        }
    }
});
exports.uploadFile = uploadFile;
const deleteFileFromS3 = (fileUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const key = fileUrl.split('.com/')[1];
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: key,
    };
    try {
        yield s3.deleteObject(params).promise();
        console.log(`Successfully deleted file from S3: ${fileUrl}`);
    }
    catch (error) {
        console.error(`Error deleting file from S3: ${fileUrl}`, error);
    }
});
exports.deleteFileFromS3 = deleteFileFromS3;

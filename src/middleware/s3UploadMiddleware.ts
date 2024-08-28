import multer from 'multer';
import dotenv from 'dotenv';
import AWS from 'aws-sdk';

dotenv.config();

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
});

const uploadSingleImage = upload.single('image');
console.log("sss",uploadSingleImage);
export default uploadSingleImage;



export const uploadFields = upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'profileImage0', maxCount: 1 },
  { name: 'profileImage1', maxCount: 1 },
  { name: 'profileImage2', maxCount: 1 },
  { name: 'profileImage3', maxCount: 1 }
]);

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Create an S3 client
const s3 = new AWS.S3();

// Define the type for the file object
interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

// Function to upload a file to S3
const uploadFile = async (file: UploadedFile): Promise<string> => {
  console.log("Uploading file:", file.originalname);

  const params = {
    Bucket: process.env.BUCKET_NAME as string,
    Key: `uploads/${file.originalname}`, 
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'public-read', // Uncomment this if you want to make the file publicly readable
  };

  try {
    const data = await s3.upload(params).promise();
    console.log("File uploaded successfully:", data);

    const url = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${data.Key}`;
    return url; // URL of the uploaded file
  } catch (error) {
    console.error('S3 upload error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred during file upload');
    }
  }
};

export const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  const key = fileUrl.split('.com/')[1];
  const params = {
    Bucket: process.env.BUCKET_NAME as string,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`Successfully deleted file from S3: ${fileUrl}`);
  } catch (error) {
    console.error(`Error deleting file from S3: ${fileUrl}`, error);
  }
};

export { uploadFile };
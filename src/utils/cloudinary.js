import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload an image
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await await cloudinary.uploader.upload(localFilePath, {
      resourse_type: "auto",
    });
    // file has been uploaded successfully
    // console.log("file is uploaded on clodinary ", response);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // remove the locally saved temporary file as the upload operation got failed
    fs.unlinkSync(localFilePath);
    return error;
  }
};

const deleteOnCloudinary = async (public_id, resource_type = "image") => {
  try {
    if (!public_id) return null;

    // delete file from cloudinary
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: `${resource_type}`,
    });
  } catch (error) {
    return error;
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };

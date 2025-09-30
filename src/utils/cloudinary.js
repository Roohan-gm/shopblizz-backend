import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.error("Error while uploading file to cloudinary", error);
    return null;
  }
};

const deleteFromCloudinary = async (public_id) => {
  if (!public_id) {
    console.warn("No public_id provided for deletion");
    return false;
  }
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    if (result?.result === "ok") {
      console.log("Image deleted from Cloudinary:", public_id);
      return true;
    } else {
      console.warn("Cloudinary delete failed for:", public_id, result);
      return false;
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error.message || error);
    return false;
  }
};
export { uploadOnCloudinary, deleteFromCloudinary };

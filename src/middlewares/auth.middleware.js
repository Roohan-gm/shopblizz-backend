import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized request.");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token.");
    }

    req.user = user;
    console.log("✅ Authenticated user:", req.user?.role); 
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token.");
  }
};

const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized request.");
  }
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin privileges required.");
  }

  next();
};
export { verifyJWT, verifyAdmin };

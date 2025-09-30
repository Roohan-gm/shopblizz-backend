import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import {
  registerUserSchema,
  loginUserSchema,
  changePassword,
  updateAccountSchema,
} from "../validations/user.validation.js";

const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

const generateAccessRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Some thing went wrong while generating refresh token or access token."
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const result = registerUserSchema.safeParse(req.body);
  if (!result.success) {
    const errorMessage = result.error.errors[0].message;
    throw new ApiError(400, errorMessage);
  }

  const { username, email, password, role } = result.data;

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this username or email");
  }
  const localAvatarPath = req.file?.path;
  if (!localAvatarPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(localAvatarPath, "avatar");
  if (!avatar.url && !avatar.public_id) {
    throw new ApiError(500, "Failed to upload avatar on cloudinary");
  }

  const createUser = await User.create({
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    password,
    role,
    avatar: { url: avatar.url, public_id: avatar.public_id },
  }).select("-password -refreshToken");

  if (!createUser) {
    throw new ApiError(500, "Failed to create new user.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const result = loginUserSchema.safeParse(req.body);

  if (!result.success) {
    const errorMessage = result.error.errors[0].message;
    throw new ApiError(400, errorMessage);
  }

  const { email, username, password } = result.data;

  const userExists = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!userExists) {
    throw new ApiError(404, "User not found.");
  }

  const validPassword = await userExists.isPasswordCorrect(password);
  if (!validPassword) {
    throw new ApiError(401, "Invalid user credential");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshTokens(
    userExists._id
  );

  const loginUser = await User.findById(userExists._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loginUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token.");
    }

    if (incomingRefreshToken != user.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used.");
    }
    const { accessToken, newRefreshToken } = await generateAccessRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token.");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const result = changePassword.safeParse(req.body);

  if (!result.success) {
    const errorMessage = result.error.errors[0].message;
    throw new ApiError(400, errorMessage);
  }

  const { oldPassword, newPassword } = result.data;

  const user = await User.findById(req.user?._id);

  const correctPassword = user.isPasswordCorrect(oldPassword);
  if (!correctPassword) {
    throw new ApiError(400, "Invalid password.");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Fetched current user successfully."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const result = updateAccountSchema.safeParse(req.body);

  if (!result.success) {
    const errorMessage = result.error.errors[0].message;
    throw new ApiError(400, errorMessage);
  }
  
  const { username, email, role } = result.data;

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { username, email, role } },
    { new: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(500, "Failed to update the fields in Database");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User data updated successfully."));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar file missing");

  // 1. upload new image
  const avatar = await uploadOnCloudinary(avatarLocalPath, "avatar");
  if (!avatar?.url || !avatar?.public_id) {
    throw new ApiError(500, "Failed to upload on Cloudinary");
  }

  // 2. fetch user (avatar field only)
  const user = await User.findById(req.user._id).select("avatar");
  const oldPublicId = user.avatar?.public_id;

  // 3. atomic swap
  user.avatar = { public_id: avatar.public_id, url: avatar.url };
  await user.save({ validateBeforeSave: false });

  // 4. best-effort delete of old asset
  if (oldPublicId) {
    try {
      await deleteFromCloudinary(oldPublicId);
    } catch (e) {
      // log but don’t crash – user already has the new avatar
      console.warn("Cloudinary delete failed", e);
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatar: user.avatar },
        "Avatar updated successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
};

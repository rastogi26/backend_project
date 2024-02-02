import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); //if cookie does not have access token then it might be the user is sending a custom header

    if (!token) {
      throw new ApiError(401, "Unauthorized request ");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    ); //._id coming from gereating access token in User model

    if (!user) {
      throw new ApiError(401, "Invalid  Access Token ");
    }

    req.user = user; //adding new object user in req
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

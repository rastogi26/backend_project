import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResonse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //     message:"OK"
  // })

  /*                       Steps to register
    1. get user details from frontend.
    2. validation - not empty, correct format etc.
    3. check if user already exist. : check using username and email.
    4. check for images, check for avatar(required).
    5. upload them to cloudinary, check avatar on cloudinary
    6. create user object - create entry in db.
    7. remove password and refresh token field from password.
    8. check for user creation.
    9. return res
    */

  // Step1 done
  const { fullName, email, username, password } = req.body;
  //  console.log("fullName: ",fullName);

  // Step 2 validation improved technique with "some" method
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "") //field he aur trim kane ke baad bhi empty he the true
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // step 3 user exist or not
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exit");
  }

  // console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path; // extract the path from local files in public
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //Step 4
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //Step 5 upload on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //Step 5 check for avatar
  if (!avatar) {
    throw new ApiError(400,"Avatar file is required")
  }

  //Step 6
  const user = await User.create({
    fullName,
    avatar: avatar.url,  //cloudinary return a response and we can get url link from that response
    coverImage: coverImage?.url ||"" , //if coverImage is there then take out url else remain empty.
    email,
    password,
    username: username.toLowerCase(),
  })

  // Step 8 :to check if user created or not and also Step 7
  // we will get a response in createdUser of all the fields excluding two fields i.e password and refreshToken
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500,"Something went wrong while regestering the user")
  }

  //Step 9:
  
  return res.status(201).json(
    new ApiResonse(200,createdUser,"User registered successfully")
  )



});

export { registerUser };

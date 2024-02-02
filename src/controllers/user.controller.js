import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResonse } from "../utils/ApiResponse.js";

// generate token start
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // inserting refresh token in db
    user.refreshToken = refreshToken; // in user model there is a field called refersh token
    await user.save({ validateBeforeSave: false }); // done this because in user model like password field is true , save the referesh token without any validation in the db

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh token"
    );
  }
};
// generate token end

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
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exit");
  }

  // console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path; // extract the path from local files in public
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //Step 4
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //Step 5 upload on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //Step 5 check for avatar
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //Step 6
  const user = await User.create({
    fullName,
    avatar: avatar.url, //cloudinary return a response and we can get url link from that response
    coverImage: coverImage?.url || "", //if coverImage is there then take out url else remain empty.
    email,
    password,
    username: username.toLowerCase(),
  });

  // Step 8 :to check if user created or not and also Step 7
  // we will get a response in createdUser of all the fields excluding two fields i.e password and refreshToken
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while regestering the user");
  }

  //Step 9:

  return res
    .status(201)
    .json(new ApiResonse(200, createdUser, "User registered successfully"));
});

//  ************  Login User Starts
const loginUser = asyncHandler(async (req, res) => {
  /*Psedo Code for this:-
          1. req.body ->data
          2. username or email
          3. find the user
          4. password check
          5. access and refresh 
          6. Send these token using cookies
          */

  // step 1
  const { username, email, password } = req.body();
  //step 2
  if (!username || !email) {
    // if both are empty
    throw new ApiError(400, "Username or email is required.");
  }
  //step 3
  const user = await User.findOne({
    // find if email or username exist or not
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // step 4 password check

  // always remember all the methods created in mongoose user model is available in user instance you get from db not in User
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // step 5 if password is correct generate tokens , as gerenating tokens process repeat multiple times so make a separate method for them
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  // we have to update the user because referesh token is inserted , so have two options either update or call function one more time
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //cookies
  const options = {
    // can see but not be able to modifed from frontend , only from server side
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResonse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});
//  ************  Login User Ends

// *********** Logout User
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, //jo return me response milega usme new updated value miligi jisme refresh token undefined hoga na ki uski purani value
    }
  );

  //cookies
  const options = {
    // can see but not be able to modifed from frontend , only from server side
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResonse(200, {},"User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };

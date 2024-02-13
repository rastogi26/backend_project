import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchedHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// injecting multer middleware to handle files in registeration 2 files i.e avatar and cover image
router.route("/register").post(
  upload.fields([
    {
      name: "avatar", // communication between frontend and backend to have same nae field.
      maxCount: 1, // how many files to accept
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
); // https://localhost:8000/api/v1/users/register

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser); // before logout the user, check if it is login or not by passing a middleware
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser); // check if user login or not , if true then getCurrentUser details.
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar); // 1. middleware check user login or not , 2nd middleware is multer

router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage); //flag ->coverImage

router.route("/c/:username").get(verifyJWT, getUserChannelProfile); // getting from params and it is defined as username in function so it is named as :username

router.route("/history").get(verifyJWT,getWatchedHistory);
export default router;

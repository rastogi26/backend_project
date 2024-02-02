import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
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

export default router;

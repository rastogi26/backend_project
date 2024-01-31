import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js'

const router = Router()

// injecting multer middleware to handle files in registeration 2 files i.e avatar and cover image
router.route("/register").post(
    upload.fields([
        {
            name: "avatar", // communication between frontend and backend to have same nae field.
            maxCount: 1  // how many files to accept

        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)  // https://localhost:8000/api/v1/users/register




export default router
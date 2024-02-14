import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideosComment,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router
  .route("/:videoId")
  .get(verifyJWT, getVideosComment)
  .post(verifyJWT, addComment);
router
  .route("/c/:commentId")
  .delete(verifyJWT, deleteComment)
  .patch(verifyJWT, updateComment);


export default router;
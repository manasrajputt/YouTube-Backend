import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  addComment,
  deleteComment,
  updateComment,
  getVideoComments,
} from "../controllers/comment.js";
const router = Router();

router
  .route("/:videoId")
  .get(verifyJWT, getVideoComments)
  .post(verifyJWT, addComment);

router
  .route("/c/:commentId")
  .patch(updateComment)
  .delete(verifyJWT, deleteComment);

export default router;

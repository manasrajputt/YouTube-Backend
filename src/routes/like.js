import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
  getLikedVideos,
} from "../controllers/like.js";
const router = Router();

router.route("/toggle/v/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/toggle/c/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/toggle/t/:tweetId").post(verifyJWT, toggleTweetLike);

router.route("/videos").get(verifyJWT, getLikedVideos);

export default router;

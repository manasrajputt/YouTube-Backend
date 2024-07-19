import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  createTweet,
  updateTweet,
  deleteTweet,
  getUserTweets,
} from "../controllers/tweet.js";

const router = Router();

router.route("/").post(verifyJWT, createTweet);

router.route("/user/:userId").get(verifyJWT, getUserTweets);

router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;

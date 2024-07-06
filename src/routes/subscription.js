import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.js";

const router = Router();

router.route("/c/:channelId").post(verifyJWT, toggleSubscription);
router.route("/c/:channelId").get(verifyJWT, getUserChannelSubscribers);
router.route("/u/:subscriberId").get(verifyJWT, getSubscribedChannels);
export default router;

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.js";

const router = Router();

router.route("/stats").get(verifyJWT, getChannelStats);
router.route("/videos").get(verifyJWT, getChannelVideos);

export default router;

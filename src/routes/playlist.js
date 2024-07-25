import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistById,
  getUserPlaylists,
} from "../controllers/playlist.js";

const router = Router();

router.route("/").post(verifyJWT, createPlaylist);

router
  .route("/:playlistId")
  .patch(verifyJWT, updatePlaylist)
  .delete(verifyJWT, deletePlaylist)
  .get(verifyJWT, getPlaylistById);

router.route("/add/:videoId/:playlistId").patch(verifyJWT, addVideoToPlaylist);
router
  .route("/remove/:videoId/:playlistId")
  .patch(verifyJWT, removeVideoFromPlaylist);

router.route("/user/:userId").get(verifyJWT, getUserPlaylists);

export default router;

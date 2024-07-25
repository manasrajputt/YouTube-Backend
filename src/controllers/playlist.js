import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PlayList } from "../models/playlist.js";
import { Video } from "../models/video.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "name and description both are required");
  }

  const playlist = await PlayList.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "failed to create playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const { playlistId } = req.params;

  if (!name || !description) {
    throw new ApiError(400, "name and description both are required");
  }

  if (!playlistId) {
    throw new ApiError(400, "Invalid playlist");
  }

  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can edit the playlist");
  }

  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    playlist?._id,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "playlist updated successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "playlist not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can delete the playlist");
  }

  await PlayList.findByIdAndDelete(playlist?._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist deleted successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "Invalid playlist or videoId");
  }

  const playlist = await PlayList.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (
    (playlist.owner.toString() && video.owner.toString()) !==
    req.user?._id.toString()
  ) {
    throw new ApiError(400, "only owner can add video to their playlist");
  }

  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    playlist?._id,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "failed to add video to playlist please try again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Added video to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "Invalid playlist or videoId");
  }

  const playlist = await PlayList.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (
    (playlist.owner.toString() && video.owner.toString()) !==
    req.user?._id.toString()
  ) {
    throw new ApiError(400, "only owner can remove video from their playlist");
  }

  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    playlist?._id,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      500,
      "failed to remove video from playlist please try again"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "remove video from playlist successfully"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  const playlistVideos = await PlayList.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "videos",
        as: "videos",
      },
    },
    {
      $match: {
        "videos.isPublished": true,
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "owner",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          "videoFile.url": 1,
          "thumbNail.url": 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
        },
        owner: {
          userName: 1,
          fullName: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistVideos, "playlist fetched successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "Invalid userId");
  }

  const playlist = await PlayList.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1, 
        totalViews: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "User playlist fetched successfully"));
});

export {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistById,
  getUserPlaylists,
};

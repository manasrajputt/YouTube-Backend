import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.js";
import { User } from "../models/user.js";
import { Like } from "../models/like.js";
import { Comment } from "../models/comment.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pipeline = [];
  if (query) {
    pipeline.push({
      $match: {
        $text: { $search: query }
      }
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      },
    });
  }

  pipeline.push({
    $match: {
      isPublished: true,
    },
  });

  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              userName: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    }
  );

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(videoAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos fetched Successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbNailLocalPath = req.files?.thumbNail[0].path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "videoFileLocalPath is required");
  }
  if (!thumbNailLocalPath) {
    throw new ApiError(400, "thumbNailLocalPath is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbNail = await uploadOnCloudinary(thumbNailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "videoFile is required");
  }
  if (!thumbNail) {
    throw new ApiError(400, "thumbNail is required");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: {
      public_id: videoFile.public_id,
      url: videoFile.url,
    },
    thumbNail: {
      public_id: thumbNail.public_id,
      url: thumbNail.url,
    },
    duration: videoFile.duration,
    owner: req.user?._id,
    isPublished: true,
  });

  const videoUpload = await Video.findById(video._id);

  if (!videoUpload) {
    throw new ApiError(500, "video upload failed please try again!!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscriberCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              userName: 1,
              "avatar.url": 1,
              subscriberCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comment: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(500, "failed to fetch video");
  }

  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res
    .status(200)
    .join(new ApiResponse(200, video[0], "video details fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Invalid VideoId");
  }

  if (!(title && description)) {
    throw new ApiError(400, "title and description is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't edit this video as you are not the owner"
    );
  }

  const thumbNailToDelete = video.thumbNail.public_id;
  const thumbNailLocalPath = req.file?.path;

  if (!thumbNailLocalPath) {
    throw new ApiError(400, "thumbNail is required");
  }

  const thumbNail = await uploadOnCloudinary(thumbNailLocalPath);

  if (!thumbNail) {
    throw new ApiError(400, "thumbnail not found");
  }

  const updateVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbNail: {
          public_id: thumbNail.public_id,
          url: thumbNail.url,
        },
      },
    },
    { new: true }
  );

  if (!updateVideo) {
    throw new ApiError(500, "Failed to update video please try again");
  }

  if (updateVideo) {
    await deleteOnCloudinary(thumbNailToDelete);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't delete this video as you are not the owner"
    );
  }

  const videoDeleted = await Video.findByIdAndUpdate(video?._id);

  if (!videoDeleted) {
    throw new ApiError(400, "failed to delete video please try again");
  }

  await deleteOnCloudinary(videoDeleted.videoFile?.public_id, "video");
  await deleteOnCloudinary(videoDeleted.thumbNail?.public_id);

  await Like.deleteMany({ video: videoId });
  await Comment.deleteMany({ video: videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't toggle publish status as you are not the owner"
    );
  }

  const toggleVideoPublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    { new: true }
  );

  if (!toggleVideoPublish) {
    throw new ApiError(500, "failed to toggle video publish status");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: toggleVideoPublish.isPublished },
        "Video publish toggled successfully"
      )
    );
});

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

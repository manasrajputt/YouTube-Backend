import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Invalid channelId");
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, "Unsubscribed Successfully")
      );
  }

  await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribed: true }, "Subscribed Successfully")
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  let { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Invalid channelId");
  }

  channelId = new mongoose.Types.ObjectId(channelId);

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: channelId,
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "subscriber",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              foreignField: "channel",
              localField: "_id",
              as: "subscribedToSubscriber",
            },
          },
          {
            $addFields: {
              subscribedToSubscriber: {
                $cond: {
                  if: { $in: [channelId, "$subscribedToSubscriber.subscriber"] },
                  then: true,
                  else: false,
                },
              },
              subscribersCount: {
                $size: "$subscribedToSubscriber",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          userName: 1,
          fullName: 1,
          "avatar.url": 1,
          subscribedToSubscriber: 1,
          subscribersCount: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribers }, "SubScribers fetched Successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(400, "Invalid subscriberId");
  }

  const subscriberChannels = await Subscription.aggregate([
    [
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "subScribedChannel",
          pipeline: [
            {
              $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
              },
            },
            {
              $addFields: {
                latestVideo: {
                  $last: "$videos",
                },
              },
            },
          ],
        },
      },
      {
        $unwind: "$subScribedChannel",
      },
      {
        $project: {
          _id: 0,
          subScribedChannel: {
            _id: 1,
            userName: 1,
            fullName: 1,
            "avatar.url": 1,
            latestVideo: {
              _id: 1,
              "videoFile.url": 1,
              "thumbNail.url": 1,
              owner: 1,
              title: 1,
              decription: 1,
              duration: 1,
              createdAt: 1,
              views: 1,
            },
          },
        },
      },
    ],
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscriberChannels },
        "SubscribedChannels fetched Successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResonse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  // Check if the user has already liked the video
  const existingLike = await Like.findOne({
    // multiple records can have same videoId but always have different user who liked the video.
    video: videoId, // check if the video is there having this video ID
    likedBy: req.user?._id, // check if the current user id have a likedBy record in the likedBy field
  });

  // If a like record exists, delete it (unlike the video)
  if (existingLike) {
    await Like.findByIdAndDelete(existingLike?._id);

    return res
      .status(200)
      .json(
        new ApiResonse(
          200,
          { isLiked: false },
          "Successfully unliked the video"
        )
      );
  } else {
    // If no like record exists, create a new one (like the video)
    await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });

    return res
      .status(200)
      .json(
        new ApiResonse(200, { isLiked: true }, "Successfully liked the video")
      );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const existingComment = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  // unlike a comment
  if (existingComment) {
    await Like.findByIdAndDelete(existingComment?._id);

    return res
      .status(200)
      .json(
        new ApiResonse(
          200,
          { isLiked: false },
          "Successfully unliked a comment"
        )
      );
  } else {
    // if comment does not have a like then make it a like (liked a comment)
    await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    return res
      .status(200)
      .json(
        new ApiResonse(200, { isLiked: true }, "sucessfully liked the comment")
      );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  // find the tweet
  const existingTweet = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  // unlike the tweet
  if (existingTweet) {
    await Like.findByIdAndDelete(existingTweet?._id);

    return res
      .status(200)
      .json(
        new ApiResonse(
          200,
          { isLiked: false },
          "Successfully unliked the tweet"
        )
      );
  } else {
    // liked the tweet
    await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    return res
      .status(200)
      .json(
        new ApiResonse(200, { isLiked: true }, "Successfully liked the tweet")
      );
  }
});

//confusion
const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideosAggegate = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideo",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideo: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          owner: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullName: 1,
            "avatar.url": 1,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResonse(
        200,
        likedVideosAggegate,
        "liked videos fetched successfully"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

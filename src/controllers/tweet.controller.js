import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResonse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content is required.");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Failed to make a tweet.");
  }

  return res
    .status(200)
    .json(new ApiResonse(200, tweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user");
  }

  const tweet = await Tweet.aggregate([
    {
      //filter tweets by owner id
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      // get avatar and username of each tweet owner from users collection
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      // It retrieves the users who liked each tweet from likes collection
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetails",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likeDetails", // calulates and returns the size of the array likeDetails
        },
        ownerDetails: {
          $first: "$ownerDetails", // selects the first element from the array ownerDetails , $first ensures that only the first document (or the document at index 0) is selected.
        },
        isLiked: {
          //A boolean indicating whether the current user (if authenticated) has liked the tweet.
          $cond: {
            if: { $in: [req.user?._id, "$likeDetails.likedBy"] }, // it will search from likedBy array if current user is liked the tweet or not
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1, //sorting the tweet in descending order
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ]);

  // confusion about below
  if (!tweet?.length) {
    throw new ApiError(404, " tweet does not exist");
  }

  return res
    .status(200)
    .json(new ApiResonse(200, tweet, "Tweets fetch successfully."));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetID");
  }
  // confusion
  const updatedTweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: req.user?._id, // Ensures only the owner can edit their tweet
    },
    { $set: { content } },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(404, "Tweet not found or you are not the owner");
  }

  return res
    .status(200)
    .json(new ApiResonse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }


  //confusion
  const tweet = await Tweet.findByIdAndDelete({
    _id: tweetId,
    owner: req.user?._id, // Ensures only the owner can delete their tweet
  });

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or you are not the owner");
  }
  return res
    .status(200)
    .json(new ApiResonse(200, { tweetId }, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model";

import { ApiError } from "../utils/ApiError";
import { ApiResonse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// get all the comments for a video
const getVideosComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query; // default value of page and limit is 1 and 10 respectivly

  const video = await Video.findById(videoId);

  // check if we get a video of coresponding id.
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const commentsAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
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
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likesCount: 1,
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
        isLiked: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comments = await Comment.aggregatePaginate(commentsAggregate, options);

  return res
    .status(200)
    .json(new ApiResonse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  // create a new comment
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to add comment. Try after sometime!");
  }

  return res
    .status(200)
    .json(new ApiResonse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const commentExistOrNot = await Comment.findById(commentId);
  if (!commentExistOrNot) {
    throw new ApiError(401, "Comment not found");
  }

  if (!content) {
    throw new ApiError(401, "Content is required to edit");
  }

  // only the owner of the comment can edit the comment so check if he/she is owner or not
  if (commentExistOrNot?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only comment owner can edit their comment");
  }

  // if everything is fine then update the comment
  const updatedComment = await Comment.findByIdAndUpdate(
    commentExistOrNot?._id,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(500, "Failed to edit comment , try after some time!");
  }

  return res
    .status(200)
    .json(new ApiResonse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {

  const { commentID } = req.params;

  const comment = await Comment.findById(commentID);
  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  // ony the owner can delete a commit
  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only comment owner can delete their comment");
  }

  await Comment.findByIdAndDelete(commentID);
 
   //delete the likes on comment also
  await Like.deleteMany({
    comment: commentID,
    likedBy: req.user,
  });
   return res
     .status(200)
     .json(new ApiResonse(200, { commentID }, "Comment deleted successfully"));
});

export { getVideosComment, addComment, updateComment, deleteComment };

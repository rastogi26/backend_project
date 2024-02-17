import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResonse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "Both name and description is required");
  }

  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: req.user?._id,
  });
  if (!playlist) {
    throw new ApiError(500, "Failed to create a playlist");
  }

  return res
    .status(200)
    .json(new ApiResonse(200, playlist, "Successfully created a playlist"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId) {
    throw new ApiError(400, "Invalid userId");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId), //filter playlist based on owner ID
      },
    },
    {
      // joining the videos
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
          $size: "$videos", // The total number of videos in each playlist, determined by the size of the videos array.
        },
        totalViews: {
          $sum: "$videos.views", //The total views of all videos in each playlist, calculated by summing up the views field of each video.
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
    .json(
      new ApiResonse(200, playlists, "User playlists fetched successfully")
    );
});

//flag
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  try {
    const playlist = await Playlist.findById(playlistId)
      .populate({
        path: "videos", // from videos collection
        match: { isPublished: true }, // only those which are true
        select:
          "_id videoFile.url thumbnail.url title description duration createdAt views", // select these fields
        populate: {
          path: "owner",
          select: "username fullName avatar.url",
        },
      })
      .populate("owner", "username fullName avatar.url");

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    return res
      .status(200)
      .json(new ApiResonse(200, playlist, "Playlist fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

//flag
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Playlist id or video id");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    // Find the playlist by its ID and verify ownership in one query
    {
      _id: playlistId,
      owner: req.user._id,
    },
    // Add the video to the playlist if the playlist and video exist and the user is the owner
    {
      $addToSet: { videos: videoId }, //if no video is there with corresponding id , it will not effect any thing , the playlist will remain same with old videos.
    },
    // Options to return the updated document after the update operation
    {
      new: true,
      // Ensure that the findOneAndUpdate method returns the document before applying validators
      runValidators: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      404,
      "Playlist not found or only the owner can add videos to their playlist"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResonse(
        200,
        updatedPlaylist,
        "Added video to playlist successfully"
      )
    );
});

//flag
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid PlaylistId or videoId");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    // Find the playlist by its ID and verify ownership in one query
    {
      _id: playlistId,
      owner:req.user?._id
,
    },
    // Remove the video from the playlist if the playlist and video exist and the user is the owner
    {
      $pull: { videos: videoId },
    },
    // Options to return the updated document after the update operation
    {
      new: true,
      // Ensure that the findOneAndUpdate method returns the document before applying validators
      runValidators: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      404,
      "Playlist not found or only the owner can remove videos from their playlist"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResonse(
        200,
        updatedPlaylist,
        "Removed video from playlist successfully"
      )
    );
});

//flag
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(
      404,
      "Playlist not found or only the owner can delete the playlist"
    );
  }

  return res
    .status(200)
    .json(new ApiResonse(200, {}, "Playlist deleted successfully"));
});

//flag
const updatePlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { playlistId } = req.params;

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    // Find the playlist by its ID and verify ownership in one query
    {
      _id: playlistId,
      owner: req.user?._id,
    },
    // Update the playlist's name and description if the playlist exists and the user is the owner
    {
      $set: { name, description },
    },
    // Options to return the updated document after the update operation
    {
      new: true,
      // Ensure that the findOneAndUpdate method returns the document before applying validators
      runValidators: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      404,
      "Playlist not found or only the owner can edit the playlist"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResonse(200, updatedPlaylist, "Playlist updated successfully")
    );
});


export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Playlist } from "../models/playlist.model.js";
import mongoose , { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res)=>{
    const {name, description} = req.body
    const userId = req.user._id

    // validate name and description
    if(!name || !description){
        throw new ApiError(400 , "Name or description not found")
    }

    if(!userId){
        throw new ApiError(500, "Error in finding user")
    }

    // create the playlist
    const playlist = await Playlist.create({
        name,
        description,
        owner: userId,
    })

    // check the playlist
    const play = await Playlist.findById(playlist._id);
    if(!play){
        throw new ApiError(500, "Error in creating the playlist")
    }

    // return the response
    return res.status(200).json(new ApiResponse(200, play, "Playlist created Successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    // step-1 getting the user
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId pass in playlist")
    }

    // step-2 finding the user from the database
    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(400, "Invalid user , user not found")
    }

    // step-3 checking if the user same as owner only when playlist is private
    /*
    if(user._id !== req.user._id){
        throw new ApiError(400, "Invalid user , user is not the owner of playlist")
    }
    */

    // step-4 getting the playlist
    const playlists = await Playlist.aggregate(
        [
            {
                $match : {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline : [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    }
                }
            }
        ]
    )

    // step-5 validating
    if(!playlists.length){
        throw new ApiError(400, "NO playlist found for the user")
    }

    // step-6 returning the response
    return res.status(200).json(new ApiResponse(200, playlists, "Playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid userId pass in playlist")
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "No playlist found")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully")) 
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid userId pass in playlist")
    }

    // step -2 validating
    const videos = await Video.findById(playlistId)
    if(!videos){
        throw new ApiError(400, "No video found")
    }

    // Updating the details
    const play = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {new : true}
    )

    // checking the details
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "No playlist found")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist Updated Successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid playlistId or VideoId pass")
    }

    // step -2 validating the video
    const videos = await Video.findById(videoId)
    if(!videos){
        throw new ApiError(400, "No video found")
    }

    // Updating the details
    const play = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {new : true}
    )

    // checking the details
    const playlist = await Playlist.findById(play._id)
    if(!playlist){
        throw new ApiError(400, "No playlist found")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist Updated Successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId) ){
        throw new ApiError(400, "Invalid playlistId pass in playlist")
    }

    // find the playlist
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Invalid playlistId pass in playlist")
    }
    
    // check whether the user is the owner 
    const userId = req.user._id
    if (!playlist.owner.equals(userId)) {
        throw new ApiError(403, "User is not the owner of the playlist");
    }

    // remove the playlist
    await playlist.deleteOne()
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist deleted Successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    // Valid object id or not
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId pass in playlist")
    }

    // find the playlist
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Invalid playlistId pass in playlist")
    }
    
    // check whether the user is the owner 
    const userId = req.user._id
    if (!playlist.owner.equals(userId)) {
        throw new ApiError(403, "User is not the owner of the playlist");
    }

    // updating the details
    playlist.name = name
    playlist.description = description
    await playlist.save({validateBeforeSave: false})

    return res.status(200).json((new ApiResponse(400, playlist, "Playlist Updated Successfully")))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
}
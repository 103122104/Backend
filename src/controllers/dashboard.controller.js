import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id
    
    const data = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "like",
                }
            },
            {
                $lookup: {
                    from : "subscriptions",
                    localField: "owner",
                    foreignField: "channel",
                    as : "subscriber"
                }
            },
            {
                $addFields: {
                    likeCount : {
                        $size : "$like"
                    },
                    totalSubscriber: {
                        $size: "$subscriber"
                    }
                }   
            },
            {
                $group : {
                    _id: "$owner",
                    totalViews : {
                        $sum : "$views"
                    },
                    totalVideos : {
                        $sum: 1
                    },
                    totalLikes : {
                        $sum : "$likeCount"
                    },
                    totalSubscribers: {
                        $first: "$totalSubscriber"
                    }
                }
            },
            {
                $project: {
                    owner: "$_id",
                    totalViews: 1,
                    totalSubscriber : 1,
                    totalVideos: 1,
                    totalLikes : 1,
                }
            }
        ]
    )

    if(!data.length){
        new ApiError(400, "No data exist for channel")
    }

    // retrun response
    return res.status(200).json(new ApiResponse(200, data[0], "Channel data fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const user = req.user;
    if(!user){
        throw new ApiError(200, "user not found")
    }

    const video = await Video.aggregate(
        [
            {
                $match :{
                    owner : new mongoose.Types.ObjectId(user._id)
                }
            },
        ]
    )
    if(!video.length){
        throw new ApiError(200, "user not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video found"))
})

export {
    getChannelStats, 
    getChannelVideos
    }
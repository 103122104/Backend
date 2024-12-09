import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {Like} from "../models/like.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    // step-1 validation on videoId
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "in valid videoId")
    }

    // step-2 check if video exist or not
    const videoExist = await Video.findById(videoId)
    if(!videoExist){
        throw new ApiError(400, "video does not exist")
    }

    const user = req.user

    // step-3 find the existing like (if exist)
    const existingLike = await Like.findOne({
        likedby : user._id,
        video: videoId
    })

    // step-4 toggle
    if(!existingLike){
        const like = await Like.create({
            likedby: user._id,
            video: videoId
        })
        return res.status(200).json(new ApiResponse(200, like, "video liked successfully"))
    }else{
        await existingLike.remove()
        return res.status(200).json(new ApiResponse(200, {}, "video liked removed successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    // step-1 validation on commetId
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "in valid commentId")
    }

    // step-2 check if comment exist or not
    const commentExist = await Comment.findById(commentId)
    if(!commentExist){
        throw new ApiError(400, "comment does not exist")
    }

    const user = req.user

    // step-3 find the existing like (if exist)
    const existingLike = await Like.findOne({
        likedby : user._id,
        comment: commentId
    })

    // step-4 toggle
    if(!existingLike){
        const like = await Like.create({
            likedby: user._id,
            comment: commentId
        })
        return res.status(200).json(new ApiResponse(200, like, "comment liked successfully"))
    }else{
        await existingLike.remove()
        return res.status(200).json(new ApiResponse(200, {}, "comment liked removed successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    // step-1 validation on tweetID
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "in valid tweetId")
    }

    // step-2 check if tweet exist or not
    const tweetExist = await Tweet.findById(tweetId)
    if(!tweetExist){
        throw new ApiError(400, "Tweet does not exist")
    }

    const user = req.user

    // step-3 find the existing like (if exist)
    const existingLike = await Like.findOne({
        likedby : user._id,
        tweet: tweetId
    })

    // step-4 toggle
    if(!existingLike){
        const like = await Like.create({
            likedby: user._id,
            tweet: tweetId
        })
        return res.status(200).json(new ApiResponse(200, like, "tweet liked successfully"))
    }else{
        await existingLike.remove()
        return res.status(200).json(new ApiResponse(200, {}, "tweet liked removed successfully"))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    // step -1 getting the user of which likes need to be find
    const userId = req.user._id

    // step-2 aggregatiiion pipeline
    const likedVideo = await Like.aggregate([
        {
            // match the user in like database
            $match : {
                likedby : mongoose.Types.ObjectId(userId)
            }
        },
        {
            // getting the details of video (left join from videos)
            $lookup : {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline : [
                    {
                        // getting the details from the user
                        $lookup : {
                            from : "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // giving only relevant details
                            pipeline : [
                                {
                                    $project : {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ],
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    },
                ]
            }  
        },
        {
            $addFields : {
                video: {
                    $first: "$video"
                }
            }
        }
    ])

    if(!likedVideo){
        new ApiError(400, "No liked video found")
    }

    res.status(200).json(new ApiResponse(200, likedVideo, "Liked video fetched successfully"))

    // sample output
    /*
    [
        {
            "_id": ObjectId("..."),
            "likedby": ObjectId("..."),
            "video": {
                "_id": ObjectId("..."),
                "title": "Sample Video",
                "duration": 120,
                "owner": {
                    "fullName": "John Doe",
                    "username": "johndoe123",
                    "avatar": "avatar_url"
                }
            }
        },
        ...
    ]
    */
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}
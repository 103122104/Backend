import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res)=>{
    // Step-1 getting details from user
    const {content} = req.body
    const user = req.user

    // Step2 validate
    if(!content){
        throw new ApiError(400, "Write proper tweet")
    }

    // Step-3 Make a entry in database
    const tweet = await Tweet.create(
        {
            owner: user._id,
            content
        }
    )

    // Step-4 validate tweet
    if(!tweet){
        throw new ApiError(500, "Something went wrong while creating in db")
    }

    // Step-5 return res
    return res.status(200).json(new ApiResponse(200, tweet, "tweet created successfully"))
})

const updateTweet = asyncHandler(async (req, res)=>{
    // Finding tweet based on user id
    const {tweetId} = req.params
    const tweet = await Tweet.findById(tweetId);

    // checking if user is owner of tweet
    if(!tweet.owner.equals(req.user._id)){
        throw new ApiError(400, "Invalid owner of tweet, not have access to update")
    }

    // updating the tweet
    const {newContent} = req.body
    tweet.content = newContent

    // saving in databse
    tweet.save({validateBeforeSave: false})

    // returning the response
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet Updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    // Finding tweet based on user id
    const {tweetId} = req.params
    const tweet = await Tweet.findById(tweetId);

    // checking if user is owner of tweet
    if(!tweet.owner.equals(req.user._id)){
        throw new ApiError(400, "Invalid owner of tweet, not have access to update")
    }

    // deleting the tweet
    await tweet.deleteOne()

    // returning the response
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet deleted successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    const tweet = await Tweet.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username : 1,
                                fullName: 1,
                                avatar: 1
                            }
                        },
                    ]
                },
            },
            {
                $addFields: {
                    owner : {
                        $first : "$owner"
                    }
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "like"
                }
            },
            {
                $addFields: {
                    likesCount: {
                        $size: "$like"
                    },
                }
            },
            {
                $project:{
                    _id: 1,
                    owner: 1,
                    likesCount: 1,
                    content: 1,
                }
            }
        ]
    )

    if(!tweet.length){
        throw new ApiError(400 , "no tweet found for user")
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet for user found successfully"))
})

export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
}
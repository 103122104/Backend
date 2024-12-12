import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // step-1 getting details from user
    const {channelId} = req.params;
    const user = req.user

    //step-2 validating user id
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channelid")
    }

    // step-3 checking the channel
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(400, "channel does not exist")
    }

    // step-4 finding the existing user
    const existingSubscriber = await Subscription.findOne({
        channel: channelId,
        subscriber: user._id
    })

    // step-5 toggling
    if(!existingSubscriber){
        const subscriberdetails = await Subscription.create({
            channel: channelId,
            subscriber: user._id
        })
        return res.status(200).json(new ApiResponse(200, subscriberdetails, "Successfully subscribed"))
    }else{
        await existingSubscriber.deleteOne()
        return res.status(200).json(new ApiResponse(200, {}, "Successfully unsubcribed"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(200, "Invalid channelId")
    }

    // validating in userDatabase
    const channel = await User.findById(channelId);
    if(!channel){
        throw new ApiError(200, "channel not found")
    }

    // finding the list
    const listOFChannelSubscribers = await Subscription.find({
        channel: channelId
    })

    if(!listOFChannelSubscribers.length){
        throw new ApiError(200, "No subscriber found")
    }

    return res.status(200).json(new ApiResponse(200, listOFChannelSubscribers, "Subscribers found successfully"))
})

const getSubscribedChannels  = asyncHandler(async (req, res) => {
    const {subscriberId } = req.params
    if(!isValidObjectId(subscriberId )){
        throw new ApiError(200, "Invalid subscriberId ")
    }

    // validating in userDatabase
    const userChannel = await User.findById(subscriberId);
    if(!userChannel){
        throw new ApiError(200, "User-Channel not found")
    }

    // finding the list
    const listOFChannelSubscribed = await Subscription.aggregate(
        [
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "subscribedChannel",
                    pipeline: [
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
                $addFields : {
                    subscribedChannel : {
                        $first : "$subscribedChannel"
                    }
                }
            }
        ]
    )

    if(!listOFChannelSubscribed.length){
        throw new ApiError(400, "No channel subscribed found")
    }

    return res.status(200).json(new ApiResponse(200, listOFChannelSubscribed, "Channel subscribed found successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
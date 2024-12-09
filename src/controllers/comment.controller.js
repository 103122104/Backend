import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { isValidObjectId } from "mongoose"

const addComment = asyncHandler(async (req, res)=>{
    // Step-1 finding the video
    const {videoId} = req.params
    // validation the values
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    // step-2 Getting the comment
    const {content} = req.body
    if(content.trim()=== ""){
        throw new ApiError(400, "Please write comment")
    }

    // step-3 finding the user
    const user = req.user

    // step-4 creating a db entry
    const comment = await Comment.create(
        {
            content,
            video: videoId,
            owner: user._id
        }
    )
    
    // Step -5 check if comment cretead or not
    const commentCheck = await Comment.findById(comment._id)
    if(!commentCheck){
        throw new ApiError(500, "Error in entry commment in db");
    }

    // step-6 returning the data
    return res.status(200).json(new Apiresponse(200, comment, "Comment created successfully"))
})

const updateComment = asyncHandler(async (req, res)=>{
    // finding comment in url
    const {commentId} = req.params
    // validation the values
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    // step-2 finding the newContent
    const {newContent} = req.body
    if(newContent.trim()=== ""){
        throw new ApiError(400, "Comment is not proper")
    }

    // step-3 checking if correct user is updating
    const commentUser = await Comment.findById(commentId)
    if(commentUser.owner !== req.user._id){
        throw new ApiError(400, "Invalid user.")
    }


    // step-3 Updating the content
    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content: newContent,
        },
        {new : true}
    )

    // step-4 check if updated or not
    if(!comment){
        throw new ApiError(500, "Error in entry commment in db");
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res)=>{
    // step-1 finding commentID
    const {commentId} = req.params
    // validation the values
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    // step-2 checking if correct user is updating
    const commentUser = await Comment.findById(commentId)
    if(commentUser.owner !== req.user._id){
        throw new ApiError(400, "Invalid user.")
    }

    const comment =  await Comment.findByIdAndDelete(commentId)
    if(!comment){
        throw new ApiError(400, "Invalid user.")
    }

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

const getVideoComments = asyncHandler(async (req, res) => {
    // getting the values 
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const skip = (page-1)*limit

    // Validating the values
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    // check if video exist or not
    const video = Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video not found")
    }

    // writing aggregation pipeline
    const comments = await Comment.aggregate(
        [
            {
                $match: {
                    video: mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup : {
                    from : "users",
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
                    owner : {
                        $first : "$owner"
                    }
                }
            },
            {
                $lookup: {
                    from : "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "like",
                }
            },
            {
                $addFields  : {
                    likesCount : {
                        $size: "$like"
                    }
                }
            },
            {
                $sort : {
                    createdAt: -1
                }
            },
            {
                $skip : skip
            },
            {
                $limit : limit
            },
            {
                $project: {
                    likesCount: 1,  
                    content: 1,
                    video :1,
                    owner : 1,
                    createdAt :1,
                    updatedAt: 1,
                }
            }
        ]
    )

    // validating
    if(!comments.length){
        throw new ApiError(400, "Comments not found on video")
    }

    const totalPosts = await comment.countDocuments()

    // returning the response
    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        {
            comments, 
            page, 
            pagesize: limit, 
            totalPage: Math.ceil(totalPosts / limit),
        }, 
    "Comments fetched successfully"))
})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
}
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const publishAVideo = asyncHandler( async (req, res)=>{
    // step-1 getting values from user
    const {title, description} = req.body

    // step-2 validating the values
    if(title.trim() === ""){
        throw new ApiError(400, "Title is required")
    }
    if(description.trim() === ""){
        throw new ApiError(400, "description is required")
    }

    // step-3 getting files from the user
    const videoFilePath = req.files?.videofile[0].path
    const thumbnailFilePath = req.files?.thumbnail[0].path

    // step-4 validating the files
    if(!videoFilePath || !thumbnailFilePath){
        throw new ApiError(400, "Files not recieved")
    }

    // step-5 upload on cloudinary
    const videoFile = await uploadOnCloudinary(videoFilePath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailFilePath)

    // step-6 check if uploaded or not
    if(!videoFile){
        throw new ApiError(400, "Error in uplaoding videoFile on cloudinary")
    }
    if(!thumbnailFile){
        throw new ApiError(400, "Error in uplaoding thumbnailFile on cloudinary")
    }

    // step-7 finding the owner of video
    const user = req.user

    // step-8 registering video on database
    const video = await Video.create(
        {
            videoFile: videoFile.path,
            thumbnail: thumbnail.path,
            title,
            description,
            duration,
            owner: user._id,
            duration: videoFile.duration
        }
    )

    // step-9 checking the video
    const createdVideo = await Video.findById(video._id)
    if(!createdVideo){
        throw new ApiError(500, "Something wrong in creating video")
    }

    // step-10 return response
    return res.status(200).json(new ApiResponse(200, createdVideo, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res)=>{
    // step-1 getting videoid from params
    const {videoId} = req.params;

    // step-2 validating the videoid
    if(videoId.trim === ""){
        throw new ApiError(400, "VideoID not found")
    }

    // step-3 finding in database
    const video = Video.findById(videoId);

    // step-4 validating the video
    if(!video){
        throw new ApiError(400, "Video not found in database")
    }

    // step-5 sending response
    return res.status(200).json(new ApiResponse(200, video, "Video found seccessfully"))
})

const updateVideo= asyncHandler(async (req, res)=>{
    // step-1 getting videoid 
    const {videoId} = req.params
    if(videoId.trim === ""){
        throw new ApiError(400, "VideoID not found")
    }

    // step-2 find video from database
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video not found in database")
    }

    // step-3 finding the loggedin user
    const user = await User.findById(req.user._id)
    if(!user){
        throw new ApiError(400, "User not found in database")

    }

    // step-4 check if user is the owner of video
    if(user._id !== video.owner){
        throw new ApiError(400, "Invalid Owner of the video")
    }

    // step-4 getting details to update
    const {title, description} = req.body
    const thumbnailPath = req.file?.path
    if(!title || !description){
        throw new ApiError(400, "Thumbnail is missing")
        
    }

    if(!thumbnailPath){
        throw new ApiError(400, "Thumbnail is missing")
    }

    // step-7 updating on cloudinary
    const thumbnail = uploadOnCloudinary(thumbnailPath);
    if(!thumbnail){
        throw new ApiError(400, "Thumbnail is not uploading on cloudinary")
    }

    // step-8 updating the details
    video.title = title
    video.description = description
    video.thumbnail = thumbnail.url

    await video.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, video, "Values updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(videoId.trim === ""){
        throw new ApiError(400, "VideoID not found")
    }

    // step-2 find video from database
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video not found in database")
    }

    // step-3 finding the loggedin user
    const user = await User.findById(req.user._id)
    if(!user){
        throw new ApiError(400, "User not found in database")

    }

    // step-4 check if user is the owner of video
    if(user._id !== video.owner){
        throw new ApiError(400, "Invalid Owner of the video")
    }

    // step-5 deleting the video 
    Video.findByIdAndDelete(videoId)

    // step-6 returning the response
    return res.status(200).json(200, {}, "Video Deleted successfully")
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(videoId.trim === ""){
        throw new ApiError(400, "VideoID not found")
    }

    // step-2 find video from database
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video not found in database")
    }

    // step-3 finding the loggedin user
    const user = await User.findById(req.user._id)
    if(!user){
        throw new ApiError(400, "User not found in database")

    }

    // step-4 check if user is the owner of video
    if(user._id !== video.owner){
        throw new ApiError(400, "Invalid Owner of the video")
    }

    // step-5 toggling the value
    const isPublic = video.isPublished
    video.isPublished = !isPublic
    video.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, video, "Toggled Successfully"))
})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    if(query.trim()=== "" ){
        throw new ApiError(400, "query not found")
    }

    const skip = (page-1)*limit

    const searchedVideos = Video.aggregate(
        [
            {
                $match : {
                    title: query
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
                $addFields : {
                    owner : {
                        $first : "$owner"
                    }
                }
            },
            {
                $sort : {
                    sortBy : sortType
                }
            },
            {
                $skip : skip
            },
            {
                $limit: limit
            }
        ]
    )

    if(!searchedVideos){
        throw new ApiError(400, "No videos found")
    }

    return res.status(200).json(new ApiResponse(200, searchedVideos, "Videos found and paginated"))
}) 

export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config();

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validatoin of data - not empty
    // check if already a user exists , username , email
    // upload them to cloudinary 
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    // step -1 Getting data from user
    const {fullName, email, username, password} = req.body;

    // step -2 validation
    if(
        [fullName, email, username, password].some((field) => !field ||  field?.trim()==="")
    ){
        throw new ApiError(400, "All field are required")
    } 

    // step-3 check if already exist
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }

    // step-4 getting files path for avatar and coverImageLocalPath
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverimage && req.files.coverimage.length > 0  ? req.files.coverimage[0].path : null;

    if(!avatarLocalPath){
        throw new ApiError(400, "avatarlocal is required");
    }

    // step-5 uploading on cloudinary
    const avatar =  await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if(!avatar){
        throw new ApiError(400, "Avatar is required, failed to upload on cloudinary")
    }

    // step-6 creating a new user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // step-7 removing password and refresh token from user
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // step-8 check if it is created or not
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering")
    }

    // step-9 return new apiresponse
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )
})

const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "error in generating refresh and access token")
    }
}

const loggedInUser = asyncHandler(async (req, res)=>{
    // step-1 getting values from user
    const {username, email, password} = req.body;

    // step-2 validate if username or email is present or not
    if(!username && !email){
        throw new ApiError(400, "username or email is nessesary");
    }

    // step-3 find user using username or email
    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    // step-4 check if user exist or not
    if(!user){
        throw new ApiError(400, "User does not exist")
    }

    // step-5 if user exist then check for password
    if(password === ""){
        throw new ApiError(400, "password is required")
    }

    // step-6 check if password is valid or not
    const isValidPassword = await user.isPasswordCorrect(password)

    if(!isValidPassword){
        throw new ApiError(400, "password is not correct")
    }

    // step-7 generate access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    // step-8 why?
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const option = {
        httpOnly : true,
        secure : true
    }

    //step-9 generate cookie and send
    return res.status(200)
              .cookie("accessToken", accessToken, option)
              .cookie("refreshToken", refreshToken, option)
              .json(new ApiResponse(200, {user : loggedInUser, accessToken, refreshToken}, "loggedIn Successful"))
})

const refreshAccessToken = asyncHandler(async (req, res)=>{
    try {
        // step-1 finding the refershtoken using cookie
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken){
            throw new ApiError(401, "unauthorized request")
        }
    
        // step-2 Decoding the refershtoken 
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        //step-3 Finding user from database
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        // step-4 Mathching the refreshtoken from user
        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Refresh Token is Expired")
        }
    
        // step-5 Generating new accesstoken
        const newAccessToken = user.generateAccessToken()
    
        const option = {
            httpOnly : true,
            secure: true
        }
    
        // step-6 sending res
        return res.status(200)
                  .cookie("accessToken", newAccessToken, option)
                  .json( new ApiResponse(200, {accessToken: newAccessToken}, "access token refreshed Successfully"))
    } catch (error) {
        throw new ApiError(200, error?.message || "Invalid refresh token")
    }
})

const loggedOutUser = asyncHandler( async(req, res)=>{
    // isme user kaise laye ye ek dikkat hai
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken: ""
            },
        },
        {
            new: true
        }
    )
    
    const option = {
        httpOnly : true,
        secure : true
    }
    
    return res.status(200)
              .clearCookie("accessToken", option)
              .clearCookie("refreshToken", option)
              .json(new ApiResponse(200, {userId: user._id}, "user Logged out successfully"))
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    // We will inject verifyJWT middleware to check if user is loggedIn or not

    // step-1 getting detials from frontend
    const {oldPassword, newPassword, confirmPassword} = req.body
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400, "Invalid user ")
    }
    
    // step-2 checking old password 
    const isValidPassword = await user.isPasswordCorrect(oldPassword);
    if(!isValidPassword){
        throw new ApiError(400, "Invalid old Password")
    }

    // step-3 checking newPassword and 
    if(newPassword !== confirmPassword){
        throw new ApiError(400, "new Password does not match")
    }

    //step-4 setting new Password
    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res.status(200)
              .json(new ApiResponse(200, {}, "Password Change successfully"))
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetched successfully"))
})

const updateAccountDetails = asyncHandler( async (req, res)=>{
    // step-1 get details from user
    const {fullName, email} =   req.body

    // validate either of them should exist
    if(!fullName || !email){
        throw new ApiError(400, "fullname or email required")
    }

    // step-2 find the user
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            fullName: fullName,
            email: email
        },
        {new : true}
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Detials updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res)=>{
    // We have use two middle first verifyJWT to check if user is logged in then multer for getting files
    //step-1 get the files
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    // step-2 upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar){
        throw new ApiError(400, "Error while uploading avatar on cloudinary")
    }

    // step-3 get the user and update
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            } 
        },
        {
            new: true,
        }
    ).select("-password -refreshToken")

    // step-4 remove old avatar from cloudinary


    // step-5 return
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Image Updated Successfully"))
})

const updateCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "CoverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading coverImage on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage :coverImage.url
            }
        },
        {
            new : true,
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(200, new ApiResponse(200, user, "Cover image Updated Successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }

    // step-2
    const channel =  await User.aggregate([
        {
            // first match username in User database
            $match : {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: { // subsciber model se mere id (channel wale user ki id) wala channel find kronga 
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            } 
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: { // it will add new field in my User model
                subscribersCount : {  // subscriber count field added 
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: { // channel that he have subscribed count field added 
                    $size: "$subscribedTo"
                },
                isSubscribed: { // this is to know wheter to show follow or followed button
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    } 
                }
            }
        },
        {
            $project: { // we dont want to pass all the field , becuase of slow down , data congestion
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "user channel fetched successfully"))
})


export  {
    registerUser, 
    loggedInUser, 
    loggedOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
};
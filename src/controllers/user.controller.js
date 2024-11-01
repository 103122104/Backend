import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
        new ApiResponse(200, createdUser, "userregistered successfully")
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

const loggedOutUser = asyncHandler( async(req, res)=>{
    // isme user kaise laye ye ek dikkat hai
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken: undefined
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
              .json(new ApiResponse(200, {}, "user Logged out successfully"))
})

export  {registerUser, loggedInUser, loggedOutUser};
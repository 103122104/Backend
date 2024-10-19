import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new mongoose.Schema(
    {
        videoFile : {
            type: String, // we will get it from cloudinary
            reqired: true,
        },
        thumbnail : {
            type: String, // we will get it from cloudinary
            reqired: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,  // this info is from cloudnary
            required: true,
        },
        views: {
            type: Number,  // this info is from cloudnary
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
    }, 
    {timeStamps: true}
)



export const Video = mongoose.model("Video", videoSchema)
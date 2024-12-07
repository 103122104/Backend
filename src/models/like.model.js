import mongoose from "mongoose"

const likesSchema = new mongoose.Schema(
    {
        likedby: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        },
        tweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tweet"
        },

    },
    {timeStamps: true}
)



export const Like = new mongoose.model("Like", likesSchema)
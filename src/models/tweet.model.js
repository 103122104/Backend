import mongoose from "mongoose"

const tweetSchema = new mongoose.Schema(
    {
        owner:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        content: {
            type: String,
            reqired: true
        }
    },
    {   
        timeStamps: true
    }
)

export const Tweet = mongoose.model("Tweet", tweetSchema)
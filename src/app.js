import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApiError } from "./utils/ApiError.js";
const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGN,
    credentials : true
}))

app.use(express.json({limit: "16kb"})) // agar json file aayegi toh
app.use(express.urlencoded({extended: true, limit: "16kb"})) // for data in url 
app.use(express.static("public"))
app.use(cookieParser())

// Routes Import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likesRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import dashBoardRouter from "./routes/dashboard.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"

//Routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likesRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/dashboard", dashBoardRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)

app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statuscode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
        });
    }

    // Fallback for other unexpected errors
    console.error(err); // Log the full error for debugging
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    });
});


export {app} 
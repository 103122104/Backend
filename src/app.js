import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
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

//Routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comment", commentRouter)

export {app} 
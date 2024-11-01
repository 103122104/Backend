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
import userRoutes from "./routes/user.routes.js"

//Routes declaration
app.use("/api/v1/users", userRoutes)


export {app} 
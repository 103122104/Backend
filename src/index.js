import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import dotenv from "dotenv";
dotenv.config();

// Way-1
import connectDB from "./db/index.js";
connectDB()
.then(()=>{
    app.on("error", (err)=>(
        console.log("Error after connection", err)
    ))

    app.listen(process.env.PORT || 8000 , ()=>(
        console.log(`app is listening.`)
    ) )
})
.catch()

/*
//  Way-2
import express from "express"
const app = express();
;( async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (err)=>{
            console.log("error", err)
            // throw err;
        })

        app.listen(process.env.PORT , ()=>{
            console.log("app is listening on port")
        })
    }catch(error){
        console.log("Error found: " , error);
        console.log(process.env.MONGODB_URI)
        // throw err
    }
})()
*/



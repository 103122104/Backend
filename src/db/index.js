import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";
dotenv.config();

async function connectDB(){
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // console.log(connectionInstance)
        console.log(`MongoDB connected DB host:  ${connectionInstance.connection.host}`);
    }catch(err){ 
        console.log("MongoDB connection Failed : ", err.message);
        console.log(process.env.MONGODB_URI)
        console.log(DB_NAME)
        process.exit(1)
    }
}

export default connectDB;
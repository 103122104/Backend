import {v2 as cloudinary} from "cloudinary"
import fs from "fs" 
import dotenv from "dotenv"; // important to import dotenv whevever we have to use it
dotenv.config(); 


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
    try{
        if(!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })
        fs.unlinkSync(localFilePath);
        // file has been uploaded successfully
        console.log("file is uploaded on cloudinary successfully, ", response.url);
        return response;
    }catch(err){
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        console.log("temporary file is removed from storage");
        return null;
    }   
}

export {uploadOnCloudinary}
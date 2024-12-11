import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { 
    publishAVideo, 
    getVideoById, 
    updateVideo,
    deleteVideo,
    togglePublishStatus, 
    getAllVideos} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT); 
router.route("/").get(getAllVideos).post(
    upload.fields(
        [
            {
                name: "videofile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]
    ),
    publishAVideo
)


router.route("/:videoId").get(getVideoById)
router.route("/:videoId").patch(upload.single("thumbnail"), updateVideo)
router.route("/:videoId").delete(deleteVideo)
router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router
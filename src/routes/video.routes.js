import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { 
    publishAVideo, 
    getVideoId, 
    updateVideo,
    deleteVideo,
    togglePublishStatus } from "../controllers/video.controller.js";

const router = Router()

router.use(verifyJWT); 
router.route("/").post(
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


router.route("/:videoId").get(getVideoId)
router.route("/:videoId").patch(upload.single("thumbnail"), updateVideo)
router.route("/:videoId").delete(deleteVideo)
router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router
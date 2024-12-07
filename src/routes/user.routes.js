import { Router } from "express";
import {
    registerUser, 
    loggedInUser, 
    loggedOutUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loggedInUser);
router.route("/logout").post(verifyJWT, loggedOutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/coverimage").patch(verifyJWT, upload.single("coverimage"), updateCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)


router.route("/refresh-token").post(refreshAccessToken);
export default router;
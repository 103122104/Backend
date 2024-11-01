import { Router } from "express";
import {registerUser, loggedInUser, loggedOutUser} from "../controllers/user.controller.js";
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

router.route("/logout").post(
    verifyJWT,
    loggedOutUser
);
export default router;
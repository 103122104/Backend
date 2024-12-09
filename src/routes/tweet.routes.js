import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { 
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
 } from "../controllers/tweet.controller.js";

const router = Router()
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router.route("/").post(createTweet)
router.route("/:tweetid").patch(updateTweet).delete(deleteTweet)
router.route("/user/:userId").get(getUserTweets);

export default router;
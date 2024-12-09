import { Router } from "express";
import router from "./user.routes";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const rotuer = Router() 
router.use(verifyJWT)
router.route("/c/:channelId").post(toggleSubscription)
router.route("/c/:channelId").get(getSubscribedChannels)
router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router
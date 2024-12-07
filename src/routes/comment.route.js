import { Router } from "express";

const router = Router()

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router.route("")

export default router;
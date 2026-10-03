import { Router } from "express";
import{ loginUser, logoutUser,  } from "../controllers/user.controller.js";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refresAccessToken } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]), registerUser)

router.route("/login").post(loginUser)
//secure routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh").post(refresAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentpassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUsercoverImage)
router.route("/user-channel/:id").get(verifyJWT, getUserChannel)
router.route("/watch-history").get(verifyJWT, getWatchHistory)
router.route("/c/username").get(verifyJWT, getUserChannelprofile)
export default router
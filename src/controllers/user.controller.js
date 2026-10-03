import { asyncHandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


// ? MEANS UNRAPING THE OPTIONAL VALUE



const generateAccessAndRefreshToken = async(userId) => {
    try {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.referenceToken = refreshToken
    user.save({validateBeforeSave: false})
    
    return {accessToken, refreshToken}
   
} catch (error) {
    console.log("TOKEN ERROR:", error);
    throw new ApiError(500, "something went wrong while generating tokens");
}
}
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    const{fullName, email, username, password} = req.body
    console.log(fullName, email, username, password);
    
    // if(!fullName || !email || !username || !password){
    //     throw new ApiError("All fields are required", 400)
    // }
    
    if(
        [fullName, email, username, password].some(field => !field)
    ){
        throw new ApiError( 400, "All fields are required")
    }
    
    const existedUser = await User.findOne({$or: [{email}, {username}]})
    if(existedUser){
        throw new ApiError( 409, "User already exists")
    }
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    console.log(req.files);

    //optional chainning and optional finding of coverImage
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    //check throught clasic if else statement
    let coverImagelocalpath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagelocalpath = req.files.coverImage[0].path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(500, "Avatar upload failed")
    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select("-password -referenceToken")
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"))
},)

const loginUser = asyncHandler(async (req, res) => {
    //req body --> data from frontend
    //username or email
    //find the user by email or username
    //access and refresh token
    //send cookie to the frontend
    const { email, username, password} = req.body
    console.log( email, username, password);
    if (!email && !username || !password) {

        //here is an alternative of above based on logic
        // if(!(username || email) || !password){
        //     throw new ApiError(400, "Username or email and password are required")
        throw new ApiError(400, "Username, email, and password are required")
    }
    const user = await User.findOne({$or: [{email}, {username}]})
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -referenceToken")

        const cookieOptions = {
            httpOnly: true,
            secure: true,
        }
        return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, {user: loggedInUser, accessToken},
             "User logged in successfully"))
    
})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,{
            $unset: {referenceToken: undefined}

        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"))   
})  

const refresAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.referenceToken || req.body.referenceToken
    
    if(!incomingRefreshToken){
        throw new ApiError(401, "unotherised request")
    }
    try{
        const decodeToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFERESH_TOKEN_SECRET)
        
        const user = await User.findById(decodeToken?._id)

        if(!user){
            throw new ApiError(404, "invalid refresh token user not found")
        
        }

    
        if(incomingRefreshToken !== user?.referenceToken){
            throw new ApiError(401, "invalid refresh token")
        }

        const options = {
            httpOnly: true,
            secure: true,
        }
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {accessToken}, "Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})
//method to change current password

const changeCurrentpassword = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword} = req.body

    // if(!(newPassword === confPassword)){
    // throw new ApiError(400, "password doesn't matched")}

    const user = await User.findById(req.user?.id)
    const ispasswordCorrect = await user.ispasswordCorrect(oldpassword)

    if(!ispasswordCorrect){
        throw new ApiError(400, "invalid old password")

    }
        user.password = newPassword
        await user.save({validateBeforeSave: false})

        return res.status(200)
        .jaon(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req, res)=>{
            return res.status(200)
            .json(200, req.User, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res)=>
{
    const {fullName, email} = req.body

    if(!fullName || email){
        throw new ApiError(400, "All field are required")

    }
    const user = User.findById(req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        
        
        },
            {new: true}
        ).select("password")
        return res.status(200)
        .jason(new ApiError(200, user, "Account details updated successfully"))
     
});

const updateUserAvatar = asyncHandler(async(req, res)=>
{
    const avatarLocalpath = req.file?.path
    if(!avatarLocalpath){
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary
    (avatarLocalpath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")

    }
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateUsercoverImage = asyncHandler(async(req, res)=>
{
    const coverImageLocalpath = req.file?.path
    if(!coverImageLocalpath){
        throw new ApiError(400, "Cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary
    (coverImageLocalpath)
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on cover image")

    }
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")
    
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"))
})

const getUserChannel = asyncHandler(async(req, res)=>{
    const{username} = req.params
    if(!username){
        throw new ApiError(400, "Username is required")
    }
    const channel = await User.aggregate([

        {
            $match: {username: username?.toLowerCase()}
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {$size: "$subscribers"},
                channelsSubscribedToCount: {$size: "$subscribedTo"},
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"],
                            then: true,
                            else: false
                        }
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                email: 1
            }
        }
    ])


    if(!channel?.length){
        throw new ApiError(404, "Channel not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req, res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }

        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory.video",
                foreignField: "_id",
                as: "watchHistoryVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                            
                        }
                    },
                    {
                        $addFields: {
                            owner: {$first: "$owner"}
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistoryVideos , "Watch history fetched successfully"))
})



export{
    registerUser,
    loginUser,
    logoutUser,
    refresAccessToken,
    changeCurrentpassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage,
    getUserChannel,
    getWatchHistory
}
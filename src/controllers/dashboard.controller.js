import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asynchandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    // Step 1: Get the logged-in channel owner's _id
    //         const channelId = req.user?._id

    // Step 2: Count total subscribers of this channel
    //         - Use Subscription.aggregate()
    //         - $match  --> { channel: new mongoose.Types.ObjectId(channelId) }
    //         - $count  --> "totalSubscribers"
    //         - Result is an array, so pick: subscriberData[0]?.totalSubscribers || 0

    // Step 3: Aggregate all videos of this channel to get total views, total videos, total likes
    //         - Use Video.aggregate()
    //         - $match  --> { owner: new mongoose.Types.ObjectId(channelId) }
    //         - $lookup --> join "likes" collection
    //                       from: "likes"
    //                       localField: "_id"
    //                       foreignField: "video"
    //                       as: "videoLikes"
    //         - $group  --> group everything into one document
    //                       _id: null
    //                       totalVideos: { $sum: 1 }
    //                       totalViews:  { $sum: "$views" }
    //                       totalLikes:  { $sum: { $size: "$videoLikes" } }

    // Step 4: Destructure result from Step 3
    //         - const videoStats = videoAggregate[0] || {}
    //         - const { totalVideos = 0, totalViews = 0, totalLikes = 0 } = videoStats

    // Step 5: Build final stats object combining all results
    //         const stats = {
    //             totalSubscribers,
    //             totalVideos,
    //             totalViews,
    //             totalLikes
    //         }

    // Step 6: Return response
    //         return res.status(200).json(new ApiResponse(200, stats, "Channel stats fetched successfully"))

    const channelId = req.user?._id
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    const subscriberData = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "totalSubscribers"
        }
    ])

    const videoAggregate = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: { $size: "$videoLikes" } }
            }
        }
    ])

    const videoStats = videoAggregate[0] || {}
    const { totalVideos = 0, totalViews = 0, totalLikes = 0 } = videoStats

    const stats = {
        totalSubscribers: subscriberData[0]?.totalSubscribers || 0,
        totalVideos,
        totalViews,
        totalLikes
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    // Step 1: Get the logged-in channel owner's _id
    //         const channelId = req.user?._id

    // Step 2: Fetch all videos of this channel using Video.aggregate()
    //         - $match --> { owner: new mongoose.Types.ObjectId(channelId) }

    // Step 3: Lookup likes for each video and compute likesCount
    //         - $lookup --> { from: "likes", localField: "_id", foreignField: "video", as: "likes" }
    //         - $addFields --> { likesCount: { $size: "$likes" } }

    // Step 4: Project only the fields needed in the response
    //         - $project -->
    //             _id: 1
    //             title: 1
    //             description: 1
    //             videofile: 1
    //             thumbnail: 1
    //             duration: 1
    //             views: 1
    //             isPublished: 1
    //             createdAt: 1
    //             likesCount: 1

    // Step 5: Check if result is empty
    //         - if(!videos?.length) throw new ApiError(404, "No videos found for this channel")

    // Step 6: Return response
    //         return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"))

    const channelId = req.user?._id

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$videoLikes" }
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                videofile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                likesCount: 1
            }
        }
    ])

    if (!videos?.length) {
        throw new ApiError(404, "No videos found for this channel")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats,
    getChannelVideos
}
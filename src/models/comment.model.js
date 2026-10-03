import mongoose, {schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        vedio: {
            type: Schema.Types.ObjectId,
            ref: "video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);
commentSchema.plugin(mongooseAggregatePaginate);

export const comment = mongoose.model("comment", commentSchema);
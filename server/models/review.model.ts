// server/models/review.model.ts

import type { IReview } from "@server/interfaces/review.interface";
import type { HydratedDocument, Model } from "mongoose";
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// 文件類型定義
type ReviewDocument = HydratedDocument<IReview>;

// --------------------
// 評論
// --------------------

const reviewSchema = new Schema<ReviewDocument>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        restaurant: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

// --------------------
// Model export
// --------------------

export const Review =
    (mongoose.models.Review as Model<ReviewDocument>) || model<ReviewDocument>("Review", reviewSchema);

export default Review;
